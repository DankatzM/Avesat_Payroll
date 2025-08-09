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
  Heart,
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
  Calculator,
  Users,
  Building2,
  Activity
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logTaxAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

interface SHIFBand {
  id: string;
  min: number;
  max: number;
  amount: number;
  description: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface SHIFContribution {
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  shifBand: string;
  contributionAmount: number;
  employeeShare: number;
  employerShare: number;
  totalContribution: number;
  month: string;
  year: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface SHIFReport {
  period: string;
  totalEmployees: number;
  totalContributions: number;
  employeeShare: number;
  employerShare: number;
  bandDistribution: Record<string, number>;
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
}

const SHIFManagement: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // State management
  const [shifBands, setSHIFBands] = useState<SHIFBand[]>([]);
  const [contributions, setContributions] = useState<SHIFContribution[]>([]);
  const [selectedTab, setSelectedTab] = useState('bands');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBand, setSelectedBand] = useState<SHIFBand | null>(null);
  const [formData, setFormData] = useState({
    min: '',
    max: '',
    amount: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth() + 1 + '');
  const [filterYear, setFilterYear] = useState<string>('2025');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load SHIF bands and contributions
  useEffect(() => {
    loadSHIFData();
  }, []);

  const loadSHIFData = () => {
    setIsLoading(true);
    
    // SHIF bands for 2025 (Social Health Insurance Fund)
    const defaultSHIFBands: SHIFBand[] = [
      {
        id: 'shif-2025-1',
        min: 0,
        max: 5999,
        amount: 150,
        description: 'SHIF Band 1 - Low Income',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-2',
        min: 6000,
        max: 7999,
        amount: 300,
        description: 'SHIF Band 2',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-3',
        min: 8000,
        max: 11999,
        amount: 400,
        description: 'SHIF Band 3',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-4',
        min: 12000,
        max: 14999,
        amount: 500,
        description: 'SHIF Band 4',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-5',
        min: 15000,
        max: 19999,
        amount: 600,
        description: 'SHIF Band 5',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-6',
        min: 20000,
        max: 24999,
        amount: 750,
        description: 'SHIF Band 6',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-7',
        min: 25000,
        max: 29999,
        amount: 850,
        description: 'SHIF Band 7',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-8',
        min: 30000,
        max: 34999,
        amount: 900,
        description: 'SHIF Band 8',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-9',
        min: 35000,
        max: 39999,
        amount: 950,
        description: 'SHIF Band 9',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-10',
        min: 40000,
        max: 44999,
        amount: 1000,
        description: 'SHIF Band 10',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-11',
        min: 45000,
        max: 49999,
        amount: 1100,
        description: 'SHIF Band 11',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-12',
        min: 50000,
        max: 59999,
        amount: 1200,
        description: 'SHIF Band 12',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-13',
        min: 60000,
        max: 69999,
        amount: 1300,
        description: 'SHIF Band 13',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-14',
        min: 70000,
        max: 79999,
        amount: 1400,
        description: 'SHIF Band 14',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-15',
        min: 80000,
        max: 89999,
        amount: 1500,
        description: 'SHIF Band 15',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-16',
        min: 90000,
        max: 99999,
        amount: 1600,
        description: 'SHIF Band 16',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'shif-2025-17',
        min: 100000,
        max: 999999999,
        amount: 1700,
        description: 'SHIF Band 17 - High Income',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ];

    // Mock contribution data
    const mockContributions: SHIFContribution[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'John Mwangi',
        grossSalary: 150000,
        shifBand: 'Band 17',
        contributionAmount: 1700,
        employeeShare: 850, // 50% employee share
        employerShare: 850, // 50% employer share
        totalContribution: 1700,
        month: 'January',
        year: 2025,
        status: 'paid'
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Grace Wanjiku',
        grossSalary: 200000,
        shifBand: 'Band 17',
        contributionAmount: 1700,
        employeeShare: 850,
        employerShare: 850,
        totalContribution: 1700,
        month: 'January',
        year: 2025,
        status: 'paid'
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Peter Kiprotich',
        grossSalary: 80000,
        shifBand: 'Band 15',
        contributionAmount: 1500,
        employeeShare: 750,
        employerShare: 750,
        totalContribution: 1500,
        month: 'January',
        year: 2025,
        status: 'pending'
      },
      {
        employeeId: 'EMP004',
        employeeName: 'Mary Achieng',
        grossSalary: 45000,
        shifBand: 'Band 11',
        contributionAmount: 1100,
        employeeShare: 550,
        employerShare: 550,
        totalContribution: 1100,
        month: 'January',
        year: 2025,
        status: 'paid'
      }
    ];

    setSHIFBands(defaultSHIFBands);
    setContributions(mockContributions);
    setIsLoading(false);
  };

  const calculateSHIFContribution = (grossSalary: number): { band: SHIFBand | null; amount: number } => {
    const activeBands = shifBands.filter(band => band.status === 'active');
    
    for (const band of activeBands.sort((a, b) => a.min - b.min)) {
      if (grossSalary >= band.min && grossSalary <= band.max) {
        return { band, amount: band.amount };
      }
    }
    
    return { band: null, amount: 0 };
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.min || parseFloat(formData.min) < 0) {
      errors.min = 'Minimum salary is required and must be 0 or greater';
    }

    if (!formData.max || parseFloat(formData.max) <= parseFloat(formData.min)) {
      errors.max = 'Maximum salary must be greater than minimum salary';
    }

    if (!formData.amount || parseFloat(formData.amount) < 0) {
      errors.amount = 'Contribution amount must be 0 or greater';
    }

    if (!formData.description) {
      errors.description = 'Description is required';
    }

    if (!formData.effectiveDate) {
      errors.effectiveDate = 'Effective date is required';
    }

    // Check for overlapping bands
    const min = parseFloat(formData.min);
    const max = parseFloat(formData.max);
    const existingBands = shifBands.filter(b => 
      b.status === 'active' && 
      b.id !== selectedBand?.id
    );

    for (const band of existingBands) {
      if ((min >= band.min && min <= band.max) || 
          (max >= band.min && max <= band.max) ||
          (min <= band.min && max >= band.max)) {
        errors.range = `Salary range overlaps with existing band: ${formatKES(band.min)} - ${formatKES(band.max)}`;
        break;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddBand = () => {
    if (!validateForm()) return;

    const newBand: SHIFBand = {
      id: `custom-${Date.now()}`,
      min: parseFloat(formData.min),
      max: parseFloat(formData.max),
      amount: parseFloat(formData.amount),
      description: formData.description,
      effectiveDate: formData.effectiveDate,
      status: 'active',
      createdBy: user?.id || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSHIFBands(prev => [...prev, newBand]);
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
      `shif_band_${newBand.id}`,
      undefined,
      newBand
    );
  };

  const resetForm = () => {
    setFormData({
      min: '',
      max: '',
      amount: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
    setValidationErrors({});
  };

  const openEditDialog = (band: SHIFBand) => {
    setSelectedBand(band);
    setFormData({
      min: band.min.toString(),
      max: band.max === 999999999 ? '' : band.max.toString(),
      amount: band.amount.toString(),
      description: band.description,
      effectiveDate: band.effectiveDate
    });
    setShowEditDialog(true);
  };

  const exportContributions = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      period: `${filterMonth}/${filterYear}`,
      contributions: contributions.filter(c => 
        filterStatus === 'all' || c.status === filterStatus
      )
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shif-contributions-${filterMonth}-${filterYear}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredBands = () => {
    return shifBands.filter(band => {
      const statusMatch = filterStatus === 'all' || band.status === filterStatus;
      return statusMatch;
    }).sort((a, b) => a.min - b.min);
  };

  const getFilteredContributions = () => {
    return contributions.filter(contribution => {
      const statusMatch = filterStatus === 'all' || contribution.status === filterStatus;
      return statusMatch;
    });
  };

  // Check permissions
  const canManageTax = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER]);
  const canEditBands = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);

  if (!canManageTax) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the SHIF Management module. 
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
          <h1 className="text-3xl font-bold text-gray-900">SHIF Management</h1>
          <p className="text-gray-600">Social Health Insurance Fund (SHIF) contribution management for 2025</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            SHIF 2025 Compliant
          </Badge>
          <Badge variant="outline">
            <Heart className="w-4 h-4 mr-1" />
            {shifBands.filter(b => b.status === 'active').length} Active Bands
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bands</p>
                <p className="text-2xl font-bold">{shifBands.filter(b => b.status === 'active').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{contributions.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Collections</p>
                <p className="text-2xl font-bold">
                  {formatKES(contributions.reduce((sum, c) => sum + c.totalContribution, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((contributions.filter(c => c.status === 'paid').length / contributions.length) * 100)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="bands">SHIF Bands</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {canEditBands && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Band
              </Button>
            )}
            <Button
              variant="outline"
              onClick={exportContributions}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={loadSHIFData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* SHIF Bands Tab */}
        <TabsContent value="bands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                SHIF Contribution Bands (2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading SHIF bands...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Band</TableHead>
                      <TableHead>Salary Range</TableHead>
                      <TableHead>Monthly Contribution</TableHead>
                      <TableHead>Employee Share</TableHead>
                      <TableHead>Employer Share</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredBands().map((band, index) => (
                      <TableRow key={band.id}>
                        <TableCell className="font-bold">Band {index + 1}</TableCell>
                        <TableCell className="font-mono">
                          {formatKES(band.min)} - {band.max === 999999999 ? 'Above' : formatKES(band.max)}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">{formatKES(band.amount)}</TableCell>
                        <TableCell className="text-green-600">{formatKES(band.amount / 2)}</TableCell>
                        <TableCell className="text-purple-600">{formatKES(band.amount / 2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(band.status)}>
                            {band.status}
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
                              <DropdownMenuItem onClick={() => openEditDialog(band)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
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

        {/* Contributions Tab */}
        <TabsContent value="contributions" className="space-y-6">
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
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="month-filter">Month</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {new Date(0, i).toLocaleString('en', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year-filter">Year</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Employee SHIF Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>SHIF Band</TableHead>
                    <TableHead>Employee Share</TableHead>
                    <TableHead>Employer Share</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredContributions().map((contribution) => (
                    <TableRow key={contribution.employeeId}>
                      <TableCell className="font-medium">{contribution.employeeName}</TableCell>
                      <TableCell>{formatKES(contribution.grossSalary)}</TableCell>
                      <TableCell>{contribution.shifBand}</TableCell>
                      <TableCell className="text-green-600">{formatKES(contribution.employeeShare)}</TableCell>
                      <TableCell className="text-purple-600">{formatKES(contribution.employerShare)}</TableCell>
                      <TableCell className="font-bold">{formatKES(contribution.totalContribution)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contribution.status)}>
                          {contribution.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                SHIF Contribution Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="salary-input">Monthly Gross Salary (KES)</Label>
                  <Input
                    id="salary-input"
                    type="number"
                    placeholder="Enter gross salary"
                    onChange={(e) => {
                      const salary = parseFloat(e.target.value) || 0;
                      const result = calculateSHIFContribution(salary);
                      // You could update a state to show the result
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Calculation Result</h4>
                  <div className="text-sm text-gray-600">
                    Enter a salary amount to see the SHIF contribution calculation
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">SHIF Reports</h3>
              <p className="text-gray-600">Comprehensive SHIF reporting and analytics will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Band Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New SHIF Band</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Minimum Salary (KES)</Label>
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
              <Label htmlFor="max">Maximum Salary (KES)</Label>
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
              <Label htmlFor="amount">Monthly Contribution (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="1000"
              />
              {validationErrors.amount && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.amount}</p>
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
                placeholder="SHIF Band Description"
              />
              {validationErrors.description && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
              )}
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
            <Button onClick={handleAddBand}>
              <Save className="w-4 h-4 mr-2" />
              Add Band
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SHIFManagement;
