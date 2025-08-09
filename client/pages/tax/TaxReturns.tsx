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
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
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
  Activity,
  Send,
  Clock,
  FileCheck,
  AlertTriangle,
  Search,
  Filter,
  FileX,
  Printer,
  Mail
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logTaxAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

interface TaxReturn {
  id: string;
  employeeId: string;
  employeeName: string;
  kraPin: string;
  taxYear: number;
  returnType: 'individual' | 'business' | 'withholding' | 'vat';
  grossIncome: number;
  taxableIncome: number;
  totalTaxPaid: number;
  taxDue: number;
  refundDue: number;
  filingDeadline: string;
  submissionDate?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'overdue';
  kraReference?: string;
  notes?: string;
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TaxForm {
  id: string;
  formCode: string;
  formName: string;
  description: string;
  version: string;
  effectiveDate: string;
  mandatory: boolean;
  filingFrequency: 'monthly' | 'quarterly' | 'annually';
  downloadUrl?: string;
  status: 'active' | 'deprecated';
}

interface TaxSubmission {
  id: string;
  returnId: string;
  submissionMethod: 'iTax' | 'manual' | 'agent';
  submissionDate: string;
  kraReference: string;
  acknowledgmentReceived: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessages?: string[];
  submittedBy: string;
}

interface TaxReport {
  id: string;
  reportType: 'p10' | 'p10a' | 'p9a' | 'annual_return' | 'withholding_tax';
  period: string;
  totalEmployees: number;
  totalIncome: number;
  totalTax: number;
  generatedAt: string;
  generatedBy: string;
  status: 'generated' | 'submitted' | 'acknowledged';
}

const TaxReturns: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // State management
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [taxForms, setTaxForms] = useState<TaxForm[]>([]);
  const [submissions, setSubmissions] = useState<TaxSubmission[]>([]);
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [selectedTab, setSelectedTab] = useState('returns');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<TaxReturn | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    kraPin: '',
    taxYear: 2025,
    returnType: 'individual',
    grossIncome: '',
    taxableIncome: '',
    totalTaxPaid: '',
    notes: ''
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('2025');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load tax returns data
  useEffect(() => {
    loadTaxReturnsData();
  }, []);

