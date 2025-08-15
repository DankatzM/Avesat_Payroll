import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Eye,
  Mail,
  Printer,
  Search,
  Filter,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Archive,
  History,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Building,
  User,
  Calculator,
  LineChart,
} from 'lucide-react';
import { Employee, Payslip, UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface PayslipHistoryEntry {
  id: string;
  payslip: Payslip;
  employee: Employee;
  actions: Array<{
    id: string;
    action: 'generated' | 'emailed' | 'printed' | 'downloaded' | 'viewed' | 'archived' | 'modified';
    performedBy: string;
    timestamp: string;
    details?: string;
    metadata?: Record<string, any>;
  }>;
  statistics: {
    emailsSent: number;
    printJobs: number;
    downloads: number;
    views: number;
    lastAccessed?: string;
  };
  compliance: {
    archived: boolean;
    archivedAt?: string;
    retentionPeriod: number; // in years
    scheduledDeletion?: string;
  };
}

interface HistoryFilter {
  dateRange: {
    start: string;
    end: string;
  };
  departments: string[];
  employees: string[];
  actions: string[];
  status: 'all' | 'active' | 'archived';
  payPeriod: string;
}

interface AnalyticsData {
  totalPayslips: number;
  totalEmployees: number;
  totalCost: number;
  trends: {
    payslipsGenerated: Array<{
      month: string;
      count: number;
    }>;
    costTrends: Array<{
      month: string;
      amount: number;
    }>;
    departmentStats: Array<{
      department: string;
      payslips: number;
      cost: number;
    }>;
  };
  recentActivity: Array<{
    id: string;
    description: string;
    timestamp: string;
    type: 'info' | 'warning' | 'error';
  }>;
}

export default function PayslipHistory() {
  const { user, hasAnyRole } = useAuth();
  const [historyEntries, setHistoryEntries] = useState<PayslipHistoryEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PayslipHistoryEntry | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<HistoryFilter>({
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
      end: new Date().toISOString().split('T')[0], // Today
    },
    departments: [],
    employees: [],
    actions: [],
    status: 'all',
    payPeriod: 'all',
  });

  const canViewHistory = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER]);

  useEffect(() => {
    if (canViewHistory) {
      fetchHistoryEntries();
      fetchEmployees();
      fetchAnalyticsData();
    }
  }, [canViewHistory]);

  const fetchHistoryEntries = async () => {
    // Mock history entries data
    const mockHistoryEntries: PayslipHistoryEntry[] = [
      {
        id: '1',
        payslip: {
          id: '1',
          employeeId: '1',
          payrollPeriodId: 'period-2024-03',
          employee: {
            firstName: 'John',
            lastName: 'Mwangi',
            employeeNumber: 'EMP001',
            position: 'Software Engineer',
            department: 'Engineering',
          },
          payPeriod: {
            startDate: '2024-03-01',
            endDate: '2024-03-31',
            payDate: '2024-03-25',
          },
          earnings: {
            basicSalary: 100000,
            overtime: 5000,
            allowances: 10000,
            bonus: 0,
            commission: 0,
            gross: 115000,
          },
          deductions: {
            payeTax: 15000,
            nhif: 1700,
            nssf: 2160,
            housingLevy: 1725,
            pension: 5000,
            other: 0,
            total: 25585,
          },
          totals: {
            gross: 115000,
            deductions: 25585,
            net: 89415,
          },
          ytdTotals: {
            grossEarnings: 345000,
            totalDeductions: 76755,
            netPay: 268245,
            taxPaid: 45000,
          },
          generatedAt: '2024-03-25T10:00:00Z',
        },
        employee: {
          id: '1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Mwangi',
          email: 'john.mwangi@company.co.ke',
          phone: '+254 712 345 678',
          nationalId: '12345678',
          address: 'P.O. Box 123, Nairobi, Kenya',
          dateOfBirth: '1990-05-15',
          hireDate: '2022-01-15',
          position: 'Software Engineer',
          department: 'Engineering',
          salary: 1200000,
          payrollCategory: 'monthly' as any,
          bankDetails: {
            bankName: 'Equity Bank',
            accountNumber: '1234567890',
            sortCode: '680000',
            accountHolderName: 'John Mwangi',
          },
          taxInformation: {
            kraPin: 'A123456789A',
            taxCode: 'T1',
            nhifNumber: 'NHIF123456',
            nssfNumber: 'NSSF789012',
            pensionContribution: 5,
          },
          isActive: true,
          createdAt: '2022-01-15T00:00:00Z',
          updatedAt: '2024-03-15T00:00:00Z',
        },
        actions: [
          {
            id: '1',
            action: 'generated',
            performedBy: 'payroll@avesat.co.ke',
            timestamp: '2024-03-25T10:00:00Z',
            details: 'Payslip generated via bulk generation',
          },
          {
            id: '2',
            action: 'emailed',
            performedBy: 'system',
            timestamp: '2024-03-25T10:15:00Z',
            details: 'Sent to john.mwangi@company.co.ke',
          },
          {
            id: '3',
            action: 'viewed',
            performedBy: 'john.mwangi@company.co.ke',
            timestamp: '2024-03-25T14:30:00Z',
            details: 'Viewed via employee portal',
          },
          {
            id: '4',
            action: 'downloaded',
            performedBy: 'john.mwangi@company.co.ke',
            timestamp: '2024-03-25T14:32:00Z',
            details: 'Downloaded PDF version',
          },
          {
            id: '5',
            action: 'printed',
            performedBy: 'hr@avesat.co.ke',
            timestamp: '2024-03-26T09:15:00Z',
            details: 'Printed on HR-Printer-001',
          },
        ],
        statistics: {
          emailsSent: 1,
          printJobs: 1,
          downloads: 1,
          views: 3,
          lastAccessed: '2024-03-25T14:32:00Z',
        },
        compliance: {
          archived: false,
          retentionPeriod: 7,
          scheduledDeletion: '2031-03-25T00:00:00Z',
        },
      },
      {
        id: '2',
        payslip: {
          id: '2',
          employeeId: '2',
          payrollPeriodId: 'period-2024-03',
          employee: {
            firstName: 'Grace',
            lastName: 'Wanjiku',
            employeeNumber: 'EMP002',
            position: 'Marketing Manager',
            department: 'Marketing',
          },
          payPeriod: {
            startDate: '2024-03-01',
            endDate: '2024-03-31',
            payDate: '2024-03-25',
          },
          earnings: {
            basicSalary: 79167,
            overtime: 0,
            allowances: 8000,
            bonus: 5000,
            commission: 0,
            gross: 92167,
          },
          deductions: {
            payeTax: 12000,
            nhif: 1600,
            nssf: 2160,
            housingLevy: 1383,
            pension: 4750,
            other: 0,
            total: 21893,
          },
          totals: {
            gross: 92167,
            deductions: 21893,
            net: 70274,
          },
          ytdTotals: {
            grossEarnings: 276500,
            totalDeductions: 65679,
            netPay: 210821,
            taxPaid: 36000,
          },
          generatedAt: '2024-03-25T10:01:00Z',
        },
        employee: {
          id: '2',
          employeeNumber: 'EMP002',
          firstName: 'Grace',
          lastName: 'Wanjiku',
          email: 'grace.wanjiku@company.co.ke',
          phone: '+254 722 987 654',
          nationalId: '23456789',
          address: 'P.O. Box 456, Nairobi, Kenya',
          dateOfBirth: '1988-08-22',
          hireDate: '2021-06-01',
          position: 'Marketing Manager',
          department: 'Marketing',
          salary: 950000,
          payrollCategory: 'monthly' as any,
          bankDetails: {
            bankName: 'KCB Bank',
            accountNumber: '9876543210',
            sortCode: '010000',
            accountHolderName: 'Grace Wanjiku',
          },
          taxInformation: {
            kraPin: 'A987654321B',
            taxCode: 'T1',
            nhifNumber: 'NHIF987654',
            nssfNumber: 'NSSF543210',
            pensionContribution: 6,
          },
          isActive: true,
          createdAt: '2021-06-01T00:00:00Z',
          updatedAt: '2024-03-15T00:00:00Z',
        },
        actions: [
          {
            id: '1',
            action: 'generated',
            performedBy: 'payroll@avesat.co.ke',
            timestamp: '2024-03-25T10:01:00Z',
            details: 'Payslip generated via bulk generation',
          },
          {
            id: '2',
            action: 'emailed',
            performedBy: 'system',
            timestamp: '2024-03-25T10:16:00Z',
            details: 'Sent to grace.wanjiku@company.co.ke',
          },
          {
            id: '3',
            action: 'viewed',
            performedBy: 'grace.wanjiku@company.co.ke',
            timestamp: '2024-03-25T16:45:00Z',
            details: 'Viewed via employee portal',
          },
        ],
        statistics: {
          emailsSent: 1,
          printJobs: 0,
          downloads: 0,
          views: 1,
          lastAccessed: '2024-03-25T16:45:00Z',
        },
        compliance: {
          archived: false,
          retentionPeriod: 7,
          scheduledDeletion: '2031-03-25T00:00:00Z',
        },
      },
      {
        id: '3',
        payslip: {
          id: '3',
          employeeId: '3',
          payrollPeriodId: 'period-2024-02',
          employee: {
            firstName: 'Samuel',
            lastName: 'Otieno',
            employeeNumber: 'EMP003',
            position: 'Sales Director',
            department: 'Sales',
          },
          payPeriod: {
            startDate: '2024-02-01',
            endDate: '2024-02-29',
            payDate: '2024-02-25',
          },
          earnings: {
            basicSalary: 125000,
            overtime: 0,
            allowances: 15000,
            bonus: 25000,
            commission: 10000,
            gross: 175000,
          },
          deductions: {
            payeTax: 28000,
            nhif: 1700,
            nssf: 2160,
            housingLevy: 2625,
            pension: 10000,
            other: 0,
            total: 44485,
          },
          totals: {
            gross: 175000,
            deductions: 44485,
            net: 130515,
          },
          ytdTotals: {
            grossEarnings: 350000,
            totalDeductions: 88970,
            netPay: 261030,
            taxPaid: 56000,
          },
          generatedAt: '2024-02-25T10:00:00Z',
        },
        employee: {
          id: '3',
          employeeNumber: 'EMP003',
          firstName: 'Samuel',
          lastName: 'Otieno',
          email: 'samuel.otieno@company.co.ke',
          phone: '+254 733 555 123',
          nationalId: '34567890',
          address: 'P.O. Box 789, Mombasa, Kenya',
          dateOfBirth: '1985-12-10',
          hireDate: '2020-03-15',
          position: 'Sales Director',
          department: 'Sales',
          salary: 1500000,
          payrollCategory: 'monthly' as any,
          bankDetails: {
            bankName: 'Cooperative Bank',
            accountNumber: '5555555555',
            sortCode: '070000',
            accountHolderName: 'Samuel Otieno',
          },
          taxInformation: {
            kraPin: 'A555555555C',
            taxCode: 'T2',
            nhifNumber: 'NHIF555555',
            nssfNumber: 'NSSF111111',
            pensionContribution: 8,
          },
          isActive: true,
          createdAt: '2020-03-15T00:00:00Z',
          updatedAt: '2024-03-15T00:00:00Z',
        },
        actions: [
          {
            id: '1',
            action: 'generated',
            performedBy: 'payroll@avesat.co.ke',
            timestamp: '2024-02-25T10:00:00Z',
            details: 'Payslip generated',
          },
          {
            id: '2',
            action: 'emailed',
            performedBy: 'system',
            timestamp: '2024-02-25T10:15:00Z',
            details: 'Sent to samuel.otieno@company.co.ke',
          },
          {
            id: '3',
            action: 'archived',
            performedBy: 'system',
            timestamp: '2024-03-31T00:00:00Z',
            details: 'Auto-archived after 30 days',
          },
        ],
        statistics: {
          emailsSent: 1,
          printJobs: 0,
          downloads: 0,
          views: 0,
          lastAccessed: '2024-02-25T10:15:00Z',
        },
        compliance: {
          archived: true,
          archivedAt: '2024-03-31T00:00:00Z',
          retentionPeriod: 7,
          scheduledDeletion: '2031-02-25T00:00:00Z',
        },
      },
    ];
    setHistoryEntries(mockHistoryEntries);
  };

  const fetchEmployees = async () => {
    // Mock employees data (subset)
    const mockEmployees: Employee[] = [
      {
        id: '1',
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Mwangi',
        email: 'john.mwangi@company.co.ke',
        phone: '+254 712 345 678',
        nationalId: '12345678',
        address: 'P.O. Box 123, Nairobi, Kenya',
        dateOfBirth: '1990-05-15',
        hireDate: '2022-01-15',
        position: 'Software Engineer',
        department: 'Engineering',
        salary: 1200000,
        payrollCategory: 'monthly' as any,
        bankDetails: {
          bankName: 'Equity Bank',
          accountNumber: '1234567890',
          sortCode: '680000',
          accountHolderName: 'John Mwangi',
        },
        taxInformation: {
          kraPin: 'A123456789A',
          taxCode: 'T1',
          nhifNumber: 'NHIF123456',
          nssfNumber: 'NSSF789012',
          pensionContribution: 5,
        },
        isActive: true,
        createdAt: '2022-01-15T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
      },
      // Add more mock employees as needed
    ];
    setEmployees(mockEmployees);
  };

  const fetchAnalyticsData = async () => {
    // Mock analytics data
    const mockAnalytics: AnalyticsData = {
      totalPayslips: 467,
      totalEmployees: 156,
      totalCost: 2340000,
      trends: {
        payslipsGenerated: [
          { month: 'Jan 2024', count: 145 },
          { month: 'Feb 2024', count: 152 },
          { month: 'Mar 2024', count: 156 },
          { month: 'Apr 2024', count: 14 }, // Partial month
        ],
        costTrends: [
          { month: 'Jan 2024', amount: 725000 },
          { month: 'Feb 2024', amount: 760000 },
          { month: 'Mar 2024', amount: 780000 },
          { month: 'Apr 2024', amount: 75000 }, // Partial month
        ],
        departmentStats: [
          { department: 'Engineering', payslips: 125, cost: 750000 },
          { department: 'Sales', payslips: 87, cost: 580000 },
          { department: 'Marketing', payslips: 45, cost: 285000 },
          { department: 'Finance', payslips: 32, cost: 210000 },
          { department: 'HR', payslips: 28, cost: 185000 },
          { department: 'Operations', payslips: 150, cost: 330000 },
        ],
      },
      recentActivity: [
        {
          id: '1',
          description: 'Bulk payslip generation completed for March 2024 (156 payslips)',
          timestamp: '2024-03-25T12:30:00Z',
          type: 'info',
        },
        {
          id: '2',
          description: 'Email distribution completed for Engineering department',
          timestamp: '2024-03-25T10:45:00Z',
          type: 'info',
        },
        {
          id: '3',
          description: 'Print job failed for 3 executive payslips - printer offline',
          timestamp: '2024-03-24T14:20:00Z',
          type: 'warning',
        },
        {
          id: '4',
          description: 'February payslips auto-archived (152 payslips)',
          timestamp: '2024-03-31T00:00:00Z',
          type: 'info',
        },
        {
          id: '5',
          description: 'Template validation failed for custom executive template',
          timestamp: '2024-03-22T16:15:00Z',
          type: 'error',
        },
      ],
    };
    setAnalyticsData(mockAnalytics);
  };

  const handleViewDetails = (entry: PayslipHistoryEntry) => {
    setSelectedEntry(entry);
    setIsDetailsDialogOpen(true);
  };

  const handleDownloadPayslip = (entry: PayslipHistoryEntry) => {
    // Mock download
    console.log('Downloading payslip:', entry.payslip.id);
    alert(`Downloading payslip for ${entry.employee.firstName} ${entry.employee.lastName}`);
  };

  const handleEmailPayslip = (entry: PayslipHistoryEntry) => {
    // Mock email
    console.log('Emailing payslip:', entry.payslip.id);
    alert(`Payslip sent to ${entry.employee.email}`);
  };

  const handlePrintPayslip = (entry: PayslipHistoryEntry) => {
    // Mock print
    console.log('Printing payslip:', entry.payslip.id);
    alert(`Printing payslip for ${entry.employee.firstName} ${entry.employee.lastName}`);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'emailed': return 'bg-green-100 text-green-800';
      case 'printed': return 'bg-purple-100 text-purple-800';
      case 'downloaded': return 'bg-orange-100 text-orange-800';
      case 'viewed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      case 'modified': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'generated': return <FileText className="h-3 w-3" />;
      case 'emailed': return <Mail className="h-3 w-3" />;
      case 'printed': return <Printer className="h-3 w-3" />;
      case 'downloaded': return <Download className="h-3 w-3" />;
      case 'viewed': return <Eye className="h-3 w-3" />;
      case 'archived': return <Archive className="h-3 w-3" />;
      case 'modified': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getDepartments = () => {
    return [...new Set(historyEntries.map(entry => entry.employee.department))];
  };

  const getPayPeriods = () => {
    return [...new Set(historyEntries.map(entry => 
      `${entry.payslip.payPeriod.startDate.slice(0, 7)}`
    ))].sort().reverse();
  };

  const filteredEntries = historyEntries.filter(entry => {
    const matchesSearch = 
      `${entry.employee.firstName} ${entry.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    const payslipDate = new Date(entry.payslip.generatedAt);
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    const matchesDateRange = payslipDate >= startDate && payslipDate <= endDate;

    const matchesDepartment = filters.departments.length === 0 || filters.departments.includes(entry.employee.department);
    const matchesEmployee = filters.employees.length === 0 || filters.employees.includes(entry.employee.id);
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'archived' && entry.compliance.archived) ||
                         (filters.status === 'active' && !entry.compliance.archived);
    
    const entryPayPeriod = entry.payslip.payPeriod.startDate.slice(0, 7);
    const matchesPayPeriod = filters.payPeriod === 'all' || filters.payPeriod === entryPayPeriod;

    const matchesActions = filters.actions.length === 0 || 
                          entry.actions.some(action => filters.actions.includes(action.action));

    return matchesSearch && matchesDateRange && matchesDepartment && 
           matchesEmployee && matchesStatus && matchesPayPeriod && matchesActions;
  });

  if (!canViewHistory) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <History className="mx-auto h-16 w-16 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to view payslip history.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator if you need access to this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payslip History</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and track all payslip activities and compliance records
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
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
                
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {getDepartments().map(dept => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={filters.departments.includes(dept)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              departments: checked
                                ? [...prev.departments, dept]
                                : prev.departments.filter(d => d !== dept)
                            }));
                          }}
                        />
                        <Label htmlFor={`dept-${dept}`} className="text-sm">{dept}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pay Period</Label>
                  <Select 
                    value={filters.payPeriod} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, payPeriod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Periods</SelectItem>
                      {getPayPeriods().map(period => (
                        <SelectItem key={period} value={period}>
                          {new Date(period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {['generated', 'emailed', 'printed', 'downloaded', 'viewed', 'archived'].map(action => (
                      <div key={action} className="flex items-center space-x-2">
                        <Checkbox
                          id={`action-${action}`}
                          checked={filters.actions.includes(action)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              actions: checked
                                ? [...prev.actions, action]
                                : prev.actions.filter(a => a !== action)
                            }));
                          }}
                        />
                        <Label htmlFor={`action-${action}`} className="text-sm capitalize">{action}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({
                    dateRange: {
                      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                      end: new Date().toISOString().split('T')[0],
                    },
                    departments: [],
                    employees: [],
                    actions: [],
                    status: 'all',
                    payPeriod: 'all',
                  })}
                >
                  Clear Filters
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {filteredEntries.length} results
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payslip History ({filteredEntries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No history found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Pay Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Statistics</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Operations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {entry.employee.firstName} {entry.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.employee.employeeNumber} • {entry.employee.department}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">
                              {new Date(entry.payslip.payPeriod.startDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(entry.payslip.generatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatKES(entry.payslip.totals.net)}</div>
                            <div className="text-xs text-gray-500">
                              Gross: {formatKES(entry.payslip.totals.gross)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.actions.slice(0, 3).map((action) => (
                              <Badge 
                                key={action.id} 
                                className={`${getActionColor(action.action)} text-xs`}
                              >
                                {getActionIcon(action.action)}
                                <span className="ml-1">{action.action}</span>
                              </Badge>
                            ))}
                            {entry.actions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.actions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>Views: {entry.statistics.views}</div>
                            <div>Downloads: {entry.statistics.downloads}</div>
                            <div>Emails: {entry.statistics.emailsSent}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.compliance.archived ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Archive className="h-3 w-3 mr-1" />
                              Archived
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(entry)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPayslip(entry)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEmailPayslip(entry)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintPayslip(entry)}
                            >
                              <Printer className="h-4 w-4" />
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

        <TabsContent value="analytics" className="space-y-6">
          {analyticsData && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Payslips</p>
                        <p className="text-2xl font-bold">{analyticsData.totalPayslips}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Employees</p>
                        <p className="text-2xl font-bold">{analyticsData.totalEmployees}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Calculator className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Cost</p>
                        <p className="text-2xl font-bold">{formatKES(analyticsData.totalCost)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Monthly Avg</p>
                        <p className="text-2xl font-bold">
                          {Math.round(analyticsData.totalPayslips / 4)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Department Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.trends.departmentStats.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Building className="h-5 w-5 text-gray-600" />
                          <div>
                            <div className="font-medium">{dept.department}</div>
                            <div className="text-sm text-gray-500">
                              {dept.payslips} payslips generated
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatKES(dept.cost)}</div>
                          <div className="text-sm text-gray-500">
                            {formatKES(Math.round(dept.cost / dept.payslips))} avg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.recentActivity.map((activity) => (
                      <div key={activity.id} className={`border-l-4 pl-4 ${
                        activity.type === 'error' ? 'border-red-500' :
                        activity.type === 'warning' ? 'border-orange-500' :
                        'border-blue-500'
                      }`}>
                        <div className="font-medium">{activity.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retention Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Data Retention Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Current Policy</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Payslip records are retained for 7 years as per Kenya Employment Act requirements.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Records:</span>
                    <span className="font-medium">
                      {historyEntries.filter(e => !e.compliance.archived).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Archived Records:</span>
                    <span className="font-medium">
                      {historyEntries.filter(e => e.compliance.archived).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Retention Period:</span>
                    <span className="font-medium">7 years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {historyEntries.reduce((sum, e) => sum + e.actions.length, 0)}
                    </div>
                    <div className="text-sm text-green-700">Total Actions</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {new Set(historyEntries.flatMap(e => e.actions.map(a => a.performedBy))).size}
                    </div>
                    <div className="text-sm text-blue-700">Unique Users</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Action Types:</div>
                  {['generated', 'emailed', 'printed', 'downloaded', 'viewed'].map(action => {
                    const count = historyEntries.reduce((sum, e) => 
                      sum + e.actions.filter(a => a.action === action).length, 0
                    );
                    return (
                      <div key={action} className="flex justify-between text-sm">
                        <span className="capitalize">{action}:</span>
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deletions */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Deletions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {historyEntries
                  .filter(e => e.compliance.scheduledDeletion)
                  .sort((a, b) => new Date(a.compliance.scheduledDeletion!).getTime() - new Date(b.compliance.scheduledDeletion!).getTime())
                  .slice(0, 5)
                  .map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {entry.employee.firstName} {entry.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(entry.payslip.payPeriod.startDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(entry.compliance.scheduledDeletion!).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.ceil((new Date(entry.compliance.scheduledDeletion!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Payslip Details: {selectedEntry?.employee.firstName} {selectedEntry?.employee.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="mt-4">
              <Tabs defaultValue="payslip">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="payslip">Payslip</TabsTrigger>
                  <TabsTrigger value="actions">Action History</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="payslip" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Employee</Label>
                      <p className="mt-1">
                        {selectedEntry.employee.firstName} {selectedEntry.employee.lastName} ({selectedEntry.employee.employeeNumber})
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Department</Label>
                      <p className="mt-1">{selectedEntry.employee.department}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Pay Period</Label>
                      <p className="mt-1">
                        {new Date(selectedEntry.payslip.payPeriod.startDate).toLocaleDateString()} - {' '}
                        {new Date(selectedEntry.payslip.payPeriod.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Pay Date</Label>
                      <p className="mt-1">{new Date(selectedEntry.payslip.payPeriod.payDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Gross Pay</div>
                        <div className="text-xl font-bold">{formatKES(selectedEntry.payslip.totals.gross)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Deductions</div>
                        <div className="text-xl font-bold text-red-600">{formatKES(selectedEntry.payslip.totals.deductions)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Net Pay</div>
                        <div className="text-xl font-bold text-green-600">{formatKES(selectedEntry.payslip.totals.net)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Views:</span> {selectedEntry.statistics.views}
                    </div>
                    <div>
                      <span className="text-gray-600">Downloads:</span> {selectedEntry.statistics.downloads}
                    </div>
                    <div>
                      <span className="text-gray-600">Emails:</span> {selectedEntry.statistics.emailsSent}
                    </div>
                    <div>
                      <span className="text-gray-600">Prints:</span> {selectedEntry.statistics.printJobs}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-3">
                    {selectedEntry.actions.map((action) => (
                      <div key={action.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${getActionColor(action.action)}`}>
                          {getActionIcon(action.action)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium capitalize">{action.action}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(action.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{action.details}</div>
                          <div className="text-xs text-gray-500">By: {action.performedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Archive Status</Label>
                      <p className="mt-1">
                        {selectedEntry.compliance.archived ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Retention Period</Label>
                      <p className="mt-1">{selectedEntry.compliance.retentionPeriod} years</p>
                    </div>
                    {selectedEntry.compliance.archivedAt && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Archived Date</Label>
                        <p className="mt-1">{new Date(selectedEntry.compliance.archivedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedEntry.compliance.scheduledDeletion && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Scheduled Deletion</Label>
                        <p className="mt-1">{new Date(selectedEntry.compliance.scheduledDeletion).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Compliance Notes</h4>
                    <p className="text-sm text-gray-600">
                      This payslip record is maintained in compliance with Kenya Employment Act 2007 requirements for payroll record retention. 
                      All access and modifications are logged for audit purposes.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
