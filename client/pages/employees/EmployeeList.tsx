import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  UserPlus,
  FileText,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Filter as FilterIcon
} from 'lucide-react';
import { Employee, PayrollCategory, UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

type ViewMode = 'table' | 'grid';
type SortField = 'name' | 'department' | 'position' | 'salary' | 'hireDate';
type SortDirection = 'asc' | 'desc';

interface EmployeeListFilters {
  search: string;
  department: string;
  status: string;
  payrollCategory: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export default function EmployeeList() {
  const { user, hasAnyRole } = useAuth();
  
  // Mock employee data
  const [employees] = useState<Employee[]>([
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
  ]);

  // State management
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Filter state
  const [filters, setFilters] = useState<EmployeeListFilters>({
    search: '',
    department: 'all',
    status: 'all',
    payrollCategory: 'all',
    sortField: 'name',
    sortDirection: 'asc'
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    departments: 0,
    averageSalary: 0
  });

  // Initialize statistics from mock data
  const initializeStatistics = () => {
    const activeEmployees = employees.filter(emp => emp.isActive);
    const departments = new Set(employees.map(emp => emp.department));
    const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);

    setStatistics({
      total: employees.length,
      active: activeEmployees.length,
      inactive: employees.length - activeEmployees.length,
      departments: departments.size,
      averageSalary: employees.length > 0 ? totalSalary / employees.length : 0
    });

    setFilteredEmployees(employees);
  };

  // Mock refresh function for UI consistency
  const loadEmployees = () => {
    setLoading(true);
    setError(null);

    // Simulate API delay
    setTimeout(() => {
      initializeStatistics();
      setLoading(false);
    }, 500);
  };

  // Filter and sort employees
  useEffect(() => {
    let filtered = [...employees];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm) ||
        emp.lastName.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.employeeNumber.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm) ||
        emp.department.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(emp => emp.department === filters.department);
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(emp => 
        filters.status === 'active' ? emp.isActive : !emp.isActive
      );
    }
    
    // Apply payroll category filter
    if (filters.payrollCategory !== 'all') {
      filtered = filtered.filter(emp => emp.payrollCategory === filters.payrollCategory);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'department':
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;
        case 'position':
          aValue = a.position.toLowerCase();
          bValue = b.position.toLowerCase();
          break;
        case 'salary':
          aValue = a.salary;
          bValue = b.salary;
          break;
        case 'hireDate':
          aValue = new Date(a.hireDate);
          bValue = new Date(b.hireDate);
          break;
        default:
          aValue = a.firstName.toLowerCase();
          bValue = b.firstName.toLowerCase();
      }
      
      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredEmployees(filtered);
  }, [employees, filters]);

  // Update filter
  const updateFilter = (key: keyof EmployeeListFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (filters.sortField === field) {
      updateFilter('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      updateFilter('sortField', field);
      updateFilter('sortDirection', 'asc');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      department: 'all',
      status: 'all',
      payrollCategory: 'all',
      sortField: 'name',
      sortDirection: 'asc'
    });
  };

  // Handle employee deletion
  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }
    
    try {
      const employeeToDelete = employees.find(emp => emp.id === employeeId);
      await employeeService.deleteEmployee(employeeId);
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      
      // Log audit action
      if (employeeToDelete) {
        logEmployeeAction(
          {
            userId: user?.id || 'unknown',
            userAgent: navigator.userAgent,
            ipAddress: '127.0.0.1'
          },
          AuditAction.DELETE,
          employeeId,
          {
            firstName: employeeToDelete.firstName,
            lastName: employeeToDelete.lastName,
            employeeNumber: employeeToDelete.employeeNumber
          },
          undefined
        );
      }
    } catch (err) {
      alert(handleAPIError(err));
    }
  };

  // Export employees data
  const exportEmployees = () => {
    const csvData = filteredEmployees.map(emp => ({
      'Employee Number': emp.employeeNumber,
      'First Name': emp.firstName,
      'Last Name': emp.lastName,
      'Email': emp.email,
      'Phone': emp.phone,
      'Department': emp.department,
      'Position': emp.position,
      'Salary': emp.salary,
      'Hire Date': emp.hireDate,
      'Status': emp.isActive ? 'Active' : 'Inactive'
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get unique departments and payroll categories
  const departments = ['all', ...new Set(employees.map(emp => emp.department))];
  const payrollCategories = ['all', ...Object.values(PayrollCategory)];

  // Check permissions
  const canManageEmployees = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER]);
  const canViewEmployees = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER]);

  // Load data on mount
  useEffect(() => {
    if (canViewEmployees) {
      loadEmployees();
    }
  }, [canViewEmployees]);

  if (!canViewEmployees) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view employee information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button onClick={loadEmployees} variant="outline" size="sm" className="ml-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee List</h1>
          <p className="text-gray-600">View and manage all employee records</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" onClick={loadEmployees} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportEmployees}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canManageEmployees && (
            <>
              <Link to="/employees/import">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              </Link>
              <Link to="/employees/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{statistics.inactive}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold">{statistics.departments}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
                <p className="text-lg font-bold">{formatKES(statistics.averageSalary)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and View Mode */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees by name, email, position, or department..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={filters.department} onValueChange={(value) => updateFilter('department', value)}>
                <SelectTrigger className="w-48">
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

              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.payrollCategory} onValueChange={(value) => updateFilter('payrollCategory', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pay Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {payrollCategories.filter(cat => cat !== 'all').map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                <FilterIcon className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredEmployees.length} of {employees.length} employees
              </span>
              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <Select value={filters.sortField} onValueChange={(value: SortField) => updateFilter('sortField', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="hireDate">Hire Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {filters.sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List - Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center">
                      Employee
                      {filters.sortField === 'name' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('department')}
                  >
                    <div className="flex items-center">
                      Department
                      {filters.sortField === 'department' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('position')}
                  >
                    <div className="flex items-center">
                      Position
                      {filters.sortField === 'position' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('salary')}
                  >
                    <div className="flex items-center">
                      Salary
                      {filters.sortField === 'salary' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {employee.firstName[0]}{employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {employee.employeeNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {employee.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {employee.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.department}</Badge>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="font-medium">
                      {formatKES(employee.salary)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/employees/profile?id=${employee.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {canManageEmployees && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link to={`/employees/edit?id=${employee.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(employee.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-600 mb-4">
                  {filters.search || filters.department !== 'all' || filters.status !== 'all' || filters.payrollCategory !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Get started by adding your first employee'
                  }
                </p>
                {canManageEmployees && (!filters.search && filters.department === 'all' && filters.status === 'all' && filters.payrollCategory === 'all') && (
                  <Link to="/employees/add">
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add First Employee
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Employee List - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium text-lg">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{employee.employeeNumber}</p>
                  </div>
                  
                  <div className="w-full space-y-2">
                    <Badge variant="outline" className="w-full justify-center">
                      {employee.department}
                    </Badge>
                    <p className="text-sm font-medium">{employee.position}</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatKES(employee.salary)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between w-full">
                    <Badge variant={employee.isActive ? "default" : "secondary"}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/employees/profile?id=${employee.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canManageEmployees && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to={`/employees/edit?id=${employee.id}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(employee.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.department !== 'all' || filters.status !== 'all' || filters.payrollCategory !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'Get started by adding your first employee'
                }
              </p>
              {canManageEmployees && (!filters.search && filters.department === 'all' && filters.status === 'all' && filters.payrollCategory === 'all') && (
                <Link to="/employees/add">
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Employee
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
