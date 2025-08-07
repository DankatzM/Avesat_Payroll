import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { Employee, PayrollCategory, UserRole } from '@shared/api';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string; // Kenya National ID
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
  kraPin: string; // Kenya Revenue Authority PIN
  taxCode: string;
  nhifNumber: string;
  nssfNumber: string;
  pensionContribution: number;
}

interface ValidationErrors {
  [key: string]: string;
}

interface EmployeeCredentials {
  employeeId: string;
  email: string;
  temporaryPassword: string;
}

export default function Employees() {
  const { hasAnyRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState<EmployeeCredentials | null>(null);

  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    address: '',
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0], // Default to today
    position: '',
    department: '',
    salary: 0,
    payrollCategory: PayrollCategory.MONTHLY,
    bankName: '',
    accountNumber: '',
    sortCode: '',
    accountHolderName: '',
    kraPin: '',
    taxCode: 'T1', // Default tax code
    nhifNumber: '',
    nssfNumber: '',
    pensionContribution: 5, // Default 5%
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      // Mock data for demonstration
      const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Mwangi',
          email: 'john.mwangi@company.co.ke',
          phone: '+254 712 345 678',
          address: 'P.O. Box 123, Nairobi, Kenya',
          dateOfBirth: '1990-05-15',
          hireDate: '2022-01-15',
          position: 'Software Engineer',
          department: 'Engineering',
          salary: 1200000, // KES 1.2M annually
          payrollCategory: PayrollCategory.MONTHLY,
          bankDetails: {
            bankName: 'Equity Bank',
            accountNumber: '1234567890',
            sortCode: '680000', // Equity Bank sort code
            accountHolderName: 'John Mwangi',
          },
          taxInformation: {
            taxNumber: 'A123456789A', // KRA PIN format
            taxCode: 'T1',
            isStudentLoan: false,
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
          address: 'P.O. Box 456, Nairobi, Kenya',
          dateOfBirth: '1988-08-22',
          hireDate: '2021-06-01',
          position: 'Marketing Manager',
          department: 'Marketing',
          salary: 950000, // KES 950K annually
          payrollCategory: PayrollCategory.MONTHLY,
          bankDetails: {
            bankName: 'KCB Bank',
            accountNumber: '9876543210',
            sortCode: '010000', // KCB sort code
            accountHolderName: 'Grace Wanjiku',
          },
          taxInformation: {
            taxNumber: 'A987654321B', // KRA PIN format
            taxCode: 'T1',
            isStudentLoan: false,
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
          address: 'P.O. Box 789, Mombasa, Kenya',
          dateOfBirth: '1985-12-10',
          hireDate: '2020-03-15',
          position: 'Sales Director',
          department: 'Sales',
          salary: 1500000, // KES 1.5M annually
          payrollCategory: PayrollCategory.MONTHLY,
          bankDetails: {
            bankName: 'Cooperative Bank',
            accountNumber: '5555555555',
            sortCode: '070000', // Co-op Bank sort code
            accountHolderName: 'Samuel Otieno',
          },
          taxInformation: {
            taxNumber: 'A555555555C', // KRA PIN format
            taxCode: 'T2',
            isStudentLoan: false,
            pensionContribution: 8,
          },
          isActive: true,
          createdAt: '2020-03-15T00:00:00Z',
          updatedAt: '2024-03-15T00:00:00Z',
        },
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const departments = ['all', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.employeeNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      address: '',
      dateOfBirth: '',
      hireDate: new Date().toISOString().split('T')[0],
      position: '',
      department: '',
      salary: 0,
      payrollCategory: PayrollCategory.MONTHLY,
      bankName: '',
      accountNumber: '',
      sortCode: '',
      accountHolderName: '',
      kraPin: '',
      taxCode: 'T1',
      nhifNumber: '',
      nssfNumber: '',
      pensionContribution: 5,
    });
    setValidationErrors({});
    setNewEmployeeCredentials(null);
    setShowSuccessMessage(false);
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateKenyanNationalId = (id: string): boolean => {
    // Kenyan National ID format: 8 digits
    const idRegex = /^\d{8}$/;
    return idRegex.test(id);
  };

  const validateKenyanPhone = (phone: string): boolean => {
    // Kenyan phone format: +254 followed by 9 digits or 07/01 followed by 8 digits
    const phoneRegex = /^(\+254\d{9}|0[17]\d{8})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const validateKraPin = (pin: string): boolean => {
    // KRA PIN format: Letter + 9 digits + Letter
    const pinRegex = /^[A-Z]\d{9}[A-Z]$/;
    return pinRegex.test(pin.toUpperCase());
  };

  const checkForDuplicates = (email: string, nationalId: string): { isDuplicate: boolean; field: string } => {
    const duplicateEmail = employees.find(emp =>
      emp.email.toLowerCase() === email.toLowerCase() && emp.id !== editingEmployee?.id
    );

    const duplicateNationalId = employees.find(emp =>
      emp.nationalId === nationalId && emp.id !== editingEmployee?.id
    );

    if (duplicateEmail) return { isDuplicate: true, field: 'email' };
    if (duplicateNationalId) return { isDuplicate: true, field: 'nationalId' };

    return { isDuplicate: false, field: '' };
  };

  const generateEmployeeCredentials = (): EmployeeCredentials => {
    const employeeId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    const email = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@company.co.ke`;
    const temporaryPassword = `Temp${Math.random().toString(36).substring(2, 8)}!`;

    return { employeeId, email, temporaryPassword };
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Required field validation
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.nationalId.trim()) errors.nationalId = 'National ID is required';
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.department.trim()) errors.department = 'Department is required';
    if (!formData.salary || formData.salary <= 0) errors.salary = 'Valid salary is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.hireDate) errors.hireDate = 'Hire date is required';
    if (!formData.bankName.trim()) errors.bankName = 'Bank name is required';
    if (!formData.accountNumber.trim()) errors.accountNumber = 'Account number is required';
    if (!formData.sortCode.trim()) errors.sortCode = 'Bank code is required';
    if (!formData.accountHolderName.trim()) errors.accountHolderName = 'Account holder name is required';
    if (!formData.kraPin.trim()) errors.kraPin = 'KRA PIN is required';

    // Format validation
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.nationalId && !validateKenyanNationalId(formData.nationalId)) {
      errors.nationalId = 'Please enter a valid 8-digit Kenyan National ID';
    }

    if (formData.phone && !validateKenyanPhone(formData.phone)) {
      errors.phone = 'Please enter a valid Kenyan phone number (+254XXXXXXXXX or 07XXXXXXXX/01XXXXXXXX)';
    }

    if (formData.kraPin && !validateKraPin(formData.kraPin)) {
      errors.kraPin = 'Please enter a valid KRA PIN (format: A123456789B)';
    }

    // Age validation (must be at least 18)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (age < 18 || (age === 18 && monthDiff < 0)) {
        errors.dateOfBirth = 'Employee must be at least 18 years old';
      }
    }

    // Hire date validation (not in the future)
    if (formData.hireDate) {
      const hireDate = new Date(formData.hireDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (hireDate > today) {
        errors.hireDate = 'Hire date cannot be in the future';
      }
    }

    // Salary validation (reasonable range for Kenya)
    if (formData.salary && (formData.salary < 10000 || formData.salary > 10000000)) {
      errors.salary = 'Salary must be between KES 10,000 and KES 10,000,000';
    }

    // Check for duplicates
    const duplicateCheck = checkForDuplicates(formData.email, formData.nationalId);
    if (duplicateCheck.isDuplicate) {
      if (duplicateCheck.field === 'email') {
        errors.email = 'An employee with this email already exists';
      }
      if (duplicateCheck.field === 'nationalId') {
        errors.nationalId = 'An employee with this National ID already exists';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate credentials for new employee
      const credentials = editingEmployee ? null : generateEmployeeCredentials();

      // In real app, make API call
      console.log('Submitting employee data:', formData);

      // Mock success
      const newEmployee: Employee = {
        id: editingEmployee?.id || Date.now().toString(),
        employeeNumber: editingEmployee?.employeeNumber || credentials!.employeeId,
        nationalId: formData.nationalId,
        ...formData,
        email: credentials?.email || formData.email,
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
        },
        isActive: true,
        createdAt: editingEmployee?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingEmployee) {
        // Update existing employee
        setEmployees(employees.map(emp => emp.id === editingEmployee.id ? newEmployee : emp));
        setIsEditDialogOpen(false);
      } else {
        // Add new employee
        setEmployees([...employees, newEmployee]);
        setNewEmployeeCredentials(credentials!);
        setShowSuccessMessage(true);
        setIsAddDialogOpen(false);
      }

      resetForm();
    } catch (error) {
      console.error('Failed to create employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
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
      taxNumber: employee.taxInformation.taxNumber,
      taxCode: employee.taxInformation.taxCode,
      isStudentLoan: employee.taxInformation.isStudentLoan,
      pensionContribution: employee.taxInformation.pensionContribution,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        // In real app, make API call
        setEmployees(employees.filter(emp => emp.id !== employeeId));
      } catch (error) {
        console.error('Failed to delete employee:', error);
      }
    }
  };

  const canManageEmployees = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const EmployeeForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+254 712 345 678 or 0712 345 678"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className={validationErrors.phone ? 'border-red-500' : ''}
              required
            />
            {validationErrors.phone && (
              <p className="text-sm text-red-600">{validationErrors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              placeholder="12345678"
              value={formData.nationalId}
              onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
              className={validationErrors.nationalId ? 'border-red-500' : ''}
              required
            />
            {validationErrors.nationalId && (
              <p className="text-sm text-red-600">{validationErrors.nationalId}</p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
              required
            />
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Employment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({...formData, department: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.filter(dept => dept !== 'all').map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Annual Salary</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payrollCategory">Payroll Category</Label>
            <Select
              value={formData.payrollCategory}
              onValueChange={(value) => setFormData({...formData, payrollCategory: value as PayrollCategory})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PayrollCategory.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={PayrollCategory.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={PayrollCategory.HOURLY}>Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              value={formData.accountHolderName}
              onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortCode">Bank Code</Label>
            <Input
              id="sortCode"
              value={formData.sortCode}
              onChange={(e) => setFormData({...formData, sortCode: e.target.value})}
              required
            />
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tax Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kraPin">KRA PIN</Label>
            <Input
              id="kraPin"
              placeholder="A123456789B"
              value={formData.kraPin}
              onChange={(e) => setFormData({...formData, kraPin: e.target.value.toUpperCase()})}
              className={validationErrors.kraPin ? 'border-red-500' : ''}
              required
            />
            {validationErrors.kraPin && (
              <p className="text-sm text-red-600">{validationErrors.kraPin}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxCode">Tax Code</Label>
            <Input
              id="taxCode"
              value={formData.taxCode}
              onChange={(e) => setFormData({...formData, taxCode: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nhifNumber">NHIF Number (Optional)</Label>
            <Input
              id="nhifNumber"
              placeholder="NHIF123456"
              value={formData.nhifNumber}
              onChange={(e) => setFormData({...formData, nhifNumber: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nssfNumber">NSSF Number (Optional)</Label>
            <Input
              id="nssfNumber"
              placeholder="NSSF789012"
              value={formData.nssfNumber}
              onChange={(e) => setFormData({...formData, nssfNumber: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pensionContribution">Pension Contribution (%)</Label>
            <Input
              id="pensionContribution"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={formData.pensionContribution}
              onChange={(e) => setFormData({...formData, pensionContribution: Number(e.target.value)})}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
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
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {editingEmployee ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            editingEmployee ? 'Update Employee' : 'Add Employee'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage employee information, payroll details, and bank information
          </p>
        </div>
        {canManageEmployees && (
          <div className="mt-4 sm:mt-0">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              {employees.filter(emp => emp.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(employees.map(emp => emp.department)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                {canManageEmployees && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.employeeNumber}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{formatCurrency(employee.salary)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={employee.isActive ? "default" : "secondary"}
                      className={employee.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(employee.hireDate)}</TableCell>
                  {canManageEmployees && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(employee)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
