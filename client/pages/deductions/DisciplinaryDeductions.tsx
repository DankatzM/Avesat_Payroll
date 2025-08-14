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
  Shield,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  Settings,
  Scale,
  AlertCircle,
  Ban,
  XCircle,
  Gavel,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Interfaces
interface DisciplinaryAction {
  id: string;
  employeeId: string;
  actionType: 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'termination' | 'fine' | 'demotion';
  offenseCategory: 'minor' | 'major' | 'serious' | 'gross_misconduct';
  offenseDescription: string;
  incidentDate: string;
  reportedDate: string;
  reportedBy: string;
  investigatedBy?: string;
  investigationNotes?: string;
  actionDate: string;
  actionBy: string;
  deductionAmount?: number;
  deductionPeriods?: number; // number of payroll periods to deduct
  isActive: boolean;
  appealDeadline?: string;
  hasAppeal: boolean;
  appealStatus?: 'pending' | 'upheld' | 'dismissed';
  recoveryStatus: 'pending' | 'in_progress' | 'completed' | 'waived';
  recoveredAmount: number;
  outstandingAmount?: number;
  notes?: string;
}

interface OffenseType {
  id: string;
  name: string;
  category: 'minor' | 'major' | 'serious' | 'gross_misconduct';
  description: string;
  suggestedActions: string[];
  fineRange?: {
    min: number;
    max: number;
  };
  suspensionDays?: {
    min: number;
    max: number;
  };
  isTerminable: boolean;
  repeatOffenseMultiplier?: number;
  isActive: boolean;
}

interface DisciplinaryDeduction {
  id: string;
  disciplinaryActionId: string;
  payrollPeriodId: string;
  deductionDate: string;
  scheduledAmount: number;
  actualAmount: number;
  paymentMethod: 'salary_deduction' | 'direct_payment' | 'installments';
  status: 'scheduled' | 'deducted' | 'missed' | 'waived';
  notes?: string;
}

interface Appeal {
  id: string;
  disciplinaryActionId: string;
  appealDate: string;
  appealReason: string;
  appealedBy: string;
  hearingDate?: string;
  hearingPanel: string[];
  hearingNotes?: string;
  decision: 'pending' | 'upheld' | 'dismissed' | 'modified';
  decisionDate?: string;
  decisionReason?: string;
  revisedAction?: string;
  revisedAmount?: number;
}

interface DisciplinaryPolicy {
  id: string;
  name: string;
  description: string;
  offenseTypes: string[];
  escalationMatrix: EscalationLevel[];
  appealPeriodDays: number;
  maxFinePercentage: number; // max % of monthly salary
  maxSuspensionDays: number;
  isActive: boolean;
  effectiveDate: string;
}

interface EscalationLevel {
  level: number;
  offenseCount: number;
  suggestedActions: string[];
  requiredApprovalLevel: UserRole[];
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
  managerId?: string;
  isActive: boolean;
}

