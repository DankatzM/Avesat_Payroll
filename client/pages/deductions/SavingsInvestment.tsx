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
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  PiggyBank,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Settings,
  Coins,
  Banknote,
  CreditCard,
  Landmark,
  Target,
  LineChart,
  BarChart3
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Interfaces
interface SavingsScheme {
  id: string;
  name: string;
  description: string;
  schemeType: 'mandatory' | 'voluntary' | 'contractual';
  provider: string;
  productType: 'savings' | 'investment' | 'pension' | 'insurance';
  minContribution: number;
  maxContribution?: number;
  contributionFrequency: 'monthly' | 'quarterly' | 'annually';
  interestRate: number; // annual percentage
  maturityPeriod?: number; // months
  penaltyRate?: number; // early withdrawal penalty
  taxBenefits: boolean;
  employerMatching: boolean;
  matchingPercentage?: number;
  maxEmployerMatch?: number;
  eligibilityRules: string[];
  withdrawalRules: string[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

interface EmployeeSavings {
  id: string;
  employeeId: string;
  schemeId: string;
  accountNumber: string;
  joinDate: string;
  status: 'active' | 'suspended' | 'matured' | 'closed';
  monthlyContribution: number;
  totalContributions: number;
  employerContributions: number;
  interestEarned: number;
  currentBalance: number;
  lastContributionDate?: string;
  maturityDate?: string;
  withdrawalRequests: WithdrawalRequest[];
  performanceData: PerformanceData[];
}

interface WithdrawalRequest {
  id: string;
  requestDate: string;
  amount: number;
  reason: string;
  type: 'partial' | 'full' | 'emergency';
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  processedDate?: string;
  penaltyAmount?: number;
  netAmount?: number;
}

interface PerformanceData {
  date: string;
  balance: number;
  contribution: number;
  interest: number;
  returns: number;
}

interface SavingsTransaction {
  id: string;
  savingsId: string;
  transactionDate: string;
  type: 'contribution' | 'withdrawal' | 'interest' | 'penalty' | 'fee';
  amount: number;
  balance: number;
  description: string;
  payrollPeriodId?: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  grossSalary: number;
  employmentDate: string;
  isActive: boolean;
}

const SavingsInvestment: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageSavings = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canProcessTransactions = hasAnyRole([UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('schemes');
  const [savingsSchemes, setSavingsSchemes] = useState<SavingsScheme[]>([]);
  const [employeeSavings, setEmployeeSavings] = useState<EmployeeSavings[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<SavingsScheme[]>([]);
  const [filteredSavings, setFilteredSavings] = useState<EmployeeSavings[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<SavingsScheme | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  // Form state
  const [newEnrollment, setNewEnrollment] = useState<Partial<EmployeeSavings>>({});

  // Mock data
  const mockSavingsSchemes: SavingsScheme[] = [
    {
      id: 'company_savings',
      name: 'Company Savings Scheme',
      description: 'Mandatory savings scheme for all employees',
      schemeType: 'mandatory',
      provider: 'Company Fund',
      productType: 'savings',
      minContribution: 2000,
      maxContribution: 50000,
      contributionFrequency: 'monthly',
      interestRate: 8.5,
      maturityPeriod: 60,
      penaltyRate: 2.0,
      taxBenefits: true,
      employerMatching: true,
      matchingPercentage: 50,
      maxEmployerMatch: 10000,
      eligibilityRules: [
        'Must be permanent employee',
        'Minimum 6 months service',
        'Good standing with company'
      ],
      withdrawalRules: [
        'No withdrawals in first 12 months',
        'Emergency withdrawals allowed with approval',
        'Penalty applies for early withdrawal'
      ],
      isActive: true,
      startDate: '2025-01-01'
    },
    {
      id: 'retirement_fund',
      name: 'Employee Retirement Fund',
      description: 'Long-term retirement savings and investment',
      schemeType: 'voluntary',
      provider: 'Retirement Benefits Authority',
      productType: 'pension',
      minContribution: 1000,
      contributionFrequency: 'monthly',
      interestRate: 12.0,
      maturityPeriod: 480, // 40 years
      taxBenefits: true,
      employerMatching: true,
      matchingPercentage: 100,
      maxEmployerMatch: 20000,
      eligibilityRules: [
        'Age between 18-60',
        'Permanent employment',
        'Completed probation period'
      ],
      withdrawalRules: [
        'No withdrawals before age 50',
        'Partial withdrawals for mortgage/medical',
        'Full withdrawal at retirement'
      ],
      isActive: true,
      startDate: '2025-01-01'
    },
    {
      id: 'investment_club',
      name: 'Staff Investment Club',
      description: 'Collective investment in stocks and bonds',
      schemeType: 'voluntary',
      provider: 'Investment Partners',
      productType: 'investment',
      minContribution: 5000,
      maxContribution: 100000,
      contributionFrequency: 'monthly',
      interestRate: 15.0,
      penaltyRate: 5.0,
      taxBenefits: false,
      employerMatching: false,
      eligibilityRules: [
        'Minimum gross salary of KES 100,000',
        'Investment knowledge assessment',
        'Risk tolerance agreement'
      ],
      withdrawalRules: [
        'Minimum investment period 24 months',
        '30 days notice for withdrawals',
        'Market value at withdrawal date'
      ],
      isActive: true,
      startDate: '2025-01-01'
    },
    {
      id: 'education_fund',
      name: 'Education Development Fund',
      description: 'Savings for education and training purposes',
      schemeType: 'voluntary',
      provider: 'Education Trust',
      productType: 'savings',
      minContribution: 1500,
      maxContribution: 25000,
      contributionFrequency: 'monthly',
      interestRate: 10.0,
      maturityPeriod: 36,
      taxBenefits: true,
      employerMatching: false,
      eligibilityRules: [
        'All employees eligible',
        'Minimum 3 months service'
      ],
      withdrawalRules: [
        'Withdrawals only for education purposes',
        'Documentation required',
        'No penalty for education use'
      ],
      isActive: true,
      startDate: '2025-01-01'
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
      employmentDate: '2021-03-10',
      isActive: true
    }
  ];

  const mockEmployeeSavings: EmployeeSavings[] = [
    {
      id: 'sav_001',
      employeeId: 'emp_001',
      schemeId: 'company_savings',
      accountNumber: 'CS-2023-001',
      joinDate: '2023-02-01',
      status: 'active',
      monthlyContribution: 5000,
      totalContributions: 115000,
      employerContributions: 57500,
      interestEarned: 12500,
      currentBalance: 185000,
      lastContributionDate: '2025-01-01',
      maturityDate: '2028-02-01',
      withdrawalRequests: [],
      performanceData: [
        { date: '2024-12-01', balance: 170000, contribution: 5000, interest: 1200, returns: 0 },
        { date: '2025-01-01', balance: 185000, contribution: 5000, interest: 1300, returns: 0 }
      ]
    },
    {
      id: 'sav_002',
      employeeId: 'emp_002',
      schemeId: 'retirement_fund',
      accountNumber: 'RF-2022-156',
      joinDate: '2022-07-01',
      status: 'active',
      monthlyContribution: 10000,
      totalContributions: 300000,
      employerContributions: 300000,
      interestEarned: 72000,
      currentBalance: 672000,
      lastContributionDate: '2025-01-01',
      maturityDate: '2062-07-01',
      withdrawalRequests: [],
      performanceData: [
        { date: '2024-12-01', balance: 652000, contribution: 10000, interest: 6500, returns: 0 },
        { date: '2025-01-01', balance: 672000, contribution: 10000, interest: 6700, returns: 0 }
      ]
    },
    {
      id: 'sav_003',
      employeeId: 'emp_003',
      schemeId: 'investment_club',
      accountNumber: 'IC-2021-089',
      joinDate: '2021-04-15',
      status: 'active',
      monthlyContribution: 15000,
      totalContributions: 675000,
      employerContributions: 0,
      interestEarned: 0,
      currentBalance: 798500,
      lastContributionDate: '2025-01-01',
      withdrawalRequests: [
        {
          id: 'wd_001',
          requestDate: '2024-12-15',
          amount: 50000,
          reason: 'Medical emergency',
          type: 'partial',
          status: 'approved',
          approvedBy: 'hr_manager',
          approvedDate: '2024-12-16',
          processedDate: '2024-12-18',
          penaltyAmount: 2500,
          netAmount: 47500
        }
      ],
      performanceData: [
        { date: '2024-12-01', balance: 825000, contribution: 15000, interest: 0, returns: 8500 },
        { date: '2025-01-01', balance: 798500, contribution: 15000, interest: 0, returns: -41500 }
      ]
    }
  ];

  // Initialize data
  useEffect(() => {
    setSavingsSchemes(mockSavingsSchemes);
    setEmployeeSavings(mockEmployeeSavings);
    setEmployees(mockEmployees);
    setFilteredSchemes(mockSavingsSchemes);
    setFilteredSavings(mockEmployeeSavings);
  }, []);

  // Filter schemes
  useEffect(() => {
    let filtered = savingsSchemes;

    if (searchTerm) {
      filtered = filtered.filter(scheme =>
        scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(scheme => scheme.productType === typeFilter);
    }

    setFilteredSchemes(filtered);
  }, [savingsSchemes, searchTerm, typeFilter]);

  // Filter employee savings
  useEffect(() => {
    let filtered = employeeSavings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(savings => savings.status === statusFilter);
    }

    setFilteredSavings(filtered);
  }, [employeeSavings, statusFilter]);

  // Calculate projected savings
  const calculateProjectedSavings = (contribution: number, interestRate: number, months: number): number => {
    const monthlyRate = interestRate / 100 / 12;
    const futureValue = contribution * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
    return Math.round(futureValue);
  };

  // Get scheme type icon
  const getSchemeTypeIcon = (type: string) => {
    switch (type) {
      case 'savings': return <PiggyBank className="w-4 h-4" />;
      case 'investment': return <TrendingUp className="w-4 h-4" />;
      case 'pension': return <Landmark className="w-4 h-4" />;
      case 'insurance': return <Target className="w-4 h-4" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'matured': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get scheme type color
  const getSchemeTypeColor = (type: string) => {
    switch (type) {
      case 'mandatory': return 'bg-red-100 text-red-800';
      case 'voluntary': return 'bg-green-100 text-green-800';
      case 'contractual': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canManageSavings) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage savings and investments.
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
          <h1 className="text-3xl font-bold text-gray-900">Savings & Investment Management</h1>
          <p className="text-gray-600">Employee savings schemes, investments, and contribution tracking</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <PiggyBank className="w-4 h-4 mr-1" />
            {savingsSchemes.length} Schemes
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <DollarSign className="w-4 h-4 mr-1" />
            {formatKES(employeeSavings.reduce((sum, s) => sum + s.currentBalance, 0))}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schemes">Schemes</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        {/* Schemes Tab */}
        <TabsContent value="schemes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5" />
                  Savings & Investment Schemes
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scheme
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
                      placeholder="Search schemes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="pension">Pension</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Schemes Grid */}
              <div className="grid gap-6">
                {filteredSchemes.map((scheme) => (
                  <Card key={scheme.id} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSchemeTypeIcon(scheme.productType)}
                            <h3 className="font-semibold text-lg">{scheme.name}</h3>
                            <Badge className={getSchemeTypeColor(scheme.schemeType)}>
                              {scheme.schemeType.toUpperCase()}
                            </Badge>
                            <Badge variant={scheme.isActive ? "default" : "secondary"}>
                              {scheme.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{scheme.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <Label>Provider</Label>
                              <div className="font-medium">{scheme.provider}</div>
                            </div>
                            <div>
                              <Label>Product Type</Label>
                              <div className="font-medium capitalize">{scheme.productType}</div>
                            </div>
                            <div>
                              <Label>Interest Rate</Label>
                              <div className="font-medium">{scheme.interestRate}% per annum</div>
                            </div>
                            <div>
                              <Label>Frequency</Label>
                              <div className="font-medium capitalize">{scheme.contributionFrequency}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <Label>Min Contribution</Label>
                              <div className="font-medium">{formatKES(scheme.minContribution)}</div>
                            </div>
                            <div>
                              <Label>Max Contribution</Label>
                              <div className="font-medium">
                                {scheme.maxContribution ? formatKES(scheme.maxContribution) : 'No limit'}
                              </div>
                            </div>
                            <div>
                              <Label>Maturity Period</Label>
                              <div className="font-medium">
                                {scheme.maturityPeriod ? `${scheme.maturityPeriod} months` : 'No limit'}
                              </div>
                            </div>
                            <div>
                              <Label>Tax Benefits</Label>
                              <div className="font-medium">{scheme.taxBenefits ? 'Yes' : 'No'}</div>
                            </div>
                          </div>

                          {/* Employer Matching */}
                          {scheme.employerMatching && (
                            <div className="mb-4">
                              <Label>Employer Matching</Label>
                              <div className="text-sm">
                                {scheme.matchingPercentage}% match up to {formatKES(scheme.maxEmployerMatch || 0)}
                              </div>
                            </div>
                          )}

                          {/* Eligibility Rules */}
                          <div className="mb-4">
                            <Label>Eligibility Requirements</Label>
                            <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                              {scheme.eligibilityRules.slice(0, 3).map((rule, index) => (
                                <li key={index}>{rule}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Withdrawal Rules */}
                          <div className="mb-4">
                            <Label>Withdrawal Rules</Label>
                            <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                              {scheme.withdrawalRules.slice(0, 2).map((rule, index) => (
                                <li key={index}>{rule}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Start Date:</span> {new Date(scheme.startDate).toLocaleDateString()}
                            </div>
                            {scheme.endDate && (
                              <div>
                                <span className="font-medium">End Date:</span> {new Date(scheme.endDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
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

        {/* Contributions Tab */}
        <TabsContent value="contributions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Employee Contributions
                </CardTitle>
                <Button onClick={() => setShowEnrollmentForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status Filter */}
              <div className="flex gap-4 mb-6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="matured">Matured</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contributions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead>Monthly Contribution</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSavings.map((savings) => {
                    const employee = employees.find(e => e.id === savings.employeeId);
                    const scheme = savingsSchemes.find(s => s.id === savings.schemeId);

                    return (
                      <TableRow key={savings.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {scheme && getSchemeTypeIcon(scheme.productType)}
                            <div>
                              <div className="font-medium">{scheme?.name}</div>
                              <div className="text-sm text-gray-500">{scheme?.provider}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{savings.accountNumber}</TableCell>
                        <TableCell className="font-medium">{formatKES(savings.monthlyContribution)}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatKES(savings.currentBalance)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(savings.status)}>
                            {savings.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
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

          {/* Portfolio Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Portfolio Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {employeeSavings.filter(s => s.status === 'active').length}
                    </div>
                    <div className="text-sm text-blue-600">Active Accounts</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatKES(employeeSavings.reduce((sum, s) => sum + s.totalContributions, 0))}
                    </div>
                    <div className="text-sm text-green-600">Total Contributions</div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatKES(employeeSavings.reduce((sum, s) => sum + s.employerContributions, 0))}
                    </div>
                    <div className="text-sm text-orange-600">Employer Contributions</div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatKES(employeeSavings.reduce((sum, s) => sum + s.interestEarned, 0))}
                    </div>
                    <div className="text-sm text-purple-600">Interest Earned</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Withdrawal Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Withdrawal Management</h3>
                <p className="text-gray-600 mb-4">Process and track savings withdrawal requests</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Withdrawal Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Investment Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
                <p className="text-gray-600 mb-4">Track investment returns and growth trends</p>
                <Button>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
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
                Savings Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Savings Parameters</h3>
                  
                  <div>
                    <Label>Select Scheme</Label>
                    <Select
                      value={selectedScheme?.id || ''}
                      onValueChange={(value) => {
                        const scheme = savingsSchemes.find(s => s.id === value);
                        setSelectedScheme(scheme || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select savings scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        {savingsSchemes.map((scheme) => (
                          <SelectItem key={scheme.id} value={scheme.id}>
                            {scheme.name} ({scheme.interestRate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Monthly Contribution (KES)</Label>
                    <Input type="number" placeholder="Enter monthly contribution" />
                  </div>
                  
                  <div>
                    <Label>Investment Period (months)</Label>
                    <Input type="number" placeholder="Enter investment period" />
                  </div>
                  
                  <Button className="w-full">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Projection Results</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span>Total Contributions:</span>
                      <span className="font-semibold">{formatKES(0)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span>Interest Earned:</span>
                      <span className="font-semibold">{formatKES(0)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span>Employer Match:</span>
                      <span className="font-semibold">{formatKES(0)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span>Final Balance:</span>
                      <span className="font-semibold text-green-600">{formatKES(0)}</span>
                    </div>
                  </div>
                  
                  {selectedScheme && (
                    <div className="mt-4 p-4 bg-blue-50 rounded">
                      <h4 className="font-semibold mb-2">Scheme Details</h4>
                      <div className="text-sm space-y-1">
                        <div>Interest Rate: {selectedScheme.interestRate}% per annum</div>
                        <div>Min Contribution: {formatKES(selectedScheme.minContribution)}</div>
                        {selectedScheme.employerMatching && (
                          <div>Employer Match: {selectedScheme.matchingPercentage}%</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SavingsInvestment;