  const loadTaxReturnsData = () => {
    setIsLoading(true);
    
    // Mock tax returns data
    const mockReturns: TaxReturn[] = [
      {
        id: 'tr-2025-001',
        employeeId: 'EMP001',
        employeeName: 'John Mwangi',
        kraPin: 'A123456789P',
        taxYear: 2025,
        returnType: 'individual',
        grossIncome: 1800000, // Annual
        taxableIncome: 1750000,
        totalTaxPaid: 285000,
        taxDue: 285000,
        refundDue: 0,
        filingDeadline: '2025-06-30',
        submissionDate: '2025-03-15',
        status: 'submitted',
        kraReference: 'KRA2025001234',
        notes: 'Regular employee tax return',
        attachments: ['p9_form.pdf', 'bank_statement.pdf'],
        createdBy: 'system',
        createdAt: '2025-01-15T00:00:00.000Z',
        updatedAt: '2025-03-15T10:30:00.000Z'
      },
      {
        id: 'tr-2025-002',
        employeeId: 'EMP002',
        employeeName: 'Grace Wanjiku',
        kraPin: 'A987654321P',
        taxYear: 2025,
        returnType: 'individual',
        grossIncome: 2400000,
        taxableIncome: 2350000,
        totalTaxPaid: 420000,
        taxDue: 420000,
        refundDue: 0,
        filingDeadline: '2025-06-30',
        status: 'draft',
        notes: 'Pending additional documentation',
        attachments: ['p9_form.pdf'],
        createdBy: 'hr_manager',
        createdAt: '2025-02-01T00:00:00.000Z',
        updatedAt: '2025-02-01T00:00:00.000Z'
      },
      {
        id: 'tr-2025-003',
        employeeId: 'EMP003',
        employeeName: 'Peter Kiprotich',
        kraPin: 'A555666777P',
        taxYear: 2025,
        returnType: 'individual',
        grossIncome: 960000,
        taxableIncome: 930000,
        totalTaxPaid: 85000,
        taxDue: 85000,
        refundDue: 0,
        filingDeadline: '2025-06-30',
        submissionDate: '2025-04-10',
        status: 'approved',
        kraReference: 'KRA2025001235',
        attachments: ['p9_form.pdf', 'certificate_of_service.pdf'],
        createdBy: 'payroll_officer',
        createdAt: '2025-01-20T00:00:00.000Z',
        updatedAt: '2025-04-10T14:20:00.000Z'
      },
      {
        id: 'tr-2024-004',
        employeeId: 'EMP004',
        employeeName: 'Mary Achieng',
        kraPin: 'A111222333P',
        taxYear: 2024,
        returnType: 'individual',
        grossIncome: 540000,
        taxableIncome: 510000,
        totalTaxPaid: 25000,
        taxDue: 25000,
        refundDue: 0,
        filingDeadline: '2024-06-30',
        status: 'overdue',
        notes: 'Failed to submit within deadline',
        attachments: [],
        createdBy: 'system',
        createdAt: '2024-12-01T00:00:00.000Z',
        updatedAt: '2024-12-01T00:00:00.000Z'
      }
    ];

    // Mock tax forms data
    const mockForms: TaxForm[] = [
      {
        id: 'form-001',
        formCode: 'IT1',
        formName: 'Individual Income Tax Return',
        description: 'Annual income tax return for individuals',
        version: '2025.1',
        effectiveDate: '2025-01-01',
        mandatory: true,
        filingFrequency: 'annually',
        downloadUrl: '/forms/it1_2025.pdf',
        status: 'active'
      },
      {
        id: 'form-002',
        formCode: 'P10',
        formName: 'Monthly Tax Deduction Card',
        description: 'Monthly employee tax deductions',
        version: '2025.1',
        effectiveDate: '2025-01-01',
        mandatory: true,
        filingFrequency: 'monthly',
        downloadUrl: '/forms/p10_2025.pdf',
        status: 'active'
      },
      {
        id: 'form-003',
        formCode: 'P10A',
        formName: 'End of Year Certificate',
        description: 'Annual certificate of tax deducted',
        version: '2025.1',
        effectiveDate: '2025-01-01',
        mandatory: true,
        filingFrequency: 'annually',
        downloadUrl: '/forms/p10a_2025.pdf',
        status: 'active'
      },
      {
        id: 'form-004',
        formCode: 'WHT',
        formName: 'Withholding Tax Return',
        description: 'Withholding tax on payments to residents',
        version: '2025.1',
        effectiveDate: '2025-01-01',
        mandatory: false,
        filingFrequency: 'monthly',
        downloadUrl: '/forms/wht_2025.pdf',
        status: 'active'
      }
    ];

    // Mock submissions data
    const mockSubmissions: TaxSubmission[] = [
      {
        id: 'sub-001',
        returnId: 'tr-2025-001',
        submissionMethod: 'iTax',
        submissionDate: '2025-03-15T10:30:00.000Z',
        kraReference: 'KRA2025001234',
        acknowledgmentReceived: true,
        processingStatus: 'completed',
        submittedBy: 'system'
      },
      {
        id: 'sub-002',
        returnId: 'tr-2025-003',
        submissionMethod: 'iTax',
        submissionDate: '2025-04-10T14:20:00.000Z',
        kraReference: 'KRA2025001235',
        acknowledgmentReceived: true,
        processingStatus: 'completed',
        submittedBy: 'payroll_officer'
      }
    ];

    // Mock reports data
    const mockReports: TaxReport[] = [
      {
        id: 'rpt-001',
        reportType: 'p10a',
        period: '2024',
        totalEmployees: 125,
        totalIncome: 180000000,
        totalTax: 25000000,
        generatedAt: '2025-01-15T00:00:00.000Z',
        generatedBy: 'system',
        status: 'submitted'
      },
      {
        id: 'rpt-002',
        reportType: 'annual_return',
        period: '2024',
        totalEmployees: 125,
        totalIncome: 180000000,
        totalTax: 25000000,
        generatedAt: '2025-02-01T00:00:00.000Z',
        generatedBy: 'admin',
        status: 'generated'
      }
    ];

    setTaxReturns(mockReturns);
    setTaxForms(mockForms);
    setSubmissions(mockSubmissions);
    setReports(mockReports);
    setIsLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.employeeName) {
      errors.employeeName = 'Employee name is required';
    }

    if (!formData.kraPin || formData.kraPin.length !== 11) {
      errors.kraPin = 'Valid KRA PIN is required (11 characters)';
    }

    if (!formData.grossIncome || parseFloat(formData.grossIncome) < 0) {
      errors.grossIncome = 'Valid gross income is required';
    }

    if (!formData.taxableIncome || parseFloat(formData.taxableIncome) < 0) {
      errors.taxableIncome = 'Valid taxable income is required';
    }

