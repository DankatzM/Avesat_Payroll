import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { UserRole, LeaveType, LeaveStatus } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

// Interfaces
interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  position: string;
  leaveType: LeaveType;
  entitlement: number;
  accrued: number;
  used: number;
  remaining: number;
  carryForward: number;
  carryForwardUsed: number;
  carryForwardExpiry: string;
  accrualRate: number; // days per month
  projectedAccrual: number;
  lastAccrualDate: string;
}

interface LeaveAccrual {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  accrualDate: string;
  daysAccrued: number;
  runningBalance: number;
  isManualAdjustment: boolean;
  reason?: string;
  adjustedBy?: string;
}

interface LeaveAdjustment {
  employeeId: string;
  leaveType: LeaveType;
  adjustmentType: 'add' | 'deduct';
  days: number;
  reason: string;
  effectiveDate: string;
}

interface BalanceConfiguration {
  leaveType: LeaveType;
  annualEntitlement: number;
  accrualBasis: 'monthly' | 'annual' | 'none';
  accrualRate: number;
  maxCarryForward: number;
  carryForwardExpiry: number; // months
  probationPeriod: number; // months
  isProRated: boolean;
}

const LeaveBalance: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageBalances = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('balances');
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveAccruals, setLeaveAccruals] = useState<LeaveAccrual[]>([]);
  const [balanceConfigs, setBalanceConfigs] = useState<BalanceConfiguration[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<LeaveBalance[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<LeaveBalance | null>(null);
  const [adjustment, setAdjustment] = useState<LeaveAdjustment>({
    employeeId: '',
    leaveType: LeaveType.ANNUAL,
    adjustmentType: 'add',
    days: 0,
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Mock data
  const mockBalanceConfigs: BalanceConfiguration[] = [
    {
      leaveType: LeaveType.ANNUAL,
      annualEntitlement: 21,
      accrualBasis: 'monthly',
      accrualRate: 1.75,
      maxCarryForward: 5,
      carryForwardExpiry: 6,
      probationPeriod: 6,
      isProRated: true
    },
    {
      leaveType: LeaveType.SICK,
      annualEntitlement: 14,
      accrualBasis: 'monthly',
      accrualRate: 1.17,
      maxCarryForward: 0,
      carryForwardExpiry: 0,
      probationPeriod: 3,
      isProRated: false
    },
    {
      leaveType: LeaveType.MATERNITY,
      annualEntitlement: 90,
      accrualBasis: 'none',
      accrualRate: 0,
      maxCarryForward: 0,
      carryForwardExpiry: 0,
      probationPeriod: 12,
      isProRated: false
    },
    {
      leaveType: LeaveType.PATERNITY,
      annualEntitlement: 14,
      accrualBasis: 'none',
      accrualRate: 0,
      maxCarryForward: 0,
      carryForwardExpiry: 0,
      probationPeriod: 12,
      isProRated: false
    }
  ];

  const mockLeaveBalances: LeaveBalance[] = [
    {
      employeeId: 'emp_001',
      employeeName: 'John Mwangi',
      employeeNumber: 'EMP001',
      department: 'Finance',
      position: 'Accountant',
      leaveType: LeaveType.ANNUAL,
      entitlement: 21,
      accrued: 15.5,
      used: 8,
      remaining: 12.5,
      carryForward: 5,
      carryForwardUsed: 0,
      carryForwardExpiry: '2025-06-30',
      accrualRate: 1.75,
      projectedAccrual: 21,
      lastAccrualDate: '2025-01-31'
    },
    {
      employeeId: 'emp_001',
      employeeName: 'John Mwangi',
      employeeNumber: 'EMP001',
      department: 'Finance',
      position: 'Accountant',
      leaveType: LeaveType.SICK,
      entitlement: 14,
      accrued: 8.2,
      used: 3,
      remaining: 5.2,
      carryForward: 0,
      carryForwardUsed: 0,
      carryForwardExpiry: '',
      accrualRate: 1.17,
      projectedAccrual: 14,
      lastAccrualDate: '2025-01-31'
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Grace Wanjiku',
      employeeNumber: 'EMP002',
      department: 'HR',
      position: 'HR Manager',
      leaveType: LeaveType.ANNUAL,
      entitlement: 21,
      accrued: 21,
      used: 12,
      remaining: 14,
      carryForward: 5,
      carryForwardUsed: 2,
      carryForwardExpiry: '2025-06-30',
      accrualRate: 1.75,
      projectedAccrual: 21,
      lastAccrualDate: '2025-01-31'
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Grace Wanjiku',
      employeeNumber: 'EMP002',
      department: 'HR',
      position: 'HR Manager',
      leaveType: LeaveType.SICK,
      entitlement: 14,
      accrued: 14,
      used: 1,
      remaining: 13,
      carryForward: 0,
      carryForwardUsed: 0,
      carryForwardExpiry: '',
      accrualRate: 1.17,
      projectedAccrual: 14,
      lastAccrualDate: '2025-01-31'
    },
    {
      employeeId: 'emp_003',
      employeeName: 'Peter Kiprotich',
      employeeNumber: 'EMP003',
      department: 'IT',
      position: 'Software Developer',
      leaveType: LeaveType.ANNUAL,
      entitlement: 21,
      accrued: 18.75,
      used: 6,
      remaining: 12.75,
      carryForward: 0,
      carryForwardUsed: 0,
      carryForwardExpiry: '',
      accrualRate: 1.75,
      projectedAccrual: 21,
      lastAccrualDate: '2025-01-31'
    }
  ];

  // Initialize data
  useEffect(() => {
    setLeaveBalances(mockLeaveBalances);
    setBalanceConfigs(mockBalanceConfigs);
    setFilteredBalances(mockLeaveBalances);
  }, []);

  // Filter balances
  useEffect(() => {
    let filtered = leaveBalances;

    if (searchTerm) {
      filtered = filtered.filter(balance =>
        balance.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(balance => balance.department === departmentFilter);
    }

    if (leaveTypeFilter !== 'all') {
      filtered = filtered.filter(balance => balance.leaveType === leaveTypeFilter);
    }

    setFilteredBalances(filtered);
  }, [leaveBalances, searchTerm, departmentFilter, leaveTypeFilter]);

  // Process accruals
  const processMonthlyAccruals = async () => {
    alert('Monthly accruals processed successfully!');
  };

  // Handle balance adjustment
  const handleBalanceAdjustment = async () => {
    if (!adjustment.employeeId || !adjustment.reason || adjustment.days <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Update balance
      setLeaveBalances(prev => prev.map(balance => {
        if (balance.employeeId === adjustment.employeeId && balance.leaveType === adjustment.leaveType) {
          const adjustmentAmount = adjustment.adjustmentType === 'add' ? adjustment.days : -adjustment.days;
          return {
            ...balance,
            accrued: balance.accrued + adjustmentAmount,
            remaining: balance.remaining + adjustmentAmount
          };
        }
        return balance;
      }));

      setShowAdjustmentDialog(false);
      setAdjustment({
        employeeId: '',
        leaveType: LeaveType.ANNUAL,
        adjustmentType: 'add',
        days: 0,
        reason: '',
        effectiveDate: new Date().toISOString().split('T')[0]
      });

      alert('Balance adjustment processed successfully!');
    } catch (error) {
      alert('Error processing adjustment. Please try again.');
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

  // Calculate balance health
  const getBalanceHealth = (balance: LeaveBalance) => {
    const utilizationRate = (balance.used / balance.entitlement) * 100;
    if (utilizationRate > 80) return { status: 'high', color: 'text-red-600' };
    if (utilizationRate > 60) return { status: 'medium', color: 'text-yellow-600' };
    return { status: 'low', color: 'text-green-600' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Balance Management</h1>
          <p className="text-gray-600">Monitor and manage employee leave balances and accruals</p>
        </div>
        <div className="flex gap-2">
          {canManageBalances && (
            <>
              <Button variant="outline" onClick={processMonthlyAccruals}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Process Accruals
              </Button>
              <Button onClick={() => setShowAdjustmentDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adjust Balance
              </Button>
            </>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balances">Employee Balances</TabsTrigger>
          <TabsTrigger value="summary">Department Summary</TabsTrigger>
          <TabsTrigger value="accruals">Accrual History</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Employee Balances Tab */}
        <TabsContent value="balances" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by employee name or number..."
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Balances Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Entitlement</TableHead>
                    <TableHead>Accrued</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Carry Forward</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.map((balance, index) => {
                    const health = getBalanceHealth(balance);
                    const utilizationRate = (balance.used / balance.entitlement) * 100;
                    
                    return (
                      <TableRow key={`${balance.employeeId}-${balance.leaveType}-${index}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{balance.employeeName}</div>
                            <div className="text-sm text-gray-500">
                              {balance.employeeNumber} • {balance.department}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getLeaveTypeColor(balance.leaveType)}>
                            {balance.leaveType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{balance.entitlement}</TableCell>
                        <TableCell>{balance.accrued.toFixed(1)}</TableCell>
                        <TableCell>{balance.used}</TableCell>
                        <TableCell className="font-medium">{balance.remaining.toFixed(1)}</TableCell>
                        <TableCell>
                          {balance.carryForward > 0 ? (
                            <div>
                              <div className="font-medium">{balance.carryForward - balance.carryForwardUsed}</div>
                              <div className="text-xs text-gray-500">
                                Expires: {new Date(balance.carryForwardExpiry).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={utilizationRate} className="h-2 w-16" />
                            <span className={`text-sm font-medium ${health.color}`}>
                              {utilizationRate.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {canManageBalances && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(balance);
                                setAdjustment(prev => ({
                                  ...prev,
                                  employeeId: balance.employeeId,
                                  leaveType: balance.leaveType
                                }));
                                setShowAdjustmentDialog(true);
                              }}
                            >
                              Adjust
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">156</div>
                <div className="text-sm text-blue-600">Total Employees</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">2,890</div>
                <div className="text-sm text-green-600">Total Accrued Days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">1,245</div>
                <div className="text-sm text-orange-600">Days Used YTD</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">1,645</div>
                <div className="text-sm text-purple-600">Days Remaining</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Department Analytics</h3>
                <p className="text-gray-600">Detailed department-wise leave balance analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accrual History Tab */}
        <TabsContent value="accruals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accrual History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Accrual Tracking</h3>
                <p className="text-gray-600">View detailed accrual history and adjustments</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balanceConfigs.map((config) => (
                  <Card key={config.leaveType} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getLeaveTypeColor(config.leaveType)}>
                              {config.leaveType.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label>Annual Entitlement</Label>
                              <div className="font-medium">{config.annualEntitlement} days</div>
                            </div>
                            <div>
                              <Label>Accrual Basis</Label>
                              <div className="font-medium capitalize">{config.accrualBasis}</div>
                            </div>
                            <div>
                              <Label>Accrual Rate</Label>
                              <div className="font-medium">{config.accrualRate} days/month</div>
                            </div>
                            <div>
                              <Label>Max Carry Forward</Label>
                              <div className="font-medium">{config.maxCarryForward} days</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                            <div>
                              <Label>Probation Period</Label>
                              <div className="font-medium">{config.probationPeriod} months</div>
                            </div>
                            <div>
                              <Label>Carry Forward Expiry</Label>
                              <div className="font-medium">{config.carryForwardExpiry} months</div>
                            </div>
                            <div>
                              <Label>Pro-rated</Label>
                              <div className="font-medium">{config.isProRated ? 'Yes' : 'No'}</div>
                            </div>
                          </div>
                        </div>
                        
                        {canManageBalances && (
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Balance Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Leave Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEmployee && (
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium">{selectedEmployee.employeeName}</div>
                <div className="text-sm text-gray-600">
                  {selectedEmployee.employeeNumber} • {selectedEmployee.department}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select
                  value={adjustment.leaveType}
                  onValueChange={(value) => setAdjustment(prev => ({ ...prev, leaveType: value as LeaveType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LeaveType.ANNUAL}>Annual</SelectItem>
                    <SelectItem value={LeaveType.SICK}>Sick</SelectItem>
                    <SelectItem value={LeaveType.MATERNITY}>Maternity</SelectItem>
                    <SelectItem value={LeaveType.PATERNITY}>Paternity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select
                  value={adjustment.adjustmentType}
                  onValueChange={(value) => setAdjustment(prev => ({ ...prev, adjustmentType: value as 'add' | 'deduct' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Days</SelectItem>
                    <SelectItem value="deduct">Deduct Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="days">Number of Days</Label>
                <Input
                  id="days"
                  type="number"
                  min="0"
                  step="0.5"
                  value={adjustment.days}
                  onChange={(e) => setAdjustment(prev => ({ ...prev, days: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={adjustment.effectiveDate}
                  onChange={(e) => setAdjustment(prev => ({ ...prev, effectiveDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Input
                id="reason"
                placeholder="Enter reason for balance adjustment..."
                value={adjustment.reason}
                onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBalanceAdjustment}>
                Apply Adjustment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveBalance;
