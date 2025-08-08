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
import { Employee, UserRole } from '@shared/api';
import { employeeService, handleAPIError } from '@shared/data-service';
import { formatKES } from '@shared/kenya-tax';

export default function EmployeeProfile() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('id');
  const { hasAnyRole } = useAuth();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load employee data
  const loadEmployee = async () => {
    if (!employeeId) {
      setError('No employee ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const employeeData = await employeeService.getEmployee(employeeId);
      setEmployee(employeeData);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Error loading employee:', err);
    } finally {
      setLoading(false);
    }
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
