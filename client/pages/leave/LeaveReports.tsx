import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Settings,
  Filter,
  Search,
  PieChart,
  LineChart,
  Activity,
  Building2
} from 'lucide-react';
import { UserRole, LeaveType, LeaveStatus } from '@shared/api';

// Interfaces
interface LeaveReportData {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  position: string;
  leaveType: LeaveType;
  totalEntitled: number;
  totalTaken: number;
  totalRemaining: number;
  utilizationRate: number;
  averageLeaveDuration: number;
  lastLeaveDate?: string;
}

interface DepartmentSummary {
  department: string;
  totalEmployees: number;
  totalLeavesTaken: number;
  totalDaysTaken: number;
  averageUtilizationRate: number;
  mostUsedLeaveType: LeaveType;
  leastUsedLeaveType: LeaveType;
}

interface LeaveAnalytics {
  totalEmployees: number;
  totalLeaveRequests: number;
  totalDaysTaken: number;
  approvalRate: number;
  averageProcessingTime: number;
  peakLeaveMonths: string[];
  leaveTypeBreakdown: { [key in LeaveType]: number };
  departmentUtilization: { [department: string]: number };
  trends: {
    month: string;
    requests: number;
    days: number;
    approvals: number;
  }[];
}

interface ReportFilter {
  dateRange: 'current_year' | 'last_year' | 'ytd' | 'custom';
  startDate?: string;
  endDate?: string;
  departments: string[];
  leaveTypes: LeaveType[];
  employees: string[];
  includeInactive: boolean;
}

