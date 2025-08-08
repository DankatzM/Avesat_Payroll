import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  UserPlus
} from 'lucide-react';
import { Employee, PayrollCategory, UserRole } from '@shared/api';
import { employeeService, handleAPIError, LoadingManager } from '@shared/data-service';
import { formatKES } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  position: string;
  department: string;
  salary: number;
  payrollCategory: PayrollCategory;
  bankName: string;
  accountNumber: string;
  sortCode: string;
  accountHolderName: string;
  kraPin: string;
  taxCode: string;
  nhifNumber: string;
  nssfNumber: string;
  pensionContribution: number;
}

const Employees: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    address: '',
    dateOfBirth: '',
    hireDate: '',
    position: '',
    department: '',
    salary: 0,
    payrollCategory: PayrollCategory.MONTHLY,
    bankName: '',
    accountNumber: '',
    sortCode: '',
    accountHolderName: '',
    kraPin: '',
    taxCode: '',
    nhifNumber: '',
    nssfNumber: '',
    pensionContribution: 0
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load employees
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      LoadingManager.start('employees');
      
      const employeeData = await employeeService.getEmployees();
      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
      LoadingManager.stop('employees');
    }
  };

  // Filter employees
  useEffect(() => {
    let filtered = [...employees];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => 
        statusFilter === 'active' ? emp.isActive : !emp.isActive
      );
    }
    
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.nationalId.trim()) errors.nationalId = 'National ID is required';
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.department) errors.department = 'Department is required';
    if (formData.salary <= 0) errors.salary = 'Salary must be greater than 0';
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // National ID validation (Kenya format)
    if (formData.nationalId && !/^\d{8}$/.test(formData.nationalId)) {
      errors.nationalId = 'National ID must be 8 digits';
    }
    
    // Phone validation (Kenya format)
    if (formData.phone && !/^(\+254|0)[17]\d{8}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid Kenyan phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      address: '',
      dateOfBirth: '',
      hireDate: '',
      position: '',
      department: '',
      salary: 0,
      payrollCategory: PayrollCategory.MONTHLY,
      bankName: '',
      accountNumber: '',
      sortCode: '',
      accountHolderName: '',
      kraPin: '',
      taxCode: '',
      nhifNumber: '',
      nssfNumber: '',
      pensionContribution: 0
    });
    setFormErrors({});
    setEditingEmployee(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const employeeData = {
        ...formData,
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          sortCode: formData.sortCode,
          accountHolderName: formData.accountHolderName,
        },
        taxInformation: {
          kraPin: formData.kraPin,
          taxCode: formData.taxCode,
          nhifNumber: formData.nhifNumber,
          nssfNumber: formData.nssfNumber,
          pensionContribution: formData.pensionContribution,
        }
      };

      if (editingEmployee) {
        // Update existing employee
        const updatedEmployee = await employeeService.updateEmployee(editingEmployee.id, employeeData);
        setEmployees(employees.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp));
        
        // Log audit action
        logEmployeeAction(
          {
            userId: user?.id || 'unknown',
            userAgent: navigator.userAgent,
            ipAddress: '127.0.0.1'
          },
          AuditAction.UPDATE,
          editingEmployee.id,
          {
            firstName: editingEmployee.firstName,
            lastName: editingEmployee.lastName,
            salary: editingEmployee.salary
          },
          {
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            salary: employeeData.salary
          }
        );
        
        setIsEditDialogOpen(false);
      } else {
        // Create new employee
        const newEmployee = await employeeService.createEmployee(employeeData);
        setEmployees([...employees, newEmployee]);
        
        // Log audit action
        logEmployeeAction(
          {
            userId: user?.id || 'unknown',
            userAgent: navigator.userAgent,
            ipAddress: '127.0.0.1'
          },
          AuditAction.CREATE,
          newEmployee.id,
          undefined,
          {
            firstName: newEmployee.firstName,
            lastName: newEmployee.lastName,
            employeeNumber: newEmployee.employeeNumber
          }
        );
        
        setIsAddDialogOpen(false);
      }
      
      resetForm();
    } catch (err) {
      alert(handleAPIError(err));
    } finally {
      setIsSubmitting(false);
    }
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

  // Handle edit
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      nationalId: employee.nationalId,
      address: employee.address,
      dateOfBirth: employee.dateOfBirth,
      hireDate: employee.hireDate,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
      payrollCategory: employee.payrollCategory,
      bankName: employee.bankDetails.bankName,
      accountNumber: employee.bankDetails.accountNumber,
      sortCode: employee.bankDetails.sortCode,
      accountHolderName: employee.bankDetails.accountHolderName,
      kraPin: employee.taxInformation.kraPin,
      taxCode: employee.taxInformation.taxCode,
      nhifNumber: employee.taxInformation.nhifNumber || '',
      nssfNumber: employee.taxInformation.nssfNumber || '',
      pensionContribution: employee.taxInformation.pensionContribution
    });
    setIsEditDialogOpen(true);
  };

  // Handle view
  const handleView = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsViewDialogOpen(true);
  };

  // Get unique departments for filter
  const departments = ['all', ...new Set(employees.map(emp => emp.department))];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage employee information and records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEmployees} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canManageEmployees && (
            <>
              <Link to="/employees/import">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              </Link>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter(emp => emp.isActive).length}
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
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold">{departments.length - 1}</p>
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
                <p className="text-2xl font-bold">
                  {formatKES(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
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

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Salary</TableHead>
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
                        <DropdownMenuItem onClick={() => handleView(employee)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canManageEmployees && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(employee)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
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
                {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first employee'
                }
              </p>
              {canManageEmployees && (!searchTerm && departmentFilter === 'all' && statusFilter === 'all') && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Employee
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className={formErrors.firstName ? 'border-red-500' : ''}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className={formErrors.lastName ? 'border-red-500' : ''}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254700123456"
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="nationalId">National ID *</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                    placeholder="12345678"
                    className={formErrors.nationalId ? 'border-red-500' : ''}
                  />
                  {formErrors.nationalId && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.nationalId}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className={formErrors.position ? 'border-red-500' : ''}
                  />
                  {formErrors.position && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.position}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({...formData, department: value})}
                  >
                    <SelectTrigger className={formErrors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Information Technology">Information Technology</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.department && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.department}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="salary">Monthly Salary (KES) *</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                    className={formErrors.salary ? 'border-red-500' : ''}
                  />
                  {formErrors.salary && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.salary}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {editingEmployee ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingEmployee ? 'Update Employee' : 'Create Employee'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          
          {viewingEmployee && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-xl">
                    {viewingEmployee.firstName[0]}{viewingEmployee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">
                    {viewingEmployee.firstName} {viewingEmployee.lastName}
                  </h3>
                  <p className="text-gray-600">{viewingEmployee.position}</p>
                  <p className="text-sm text-gray-500">{viewingEmployee.employeeNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingEmployee.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingEmployee.phone}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingEmployee.address || 'No address provided'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Employment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingEmployee.department}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      {formatKES(viewingEmployee.salary)} / month
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      Hired: {new Date(viewingEmployee.hireDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Badge variant={viewingEmployee.isActive ? "default" : "secondary"}>
                    {viewingEmployee.isActive ? 'Active Employee' : 'Inactive Employee'}
                  </Badge>
                  {canManageEmployees && (
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEdit(viewingEmployee);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
