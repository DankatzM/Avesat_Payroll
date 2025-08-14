import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  Search,
  Filter,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  CreditCard,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Download,
  Upload,
  RefreshCw,
  Settings
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Interfaces
interface LoanType {
  id: string;
  name: string;
  description: string;
  maxAmount: number;
  minAmount: number;
  maxTerm: number; // months
  minTerm: number; // months
  interestRate: number; // annual %
  processingFee: number;
  requiresGuarantor: boolean;
  requiresCollateral: boolean;
  eligibilityRules: string[];
  isActive: boolean;
}

interface LoanApplication {
  id: string;
  employeeId: string;
  loanTypeId: string;
  amount: number;
  term: number; // months
  purpose: string;
  applicationDate: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  disbursementDate?: string;
  guarantors: LoanGuarantor[];
  collateral?: string;
  monthlyInstallment: number;
  totalInterest: number;
  totalPayable: number;
}

interface LoanGuarantor {
  id: string;
  employeeId: string;
  guaranteeAmount: number;
  status: 'pending' | 'accepted' | 'declined';
  acceptedAt?: string;
}

interface LoanPayment {
  id: string;
  loanId: string;
  paymentDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  outstandingBalance: number;
  paymentMethod: 'salary_deduction' | 'cash' | 'bank_transfer';
  payrollPeriodId?: string;
  notes?: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  grossSalary: number;
  netSalary: number;
  employmentDate: string;
  isActive: boolean;
}