    if (!formData.totalTaxPaid || parseFloat(formData.totalTaxPaid) < 0) {
      errors.totalTaxPaid = 'Valid total tax paid is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddReturn = () => {
    if (!validateForm()) return;

    const grossIncome = parseFloat(formData.grossIncome);
    const taxableIncome = parseFloat(formData.taxableIncome);
    const totalTaxPaid = parseFloat(formData.totalTaxPaid);

    const newReturn: TaxReturn = {
      id: `tr-${formData.taxYear}-${Date.now()}`,
      employeeId: formData.employeeId || `EMP${Date.now()}`,
      employeeName: formData.employeeName,
      kraPin: formData.kraPin,
      taxYear: formData.taxYear,
      returnType: formData.returnType as any,
      grossIncome,
      taxableIncome,
      totalTaxPaid,
      taxDue: totalTaxPaid, // Simplified calculation
      refundDue: 0,
      filingDeadline: `${formData.taxYear}-06-30`,
      status: 'draft',
      notes: formData.notes,
      attachments: [],
      createdBy: user?.id || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTaxReturns(prev => [...prev, newReturn]);
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
      `tax_return_${newReturn.id}`,
      undefined,
      newReturn
    );
  };

  const handleSubmitReturn = (returnItem: TaxReturn) => {
    const updatedReturn = {
      ...returnItem,
      status: 'submitted' as const,
      submissionDate: new Date().toISOString(),
      kraReference: `KRA${Date.now()}`,
      updatedAt: new Date().toISOString()
    };

    setTaxReturns(prev => prev.map(r => r.id === returnItem.id ? updatedReturn : r));

    // Create submission record
    const newSubmission: TaxSubmission = {
      id: `sub-${Date.now()}`,
      returnId: returnItem.id,
      submissionMethod: 'iTax',
      submissionDate: new Date().toISOString(),
      kraReference: updatedReturn.kraReference!,
      acknowledgmentReceived: false,
      processingStatus: 'pending',
      submittedBy: user?.id || 'system'
    };

    setSubmissions(prev => [...prev, newSubmission]);

    // Log action
    logTaxAction(
      {
        userId: user?.id || 'system',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1'
      },
      AuditAction.SUBMIT,
      `tax_return_${returnItem.id}`,
      returnItem,
      updatedReturn
    );
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      kraPin: '',
      taxYear: 2025,
      returnType: 'individual',
      grossIncome: '',
      taxableIncome: '',
      totalTaxPaid: '',
      notes: ''
    });
    setValidationErrors({});
  };

  const exportReturns = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      filters: { status: filterStatus, year: filterYear, type: filterType },
      returns: getFilteredReturns(),
      summary: {
        totalReturns: getFilteredReturns().length,
        totalIncome: getFilteredReturns().reduce((sum, r) => sum + r.grossIncome, 0),
        totalTax: getFilteredReturns().reduce((sum, r) => sum + r.totalTaxPaid, 0)
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax-returns-${filterYear}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadForm = (form: TaxForm) => {
    // Simulate form download
    const link = document.createElement('a');
    link.href = form.downloadUrl || '#';
    link.download = `${form.formCode}_${form.version}.pdf`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'deprecated': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredReturns = () => {
    return taxReturns.filter(returnItem => {
      const statusMatch = filterStatus === 'all' || returnItem.status === filterStatus;
      const yearMatch = filterYear === 'all' || returnItem.taxYear.toString() === filterYear;
      const typeMatch = filterType === 'all' || returnItem.returnType === filterType;
      const searchMatch = !searchTerm || 
        returnItem.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.kraPin.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && yearMatch && typeMatch && searchMatch;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  // Check permissions
  const canManageTax = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER]);
  const canCreateReturns = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);

  if (!canManageTax) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the Tax Returns module. 
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
          <h1 className="text-3xl font-bold text-gray-900">Tax Returns Management</h1>
          <p className="text-gray-600">Kenya Revenue Authority (KRA) tax return filing and management for 2025</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            KRA 2025 Compliant
          </Badge>
          <Badge variant="outline">
            <FileText className="w-4 h-4 mr-1" />
            {taxReturns.length} Returns
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold">{taxReturns.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-2xl font-bold">{taxReturns.filter(r => r.status === 'submitted').length}</p>
              </div>
              <Send className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{taxReturns.filter(r => r.status === 'draft').length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">{taxReturns.filter(r => r.status === 'overdue').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tax</p>
                <p className="text-2xl font-bold">
                  {formatKES(taxReturns.reduce((sum, r) => sum + r.totalTaxPaid, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="returns">Tax Returns</TabsTrigger>
            <TabsTrigger value="forms">Tax Forms</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {canCreateReturns && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Return
              </Button>
            )}
            <Button
              variant="outline"
              onClick={exportReturns}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={loadTaxReturnsData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tax Returns Tab */}
        <TabsContent value="returns" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-end">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name or KRA PIN"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
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
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type-filter">Return Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="withholding">Withholding</SelectItem>
                      <SelectItem value="vat">VAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Returns Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Tax Returns ({getFilteredReturns().length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading tax returns...</p>
                </div>
              ) : getFilteredReturns().length === 0 ? (
                <div className="text-center py-8">
                  <FileX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tax Returns Found</h3>
                  <p className="text-gray-600">No tax returns match your current filters.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>KRA PIN</TableHead>
                      <TableHead>Tax Year</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Gross Income</TableHead>
                      <TableHead>Tax Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredReturns().map((returnItem) => (
                      <TableRow key={returnItem.id}>
                        <TableCell className="font-medium">{returnItem.employeeName}</TableCell>
                        <TableCell className="font-mono text-sm">{returnItem.kraPin}</TableCell>
                        <TableCell>{returnItem.taxYear}</TableCell>
                        <TableCell className="capitalize">{returnItem.returnType}</TableCell>
                        <TableCell>{formatKES(returnItem.grossIncome)}</TableCell>
                        <TableCell className="font-bold text-green-600">{formatKES(returnItem.totalTaxPaid)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(returnItem.status)}>
                            {returnItem.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(returnItem.filingDeadline).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {returnItem.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handleSubmitReturn(returnItem)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Submit to KRA
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
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

        {/* Tax Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Available Tax Forms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {taxForms.map((form) => (
                  <Card key={form.id} className="relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{form.formCode}</h3>
                          <p className="text-sm text-gray-600">{form.formName}</p>
                        </div>
                        <Badge className={getStatusColor(form.status)}>
                          {form.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">{form.description}</p>
                      <div className="space-y-2 text-xs text-gray-500">
                        <div>Version: {form.version}</div>
                        <div>Frequency: {form.filingFrequency}</div>
                        <div>Mandatory: {form.mandatory ? 'Yes' : 'No'}</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => downloadForm(form)}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                KRA Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Submission Method</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>KRA Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm">{submission.returnId}</TableCell>
                      <TableCell className="capitalize">{submission.submissionMethod}</TableCell>
                      <TableCell>{new Date(submission.submissionDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-sm">{submission.kraReference}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.processingStatus)}>
                          {submission.processingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{submission.submittedBy}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tax Reports</h3>
              <p className="text-gray-600">Comprehensive tax reporting and analytics will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Return Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Tax Return</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input
                id="employeeName"
                value={formData.employeeName}
                onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                placeholder="John Doe"
              />
              {validationErrors.employeeName && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.employeeName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="kraPin">KRA PIN</Label>
              <Input
                id="kraPin"
                value={formData.kraPin}
                onChange={(e) => setFormData({...formData, kraPin: e.target.value.toUpperCase()})}
                placeholder="A123456789P"
                maxLength={11}
              />
              {validationErrors.kraPin && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.kraPin}</p>
              )}
            </div>
            <div>
              <Label htmlFor="taxYear">Tax Year</Label>
              <Select
                value={formData.taxYear.toString()}
                onValueChange={(value) => setFormData({...formData, taxYear: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="returnType">Return Type</Label>
              <Select
                value={formData.returnType}
                onValueChange={(value) => setFormData({...formData, returnType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="withholding">Withholding</SelectItem>
                  <SelectItem value="vat">VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grossIncome">Annual Gross Income (KES)</Label>
              <Input
                id="grossIncome"
                type="number"
                value={formData.grossIncome}
                onChange={(e) => setFormData({...formData, grossIncome: e.target.value})}
                placeholder="1800000"
              />
              {validationErrors.grossIncome && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.grossIncome}</p>
              )}
            </div>
            <div>
              <Label htmlFor="taxableIncome">Taxable Income (KES)</Label>
              <Input
                id="taxableIncome"
                type="number"
                value={formData.taxableIncome}
                onChange={(e) => setFormData({...formData, taxableIncome: e.target.value})}
                placeholder="1750000"
              />
              {validationErrors.taxableIncome && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.taxableIncome}</p>
              )}
            </div>
            <div>
              <Label htmlFor="totalTaxPaid">Total Tax Paid (KES)</Label>
              <Input
                id="totalTaxPaid"
                type="number"
                value={formData.totalTaxPaid}
                onChange={(e) => setFormData({...formData, totalTaxPaid: e.target.value})}
                placeholder="285000"
              />
              {validationErrors.totalTaxPaid && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.totalTaxPaid}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReturn}>
              <Save className="w-4 h-4 mr-2" />
              Create Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxReturns;
