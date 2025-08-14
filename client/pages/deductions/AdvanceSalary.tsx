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
  CreditCard,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Download,
  RefreshCw,
  Settings,
  Banknote,
  PiggyBank,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Interfaces
interface AdvanceRequest {
  id: string;
  employeeId: string;
  requestDate: string;
  amount: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  approvedAmount?: number;
  disbursementDate?: string;
  repaymentStartDate?: string;
  repaymentMonths: number;
  monthlyDeduction: number;
  totalRepaid: number;
  outstandingBalance: number;
  isFullyRepaid: boolean;
}

interface RepaymentSchedule {
  id: string;
  advanceId: string;
  payrollPeriodId: string;
  scheduledDate: string;
  scheduledAmount: number;
  actualAmount?: number;
  paidDate?: string;
  status: 'scheduled' | 'paid' | 'missed' | 'waived';
  notes?: string;
}

interface AdvancePolicy {
  id: string;
  name: string;
  description: string;
  maxAmount: number;
  maxPercentageOfSalary: number; // percentage of gross salary
  maxRepaymentMonths: number;
  minServiceMonths: number;
  maxAdvancesPerYear: number;
  requiresApproval: boolean;
  approvalLevels: ApprovalLevel[];
  isActive: boolean;
}

interface ApprovalLevel {
  level: number;
  title: string;
  maxAmount: number;
  requiredRoles: UserRole[];
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
  managerId?: string;
  isActive: boolean;
}

interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  status: 'open' | 'processing' | 'closed';
  description: string;
}

