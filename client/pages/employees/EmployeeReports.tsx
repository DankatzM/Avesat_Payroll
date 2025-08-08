import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft,
  Download,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw,
  Eye,
  Mail,
  Printer,
  Share,
  Settings,
  FileSpreadsheet,
  FileImage
} from 'lucide-react';
import { Employee, PayrollCategory, UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface ReportFilters {
  department: string;
  status: string;
  payrollCategory: string;
  hireYear: string;
  salaryRange: string;
}

interface DepartmentStats {
  department: string;
  count: number;
  avgSalary: number;
  activeEmployees: number;
  totalSalary: number;
}

interface SalaryBracket {
  range: string;
  count: number;
  percentage: number;
  minSalary: number;
  maxSalary: number;
}

interface EmploymentTimeline {
  year: string;
  hires: number;
  departures: number;
  netChange: number;
}

export default function EmployeeReports() {
  const { user, hasAnyRole } = useAuth();
  
  // Mock employee data
  const employees: Employee[] = [
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
      payrollCategory: PayrollCategory.MONTHLY,
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
    {
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
      payrollCategory: PayrollCategory.MONTHLY,
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
    {
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
      payrollCategory: PayrollCategory.MONTHLY,
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
    {
      id: '4',
      employeeNumber: 'EMP004',
      firstName: 'Mary',
      lastName: 'Achieng',
      email: 'mary.achieng@company.co.ke',
      phone: '+254 701 234 567',
      nationalId: '45678901',
      address: 'P.O. Box 321, Kisumu, Kenya',
      dateOfBirth: '1992-03-18',
      hireDate: '2023-02-01',
      position: 'HR Specialist',
      department: 'Human Resources',
      salary: 850000,
      payrollCategory: PayrollCategory.MONTHLY,
      bankDetails: {
        bankName: 'NCBA Bank',
        accountNumber: '1111222233',
        sortCode: '065000',
        accountHolderName: 'Mary Achieng',
      },
      taxInformation: {
        kraPin: 'A111222233D',
        taxCode: 'T1',
        nhifNumber: 'NHIF111222',
        nssfNumber: 'NSSF333444',
        pensionContribution: 5,
      },
      isActive: true,
      createdAt: '2023-02-01T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
    },
    {
      id: '5',
      employeeNumber: 'EMP005',
      firstName: 'Peter',
      lastName: 'Kiprotich',
      email: 'peter.kiprotich@company.co.ke',
      phone: '+254 789 456 123',
      nationalId: '56789012',
      address: 'P.O. Box 654, Eldoret, Kenya',
      dateOfBirth: '1987-11-25',
      hireDate: '2019-09-15',
      position: 'Finance Manager',
      department: 'Finance',
      salary: 1100000,
      payrollCategory: PayrollCategory.MONTHLY,
      bankDetails: {
        bankName: 'Standard Chartered',
        accountNumber: '4444555566',
        sortCode: '020000',
        accountHolderName: 'Peter Kiprotich',
      },
      taxInformation: {
        kraPin: 'A444555566E',
        taxCode: 'T2',
        nhifNumber: 'NHIF444555',
        nssfNumber: 'NSSF666777',
        pensionContribution: 7,
      },
      isActive: true,
      createdAt: '2019-09-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
    },
    {
      id: '6',
      employeeNumber: 'EMP006',
      firstName: 'Alice',
      lastName: 'Nyong\'o',
      email: 'alice.nyongo@company.co.ke',
      phone: '+254 711 987 654',
      nationalId: '67890123',
      address: 'P.O. Box 987, Nakuru, Kenya',
      dateOfBirth: '1991-07-14',
      hireDate: '2021-11-20',
      position: 'Operations Coordinator',
      department: 'Operations',
      salary: 750000,
      payrollCategory: PayrollCategory.MONTHLY,
      bankDetails: {
        bankName: 'Diamond Trust Bank',
        accountNumber: '7777888899',
        sortCode: '063000',
        accountHolderName: 'Alice Nyong\'o',
      },
      taxInformation: {
        kraPin: 'A777888899F',
        taxCode: 'T1',
        nhifNumber: 'NHIF777888',
        nssfNumber: 'NSSF999000',
        pensionContribution: 4,
      },
      isActive: false,
      createdAt: '2021-11-20T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
    }
  ];

  // State management
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    department: 'all',
    status: 'all',
    payrollCategory: 'all',
    hireYear: 'all',
    salaryRange: 'all'
  });

  // Filter options
  const departments = ['all', ...new Set(employees.map(emp => emp.department))];
  const hireYears = ['all', ...Array.from(new Set(employees.map(emp => new Date(emp.hireDate).getFullYear().toString()))).sort((a, b) => b.localeCompare(a))];
  const salaryRanges = [
    'all',
    '0-500000',
    '500001-800000',
    '800001-1000000',
    '1000001-1500000',
    '1500001+'
  ];

  // Filter employees based on current filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (filters.department !== 'all' && emp.department !== filters.department) return false;
      if (filters.status !== 'all' && ((filters.status === 'active') !== emp.isActive)) return false;
      if (filters.payrollCategory !== 'all' && emp.payrollCategory !== filters.payrollCategory) return false;
      if (filters.hireYear !== 'all' && new Date(emp.hireDate).getFullYear().toString() !== filters.hireYear) return false;
      
      if (filters.salaryRange !== 'all') {
        const salary = emp.salary;
        switch (filters.salaryRange) {
          case '0-500000':
            if (salary > 500000) return false;
            break;
          case '500001-800000':
            if (salary <= 500000 || salary > 800000) return false;
            break;
          case '800001-1000000':
            if (salary <= 800000 || salary > 1000000) return false;
            break;
          case '1000001-1500000':
            if (salary <= 1000000 || salary > 1500000) return false;
            break;
          case '1500001+':
            if (salary <= 1500000) return false;
            break;
        }
      }
      
      return true;
    });
  }, [employees, filters]);

  // Calculate department statistics
  const departmentStats: DepartmentStats[] = useMemo(() => {
    const departmentMap = new Map<string, {
      employees: Employee[];
      activeCount: number;
      totalSalary: number;
    }>();

    filteredEmployees.forEach(emp => {
      if (!departmentMap.has(emp.department)) {
        departmentMap.set(emp.department, {
          employees: [],
          activeCount: 0,
          totalSalary: 0
        });
      }
      
      const dept = departmentMap.get(emp.department)!;
      dept.employees.push(emp);
      if (emp.isActive) dept.activeCount++;
      dept.totalSalary += emp.salary;
    });

    return Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      count: data.employees.length,
      avgSalary: data.employees.length > 0 ? data.totalSalary / data.employees.length : 0,
      activeEmployees: data.activeCount,
      totalSalary: data.totalSalary
    })).sort((a, b) => b.count - a.count);
  }, [filteredEmployees]);

  // Calculate salary brackets
  const salaryBrackets: SalaryBracket[] = useMemo(() => {
    const brackets = [
      { range: 'KES 0 - 500K', min: 0, max: 500000 },
      { range: 'KES 500K - 800K', min: 500001, max: 800000 },
      { range: 'KES 800K - 1M', min: 800001, max: 1000000 },
      { range: 'KES 1M - 1.5M', min: 1000001, max: 1500000 },
      { range: 'KES 1.5M+', min: 1500001, max: Infinity }
    ];

    const totalEmployees = filteredEmployees.length;

    return brackets.map(bracket => {
      const count = filteredEmployees.filter(emp => 
        emp.salary >= bracket.min && emp.salary <= bracket.max
      ).length;

      return {
        range: bracket.range,
        count,
        percentage: totalEmployees > 0 ? (count / totalEmployees) * 100 : 0,
        minSalary: bracket.min,
        maxSalary: bracket.max
      };
    });
  }, [filteredEmployees]);

  // Calculate employment timeline
  const employmentTimeline: EmploymentTimeline[] = useMemo(() => {
    const timelineMap = new Map<string, { hires: number; departures: number }>();
    
    // Initialize years
    const years = new Set<string>();
    employees.forEach(emp => {
      years.add(new Date(emp.hireDate).getFullYear().toString());
    });

    years.forEach(year => {
      timelineMap.set(year, { hires: 0, departures: 0 });
    });

    // Count hires
    employees.forEach(emp => {
      const year = new Date(emp.hireDate).getFullYear().toString();
      const yearData = timelineMap.get(year);
      if (yearData) {
        yearData.hires++;
      }
    });

    // Mock departures (in real app, would come from database)
    timelineMap.set('2020', { ...timelineMap.get('2020')!, departures: 0 });
    timelineMap.set('2021', { ...timelineMap.get('2021')!, departures: 1 });
    timelineMap.set('2022', { ...timelineMap.get('2022')!, departures: 0 });
    timelineMap.set('2023', { ...timelineMap.get('2023')!, departures: 2 });

    return Array.from(timelineMap.entries())
      .map(([year, data]) => ({
        year,
        hires: data.hires,
        departures: data.departures,
        netChange: data.hires - data.departures
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [employees]);

  // Export functions
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '')];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportDepartmentReport = () => {
    const data = departmentStats.map(dept => ({
      department: dept.department,
      totalemployees: dept.count,
      activeemployees: dept.activeEmployees,
      averagesalary: dept.avgSalary,
      totalsalary: dept.totalSalary
    }));
    
    exportToCSV(
      data, 
      'department-report', 
      ['Department', 'Total Employees', 'Active Employees', 'Average Salary', 'Total Salary']
    );
  };

  const exportSalaryReport = () => {
    const data = salaryBrackets.map(bracket => ({
      salaryrange: bracket.range,
      employeecount: bracket.count,
      percentage: `${bracket.percentage.toFixed(1)}%`
    }));
    
    exportToCSV(
      data,
      'salary-analysis-report',
      ['Salary Range', 'Employee Count', 'Percentage']
    );
  };

  const exportDetailedReport = () => {
    const data = filteredEmployees.map(emp => ({
      employeenumber: emp.employeeNumber,
      fullname: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      position: emp.position,
      salary: emp.salary,
      hiredate: emp.hireDate,
      status: emp.isActive ? 'Active' : 'Inactive',
      email: emp.email,
      phone: emp.phone
    }));
    
    exportToCSV(
      data,
      'detailed-employee-report',
      ['Employee Number', 'Full Name', 'Department', 'Position', 'Salary', 'Hire Date', 'Status', 'Email', 'Phone']
    );
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      department: 'all',
      status: 'all',
      payrollCategory: 'all',
      hireYear: 'all',
      salaryRange: 'all'
    });
  };

  // Refresh data
  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Check permissions
  const canViewReports = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER]);

  if (!canViewReports) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view employee reports.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Reports</h1>
            <p className="text-gray-600">Comprehensive analytics and reporting for employee data</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportDetailedReport}>
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <Select value={filters.department} onValueChange={(value) => setFilters({...filters, department: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.hireYear} onValueChange={(value) => setFilters({...filters, hireYear: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                {hireYears.map(year => (
                  <SelectItem key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.salaryRange} onValueChange={(value) => setFilters({...filters, salaryRange: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Salaries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salary Ranges</SelectItem>
                <SelectItem value="0-500000">KES 0 - 500K</SelectItem>
                <SelectItem value="500001-800000">KES 500K - 800K</SelectItem>
                <SelectItem value="800001-1000000">KES 800K - 1M</SelectItem>
                <SelectItem value="1000001-1500000">KES 1M - 1.5M</SelectItem>
                <SelectItem value="1500001+">KES 1.5M+</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing data for {filteredEmployees.length} of {employees.length} employees
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{filteredEmployees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredEmployees.length > 0 ? Math.round((filteredEmployees.filter(emp => emp.isActive).length / filteredEmployees.length) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
                <p className="text-xl font-bold text-indigo-600">
                  {formatKES(filteredEmployees.length > 0 ? filteredEmployees.reduce((sum, emp) => sum + emp.salary, 0) / filteredEmployees.length : 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-purple-600">{departmentStats.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="department" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="department">Department Analysis</TabsTrigger>
          <TabsTrigger value="salary">Salary Analysis</TabsTrigger>
          <TabsTrigger value="timeline">Employment Timeline</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
        </TabsList>

        {/* Department Analysis */}
        <TabsContent value="department">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Department Analysis Report
              </CardTitle>
              <Button variant="outline" onClick={exportDepartmentReport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Total Employees</TableHead>
                    <TableHead>Active Employees</TableHead>
                    <TableHead>Average Salary</TableHead>
                    <TableHead>Total Salary Cost</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((dept) => (
                    <TableRow key={dept.department}>
                      <TableCell className="font-medium">{dept.department}</TableCell>
                      <TableCell>{dept.count}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2">{dept.activeEmployees}</span>
                          <Badge variant={dept.activeEmployees === dept.count ? "default" : "secondary"}>
                            {Math.round((dept.activeEmployees / dept.count) * 100)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatKES(dept.avgSalary)}</TableCell>
                      <TableCell className="font-medium">{formatKES(dept.totalSalary)}</TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(dept.activeEmployees / dept.count) * 100}%` }}
                          ></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {departmentStats.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
                  <p className="text-gray-600">Adjust your filters to see department data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Analysis */}
        <TabsContent value="salary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Salary Distribution Analysis
              </CardTitle>
              <Button variant="outline" onClick={exportSalaryReport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Salary Brackets Table */}
                <div>
                  <h4 className="font-medium mb-4">Salary Brackets</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Salary Range</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryBrackets.map((bracket, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{bracket.range}</TableCell>
                          <TableCell>{bracket.count}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">{bracket.percentage.toFixed(1)}%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${bracket.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Salary Statistics */}
                <div>
                  <h4 className="font-medium mb-4">Salary Statistics</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Highest Salary</div>
                      <div className="text-xl font-bold text-blue-800">
                        {formatKES(Math.max(...filteredEmployees.map(emp => emp.salary)))}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Average Salary</div>
                      <div className="text-xl font-bold text-green-800">
                        {formatKES(filteredEmployees.reduce((sum, emp) => sum + emp.salary, 0) / filteredEmployees.length || 0)}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-600">Lowest Salary</div>
                      <div className="text-xl font-bold text-orange-800">
                        {formatKES(Math.min(...filteredEmployees.map(emp => emp.salary)))}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Total Salary Cost</div>
                      <div className="text-xl font-bold text-purple-800">
                        {formatKES(filteredEmployees.reduce((sum, emp) => sum + emp.salary, 0))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Employment Timeline Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>New Hires</TableHead>
                    <TableHead>Departures</TableHead>
                    <TableHead>Net Change</TableHead>
                    <TableHead>Growth Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employmentTimeline.map((timeline) => (
                    <TableRow key={timeline.year}>
                      <TableCell className="font-medium">{timeline.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                          {timeline.hires}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-red-500 rotate-180" />
                          {timeline.departures}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={timeline.netChange >= 0 ? "default" : "destructive"}>
                          {timeline.netChange >= 0 ? '+' : ''}{timeline.netChange}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {timeline.netChange >= 0 ? 'Growth' : 'Decline'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Report */}
        <TabsContent value="detailed">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Detailed Employee Report
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={exportDetailedReport}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{employee.employeeNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{new Date(employee.hireDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{formatKES(employee.salary)}</TableCell>
                      <TableCell>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/employees/profile?id=${employee.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                  <p className="text-gray-600">
                    Try adjusting your filters to see employee data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