const LeaveReports: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canViewReports = hasAnyRole([UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('summary');
  const [reportData, setReportData] = useState<LeaveReportData[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummary[]>([]);
  const [analytics, setAnalytics] = useState<LeaveAnalytics | null>(null);
  const [filteredData, setFilteredData] = useState<LeaveReportData[]>([]);

  // Filters
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: 'current_year',
    departments: [],
    leaveTypes: [],
    employees: [],
    includeInactive: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');

  // Mock data
  const mockReportData: LeaveReportData[] = [
    {
      employeeId: 'emp_001',
      employeeName: 'John Mwangi',
      employeeNumber: 'EMP001',
      department: 'Finance',
      position: 'Accountant',
      leaveType: LeaveType.ANNUAL,
      totalEntitled: 21,
      totalTaken: 8,
      totalRemaining: 13,
      utilizationRate: 38.1,
      averageLeaveDuration: 4,
      lastLeaveDate: '2024-12-20'
    },
    {
      employeeId: 'emp_001',
      employeeName: 'John Mwangi',
      employeeNumber: 'EMP001',
      department: 'Finance',
      position: 'Accountant',
      leaveType: LeaveType.SICK,
      totalEntitled: 14,
      totalTaken: 3,
      totalRemaining: 11,
      utilizationRate: 21.4,
      averageLeaveDuration: 1.5,
      lastLeaveDate: '2024-11-15'
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Grace Wanjiku',
      employeeNumber: 'EMP002',
      department: 'HR',
      position: 'HR Manager',
      leaveType: LeaveType.ANNUAL,
      totalEntitled: 24,
      totalTaken: 12,
      totalRemaining: 12,
      utilizationRate: 50.0,
      averageLeaveDuration: 6,
      lastLeaveDate: '2024-12-15'
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Grace Wanjiku',
      employeeNumber: 'EMP002',
      department: 'HR',
      position: 'HR Manager',
      leaveType: LeaveType.SICK,
      totalEntitled: 14,
      totalTaken: 1,
      totalRemaining: 13,
      utilizationRate: 7.1,
      averageLeaveDuration: 1,
      lastLeaveDate: '2024-08-22'
    },
    {
      employeeId: 'emp_003',
      employeeName: 'Peter Kiprotich',
      employeeNumber: 'EMP003',
      department: 'IT',
      position: 'Software Developer',
      leaveType: LeaveType.ANNUAL,
      totalEntitled: 21,
      totalTaken: 15,
      totalRemaining: 6,
      utilizationRate: 71.4,
      averageLeaveDuration: 5,
      lastLeaveDate: '2024-12-01'
    }
  ];

  const mockDepartmentSummary: DepartmentSummary[] = [
    {
      department: 'Finance',
      totalEmployees: 12,
      totalLeavesTaken: 45,
      totalDaysTaken: 180,
      averageUtilizationRate: 42.5,
      mostUsedLeaveType: LeaveType.ANNUAL,
      leastUsedLeaveType: LeaveType.MATERNITY
    },
    {
      department: 'HR',
      totalEmployees: 8,
      totalLeavesTaken: 32,
      totalDaysTaken: 156,
      averageUtilizationRate: 48.8,
      mostUsedLeaveType: LeaveType.ANNUAL,
      leastUsedLeaveType: LeaveType.PATERNITY
    },
    {
      department: 'IT',
      totalEmployees: 15,
      totalLeavesTaken: 67,
      totalDaysTaken: 289,
      averageUtilizationRate: 55.2,
      mostUsedLeaveType: LeaveType.ANNUAL,
      leastUsedLeaveType: LeaveType.SICK
    },
    {
      department: 'Sales',
      totalEmployees: 20,
      totalLeavesTaken: 89,
      totalDaysTaken: 367,
      averageUtilizationRate: 38.9,
      mostUsedLeaveType: LeaveType.ANNUAL,
      leastUsedLeaveType: LeaveType.COMPASSIONATE
    }
  ];

  const mockAnalytics: LeaveAnalytics = {
    totalEmployees: 55,
    totalLeaveRequests: 233,
    totalDaysTaken: 992,
    approvalRate: 94.4,
    averageProcessingTime: 2.3,
    peakLeaveMonths: ['December', 'April', 'August'],
    leaveTypeBreakdown: {
      [LeaveType.ANNUAL]: 65.2,
      [LeaveType.SICK]: 18.5,
      [LeaveType.MATERNITY]: 8.1,
      [LeaveType.PATERNITY]: 4.7,
      [LeaveType.COMPASSIONATE]: 2.8,
      [LeaveType.STUDY]: 0.7
    },
    departmentUtilization: {
      'IT': 55.2,
      'HR': 48.8,
      'Finance': 42.5,
      'Sales': 38.9
    },
    trends: [
      { month: 'Jan', requests: 18, days: 72, approvals: 17 },
      { month: 'Feb', requests: 15, days: 58, approvals: 14 },
      { month: 'Mar', requests: 22, days: 89, approvals: 21 },
      { month: 'Apr', requests: 28, days: 118, approvals: 26 },
      { month: 'May', requests: 19, days: 76, approvals: 18 },
      { month: 'Jun', requests: 21, days: 84, approvals: 20 },
      { month: 'Jul', requests: 24, days: 96, approvals: 23 },
      { month: 'Aug', requests: 26, days: 104, approvals: 25 },
      { month: 'Sep', requests: 17, days: 68, approvals: 16 },
      { month: 'Oct', requests: 20, days: 80, approvals: 19 },
      { month: 'Nov', requests: 16, days: 64, approvals: 15 },
      { month: 'Dec', requests: 27, days: 108, approvals: 25 }
    ]
  };

  // Initialize data
  useEffect(() => {
    setReportData(mockReportData);
    setDepartmentSummary(mockDepartmentSummary);
    setAnalytics(mockAnalytics);
    setFilteredData(mockReportData);
  }, []);

  // Filter data
  useEffect(() => {
    let filtered = reportData;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(item => item.department === departmentFilter);
    }

    if (leaveTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.leaveType === leaveTypeFilter);
    }

    setFilteredData(filtered);
  }, [reportData, searchTerm, departmentFilter, leaveTypeFilter]);

  // Export functions
  const exportToCSV = () => {
    const csvContent = [
      ['Employee Name', 'Employee Number', 'Department', 'Leave Type', 'Entitled', 'Taken', 'Remaining', 'Utilization %'],
      ...filteredData.map(item => [
        item.employeeName,
        item.employeeNumber,
        item.department,
        item.leaveType,
        item.totalEntitled,
        item.totalTaken,
        item.totalRemaining,
        item.utilizationRate.toFixed(1)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leave_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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

  // Get utilization color
  const getUtilizationColor = (rate: number) => {
    if (rate > 80) return 'text-red-600 font-bold';
    if (rate > 60) return 'text-orange-600 font-medium';
    if (rate > 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive leave usage analysis and reporting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
          <TabsTrigger value="department">Department Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
        </TabsList>

        {/* Executive Summary */}
        <TabsContent value="summary" className="space-y-6">
          {analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.totalEmployees}</div>
                    <div className="text-sm text-blue-600">Total Employees</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.totalLeaveRequests}</div>
                    <div className="text-sm text-green-600">Leave Requests</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.totalDaysTaken}</div>
                    <div className="text-sm text-orange-600">Days Taken</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.approvalRate.toFixed(1)}%</div>
                    <div className="text-sm text-purple-600">Approval Rate</div>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Leave Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(analytics.leaveTypeBreakdown).map(([type, percentage]) => (
                      <div key={type} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={getLeaveTypeColor(type as LeaveType)}>
                            {type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="font-medium">{percentage.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Department Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Department Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.departmentUtilization).map(([dept, rate]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <div className="font-medium">{dept}</div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm ${getUtilizationColor(rate)}`}>
                            {rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-600">Peak Months</span>
                      </div>
                      <div className="text-sm">
                        Highest leave usage: {analytics.peakLeaveMonths.join(', ')}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">Processing Time</span>
                      </div>
                      <div className="text-sm">
                        Average approval time: {analytics.averageProcessingTime} days
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Detailed Report */}
        <TabsContent value="detailed" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employees..."
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

          {/* Detailed Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Entitled</TableHead>
                    <TableHead>Taken</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Avg Duration</TableHead>
                    <TableHead>Last Leave</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={`${item.employeeId}-${item.leaveType}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.employeeName}</div>
                          <div className="text-sm text-gray-500">
                            {item.employeeNumber} • {item.department}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeaveTypeColor(item.leaveType)}>
                          {item.leaveType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.totalEntitled}</TableCell>
                      <TableCell className="font-medium">{item.totalTaken}</TableCell>
                      <TableCell className="font-medium">{item.totalRemaining}</TableCell>
                      <TableCell>
                        <span className={getUtilizationColor(item.utilizationRate)}>
                          {item.utilizationRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{item.averageLeaveDuration} days</TableCell>
                      <TableCell>
                        {item.lastLeaveDate ? new Date(item.lastLeaveDate).toLocaleDateString() : 'None'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Analysis */}
        <TabsContent value="department" className="space-y-6">
          <div className="grid gap-6">
            {departmentSummary.map((dept) => (
              <Card key={dept.department}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {dept.department} Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{dept.totalEmployees}</div>
                      <div className="text-sm text-blue-600">Employees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{dept.totalLeavesTaken}</div>
                      <div className="text-sm text-green-600">Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{dept.totalDaysTaken}</div>
                      <div className="text-sm text-orange-600">Days Taken</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {dept.averageUtilizationRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-purple-600">Avg Utilization</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-sm text-green-600">Most Used Leave Type</div>
                      <Badge className={getLeaveTypeColor(dept.mostUsedLeaveType)}>
                        {dept.mostUsedLeaveType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <div className="text-sm text-yellow-600">Least Used Leave Type</div>
                      <Badge className={getLeaveTypeColor(dept.leastUsedLeaveType)}>
                        {dept.leastUsedLeaveType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends & Analytics */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics && (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-2">
                    {analytics.trends.map((trend, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-1">{trend.month}</div>
                        <div className="space-y-1">
                          <div className="h-8 bg-blue-200 rounded flex items-end justify-center relative">
                            <div 
                              className="bg-blue-600 rounded w-full"
                              style={{ height: `${(trend.requests / 30) * 100}%` }}
                            ></div>
                            <span className="absolute text-xs text-white">{trend.requests}</span>
                          </div>
                          <div className="text-xs text-gray-500">{trend.days}d</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      Blue bars: Leave requests | Numbers below: Total days
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Report */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Leave Compliance Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Monitoring</h3>
                <p className="text-gray-600">Track compliance with leave policies and regulations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveReports;