const DisciplinaryDeductions: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageDisciplinary = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canApproveActions = hasAnyRole([UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canProcessDeductions = hasAnyRole([UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('actions');
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [offenseTypes, setOffenseTypes] = useState<OffenseType[]>([]);
  const [disciplinaryDeductions, setDisciplinaryDeductions] = useState<DisciplinaryDeduction[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [disciplinaryPolicies, setDisciplinaryPolicies] = useState<DisciplinaryPolicy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredActions, setFilteredActions] = useState<DisciplinaryAction[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);

  // Form state
  const [newAction, setNewAction] = useState<Partial<DisciplinaryAction>>({});

  // Mock data
  const mockOffenseTypes: OffenseType[] = [
    {
      id: 'late_arrival',
      name: 'Late Arrival',
      category: 'minor',
      description: 'Reporting to work after scheduled time',
      suggestedActions: ['verbal_warning', 'written_warning'],
      fineRange: { min: 500, max: 2000 },
      isTerminable: false,
      repeatOffenseMultiplier: 1.5,
      isActive: true
    },
    {
      id: 'absenteeism',
      name: 'Unauthorized Absence',
      category: 'major',
      description: 'Absence from work without permission',
      suggestedActions: ['written_warning', 'suspension', 'fine'],
      fineRange: { min: 2000, max: 10000 },
      suspensionDays: { min: 1, max: 5 },
      isTerminable: false,
      repeatOffenseMultiplier: 2.0,
      isActive: true
    },
    {
      id: 'insubordination',
      name: 'Insubordination',
      category: 'serious',
      description: 'Deliberate refusal to follow lawful instructions',
      suggestedActions: ['final_warning', 'suspension', 'demotion'],
      fineRange: { min: 5000, max: 25000 },
      suspensionDays: { min: 3, max: 10 },
      isTerminable: false,
      repeatOffenseMultiplier: 3.0,
      isActive: true
    },
    {
      id: 'theft',
      name: 'Theft/Misappropriation',
      category: 'gross_misconduct',
      description: 'Theft of company property or funds',
      suggestedActions: ['termination'],
      isTerminable: true,
      isActive: true
    },
    {
      id: 'harassment',
      name: 'Workplace Harassment',
      category: 'gross_misconduct',
      description: 'Sexual or other forms of harassment',
      suggestedActions: ['suspension', 'termination'],
      suspensionDays: { min: 5, max: 30 },
      isTerminable: true,
      isActive: true
    },
    {
      id: 'safety_violation',
      name: 'Safety Violation',
      category: 'serious',
      description: 'Violation of workplace safety procedures',
      suggestedActions: ['written_warning', 'suspension', 'fine'],
      fineRange: { min: 3000, max: 15000 },
      suspensionDays: { min: 2, max: 7 },
      isTerminable: false,
      repeatOffenseMultiplier: 2.5,
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
      managerId: 'mgr_002',
      isActive: true
    }
  ];

  const mockDisciplinaryActions: DisciplinaryAction[] = [
    {
      id: 'disc_001',
      employeeId: 'emp_001',
      actionType: 'fine',
      offenseCategory: 'minor',
      offenseDescription: 'Late arrival for 5 consecutive days',
      incidentDate: '2025-01-05',
      reportedDate: '2025-01-06',
      reportedBy: 'mgr_001',
      investigatedBy: 'hr_manager',
      investigationNotes: 'Employee acknowledged lateness, cited transport issues',
      actionDate: '2025-01-08',
      actionBy: 'hr_manager',
      deductionAmount: 1500,
      deductionPeriods: 1,
      isActive: true,
      appealDeadline: '2025-01-15',
      hasAppeal: false,
      recoveryStatus: 'pending',
      recoveredAmount: 0,
      outstandingAmount: 1500
    },
    {
      id: 'disc_002',
      employeeId: 'emp_003',
      actionType: 'suspension',
      offenseCategory: 'major',
      offenseDescription: 'Unauthorized absence for 3 days',
      incidentDate: '2024-12-20',
      reportedDate: '2024-12-23',
      reportedBy: 'mgr_002',
      investigatedBy: 'hr_manager',
      actionDate: '2024-12-27',
      actionBy: 'hr_manager',
      deductionAmount: 30000, // 3 days salary
      deductionPeriods: 2,
      isActive: true,
      appealDeadline: '2025-01-03',
      hasAppeal: true,
      appealStatus: 'pending',
      recoveryStatus: 'in_progress',
      recoveredAmount: 15000,
      outstandingAmount: 15000
    },
    {
      id: 'disc_003',
      employeeId: 'emp_002',
      actionType: 'written_warning',
      offenseCategory: 'minor',
      offenseDescription: 'Improper use of company email',
      incidentDate: '2024-11-15',
      reportedDate: '2024-11-16',
      reportedBy: 'admin',
      actionDate: '2024-11-18',
      actionBy: 'hr_manager',
      isActive: true,
      hasAppeal: false,
      recoveryStatus: 'completed',
      recoveredAmount: 0
    }
  ];

  const mockDisciplinaryPolicies: DisciplinaryPolicy[] = [
    {
      id: 'general_policy',
      name: 'General Disciplinary Policy',
      description: 'Standard disciplinary procedures for all employees',
      offenseTypes: ['late_arrival', 'absenteeism', 'insubordination'],
      escalationMatrix: [
        {
          level: 1,
          offenseCount: 1,
          suggestedActions: ['verbal_warning'],
          requiredApprovalLevel: [UserRole.MANAGER]
        },
        {
          level: 2,
          offenseCount: 2,
          suggestedActions: ['written_warning', 'fine'],
          requiredApprovalLevel: [UserRole.HR_MANAGER]
        },
        {
          level: 3,
          offenseCount: 3,
          suggestedActions: ['final_warning', 'suspension'],
          requiredApprovalLevel: [UserRole.HR_MANAGER]
        },
        {
          level: 4,
          offenseCount: 4,
          suggestedActions: ['termination'],
          requiredApprovalLevel: [UserRole.ADMIN]
        }
      ],
      appealPeriodDays: 7,
      maxFinePercentage: 25,
      maxSuspensionDays: 30,
      isActive: true,
      effectiveDate: '2025-01-01'
    }
  ];

  // Initialize data
  useEffect(() => {
    setDisciplinaryActions(mockDisciplinaryActions);
    setOffenseTypes(mockOffenseTypes);
    setDisciplinaryPolicies(mockDisciplinaryPolicies);
    setEmployees(mockEmployees);
    setFilteredActions(mockDisciplinaryActions);
  }, []);

  // Filter actions
  useEffect(() => {
    let filtered = disciplinaryActions;

    if (searchTerm) {
      filtered = filtered.filter(action => {
        const employee = employees.find(e => e.id === action.employeeId);
        return (
          employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          action.offenseDescription.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(action => action.actionType === actionTypeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(action => action.recoveryStatus === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(action => action.offenseCategory === categoryFilter);
    }

    setFilteredActions(filtered);
  }, [disciplinaryActions, searchTerm, actionTypeFilter, statusFilter, categoryFilter, employees]);

  // Get action type icon
  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'verbal_warning': return <AlertTriangle className="w-4 h-4" />;
      case 'written_warning': return <FileText className="w-4 h-4" />;
      case 'final_warning': return <AlertCircle className="w-4 h-4" />;
      case 'suspension': return <Ban className="w-4 h-4" />;
      case 'termination': return <XCircle className="w-4 h-4" />;
      case 'fine': return <DollarSign className="w-4 h-4" />;
      case 'demotion': return <TrendingDown className="w-4 h-4" />;
      default: return <Scale className="w-4 h-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'serious': return 'bg-red-100 text-red-800';
      case 'gross_misconduct': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'waived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canManageDisciplinary) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage disciplinary actions.
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
          <h1 className="text-3xl font-bold text-gray-900">Disciplinary Deductions</h1>
          <p className="text-gray-600">Employee disciplinary actions, penalties, and recovery management</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <Scale className="w-4 h-4 mr-1" />
            {disciplinaryActions.length} Actions
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            <DollarSign className="w-4 h-4 mr-1" />
            {formatKES(disciplinaryActions.reduce((sum, a) => sum + (a.outstandingAmount || 0), 0))} Outstanding
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="offenses">Offense Types</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Disciplinary Actions
                </CardTitle>
                <Button onClick={() => setShowActionForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Action
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
                      placeholder="Search actions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="verbal_warning">Verbal Warning</SelectItem>
                    <SelectItem value="written_warning">Written Warning</SelectItem>
                    <SelectItem value="final_warning">Final Warning</SelectItem>
                    <SelectItem value="suspension">Suspension</SelectItem>
                    <SelectItem value="fine">Fine</SelectItem>
                    <SelectItem value="demotion">Demotion</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="gross_misconduct">Gross Misconduct</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Action Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action) => {
                    const employee = employees.find(e => e.id === action.employeeId);

                    return (
                      <TableRow key={action.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionTypeIcon(action.actionType)}
                            <span className="capitalize">{action.actionType.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(action.offenseCategory)}>
                            {action.offenseCategory.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={action.offenseDescription}>
                            {action.offenseDescription}
                          </div>
                        </TableCell>
                        <TableCell>
                          {action.deductionAmount ? (
                            <div>
                              <div className="font-medium">{formatKES(action.deductionAmount)}</div>
                              {action.outstandingAmount && action.outstandingAmount > 0 && (
                                <div className="text-sm text-red-600">
                                  Outstanding: {formatKES(action.outstandingAmount)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(action.recoveryStatus)}>
                            {action.recoveryStatus.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(action.actionDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {action.hasAppeal && (
                              <Button variant="outline" size="sm" className="text-orange-600">
                                <Gavel className="w-4 h-4" />
                              </Button>
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

          {/* Actions Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Actions Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {disciplinaryActions.filter(a => a.recoveryStatus === 'pending').length}
                    </div>
                    <div className="text-sm text-yellow-600">Pending Actions</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {disciplinaryActions.filter(a => a.recoveryStatus === 'in_progress').length}
                    </div>
                    <div className="text-sm text-blue-600">In Progress</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {disciplinaryActions.filter(a => a.recoveryStatus === 'completed').length}
                    </div>
                    <div className="text-sm text-green-600">Completed</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatKES(disciplinaryActions.reduce((sum, a) => sum + (a.outstandingAmount || 0), 0))}
                    </div>
                    <div className="text-sm text-red-600">Outstanding Amount</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offense Types Tab */}
        <TabsContent value="offenses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Offense Types Configuration
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Offense Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {offenseTypes.map((offense) => (
                  <Card key={offense.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert className="w-4 h-4 text-red-600" />
                            <h3 className="font-semibold">{offense.name}</h3>
                            <Badge className={getCategoryColor(offense.category)}>
                              {offense.category.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant={offense.isActive ? "default" : "secondary"}>
                              {offense.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {offense.isTerminable && (
                              <Badge variant="destructive">Terminable</Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-3">{offense.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label>Suggested Actions</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {offense.suggestedActions.map((action, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {action.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {offense.fineRange && (
                              <div>
                                <Label>Fine Range</Label>
                                <div>{formatKES(offense.fineRange.min)} - {formatKES(offense.fineRange.max)}</div>
                              </div>
                            )}
                            
                            {offense.suspensionDays && (
                              <div>
                                <Label>Suspension Days</Label>
                                <div>{offense.suspensionDays.min} - {offense.suspensionDays.max} days</div>
                              </div>
                            )}
                          </div>

                          {offense.repeatOffenseMultiplier && (
                            <div className="mt-3 text-sm">
                              <Label>Repeat Offense Multiplier: {offense.repeatOffenseMultiplier}x</Label>
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

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Penalty Recovery Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Recovery Management</h3>
                <p className="text-gray-600 mb-4">Track and manage penalty recovery through payroll deductions</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Process Recovery
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appeals Tab */}
        <TabsContent value="appeals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="w-5 h-5" />
                Disciplinary Appeals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Gavel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Appeals Management</h3>
                <p className="text-gray-600 mb-4">Process and review disciplinary action appeals</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Review Appeals
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Disciplinary Policies
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disciplinaryPolicies.map((policy) => (
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
                          
                          <p className="text-gray-600 mb-3">{policy.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label>Appeal Period</Label>
                              <div>{policy.appealPeriodDays} days</div>
                            </div>
                            <div>
                              <Label>Max Fine %</Label>
                              <div>{policy.maxFinePercentage}% of salary</div>
                            </div>
                            <div>
                              <Label>Max Suspension</Label>
                              <div>{policy.maxSuspensionDays} days</div>
                            </div>
                            <div>
                              <Label>Effective Date</Label>
                              <div>{new Date(policy.effectiveDate).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <Label>Escalation Matrix</Label>
                            <div className="space-y-1 mt-1">
                              {policy.escalationMatrix.map((level) => (
                                <div key={level.level} className="text-sm text-gray-600">
                                  Level {level.level}: After {level.offenseCount} offense(s) - {level.suggestedActions.join(', ')}
                                </div>
                              ))}
                            </div>
                          </div>
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

export default DisciplinaryDeductions;
