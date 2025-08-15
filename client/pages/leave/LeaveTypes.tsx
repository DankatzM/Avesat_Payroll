import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Users,
  FileText,
  Shield,
  Copy,
  Download
} from 'lucide-react';
import { UserRole, LeaveType } from '@shared/api';

// Interfaces
interface LeaveTypeConfiguration {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'statutory' | 'company' | 'special';
  isActive: boolean;
  isPaid: boolean;
  requiresApproval: boolean;
  approvalLevels: ApprovalLevel[];
  entitlement: EntitlementRule;
  restrictions: LeaveRestriction[];
  documentation: DocumentationRequirement[];
  carryForward: CarryForwardRule;
  accrual: AccrualRule;
  gender?: 'male' | 'female' | 'both';
  minServicePeriod: number; // months
  maxConsecutiveDays: number;
  minAdvanceNotice: number; // days
  blackoutPeriods: BlackoutPeriod[];
  isHalfDayAllowed: boolean;
  isBackdatingAllowed: boolean;
  backdatingLimit: number; // days
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ApprovalLevel {
  level: number;
  title: string;
  roles: UserRole[];
  conditions?: string[];
}

interface EntitlementRule {
  type: 'fixed' | 'service_based' | 'pro_rated';
  defaultDays: number;
  serviceBasedRules?: ServiceBasedRule[];
  proRationBasis?: 'monthly' | 'annual';
}

interface ServiceBasedRule {
  minServiceMonths: number;
  maxServiceMonths?: number;
  entitlementDays: number;
}

interface LeaveRestriction {
  type: 'max_per_month' | 'max_per_quarter' | 'min_gap_between' | 'specific_dates';
  value: number;
  description: string;
}

interface DocumentationRequirement {
  type: 'medical_certificate' | 'proof_document' | 'manager_approval' | 'hr_approval';
  isRequired: boolean;
  conditions?: string[];
}

interface CarryForwardRule {
  isAllowed: boolean;
  maxDays?: number;
  expiryMonths?: number;
  conditions?: string[];
}

interface AccrualRule {
  type: 'monthly' | 'annual' | 'none';
  rate?: number; // days per period
  probationPeriod: number; // months
}

interface BlackoutPeriod {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

const LeaveTypes: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageLeaveTypes = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('types');
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfiguration[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<LeaveTypeConfiguration[]>([]);
  const [selectedType, setSelectedType] = useState<LeaveTypeConfiguration | null>(null);
  
  // UI state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [newLeaveType, setNewLeaveType] = useState<Partial<LeaveTypeConfiguration>>({
    name: '',
    code: '',
    description: '',
    category: 'company',
    isActive: true,
    isPaid: true,
    requiresApproval: true,
    entitlement: {
      type: 'fixed',
      defaultDays: 21
    },
    restrictions: [],
    documentation: [],
    carryForward: {
      isAllowed: false
    },
    accrual: {
      type: 'monthly',
      probationPeriod: 6
    },
    gender: 'both',
    minServicePeriod: 0,
    maxConsecutiveDays: 0,
    minAdvanceNotice: 0,
    blackoutPeriods: [],
    isHalfDayAllowed: true,
    isBackdatingAllowed: false,
    backdatingLimit: 0
  });

