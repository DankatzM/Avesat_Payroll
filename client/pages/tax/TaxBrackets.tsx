import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calculator,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  History,
  Eye,
  FileText,
  Shield,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings,
  Database,
  Import
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES, KENYA_TAX_BRACKETS, KenyaTaxBracket } from '@shared/kenya-tax';
import { logTaxAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

interface TaxBracket {
  id: string;
  min: number;
  max: number;
  rate: number;
  description: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TaxBracketHistory {
  id: string;
  bracketId: string;
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  oldValues?: Partial<TaxBracket>;
  newValues?: Partial<TaxBracket>;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface TaxCalculationExample {
  annualIncome: number;
  monthlyIncome: number;
  tax: number;
  netIncome: number;
  effectiveRate: number;
  marginalRate: number;
}

const TaxBrackets: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // State management
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [bracketHistory, setBracketHistory] = useState<TaxBracketHistory[]>([]);
  const [selectedTab, setSelectedTab] = useState('current');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedBracket, setSelectedBracket] = useState<TaxBracket | null>(null);
  const [formData, setFormData] = useState({
    min: '',
    max: '',
    rate: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [calculationExamples, setCalculationExamples] = useState<TaxCalculationExample[]>([]);

  // Filtering state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('2025');

  // Load tax brackets and convert Kenya brackets to our format
  useEffect(() => {
    loadTaxBrackets();
  }, []);

  const loadTaxBrackets = () => {
    setIsLoading(true);
    
    // Convert Kenya tax brackets to our extended format
    const convertedBrackets: TaxBracket[] = KENYA_TAX_BRACKETS.map((bracket, index) => ({
      id: `kra-2025-${index + 1}`,
      min: bracket.min,
      max: bracket.max === Infinity ? 999999999 : bracket.max,
      rate: bracket.rate * 100, // Convert to percentage
      description: `KRA 2025 Tax Bracket ${index + 1}`,
      effectiveDate: '2025-01-01',
      status: 'active' as const,
      createdBy: 'system',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    }));

    // Add some mock historical brackets
    const historicalBrackets: TaxBracket[] = [
      {
        id: 'kra-2023-1',
        min: 0,
        max: 288000,
        rate: 10,
        description: 'KRA 2023 Tax Bracket 1 (Expired)',
        effectiveDate: '2023-01-01',
        expiryDate: '2023-12-31',
        status: 'expired',
        createdBy: 'system',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-12-31T23:59:59.000Z'
      }
    ];

    setTaxBrackets([...convertedBrackets, ...historicalBrackets]);
    generateCalculationExamples(convertedBrackets.filter(b => b.status === 'active'));
    setIsLoading(false);
  };

  const generateCalculationExamples = (brackets: TaxBracket[]) => {
    const sampleIncomes = [50000, 100000, 200000, 500000, 1000000, 2000000];
    const examples: TaxCalculationExample[] = [];

    sampleIncomes.forEach(monthlyIncome => {
      const annualIncome = monthlyIncome * 12;
      let tax = 0;
      let marginalRate = 0;

      // Calculate tax using brackets
      for (const bracket of brackets.sort((a, b) => a.min - b.min)) {
        if (annualIncome > bracket.min) {
          const maxInBracket = bracket.max === 999999999 ? annualIncome : bracket.max;
          const taxableInBracket = Math.min(annualIncome, maxInBracket) - bracket.min + 1;
          
          if (taxableInBracket > 0) {
            tax += (taxableInBracket * bracket.rate) / 100;
            marginalRate = bracket.rate;
          }
        }
      }

      // Apply personal relief
      tax = Math.max(0, tax - 28800); // KES 28,800 personal relief
      const netIncome = annualIncome - tax;
      const effectiveRate = annualIncome > 0 ? (tax / annualIncome) * 100 : 0;

      examples.push({
        annualIncome,
        monthlyIncome,
        tax: Math.round(tax),
        netIncome: Math.round(netIncome),
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        marginalRate
      });
    });

    setCalculationExamples(examples);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.min || parseFloat(formData.min) < 0) {
      errors.min = 'Minimum income is required and must be 0 or greater';
    }

    if (!formData.max || parseFloat(formData.max) <= parseFloat(formData.min)) {
      errors.max = 'Maximum income must be greater than minimum income';
    }

    if (!formData.rate || parseFloat(formData.rate) < 0 || parseFloat(formData.rate) > 100) {
      errors.rate = 'Tax rate must be between 0% and 100%';
    }

    if (!formData.description) {
      errors.description = 'Description is required';
    }

    if (!formData.effectiveDate) {
      errors.effectiveDate = 'Effective date is required';
    }

    // Check for overlapping brackets
    const min = parseFloat(formData.min);
    const max = parseFloat(formData.max);
    const existingBrackets = taxBrackets.filter(b => 
      b.status === 'active' && 
      b.id !== selectedBracket?.id
    );

    for (const bracket of existingBrackets) {
      if ((min >= bracket.min && min <= bracket.max) || 
          (max >= bracket.min && max <= bracket.max) ||
          (min <= bracket.min && max >= bracket.max)) {
        errors.range = `Income range overlaps with existing bracket: ${formatKES(bracket.min)} - ${formatKES(bracket.max)}`;
        break;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddBracket = () => {
    if (!validateForm()) return;

    const newBracket: TaxBracket = {
      id: `custom-${Date.now()}`,
      min: parseFloat(formData.min),
      max: parseFloat(formData.max),
      rate: parseFloat(formData.rate),
      description: formData.description,
      effectiveDate: formData.effectiveDate,
      expiryDate: formData.expiryDate || undefined,
      status: 'active',
      createdBy: user?.id || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTaxBrackets(prev => [...prev, newBracket]);
    setShowAddDialog(false);
    resetForm();

    // Log action
    logTaxAction(
      {
        userId: user?.id || 'system',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1'
      },
      AuditAction.CREATE,
      `tax_bracket_${newBracket.id}`,
      undefined,
      newBracket
    );
  };

  const handleEditBracket = () => {
    if (!validateForm() || !selectedBracket) return;

    const updatedBracket: TaxBracket = {
      ...selectedBracket,
      min: parseFloat(formData.min),
      max: parseFloat(formData.max),
      rate: parseFloat(formData.rate),
      description: formData.description,
      effectiveDate: formData.effectiveDate,
      expiryDate: formData.expiryDate || undefined,
      updatedAt: new Date().toISOString()
    };

    setTaxBrackets(prev => prev.map(b => b.id === selectedBracket.id ? updatedBracket : b));
    setShowEditDialog(false);
    resetForm();
    setSelectedBracket(null);

    // Log action
    logTaxAction(
      {
        userId: user?.id || 'system',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1'
      },
      AuditAction.UPDATE,
      `tax_bracket_${selectedBracket.id}`,
      selectedBracket,
      updatedBracket
    );
  };

  const handleDeleteBracket = (bracket: TaxBracket) => {
    if (confirm(`Are you sure you want to delete the tax bracket: ${bracket.description}?`)) {
      setTaxBrackets(prev => prev.filter(b => b.id !== bracket.id));

      // Log action
      logTaxAction(
        {
          userId: user?.id || 'system',
          userAgent: navigator.userAgent,
          ipAddress: '127.0.0.1'
        },
        AuditAction.DELETE,
        `tax_bracket_${bracket.id}`,
        bracket,
        undefined
      );
    }
  };

  const handleStatusChange = (bracket: TaxBracket, newStatus: 'active' | 'inactive') => {
    const updatedBracket = { ...bracket, status: newStatus, updatedAt: new Date().toISOString() };
    setTaxBrackets(prev => prev.map(b => b.id === bracket.id ? updatedBracket : b));

    // Log action
    logTaxAction(
      {
        userId: user?.id || 'system',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1'
      },
      newStatus === 'active' ? AuditAction.ACTIVATE : AuditAction.DEACTIVATE,
      `tax_bracket_${bracket.id}`,
      bracket,
      updatedBracket
    );
  };

  const resetForm = () => {
    setFormData({
      min: '',
      max: '',
      rate: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    });
    setValidationErrors({});
  };

  const openEditDialog = (bracket: TaxBracket) => {
    setSelectedBracket(bracket);
    setFormData({
      min: bracket.min.toString(),
      max: bracket.max === 999999999 ? '' : bracket.max.toString(),
      rate: bracket.rate.toString(),
      description: bracket.description,
      effectiveDate: bracket.effectiveDate,
      expiryDate: bracket.expiryDate || ''
    });
    setShowEditDialog(true);
  };

  const exportBrackets = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      taxYear: filterYear,
      brackets: taxBrackets.filter(b => 
        filterStatus === 'all' || b.status === filterStatus
      )
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax-brackets-${filterYear}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getFilteredBrackets = () => {
    return taxBrackets.filter(bracket => {
      const statusMatch = filterStatus === 'all' || bracket.status === filterStatus;
      const yearMatch = bracket.effectiveDate.startsWith(filterYear);
      return statusMatch && yearMatch;
    }).sort((a, b) => a.min - b.min);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check permissions
  const canManageTax = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER]);
  const canEditBrackets = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);

  if (!canManageTax) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the Tax Brackets module. 
            Contact your administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Brackets Management</h1>
          <p className="text-gray-600">Manage Kenya Revenue Authority (KRA) tax brackets and rates</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            KRA 2024 Compliant
          </Badge>
          <Badge variant="outline">
            <Database className="w-4 h-4 mr-1" />
            {getFilteredBrackets().filter(b => b.status === 'active').length} Active Brackets
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Brackets</p>
                <p className="text-2xl font-bold">{taxBrackets.filter(b => b.status === 'active').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Max Tax Rate</p>
                <p className="text-2xl font-bold">
                  {Math.max(...taxBrackets.filter(b => b.status === 'active').map(b => b.rate))}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Bracket</p>
                <p className="text-2xl font-bold">
                  {formatKES(Math.max(...taxBrackets.filter(b => b.status === 'active').map(b => b.min)))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-sm font-bold">
                  {new Date(Math.max(...taxBrackets.map(b => new Date(b.updatedAt).getTime()))).toLocaleDateString()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="current">Current Brackets</TabsTrigger>
            <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {canEditBrackets && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Bracket
              </Button>
            )}
            <Button
              variant="outline"
              onClick={exportBrackets}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={loadTaxBrackets}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Brackets Tab */}
        <TabsContent value="current" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-end">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year-filter">Tax Year</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Brackets Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Tax Brackets ({filterYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading tax brackets...</p>
                </div>
              ) : getFilteredBrackets().length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tax Brackets Found</h3>
                  <p className="text-gray-600">No tax brackets match your current filters.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Income Range</TableHead>
                      <TableHead>Tax Rate</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredBrackets().map((bracket) => (
                      <TableRow key={bracket.id}>
                        <TableCell className="font-mono">
                          {formatKES(bracket.min)} - {bracket.max === 999999999 ? 'Above' : formatKES(bracket.max)}
                        </TableCell>
                        <TableCell className="font-bold">{bracket.rate}%</TableCell>
                        <TableCell>{bracket.description}</TableCell>
                        <TableCell>{new Date(bracket.effectiveDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(bracket.status)}>
                            {bracket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(bracket)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(
                                  bracket, 
                                  bracket.status === 'active' ? 'inactive' : 'active'
                                )}
                              >
                                {bracket.status === 'active' ? (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              {canEditBrackets && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteBracket(bracket)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Tax Calculation Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Examples of tax calculations using current active brackets (includes KES 28,800 personal relief)
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monthly Income</TableHead>
                    <TableHead>Annual Income</TableHead>
                    <TableHead>Annual Tax</TableHead>
                    <TableHead>Monthly Tax</TableHead>
                    <TableHead>Net Annual</TableHead>
                    <TableHead>Effective Rate</TableHead>
                    <TableHead>Marginal Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculationExamples.map((example, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-bold">{formatKES(example.monthlyIncome)}</TableCell>
                      <TableCell>{formatKES(example.annualIncome)}</TableCell>
                      <TableCell className="font-bold text-red-600">{formatKES(example.tax)}</TableCell>
                      <TableCell className="font-bold text-red-600">{formatKES(example.tax / 12)}</TableCell>
                      <TableCell className="font-bold text-green-600">{formatKES(example.netIncome)}</TableCell>
                      <TableCell>{example.effectiveRate}%</TableCell>
                      <TableCell>{example.marginalRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bracket History</h3>
              <p className="text-gray-600">Tax bracket change history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Tax Bracket Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tax bracket settings are managed centrally and should align with Kenya Revenue Authority guidelines.
                  Changes require proper authorization and approval process.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Personal Relief (Annual)</Label>
                  <Input value="KES 28,800" disabled />
                </div>
                <div>
                  <Label>Default Tax Year</Label>
                  <Input value="2024" disabled />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input value="Kenya Shillings (KES)" disabled />
                </div>
                <div>
                  <Label>Tax Authority</Label>
                  <Input value="Kenya Revenue Authority (KRA)" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Bracket Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Tax Bracket</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Minimum Income (KES)</Label>
              <Input
                id="min"
                type="number"
                value={formData.min}
                onChange={(e) => setFormData({...formData, min: e.target.value})}
                placeholder="0"
              />
              {validationErrors.min && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.min}</p>
              )}
            </div>
            <div>
              <Label htmlFor="max">Maximum Income (KES)</Label>
              <Input
                id="max"
                type="number"
                value={formData.max}
                onChange={(e) => setFormData({...formData, max: e.target.value})}
                placeholder="999999999 for unlimited"
              />
              {validationErrors.max && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.max}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rate">Tax Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                placeholder="10.00"
              />
              {validationErrors.rate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.rate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
              />
              {validationErrors.effectiveDate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.effectiveDate}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Custom Tax Bracket 2024"
              />
              {validationErrors.description && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              />
            </div>
          </div>
          {validationErrors.range && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationErrors.range}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBracket}>
              <Save className="w-4 h-4 mr-2" />
              Add Bracket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bracket Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tax Bracket</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-min">Minimum Income (KES)</Label>
              <Input
                id="edit-min"
                type="number"
                value={formData.min}
                onChange={(e) => setFormData({...formData, min: e.target.value})}
              />
              {validationErrors.min && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.min}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-max">Maximum Income (KES)</Label>
              <Input
                id="edit-max"
                type="number"
                value={formData.max}
                onChange={(e) => setFormData({...formData, max: e.target.value})}
              />
              {validationErrors.max && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.max}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-rate">Tax Rate (%)</Label>
              <Input
                id="edit-rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
              />
              {validationErrors.rate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.rate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-effectiveDate">Effective Date</Label>
              <Input
                id="edit-effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
              />
              {validationErrors.effectiveDate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.effectiveDate}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="edit-expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              />
            </div>
          </div>
          {validationErrors.range && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationErrors.range}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBracket}>
              <Save className="w-4 h-4 mr-2" />
              Update Bracket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxBrackets;