const AdvanceSalary: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageAdvances = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canApproveAdvances = hasAnyRole([UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canProcessPayments = hasAnyRole([UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('requests');
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [repaymentSchedules, setRepaymentSchedules] = useState<RepaymentSchedule[]>([]);
  const [advancePolicies, setAdvancePolicies] = useState<AdvancePolicy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AdvanceRequest[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form state
  const [newRequest, setNewRequest] = useState<Partial<AdvanceRequest>>({
    amount: 0,
    reason: '',
    urgency: 'medium',
    repaymentMonths: 3
  });

  // Mock data
  const mockAdvancePolicies: AdvancePolicy[] = [
    {
      id: 'emergency_advance',
      name: 'Emergency Advance',
      description: 'Quick advance for emergency situations',
      maxAmount: 50000,
      maxPercentageOfSalary: 30,
      maxRepaymentMonths: 3,
      minServiceMonths: 3,
      maxAdvancesPerYear: 2,
      requiresApproval: true,
      approvalLevels: [
        {
          level: 1,
          title: 'Department Manager',
          maxAmount: 25000,
          requiredRoles: [UserRole.MANAGER]
        },
        {
          level: 2,
          title: 'HR Manager',
          maxAmount: 50000,
          requiredRoles: [UserRole.HR_MANAGER]
        }
      ],
      isActive: true
    },
    {
      id: 'regular_advance',
      name: 'Regular Salary Advance',
      description: 'Standard salary advance for planned expenses',
      maxAmount: 100000,
      maxPercentageOfSalary: 50,
      maxRepaymentMonths: 6,
      minServiceMonths: 6,
      maxAdvancesPerYear: 1,
      requiresApproval: true,
      approvalLevels: [
        {
          level: 1,
          title: 'Department Manager',
          maxAmount: 50000,
          requiredRoles: [UserRole.MANAGER]
        },
        {
          level: 2,
          title: 'HR Manager',
          maxAmount: 100000,
          requiredRoles: [UserRole.HR_MANAGER]
        }
      ],
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
      managerId: 'mgr_001',
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
      managerId: 'mgr_002',
      isActive: true
    }
  ];

  const mockAdvanceRequests: AdvanceRequest[] = [
    {
      id: 'adv_001',
      employeeId: 'emp_001',
      requestDate: '2025-01-10',
      amount: 30000,
      reason: 'Medical emergency for family member',
      urgency: 'emergency',
      status: 'approved',
      requestedBy: 'emp_001',
      reviewedBy: 'mgr_001',
      reviewedAt: '2025-01-11',
      reviewNotes: 'Approved for emergency medical expenses',
      approvedAmount: 30000,
      disbursementDate: '2025-01-12',
      repaymentStartDate: '2025-02-01',
      repaymentMonths: 3,
      monthlyDeduction: 10000,
      totalRepaid: 0,
      outstandingBalance: 30000,
      isFullyRepaid: false
    },
    {
      id: 'adv_002',
      employeeId: 'emp_003',
      requestDate: '2025-01-08',
      amount: 80000,
      reason: 'School fees payment',
      urgency: 'high',
      status: 'under_review',
      requestedBy: 'emp_003',
      repaymentMonths: 4,
      monthlyDeduction: 20000,
      totalRepaid: 0,
      outstandingBalance: 80000,
      isFullyRepaid: false
    },
    {
      id: 'adv_003',
      employeeId: 'emp_002',
      requestDate: '2024-11-15',
      amount: 45000,
      reason: 'Home repairs after flooding',
      urgency: 'medium',
      status: 'disbursed',
      requestedBy: 'emp_002',
      reviewedBy: 'hr_manager_001',
      reviewedAt: '2024-11-16',
      approvedAmount: 45000,
      disbursementDate: '2024-11-18',
      repaymentStartDate: '2024-12-01',
      repaymentMonths: 3,
      monthlyDeduction: 15000,
      totalRepaid: 30000,
      outstandingBalance: 15000,
      isFullyRepaid: false
    }
  ];

  const mockPayrollPeriods: PayrollPeriod[] = [
    {
      id: 'period_2025_01',
      month: 1,
      year: 2025,
      status: 'open',
      description: 'January 2025'
    },
    {
      id: 'period_2025_02',
      month: 2,
      year: 2025,
      status: 'open',
      description: 'February 2025'
    }
  ];

  // Initialize data
  useEffect(() => {
    setAdvanceRequests(mockAdvanceRequests);
    setAdvancePolicies(mockAdvancePolicies);
    setEmployees(mockEmployees);
    setPayrollPeriods(mockPayrollPeriods);
    setFilteredRequests(mockAdvanceRequests);
  }, []);

  // Filter requests
  useEffect(() => {
    let filtered = advanceRequests;

    if (searchTerm) {
      filtered = filtered.filter(request => {
        const employee = employees.find(e => e.id === request.employeeId);
        return (
          employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.reason.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(request => request.urgency === urgencyFilter);
    }

    setFilteredRequests(filtered);
  }, [advanceRequests, searchTerm, statusFilter, urgencyFilter, employees]);

  // Calculate eligibility
  const calculateEligibility = (employee: Employee): {
    maxAmount: number;
    isEligible: boolean;
    reasons: string[];
  } => {
    const reasons: string[] = [];
    const employmentMonths = Math.floor(
      (new Date().getTime() - new Date(employee.employmentDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
    );

    const policy = advancePolicies[0]; // Using regular advance policy
    
    if (employmentMonths < policy.minServiceMonths) {
      reasons.push(`Minimum ${policy.minServiceMonths} months service required`);
    }

    const currentYearAdvances = advanceRequests.filter(req => 
      req.employeeId === employee.id && 
      new Date(req.requestDate).getFullYear() === new Date().getFullYear() &&
      req.status !== 'rejected'
    ).length;

    if (currentYearAdvances >= policy.maxAdvancesPerYear) {
      reasons.push(`Maximum ${policy.maxAdvancesPerYear} advances per year reached`);
    }

    const maxAmountBySalary = Math.floor(employee.grossSalary * (policy.maxPercentageOfSalary / 100));
    const maxAmount = Math.min(policy.maxAmount, maxAmountBySalary);

    return {
      maxAmount,
      isEligible: reasons.length === 0,
      reasons
    };
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

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Submit new request
  const submitRequest = async () => {
    if (!selectedEmployee || !newRequest.amount || !newRequest.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const eligibility = calculateEligibility(selectedEmployee);
    if (!eligibility.isEligible) {
      alert(`Request not eligible: ${eligibility.reasons.join(', ')}`);
      return;
    }

    if (newRequest.amount > eligibility.maxAmount) {
      alert(`Amount exceeds maximum eligible amount of ${formatKES(eligibility.maxAmount)}`);
      return;
    }

    setIsSaving(true);

    try {
      const request: AdvanceRequest = {
        id: `adv_${Date.now()}`,
        employeeId: selectedEmployee.id,
        requestDate: new Date().toISOString().split('T')[0],
        amount: newRequest.amount,
        reason: newRequest.reason,
        urgency: newRequest.urgency || 'medium',
        status: 'submitted',
        requestedBy: user?.id || selectedEmployee.id,
        repaymentMonths: newRequest.repaymentMonths || 3,
        monthlyDeduction: Math.ceil(newRequest.amount / (newRequest.repaymentMonths || 3)),
        totalRepaid: 0,
        outstandingBalance: newRequest.amount,
        isFullyRepaid: false
      };

      setAdvanceRequests([...advanceRequests, request]);
      setShowRequestForm(false);
      setNewRequest({});
      setSelectedEmployee(null);

      alert('Advance request submitted successfully!');
    } catch (error) {
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Access control check
  if (!canManageAdvances) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage salary advances.
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
          <h1 className="text-3xl font-bold text-gray-900">Advance Salary Management</h1>
          <p className="text-gray-600">Employee salary advance requests and repayment tracking</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <FileText className="w-4 h-4 mr-1" />
            {advanceRequests.length} Requests
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <DollarSign className="w-4 h-4 mr-1" />
            {advanceRequests.filter(req => req.status === 'disbursed').length} Active
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="active-advances">Active Advances</TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Advance Requests
                </CardTitle>
                <Button onClick={() => setShowRequestForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Request
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
                      placeholder="Search requests..."
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
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Requests Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const employee = employees.find(e => e.id === request.employeeId);

                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatKES(request.amount)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={request.reason}>
                            {request.reason}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getUrgencyColor(request.urgency)}>
                            {request.urgency.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {request.status === 'under_review' && canApproveAdvances && (
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

          {/* New Request Dialog */}
          <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Salary Advance Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Employee Selection */}
                <div>
                  <Label htmlFor="employee">Select Employee</Label>
                  <Select
                    value={selectedEmployee?.id || ''}
                    onValueChange={(value) => {
                      const employee = employees.find(e => e.id === value);
                      setSelectedEmployee(employee || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.employeeNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Info & Eligibility */}
                {selectedEmployee && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Gross Salary</Label>
                          <div className="font-medium">{formatKES(selectedEmployee.grossSalary)}</div>
                        </div>
                        <div>
                          <Label>Department</Label>
                          <div className="font-medium">{selectedEmployee.department}</div>
                        </div>
                      </div>
                      
                      {(() => {
                        const eligibility = calculateEligibility(selectedEmployee);
                        return (
                          <div className="mt-4">
                            <Label>Eligibility Status</Label>
                            {eligibility.isEligible ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Eligible for advance up to {formatKES(eligibility.maxAmount)}</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Not eligible</span>
                                </div>
                                <ul className="text-red-600 text-xs list-disc list-inside">
                                  {eligibility.reasons.map((reason, index) => (
                                    <li key={index}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Request Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newRequest.amount || ''}
                      onChange={(e) => setNewRequest({...newRequest, amount: Number(e.target.value)})}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="urgency">Urgency</Label>
                    <Select
                      value={newRequest.urgency || 'medium'}
                      onValueChange={(value) => setNewRequest({...newRequest, urgency: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="repayment">Repayment Period (months)</Label>
                  <Select
                    value={String(newRequest.repaymentMonths || 3)}
                    onValueChange={(value) => setNewRequest({...newRequest, repaymentMonths: Number(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="2">2 months</SelectItem>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="4">4 months</SelectItem>
                      <SelectItem value="5">5 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Advance</Label>
                  <Textarea
                    id="reason"
                    value={newRequest.reason || ''}
                    onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                    placeholder="Please provide detailed reason for the advance request"
                    rows={3}
                  />
                </div>

                {/* Calculation Preview */}
                {newRequest.amount && newRequest.repaymentMonths && (
                  <Card className="bg-blue-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Repayment Calculation</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Monthly Deduction</Label>
                          <div className="font-medium">
                            {formatKES(Math.ceil(newRequest.amount / newRequest.repaymentMonths))}
                          </div>
                        </div>
                        <div>
                          <Label>Repayment Period</Label>
                          <div className="font-medium">{newRequest.repaymentMonths} months</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitRequest} disabled={isSaving}>
                    {isSaving ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Active Advances Tab */}
        <TabsContent value="active-advances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Active Salary Advances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-sm text-blue-600">Active Advances</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{formatKES(155000)}</div>
                    <div className="text-sm text-green-600">Total Outstanding</div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{formatKES(45000)}</div>
                    <div className="text-sm text-orange-600">Monthly Collections</div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">94%</div>
                    <div className="text-sm text-purple-600">Collection Rate</div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Monthly Deduction</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advanceRequests.filter(req => req.status === 'disbursed' && !req.isFullyRepaid).map((advance) => {
                    const employee = employees.find(e => e.id === advance.employeeId);
                    const progress = ((advance.amount - advance.outstandingBalance) / advance.amount) * 100;
                    
                    return (
                      <TableRow key={advance.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatKES(advance.amount)}</TableCell>
                        <TableCell className="font-medium text-orange-600">
                          {formatKES(advance.outstandingBalance)}
                        </TableCell>
                        <TableCell>{formatKES(advance.monthlyDeduction)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{Math.round(progress)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>Feb 2025</TableCell>
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

        {/* Repayments Tab */}
        <TabsContent value="repayments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Repayment Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Repayment Management</h3>
                <p className="text-gray-600 mb-4">Track and manage salary advance repayments</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advance Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {advancePolicies.map((policy) => (
                  <Card key={policy.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{policy.name}</h3>
                            <Badge variant={policy.isActive ? "default" : "secondary"}>
                              {policy.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label>Max Amount</Label>
                              <div>{formatKES(policy.maxAmount)}</div>
                            </div>
                            <div>
                              <Label>Max % of Salary</Label>
                              <div>{policy.maxPercentageOfSalary}%</div>
                            </div>
                            <div>
                              <Label>Max Repayment Period</Label>
                              <div>{policy.maxRepaymentMonths} months</div>
                            </div>
                            <div>
                              <Label>Min Service Period</Label>
                              <div>{policy.minServiceMonths} months</div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <Label>Max Advances Per Year: {policy.maxAdvancesPerYear}</Label>
                          </div>

                          {policy.approvalLevels.length > 0 && (
                            <div className="mt-3">
                              <Label>Approval Levels</Label>
                              <div className="space-y-1">
                                {policy.approvalLevels.map((level) => (
                                  <div key={level.level} className="text-sm text-gray-600">
                                    Level {level.level}: {level.title} (up to {formatKES(level.maxAmount)})
                                  </div>
                                ))}
                              </div>
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
      </Tabs>
    </div>
  );
};

export default AdvanceSalary;