  // Mock data
  const mockLeaveTypes: LeaveTypeConfiguration[] = [
    {
      id: 'annual_leave',
      name: 'Annual Leave',
      code: 'AL',
      description: 'Annual vacation leave for rest and recreation',
      category: 'statutory',
      isActive: true,
      isPaid: true,
      requiresApproval: true,
      approvalLevels: [
        {
          level: 1,
          title: 'Line Manager',
          roles: [UserRole.MANAGER]
        },
        {
          level: 2,
          title: 'HR Manager',
          roles: [UserRole.HR_MANAGER],
          conditions: ['More than 10 days']
        }
      ],
      entitlement: {
        type: 'service_based',
        defaultDays: 21,
        serviceBasedRules: [
          { minServiceMonths: 0, maxServiceMonths: 24, entitlementDays: 21 },
          { minServiceMonths: 24, maxServiceMonths: 60, entitlementDays: 24 },
          { minServiceMonths: 60, entitlementDays: 28 }
        ]
      },
      restrictions: [
        {
          type: 'max_per_month',
          value: 10,
          description: 'Maximum 10 days per month'
        }
      ],
      documentation: [],
      carryForward: {
        isAllowed: true,
        maxDays: 5,
        expiryMonths: 6
      },
      accrual: {
        type: 'monthly',
        rate: 1.75,
        probationPeriod: 6
      },
      gender: 'both',
      minServicePeriod: 6,
      maxConsecutiveDays: 15,
      minAdvanceNotice: 7,
      blackoutPeriods: [
        {
          name: 'Year End',
          startDate: '2025-12-20',
          endDate: '2025-01-05',
          description: 'Year-end closure period'
        }
      ],
      isHalfDayAllowed: true,
      isBackdatingAllowed: false,
      backdatingLimit: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'sick_leave',
      name: 'Sick Leave',
      code: 'SL',
      description: 'Leave for medical treatment and recovery',
      category: 'statutory',
      isActive: true,
      isPaid: true,
      requiresApproval: true,
      approvalLevels: [
        {
          level: 1,
          title: 'Line Manager',
          roles: [UserRole.MANAGER]
        }
      ],
      entitlement: {
        type: 'fixed',
        defaultDays: 14
      },
      restrictions: [],
      documentation: [
        {
          type: 'medical_certificate',
          isRequired: true,
          conditions: ['More than 3 consecutive days']
        }
      ],
      carryForward: {
        isAllowed: false
      },
      accrual: {
        type: 'monthly',
        rate: 1.17,
        probationPeriod: 3
      },
      gender: 'both',
      minServicePeriod: 3,
      maxConsecutiveDays: 0,
      minAdvanceNotice: 0,
      blackoutPeriods: [],
      isHalfDayAllowed: true,
      isBackdatingAllowed: true,
      backdatingLimit: 7,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'maternity_leave',
      name: 'Maternity Leave',
      code: 'ML',
      description: 'Leave for childbirth and postnatal care',
      category: 'statutory',
      isActive: true,
      isPaid: true,
      requiresApproval: true,
      approvalLevels: [
        {
          level: 1,
          title: 'HR Manager',
          roles: [UserRole.HR_MANAGER]
        }
      ],
      entitlement: {
        type: 'fixed',
        defaultDays: 90
      },
      restrictions: [
        {
          type: 'specific_dates',
          value: 0,
          description: 'Must be taken around childbirth'
        }
      ],
      documentation: [
        {
          type: 'medical_certificate',
          isRequired: true
        }
      ],
      carryForward: {
        isAllowed: false
      },
      accrual: {
        type: 'none',
        probationPeriod: 12
      },
      gender: 'female',
      minServicePeriod: 12,
      maxConsecutiveDays: 90,
      minAdvanceNotice: 30,
      blackoutPeriods: [],
      isHalfDayAllowed: false,
      isBackdatingAllowed: false,
      backdatingLimit: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'paternity_leave',
      name: 'Paternity Leave',
      code: 'PL',
      description: 'Leave for fathers following childbirth',
      category: 'statutory',
      isActive: true,
      isPaid: true,
      requiresApproval: true,
      approvalLevels: [
        {
          level: 1,
          title: 'HR Manager',
          roles: [UserRole.HR_MANAGER]
        }
      ],
      entitlement: {
        type: 'fixed',
        defaultDays: 14
      },
      restrictions: [
        {
          type: 'specific_dates',
          value: 0,
          description: 'Must be taken within 3 months of childbirth'
        }
      ],
      documentation: [
        {
          type: 'proof_document',
          isRequired: true
        }
      ],
      carryForward: {
        isAllowed: false
      },
      accrual: {
        type: 'none',
        probationPeriod: 12
      },
      gender: 'male',
      minServicePeriod: 12,
      maxConsecutiveDays: 14,
      minAdvanceNotice: 7,
      blackoutPeriods: [],
      isHalfDayAllowed: false,
      isBackdatingAllowed: false,
      backdatingLimit: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'compassionate_leave',
      name: 'Compassionate Leave',
      code: 'CL',
      description: 'Leave for bereavement and family emergencies',
      category: 'company',
      isActive: true,
      isPaid: true,
      requiresApproval: true,
      approvalLevels: [
        {
          level: 1,
          title: 'Line Manager',
          roles: [UserRole.MANAGER]
        }
      ],
      entitlement: {
        type: 'fixed',
        defaultDays: 5
      },
      restrictions: [
        {
          type: 'max_per_quarter',
          value: 5,
          description: 'Maximum 5 days per quarter'
        }
      ],
      documentation: [
        {
          type: 'proof_document',
          isRequired: true
        }
      ],
      carryForward: {
        isAllowed: false
      },
      accrual: {
        type: 'none',
        probationPeriod: 0
      },
      gender: 'both',
      minServicePeriod: 0,
      maxConsecutiveDays: 5,
      minAdvanceNotice: 0,
      blackoutPeriods: [],
      isHalfDayAllowed: false,
      isBackdatingAllowed: true,
      backdatingLimit: 3,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin'
    }
  ];

  // Initialize data
  useEffect(() => {
    setLeaveTypes(mockLeaveTypes);
    setFilteredTypes(mockLeaveTypes);
  }, []);