const LoanManagement: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageLoans = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canProcessPayments = hasAnyRole([UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('loan-types');
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LoanApplication[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);

  // Form state
  const [newLoanType, setNewLoanType] = useState<Partial<LoanType>>({});
  const [newApplication, setNewApplication] = useState<Partial<LoanApplication>>({});

  // Mock data
  const mockLoanTypes: LoanType[] = [
    {
      id: 'staff_loan',
      name: 'Staff Loan',
      description: 'General purpose staff loan',
      maxAmount: 500000,
      minAmount: 10000,
      maxTerm: 36,
      minTerm: 6,
      interestRate: 12,
      processingFee: 1000,
      requiresGuarantor: true,
      requiresCollateral: false,
      eligibilityRules: ['Minimum 6 months service', 'Good credit standing'],
      isActive: true
    },
    {
      id: 'emergency_loan',
      name: 'Emergency Loan',
      description: 'Quick disbursement for emergencies',
      maxAmount: 100000,
      minAmount: 5000,
      maxTerm: 12,
      minTerm: 3,
      interestRate: 15,
      processingFee: 500,
      requiresGuarantor: false,
      requiresCollateral: false,
      eligibilityRules: ['Minimum 3 months service'],
      isActive: true
    },
    {
      id: 'vehicle_loan',
      name: 'Vehicle Loan',
      description: 'Loan for vehicle purchase',
      maxAmount: 2000000,
      minAmount: 100000,
      maxTerm: 60,
      minTerm: 12,
      interestRate: 10,
      processingFee: 5000,
      requiresGuarantor: true,
      requiresCollateral: true,
      eligibilityRules: ['Minimum 12 months service', 'Vehicle as collateral'],
      isActive: true
    },
    {
      id: 'development_loan',
      name: 'Development Loan',
      description: 'Loan for education or property development',
      maxAmount: 1000000,
      minAmount: 50000,
      maxTerm: 48,
      minTerm: 12,
      interestRate: 8,
      processingFee: 2500,
      requiresGuarantor: true,
      requiresCollateral: true,
      eligibilityRules: ['Minimum 18 months service', 'Proof of development project'],
      isActive: true
    }
  ];

  const mockEmployees: Employee[] = [
    {
      id: 'emp_001',
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Mwangi',
      department: 'Finance',
      position: 'Accountant',
      grossSalary: 150000,
      netSalary: 110000,
      employmentDate: '2023-01-15',
      isActive: true
    },
    {
      id: 'emp_002',
      employeeNumber: 'EMP002',
      firstName: 'Grace',
      lastName: 'Wanjiku',
      department: 'HR',
      position: 'HR Manager',
      grossSalary: 200000,
      netSalary: 145000,
      employmentDate: '2022-06-20',
      isActive: true
    },
    {
      id: 'emp_003',
      employeeNumber: 'EMP003',
      firstName: 'Peter',
      lastName: 'Kiprotich',
      department: 'IT',
      position: 'Software Developer',
      grossSalary: 300000,
      netSalary: 210000,
      employmentDate: '2021-03-10',
      isActive: true
    }
  ];

  const mockApplications: LoanApplication[] = [
    {
      id: 'loan_app_001',
      employeeId: 'emp_001',
      loanTypeId: 'staff_loan',
      amount: 200000,
      term: 24,
      purpose: 'Home improvement',
      applicationDate: '2025-01-10',
      status: 'approved',
      reviewedBy: 'hr_manager_001',
      reviewedAt: '2025-01-12',
      reviewNotes: 'Approved with standard terms',
      disbursementDate: '2025-01-15',
      guarantors: [
        {
          id: 'guarantor_001',
          employeeId: 'emp_002',
          guaranteeAmount: 100000,
          status: 'accepted',
          acceptedAt: '2025-01-11'
        }
      ],
      monthlyInstallment: 9533,
      totalInterest: 28800,
      totalPayable: 228800
    },
    {
      id: 'loan_app_002',
      employeeId: 'emp_003',
      loanTypeId: 'vehicle_loan',
      amount: 800000,
      term: 48,
      purpose: 'Vehicle purchase',
      applicationDate: '2025-01-08',
      status: 'under_review',
      guarantors: [
        {
          id: 'guarantor_002',
          employeeId: 'emp_001',
          guaranteeAmount: 400000,
          status: 'pending'
        }
      ],
      monthlyInstallment: 20133,
      totalInterest: 166400,
      totalPayable: 966400
    }
  ];

  // Initialize data
  useEffect(() => {
    setLoanTypes(mockLoanTypes);
    setLoanApplications(mockApplications);
    setEmployees(mockEmployees);
    setFilteredApplications(mockApplications);
  }, []);

  // Filter applications
  useEffect(() => {
    let filtered = loanApplications;

    if (searchTerm) {
      filtered = filtered.filter(app => {
        const employee = employees.find(e => e.id === app.employeeId);
        const loanType = loanTypes.find(lt => lt.id === app.loanTypeId);
        return (
          employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loanType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.purpose.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => app.loanTypeId === typeFilter);
    }

    setFilteredApplications(filtered);
  }, [loanApplications, searchTerm, statusFilter, typeFilter, employees, loanTypes]);

  // Calculate loan installment
  const calculateInstallment = (amount: number, rate: number, term: number): number => {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return amount / term;
    
    const installment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                       (Math.pow(1 + monthlyRate, term) - 1);
    return Math.round(installment);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'disbursed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canManageLoans) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage loans.
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
          <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600">Comprehensive staff loan administration and tracking</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <CreditCard className="w-4 h-4 mr-1" />
            {loanApplications.length} Applications
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <DollarSign className="w-4 h-4 mr-1" />
            {loanApplications.filter(app => app.status === 'disbursed').length} Active Loans
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="loan-types">Loan Types</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="active-loans">Active Loans</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        {/* Loan Types Tab */}
        <TabsContent value="loan-types" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Loan Types Configuration
                </CardTitle>
                <Button onClick={() => setShowLoanForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Loan Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {loanTypes.map((loanType) => (
                  <Card key={loanType.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{loanType.name}</h3>
                            <Badge variant={loanType.isActive ? "default" : "secondary"}>
                              {loanType.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{loanType.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label>Amount Range</Label>
                              <div>{formatKES(loanType.minAmount)} - {formatKES(loanType.maxAmount)}</div>
                            </div>
                            <div>
                              <Label>Term Range</Label>
                              <div>{loanType.minTerm} - {loanType.maxTerm} months</div>
                            </div>
                            <div>
                              <Label>Interest Rate</Label>
                              <div>{loanType.interestRate}% per annum</div>
                            </div>
                            <div>
                              <Label>Processing Fee</Label>
                              <div>{formatKES(loanType.processingFee)}</div>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${loanType.requiresGuarantor ? 'bg-orange-400' : 'bg-gray-300'}`}></span>
                              <span>Guarantor Required</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${loanType.requiresCollateral ? 'bg-red-400' : 'bg-gray-300'}`}></span>
                              <span>Collateral Required</span>
                            </div>
                          </div>

                          {loanType.eligibilityRules.length > 0 && (
                            <div className="mt-3">
                              <Label>Eligibility Rules</Label>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {loanType.eligibilityRules.map((rule, index) => (
                                  <li key={index}>{rule}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Loan Applications
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Application
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="disbursed">Disbursed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {loanTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Applications Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Application Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => {
                    const employee = employees.find(e => e.id === application.employeeId);
                    const loanType = loanTypes.find(lt => lt.id === application.loanTypeId);

                    return (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{loanType?.name}</TableCell>
                        <TableCell className="font-medium">{formatKES(application.amount)}</TableCell>
                        <TableCell>{application.term} months</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(application.applicationDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {application.status === 'under_review' && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <AlertTriangle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Loans Tab */}
        <TabsContent value="active-loans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Active Loans Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-sm text-blue-600">Active Loans</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{formatKES(2500000)}</div>
                    <div className="text-sm text-green-600">Total Disbursed</div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{formatKES(1800000)}</div>
                    <div className="text-sm text-orange-600">Outstanding Balance</div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatKES(45000)}</div>
                    <div className="text-sm text-purple-600">Monthly Collections</div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Monthly Payment</TableHead>
                    <TableHead>Remaining Term</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.filter(app => app.status === 'disbursed').map((loan) => {
                    const employee = employees.find(e => e.id === loan.employeeId);
                    const loanType = loanTypes.find(lt => lt.id === loan.loanTypeId);
                    
                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{loanType?.name}</TableCell>
                        <TableCell className="font-medium">{formatKES(loan.amount)}</TableCell>
                        <TableCell className="font-medium text-orange-600">{formatKES(Math.round(loan.amount * 0.7))}</TableCell>
                        <TableCell>{formatKES(loan.monthlyInstallment)}</TableCell>
                        <TableCell>18 months</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Loan Payments & Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Processing</h3>
                <p className="text-gray-600 mb-4">Record loan payments and manage collections</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Loan Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Loan Parameters</h3>
                  
                  <div>
                    <Label htmlFor="calc-amount">Loan Amount (KES)</Label>
                    <Input id="calc-amount" type="number" placeholder="Enter loan amount" />
                  </div>
                  
                  <div>
                    <Label htmlFor="calc-rate">Interest Rate (% per annum)</Label>
                    <Input id="calc-rate" type="number" placeholder="Enter interest rate" />
                  </div>
                  
                  <div>
                    <Label htmlFor="calc-term">Loan Term (months)</Label>
                    <Input id="calc-term" type="number" placeholder="Enter loan term" />
                  </div>
                  
                  <Button className="w-full">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Calculation Results</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span>Monthly Payment:</span>
                      <span className="font-semibold">{formatKES(0)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span>Total Interest:</span>
                      <span className="font-semibold">{formatKES(0)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span>Total Amount Payable:</span>
                      <span className="font-semibold">{formatKES(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoanManagement;
