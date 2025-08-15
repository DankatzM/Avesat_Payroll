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
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Download,
  Bell,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Users,
  FileText,
  Settings,
  History
} from 'lucide-react';
import { UserRole, LeaveStatus, LeaveType } from '@shared/api';

// Interfaces
interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  position: string;
  managerId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  urgency: 'low' | 'medium' | 'high';
  hasAttachments: boolean;
  approvalWorkflow: ApprovalStep[];
  remainingBalance: number;
  previousLeaveHistory: LeaveHistoryItem[];
}

interface ApprovalStep {
  level: number;
  approverRole: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  comments?: string;
}

interface LeaveHistoryItem {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
}

interface ApprovalAction {
  action: 'approve' | 'reject';
  comments: string;
  delegateToOther?: boolean;
  delegateToUserId?: string;
}

const LeaveApproval: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canApproveLeave = hasAnyRole([UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('pending');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>({
    action: 'approve',
    comments: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data
  const mockLeaveRequests: LeaveRequest[] = [
    {
      id: 'req_001',
      employeeId: 'emp_001',
      employeeName: 'John Mwangi',
      employeeNumber: 'EMP001',
      department: 'Finance',
      position: 'Accountant',
      managerId: 'mgr_001',
      leaveType: LeaveType.ANNUAL,
      startDate: '2025-02-15',
      endDate: '2025-02-19',
      daysRequested: 5,
      reason: 'Family vacation to Mombasa',
      status: LeaveStatus.PENDING,
      submittedAt: '2025-01-20T09:00:00Z',
      urgency: 'medium',
      hasAttachments: false,
      remainingBalance: 18,
      approvalWorkflow: [
        {
          level: 1,
          approverRole: 'Department Manager',
          status: 'pending'
        },
        {
          level: 2,
          approverRole: 'HR Manager',
          status: 'pending'
        }
      ],
      previousLeaveHistory: [
        {
          leaveType: LeaveType.ANNUAL,
          startDate: '2024-12-20',
          endDate: '2024-12-24',
          days: 3,
          status: LeaveStatus.APPROVED
        }
      ]
    },
    {
      id: 'req_002',
      employeeId: 'emp_002',
      employeeName: 'Grace Wanjiku',
      employeeNumber: 'EMP002',
      department: 'HR',
      position: 'HR Assistant',
      leaveType: LeaveType.SICK,
      startDate: '2025-01-25',
      endDate: '2025-01-25',
      daysRequested: 1,
      reason: 'Doctor appointment',
      status: LeaveStatus.PENDING,
      submittedAt: '2025-01-24T14:30:00Z',
      urgency: 'high',
      hasAttachments: true,
      remainingBalance: 12,
      approvalWorkflow: [
        {
          level: 1,
          approverRole: 'HR Manager',
          status: 'pending'
        }
      ],
      previousLeaveHistory: []
    },
    {
      id: 'req_003',
      employeeId: 'emp_003',
      employeeName: 'Peter Kiprotich',
      employeeNumber: 'EMP003',
      department: 'IT',
      position: 'Software Developer',
      leaveType: LeaveType.COMPASSIONATE,
      startDate: '2025-01-28',
      endDate: '2025-01-30',
      daysRequested: 3,
      reason: 'Family bereavement',
      status: LeaveStatus.PENDING,
      submittedAt: '2025-01-27T16:45:00Z',
      urgency: 'high',
      hasAttachments: false,
      remainingBalance: 5,
      approvalWorkflow: [
        {
          level: 1,
          approverRole: 'Department Manager',
          status: 'approved',
          approverId: 'mgr_002',
          approverName: 'Alice Mutua',
          approvedAt: '2025-01-27T18:00:00Z',
          comments: 'Approved for compassionate reasons'
        },
        {
          level: 2,
          approverRole: 'HR Manager',
          status: 'pending'
        }
      ],
      previousLeaveHistory: [
        {
          leaveType: LeaveType.ANNUAL,
          startDate: '2024-11-15',
          endDate: '2024-11-18',
          days: 4,
          status: LeaveStatus.APPROVED
        }
      ]
    }
  ];

  // Initialize data
  useEffect(() => {
    setLeaveRequests(mockLeaveRequests);
    setFilteredRequests(mockLeaveRequests);
  }, []);

  // Filter requests
  useEffect(() => {
    let filtered = leaveRequests;

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(req => req.status === LeaveStatus.PENDING);
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(req => req.status === LeaveStatus.APPROVED);
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(req => req.status === LeaveStatus.REJECTED);
    }

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(req => req.department === departmentFilter);
    }

    if (leaveTypeFilter !== 'all') {
      filtered = filtered.filter(req => req.leaveType === leaveTypeFilter);
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(req => req.urgency === urgencyFilter);
    }

    setFilteredRequests(filtered);
  }, [leaveRequests, activeTab, searchTerm, departmentFilter, leaveTypeFilter, urgencyFilter]);

  // Handle approval/rejection
  const handleApprovalDecision = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedRequest = {
        ...selectedRequest,
        status: approvalAction.action === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
        approvalWorkflow: selectedRequest.approvalWorkflow.map(step => {
          if (step.status === 'pending') {
            return {
              ...step,
              status: approvalAction.action === 'approve' ? 'approved' : 'rejected',
              approverId: user?.id,
              approverName: `${user?.firstName} ${user?.lastName}`,
              approvedAt: new Date().toISOString(),
              comments: approvalAction.comments
            };
          }
          return step;
        })
      };

      setLeaveRequests(prev => prev.map(req => 
        req.id === selectedRequest.id ? updatedRequest : req
      ));

      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setApprovalAction({ action: 'approve', comments: '' });

      alert(`Leave request ${approvalAction.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      alert('Error processing approval. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get leave type color
  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.ANNUAL: return 'bg-blue-100 text-blue-800';
      case LeaveType.SICK: return 'bg-red-100 text-red-800';
      case LeaveType.MATERNITY: return 'bg-pink-100 text-pink-800';
      case LeaveType.PATERNITY: return 'bg-green-100 text-green-800';
      case LeaveType.COMPASSIONATE: return 'bg-purple-100 text-purple-800';
      case LeaveType.STUDY: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'bg-green-100 text-green-800';
      case LeaveStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case LeaveStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canApproveLeave) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to approve leave requests.
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
          <h1 className="text-3xl font-bold text-gray-900">Leave Approval</h1>
          <p className="text-gray-600">Review and approve employee leave requests</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            {leaveRequests.filter(req => req.status === LeaveStatus.PENDING).length} Pending
          </Badge>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({leaveRequests.filter(req => req.status === LeaveStatus.PENDING).length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({leaveRequests.filter(req => req.status === LeaveStatus.APPROVED).length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({leaveRequests.filter(req => req.status === LeaveStatus.REJECTED).length})
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by employee name, number, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                </SelectContent>
              </Select>
              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={LeaveType.ANNUAL}>Annual</SelectItem>
                  <SelectItem value={LeaveType.SICK}>Sick</SelectItem>
                  <SelectItem value={LeaveType.MATERNITY}>Maternity</SelectItem>
                  <SelectItem value={LeaveType.PATERNITY}>Paternity</SelectItem>
                  <SelectItem value={LeaveType.COMPASSIONATE}>Compassionate</SelectItem>
                  <SelectItem value={LeaveType.STUDY}>Study</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <TabsContent value={activeTab} className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.employeeName}</div>
                          <div className="text-sm text-gray-500">
                            {request.employeeNumber} • {request.department}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeaveTypeColor(request.leaveType)}>
                          {request.leaveType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(request.startDate).toLocaleDateString()}</div>
                          <div className="text-gray-500">to {new Date(request.endDate).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{request.daysRequested}</TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{request.remainingBalance}</span> days
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {request.status === LeaveStatus.PENDING && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setApprovalAction({ action: 'approve', comments: '' });
                                  setShowApprovalDialog(true);
                                }}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setApprovalAction({ action: 'reject', comments: '' });
                                  setShowApprovalDialog(true);
                                }}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredRequests.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
                  <p className="text-gray-600">No requests match your current filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest && !showApprovalDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <div className="font-medium">{selectedRequest.employeeName}</div>
                  <div className="text-sm text-gray-500">{selectedRequest.employeeNumber}</div>
                </div>
                <div>
                  <Label>Department</Label>
                  <div className="font-medium">{selectedRequest.department}</div>
                  <div className="text-sm text-gray-500">{selectedRequest.position}</div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Leave Type</Label>
                  <Badge className={getLeaveTypeColor(selectedRequest.leaveType)}>
                    {selectedRequest.leaveType.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Duration</Label>
                  <div>{selectedRequest.daysRequested} days</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <div>{new Date(selectedRequest.startDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>End Date</Label>
                  <div>{new Date(selectedRequest.endDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded">{selectedRequest.reason}</div>
              </div>

              {/* Approval Workflow */}
              <div>
                <Label>Approval Workflow</Label>
                <div className="mt-2 space-y-2">
                  {selectedRequest.approvalWorkflow.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded">
                      {step.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {step.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                      {step.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                      
                      <div className="flex-1">
                        <div className="font-medium">Level {step.level}: {step.approverRole}</div>
                        {step.approverName && (
                          <div className="text-sm text-gray-600">
                            {step.status === 'approved' ? 'Approved' : 'Rejected'} by {step.approverName}
                            {step.approvedAt && ` on ${new Date(step.approvedAt).toLocaleDateString()}`}
                          </div>
                        )}
                        {step.comments && (
                          <div className="text-sm text-gray-600 italic">"{step.comments}"</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Previous Leave History */}
              {selectedRequest.previousLeaveHistory.length > 0 && (
                <div>
                  <Label>Recent Leave History</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.previousLeaveHistory.map((leave, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <Badge className={getLeaveTypeColor(leave.leaveType)} size="sm">
                            {leave.leaveType}
                          </Badge>
                          <span className="ml-2 text-sm">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{leave.days} days</span>
                          <Badge className={getStatusColor(leave.status)} size="sm" className="ml-2">
                            {leave.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Decision Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction.action === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium">{selectedRequest.employeeName}</div>
                <div className="text-sm text-gray-600">
                  {selectedRequest.leaveType.replace('_', ' ')} • {selectedRequest.daysRequested} days
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder={`Add comments for ${approvalAction.action === 'approve' ? 'approval' : 'rejection'}...`}
                  value={approvalAction.comments}
                  onChange={(e) => setApprovalAction(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApprovalDecision}
                  disabled={isProcessing}
                  className={approvalAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {approvalAction.action === 'approve' ? (
                        <ThumbsUp className="w-4 h-4 mr-2" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 mr-2" />
                      )}
                      {approvalAction.action === 'approve' ? 'Approve' : 'Reject'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveApproval;