  // Filter leave types
  useEffect(() => {
    let filtered = leaveTypes;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(type => type.category === categoryFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(type => type.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(type => !type.isActive);
    }

    setFilteredTypes(filtered);
  }, [leaveTypes, categoryFilter, statusFilter]);

  // Handle create leave type
  const handleCreateLeaveType = async () => {
    if (!newLeaveType.name || !newLeaveType.code) {
      alert('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      const leaveType: LeaveTypeConfiguration = {
        id: `leave_type_${Date.now()}`,
        ...newLeaveType as LeaveTypeConfiguration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || 'system'
      };

      setLeaveTypes([...leaveTypes, leaveType]);
      setShowCreateDialog(false);
      setNewLeaveType({
        name: '',
        code: '',
        description: '',
        category: 'company',
        isActive: true,
        isPaid: true,
        requiresApproval: true,
        entitlement: {
          type: 'fixed',
          defaultDays: 21
        },
        restrictions: [],
        documentation: [],
        carryForward: {
          isAllowed: false
        },
        accrual: {
          type: 'monthly',
          probationPeriod: 6
        },
        gender: 'both',
        minServicePeriod: 0,
        maxConsecutiveDays: 0,
        minAdvanceNotice: 0,
        blackoutPeriods: [],
        isHalfDayAllowed: true,
        isBackdatingAllowed: false,
        backdatingLimit: 0
      });

      alert('Leave type created successfully!');
    } catch (error) {
      alert('Error creating leave type. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'statutory': return 'bg-red-100 text-red-800';
      case 'company': return 'bg-blue-100 text-blue-800';
      case 'special': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canManageLeaveTypes) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage leave types.
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
          <h1 className="text-3xl font-bold text-gray-900">Leave Types Configuration</h1>
          <p className="text-gray-600">Configure and manage different types of leave</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Leave Type
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="types">Leave Types</TabsTrigger>
          <TabsTrigger value="workflows">Approval Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        {/* Leave Types Tab */}
        <TabsContent value="types" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="statutory">Statutory</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leave Types Grid */}
          <div className="grid gap-6">
            {filteredTypes.map((leaveType) => (
              <Card key={leaveType.id} className="border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{leaveType.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {leaveType.code}
                        </Badge>
                        <Badge className={getCategoryColor(leaveType.category)}>
                          {leaveType.category}
                        </Badge>
                        <Badge variant={leaveType.isActive ? "default" : "secondary"}>
                          {leaveType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {leaveType.isPaid && (
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-4">{leaveType.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label>Entitlement</Label>
                          <div className="font-medium">
                            {leaveType.entitlement.defaultDays} days
                            {leaveType.entitlement.type !== 'fixed' && (
                              <span className="text-sm text-gray-500"> ({leaveType.entitlement.type})</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label>Min Service</Label>
                          <div className="font-medium">{leaveType.minServicePeriod} months</div>
                        </div>
                        <div>
                          <Label>Advance Notice</Label>
                          <div className="font-medium">
                            {leaveType.minAdvanceNotice > 0 ? `${leaveType.minAdvanceNotice} days` : 'Not required'}
                          </div>
                        </div>
                        <div>
                          <Label>Gender</Label>
                          <div className="font-medium capitalize">{leaveType.gender}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label>Approval Required</Label>
                          <div className="font-medium">{leaveType.requiresApproval ? 'Yes' : 'No'}</div>
                        </div>
                        <div>
                          <Label>Half Day Allowed</Label>
                          <div className="font-medium">{leaveType.isHalfDayAllowed ? 'Yes' : 'No'}</div>
                        </div>
                        <div>
                          <Label>Carry Forward</Label>
                          <div className="font-medium">
                            {leaveType.carryForward.isAllowed ? 
                              `${leaveType.carryForward.maxDays || 0} days` : 
                              'Not allowed'
                            }
                          </div>
                        </div>
                        <div>
                          <Label>Backdating</Label>
                          <div className="font-medium">
                            {leaveType.isBackdatingAllowed ? 
                              `${leaveType.backdatingLimit} days` : 
                              'Not allowed'
                            }
                          </div>
                        </div>
                      </div>

                      {leaveType.restrictions.length > 0 && (
                        <div className="mb-4">
                          <Label>Restrictions</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {leaveType.restrictions.map((restriction, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {restriction.description}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {leaveType.documentation.length > 0 && (
                        <div className="mb-4">
                          <Label>Documentation Required</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {leaveType.documentation.map((doc, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {doc.type.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {leaveType.blackoutPeriods.length > 0 && (
                        <div>
                          <Label>Blackout Periods</Label>
                          <div className="space-y-1 mt-1">
                            {leaveType.blackoutPeriods.map((period, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                {period.name}: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedType(leaveType)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedType(leaveType);
                        setShowEditDialog(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Approval Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Approval Workflows</h3>
                <p className="text-gray-600">Configure approval workflows for different leave types</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Type Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Analytics</h3>
                <p className="text-gray-600">Analyze leave type usage patterns and trends</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Leave Type Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Leave Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Leave Type Name</Label>
                <Input
                  id="name"
                  value={newLeaveType.name || ''}
                  onChange={(e) => setNewLeaveType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Study Leave"
                />
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={newLeaveType.code || ''}
                  onChange={(e) => setNewLeaveType(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., SL"
                  maxLength={5}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newLeaveType.description || ''}
                onChange={(e) => setNewLeaveType(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this leave type"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newLeaveType.category}
                  onValueChange={(value) => setNewLeaveType(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="statutory">Statutory</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="defaultDays">Default Entitlement (Days)</Label>
                <Input
                  id="defaultDays"
                  type="number"
                  value={newLeaveType.entitlement?.defaultDays || 0}
                  onChange={(e) => setNewLeaveType(prev => ({
                    ...prev,
                    entitlement: {
                      ...prev.entitlement!,
                      defaultDays: Number(e.target.value)
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender Eligibility</Label>
                <Select
                  value={newLeaveType.gender}
                  onValueChange={(value) => setNewLeaveType(prev => ({ ...prev, gender: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minService">Min Service Period (Months)</Label>
                <Input
                  id="minService"
                  type="number"
                  value={newLeaveType.minServicePeriod || 0}
                  onChange={(e) => setNewLeaveType(prev => ({ ...prev, minServicePeriod: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="advanceNotice">Min Advance Notice (Days)</Label>
                <Input
                  id="advanceNotice"
                  type="number"
                  value={newLeaveType.minAdvanceNotice || 0}
                  onChange={(e) => setNewLeaveType(prev => ({ ...prev, minAdvanceNotice: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newLeaveType.isActive}
                    onCheckedChange={(checked) => setNewLeaveType(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPaid"
                    checked={newLeaveType.isPaid}
                    onCheckedChange={(checked) => setNewLeaveType(prev => ({ ...prev, isPaid: checked }))}
                  />
                  <Label htmlFor="isPaid">Paid Leave</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresApproval"
                    checked={newLeaveType.requiresApproval}
                    onCheckedChange={(checked) => setNewLeaveType(prev => ({ ...prev, requiresApproval: checked }))}
                  />
                  <Label htmlFor="requiresApproval">Requires Approval</Label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isHalfDayAllowed"
                    checked={newLeaveType.isHalfDayAllowed}
                    onCheckedChange={(checked) => setNewLeaveType(prev => ({ ...prev, isHalfDayAllowed: checked }))}
                  />
                  <Label htmlFor="isHalfDayAllowed">Allow Half Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isBackdatingAllowed"
                    checked={newLeaveType.isBackdatingAllowed}
                    onCheckedChange={(checked) => setNewLeaveType(prev => ({ ...prev, isBackdatingAllowed: checked }))}
                  />
                  <Label htmlFor="isBackdatingAllowed">Allow Backdating</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="carryForwardAllowed"
                    checked={newLeaveType.carryForward?.isAllowed}
                    onCheckedChange={(checked) => setNewLeaveType(prev => ({
                      ...prev,
                      carryForward: {
                        ...prev.carryForward!,
                        isAllowed: checked
                      }
                    }))}
                  />
                  <Label htmlFor="carryForwardAllowed">Allow Carry Forward</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLeaveType} disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create Leave Type'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Leave Type Dialog */}
      <Dialog open={!!selectedType && !showEditDialog} onOpenChange={() => setSelectedType(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Leave Type Details</DialogTitle>
          </DialogHeader>
          {selectedType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <div className="font-medium">{selectedType.name}</div>
                </div>
                <div>
                  <Label>Code</Label>
                  <div className="font-medium">{selectedType.code}</div>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <div className="p-3 bg-gray-50 rounded">{selectedType.description}</div>
              </div>

              {selectedType.approvalLevels.length > 0 && (
                <div>
                  <Label>Approval Workflow</Label>
                  <div className="space-y-2">
                    {selectedType.approvalLevels.map((level, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded">
                        <Badge variant="outline">Level {level.level}</Badge>
                        <div className="flex-1">
                          <div className="font-medium">{level.title}</div>
                          <div className="text-sm text-gray-600">
                            Roles: {level.roles.join(', ')}
                          </div>
                          {level.conditions && level.conditions.length > 0 && (
                            <div className="text-sm text-gray-500">
                              Conditions: {level.conditions.join(', ')}
                            </div>
                          )}
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
    </div>
  );
};

export default LeaveTypes;
