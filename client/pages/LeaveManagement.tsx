import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logLeaveAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  Bell,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calculator,
} from 'lucide-react';
import { 
  LeaveRequest, 
  LeaveType, 
  LeaveStatus, 
  LeaveBalance, 
  UserRole 
} from '@shared/api';

interface LeaveRequestForm {
  leaveType: LeaveType | '';
  startDate: string;
  endDate: string;
  reason: string;
  daysRequested: number;
}

interface LeaveRequestStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export default function LeaveManagement() {
  const { user, hasAnyRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Leave request form state
  const [formData, setFormData] = useState<LeaveRequestForm>({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    daysRequested: 0,
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Leave data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveRequest[]>([]);

  // Algorithm steps
  const algorithmSteps: LeaveRequestStep[] = [
    {
      step: 1,
      title: 'Open Leave Request Form',
      description: 'Employee logs in and opens leave request form',
      completed: false,
      current: false,
    },
    {
      step: 2,
      title: 'Input Leave Details',
      description: 'Inputs leave type, start and end dates',
      completed: false,
      current: false,
    },
    {
      step: 3,
      title: 'Calculate Days',
      description: 'System calculates number of requested days',
      completed: false,
      current: false,
    },
    {
      step: 4,
      title: 'Check Balance',
      description: 'Check available leave balance for type',
      completed: false,
      current: false,
    },
    {
      step: 5,
      title: 'Store Request',
      description: 'If sufficient balance, store leave request as pending',
      completed: false,
      current: false,
    },
    {
      step: 6,
      title: 'Notify Approver',
      description: 'Notify supervisor/HR for approval',
      completed: false,
      current: false,
    },
    {
      step: 7,
      title: 'Process Approval',
      description: 'If approved, deduct leave days and update leave record',
      completed: false,
      current: false,
    },
  ];

  const [steps, setSteps] = useState(algorithmSteps);

  useEffect(() => {
    fetchLeaveData();
  }, [user]);

  const fetchLeaveData = async () => {
    // Mock data for demonstration
    const mockBalances: LeaveBalance[] = [
      {
        employeeId: user?.id || '1',
        leaveType: LeaveType.ANNUAL,
        entitlement: 21,
        used: 8,
        remaining: 13,
        carryForward: 5,
      },
      {
        employeeId: user?.id || '1',
        leaveType: LeaveType.SICK,
        entitlement: 14,
        used: 3,
        remaining: 11,
        carryForward: 0,
      },
      {
        employeeId: user?.id || '1',
        leaveType: LeaveType.MATERNITY,
        entitlement: 90,
        used: 0,
        remaining: 90,
        carryForward: 0,
      },
      {
        employeeId: user?.id || '1',
        leaveType: LeaveType.PATERNITY,
        entitlement: 14,
        used: 0,
        remaining: 14,
        carryForward: 0,
      },
    ];

    const mockRequests: LeaveRequest[] = [
      {
        id: '1',
        employeeId: user?.id || '1',
        leaveType: LeaveType.ANNUAL,
        startDate: '2024-03-25',
        endDate: '2024-03-29',
        daysRequested: 5,
        reason: 'Family vacation',
        status: LeaveStatus.APPROVED,
        approvedBy: 'hr@payrollke.co.ke',
        approvedAt: '2024-03-20T10:00:00Z',
        createdAt: '2024-03-18T14:30:00Z',
      },
      {
        id: '2',
        employeeId: user?.id || '1',
        leaveType: LeaveType.SICK,
        startDate: '2024-03-15',
        endDate: '2024-03-17',
        daysRequested: 3,
        reason: 'Medical appointment and recovery',
        status: LeaveStatus.APPROVED,
        approvedBy: 'manager@payrollke.co.ke',
        approvedAt: '2024-03-14T16:45:00Z',
        createdAt: '2024-03-14T09:15:00Z',
      },
    ];

    const mockPendingApprovals: LeaveRequest[] = [
      {
        id: '3',
        employeeId: '2',
        leaveType: LeaveType.ANNUAL,
        startDate: '2024-04-01',
        endDate: '2024-04-05',
        daysRequested: 5,
        reason: 'Personal matters',
        status: LeaveStatus.PENDING,
        createdAt: '2024-03-20T11:00:00Z',
      },
      {
        id: '4',
        employeeId: '3',
        leaveType: LeaveType.SICK,
        startDate: '2024-03-22',
        endDate: '2024-03-22',
        daysRequested: 1,
        reason: 'Doctor appointment',
        status: LeaveStatus.PENDING,
        createdAt: '2024-03-21T08:30:00Z',
      },
    ];

    setLeaveBalances(mockBalances);
    setLeaveRequests(mockRequests);
    setPendingApprovals(mockPendingApprovals);
  };

  // Step 1: Open leave request form
  const handleOpenForm = () => {
    setShowRequestForm(true);
    setCurrentStep(1);
    updateStepStatus(1, true, true);
  };

  // Step 2: Input validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.leaveType) {
      errors.leaveType = 'Please select a leave type';
    }

    if (!formData.startDate) {
      errors.startDate = 'Please select a start date';
    }

    if (!formData.endDate) {
      errors.endDate = 'Please select an end date';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (formData.startDate && new Date(formData.startDate) < new Date()) {
      errors.startDate = 'Start date cannot be in the past';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for leave';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3: Calculate number of days
  const calculateLeaveDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end dates
    
    return Math.max(0, daysDiff);
  };

  // Step 4: Check leave balance
  const checkLeaveBalance = (leaveType: LeaveType, requestedDays: number): { sufficient: boolean; balance: LeaveBalance | null } => {
    const balance = leaveBalances.find(b => b.leaveType === leaveType);
    if (!balance) {
      return { sufficient: false, balance: null };
    }
    
    return {
      sufficient: balance.remaining >= requestedDays,
      balance
    };
  };

  const updateStepStatus = (stepNumber: number, completed: boolean, current: boolean) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      completed: step.step < stepNumber ? true : (step.step === stepNumber ? completed : false),
      current: step.step === stepNumber ? current : false,
    })));
  };

  // Main submission handler implementing the algorithm
  const handleSubmitLeaveRequest = async () => {
    // Step 2: Validate inputs
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    updateStepStatus(2, true, true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Calculate days
    setCurrentStep(3);
    updateStepStatus(3, false, true);
    const calculatedDays = calculateLeaveDays(formData.startDate, formData.endDate);
    setFormData(prev => ({ ...prev, daysRequested: calculatedDays }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus(3, true, false);

    // Step 4: Check balance
    setCurrentStep(4);
    updateStepStatus(4, false, true);
    const balanceCheck = checkLeaveBalance(formData.leaveType as LeaveType, calculatedDays);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!balanceCheck.sufficient) {
      setValidationErrors({
        leaveType: `Insufficient leave balance. You have ${balanceCheck.balance?.remaining || 0} days remaining.`
      });
      setIsSubmitting(false);
      updateStepStatus(4, false, false);
      return;
    }
    
    updateStepStatus(4, true, false);

    // Step 5: Store request as pending
    setCurrentStep(5);
    updateStepStatus(5, false, true);
    
    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: user?.id || '1',
      leaveType: formData.leaveType as LeaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      daysRequested: calculatedDays,
      reason: formData.reason,
      status: LeaveStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLeaveRequests(prev => [newRequest, ...prev]);
    updateStepStatus(5, true, false);

    // Step 6: Notify supervisor/HR
    setCurrentStep(6);
    updateStepStatus(6, false, true);
    
    // Simulate notification
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus(6, true, false);

    // Step 7: Mark as ready for approval (completing the workflow)
    setCurrentStep(7);
    updateStepStatus(7, true, false);

    setIsSubmitting(false);
    setShowRequestForm(false);
    resetForm();
    
    // Show success message
    alert('Leave request submitted successfully! Your supervisor has been notified for approval.');
  };

  const resetForm = () => {
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      daysRequested: 0,
    });
    setValidationErrors({});
    setCurrentStep(1);
    setSteps(algorithmSteps);
  };

  // Step 7: Approval functions
  const handleApproveLeave = async (requestId: string) => {
    const request = pendingApprovals.find(r => r.id === requestId);
    if (!request) return;

    // Update request status
    const updatedRequest = {
      ...request,
      status: LeaveStatus.APPROVED,
      approvedBy: user?.email || '',
      approvedAt: new Date().toISOString(),
    };

    // Deduct from leave balance
    setLeaveBalances(prev => prev.map(balance => {
      if (balance.leaveType === request.leaveType) {
        return {
          ...balance,
          used: balance.used + request.daysRequested,
          remaining: balance.remaining - request.daysRequested,
        };
      }
      return balance;
    }));

    // Remove from pending approvals
    setPendingApprovals(prev => prev.filter(r => r.id !== requestId));

    // Log audit entry for leave approval
    logLeaveAction(
      {
        userId: user?.id || 'unknown',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1' // In production, get from server
      },
      AuditAction.APPROVE,
      requestId,
      { status: LeaveStatus.PENDING },
      {
        status: LeaveStatus.APPROVED,
        approvedBy: user?.email,
        approvedAt: updatedRequest.approvedAt,
        leaveType: request.leaveType,
        daysRequested: request.daysRequested
      }
    );

    alert('Leave request approved successfully!');
  };

  const handleRejectLeave = async (requestId: string) => {
    const request = pendingApprovals.find(r => r.id === requestId);

    setPendingApprovals(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: LeaveStatus.REJECTED, rejectionReason: 'Manager discretion' }
          : req
      ).filter(r => r.status === LeaveStatus.PENDING)
    );

    // Log audit entry for leave rejection
    if (request) {
      logLeaveAction(
        {
          userId: user?.id || 'unknown',
          userAgent: navigator.userAgent,
          ipAddress: '127.0.0.1' // In production, get from server
        },
        AuditAction.REJECT,
        requestId,
        { status: LeaveStatus.PENDING },
        {
          status: LeaveStatus.REJECTED,
          rejectedBy: user?.email,
          rejectionReason: 'Manager discretion',
          leaveType: request.leaveType,
          daysRequested: request.daysRequested
        }
      );
    }

    alert('Leave request rejected.');
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.ANNUAL: return 'bg-blue-100 text-blue-800';
      case LeaveType.SICK: return 'bg-red-100 text-red-800';
      case LeaveType.MATERNITY: return 'bg-pink-100 text-pink-800';
      case LeaveType.PATERNITY: return 'bg-green-100 text-green-800';
      case LeaveType.COMPASSIONATE: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'bg-green-100 text-green-800';
      case LeaveStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case LeaveStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canApproveLeave = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER]);

  // Update days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = calculateLeaveDays(formData.startDate, formData.endDate);
      setFormData(prev => ({ ...prev, daysRequested: days }));
    }
  }, [formData.startDate, formData.endDate]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Submit leave requests and manage leave balances
          </p>
        </div>
        <Button onClick={handleOpenForm} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </div>

      <Tabs defaultValue="my-leave" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-leave">My Leave</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          {canApproveLeave && <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-leave" className="space-y-6">
          {/* Leave Request Algorithm Steps */}
          {showRequestForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Leave Request Process Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={(steps.filter(s => s.completed).length / steps.length) * 100} className="h-2" />
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-sm">
                    {steps.map((step) => (
                      <div
                        key={step.step}
                        className={`text-center p-3 rounded-lg ${
                          step.completed
                            ? 'bg-green-100 text-green-800'
                            : step.current
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <div className="font-medium">{step.step}</div>
                        <div className="text-xs mt-1">{step.title}</div>
                        {step.completed && <CheckCircle className="mx-auto mt-1 h-3 w-3" />}
                        {step.current && <Clock className="mx-auto mt-1 h-3 w-3 animate-pulse" />}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leave Request Form */}
          {showRequestForm && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Leave Request</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitLeaveRequest(); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leaveType">Leave Type</Label>
                      <Select
                        value={formData.leaveType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value as LeaveType }))}
                      >
                        <SelectTrigger className={validationErrors.leaveType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={LeaveType.ANNUAL}>Annual Leave</SelectItem>
                          <SelectItem value={LeaveType.SICK}>Sick Leave</SelectItem>
                          <SelectItem value={LeaveType.MATERNITY}>Maternity Leave</SelectItem>
                          <SelectItem value={LeaveType.PATERNITY}>Paternity Leave</SelectItem>
                          <SelectItem value={LeaveType.COMPASSIONATE}>Compassionate Leave</SelectItem>
                          <SelectItem value={LeaveType.STUDY}>Study Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.leaveType && (
                        <p className="text-sm text-red-600">{validationErrors.leaveType}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Available Balance</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {formData.leaveType ? (
                          <span className="font-medium">
                            {leaveBalances.find(b => b.leaveType === formData.leaveType)?.remaining || 0} days
                          </span>
                        ) : (
                          <span className="text-gray-500">Select leave type first</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className={validationErrors.startDate ? 'border-red-500' : ''}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {validationErrors.startDate && (
                        <p className="text-sm text-red-600">{validationErrors.startDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className={validationErrors.endDate ? 'border-red-500' : ''}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                      {validationErrors.endDate && (
                        <p className="text-sm text-red-600">{validationErrors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-800 font-medium">Total Days Requested:</span>
                        <span className="text-blue-900 text-xl font-bold">{formData.daysRequested} days</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Leave</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please provide a reason for your leave request"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className={validationErrors.reason ? 'border-red-500' : ''}
                      rows={3}
                    />
                    {validationErrors.reason && (
                      <p className="text-sm text-red-600">{validationErrors.reason}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowRequestForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* My Leave Requests */}
          <Card>
            <CardHeader>
              <CardTitle>My Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't submitted any leave requests yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge className={getLeaveTypeColor(request.leaveType)}>
                            {request.leaveType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.startDate).toLocaleDateString()} - {' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{request.daysRequested}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {leaveBalances.map((balance) => (
                  <div key={balance.leaveType} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {balance.leaveType.replace('_', ' ')}
                      </h4>
                      <Badge className={getLeaveTypeColor(balance.leaveType)}>
                        {balance.remaining}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Entitlement:</span>
                        <span>{balance.entitlement}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{balance.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="font-medium">{balance.remaining}</span>
                      </div>
                      {balance.carryForward > 0 && (
                        <div className="flex justify-between">
                          <span>Carry Forward:</span>
                          <span>{balance.carryForward}</span>
                        </div>
                      )}
                    </div>
                    <Progress 
                      value={(balance.used / balance.entitlement) * 100} 
                      className="mt-3 h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canApproveLeave && (
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Pending Approvals ({pendingApprovals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      All leave requests have been processed.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovals.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>Employee {request.employeeId}</TableCell>
                          <TableCell>
                            <Badge className={getLeaveTypeColor(request.leaveType)}>
                              {request.leaveType.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(request.startDate).toLocaleDateString()} - {' '}
                            {new Date(request.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{request.daysRequested}</TableCell>
                          <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveLeave(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectLeave(request.id)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
