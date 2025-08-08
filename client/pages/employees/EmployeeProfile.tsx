import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  CreditCard,
  Shield,
  FileText,
  User,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Employee, UserRole, PayrollCategory } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

export default function EmployeeProfile() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('id');
  const { hasAnyRole } = useAuth();
  
  // Mock employee data
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
    }
  ];

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load employee data from mock data
  const loadEmployee = () => {
    if (!employeeId) {
      setError('No employee ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate API delay
    setTimeout(() => {
      const foundEmployee = mockEmployees.find(emp => emp.id === employeeId);
      if (foundEmployee) {
        setEmployee(foundEmployee);
      } else {
        setError('Employee not found');
      }
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  const canManageEmployees = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER]);
  const canViewEmployees = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link to="/employees">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employee List
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Employee not found'}
            <Button onClick={loadEmployee} variant="outline" size="sm" className="ml-4">
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
        <div className="flex items-center space-x-4">
          <Link to="/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Profile</h1>
            <p className="text-gray-600">View detailed employee information</p>
          </div>
        </div>
        {canManageEmployees && (
          <div className="mt-4 sm:mt-0">
            <Link to={`/employees/edit?id=${employee.id}`}>
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Edit Employee
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Employee Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
            <Avatar className="w-24 h-24 mx-auto sm:mx-0">
              <AvatarFallback className="text-2xl">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-lg text-gray-600">{employee.position}</p>
              <p className="text-sm text-gray-500">{employee.employeeNumber}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <Badge variant={employee.isActive ? "default" : "secondary"}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{employee.department}</Badge>
                <Badge variant="outline">
                  {employee.payrollCategory.charAt(0).toUpperCase() + employee.payrollCategory.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>
            
            <div className="text-center sm:text-right mt-4 sm:mt-0">
              <div className="text-sm text-gray-600">Monthly Salary</div>
              <div className="text-2xl font-bold text-green-600">
                {formatKES(employee.salary)}
              </div>
              <div className="text-sm text-gray-500">
                Hired: {new Date(employee.hireDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="tax">Tax & Benefits</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{employee.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium">{employee.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-1" />
                      <div>
                        <div className="text-sm text-gray-600">Address</div>
                        <div className="font-medium">{employee.address || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Personal Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Date of Birth</div>
                        <div className="font-medium">
                          {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">National ID</div>
                        <div className="font-medium">{employee.nationalId}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Information */}
        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Employment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Job Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Department</div>
                        <div className="font-medium">{employee.department}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Position</div>
                        <div className="font-medium">{employee.position}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Payroll Category</div>
                        <div className="font-medium">
                          {employee.payrollCategory.charAt(0).toUpperCase() + employee.payrollCategory.slice(1).toLowerCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Employment Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Hire Date</div>
                        <div className="font-medium">{new Date(employee.hireDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Tenure</div>
                        <div className="font-medium">
                          {Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Information */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Salary Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Monthly Salary</div>
                        <div className="text-xl font-bold text-green-600">{formatKES(employee.salary)}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Annual Salary</div>
                        <div className="font-medium">{formatKES(employee.salary * 12)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Bank Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Bank Name</div>
                        <div className="font-medium">{employee.bankDetails.bankName}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Account Number</div>
                        <div className="font-medium">***{employee.bankDetails.accountNumber.slice(-4)}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Sort Code</div>
                        <div className="font-medium">{employee.bankDetails.sortCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Account Holder</div>
                        <div className="font-medium">{employee.bankDetails.accountHolderName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax & Benefits Information */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Tax & Benefits Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tax Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">KRA PIN</div>
                        <div className="font-medium">{employee.taxInformation.kraPin}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Tax Code</div>
                        <div className="font-medium">{employee.taxInformation.taxCode}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Statutory Contributions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">NHIF Number</div>
                        <div className="font-medium">{employee.taxInformation.nhifNumber || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">NSSF Number</div>
                        <div className="font-medium">{employee.taxInformation.nssfNumber || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Pension Contribution</div>
                        <div className="font-medium">{employee.taxInformation.pensionContribution}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
