import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
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
  Calculator,
  Search,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  Settings,
  UserPlus,
  UserCheck,
  UserX,
  Flag,
  Award,
  Handshake
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Interfaces
interface Union {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  registrationNumber: string;
  headquarters: string;
  contactPerson: string;
  phoneNumber: string;
  emailAddress: string;
  website?: string;
  foundedDate: string;
  sector: string;
  membershipRequirements: string[];
  benefits: string[];
  duesStructure: DuesStructure[];
  isRecognized: boolean;
  isActive: boolean;
}

interface DuesStructure {
  id: string;
  category: string;
  description: string;
  calculationType: 'fixed' | 'percentage' | 'tiered';
  fixedAmount?: number;
  percentage?: number;
  tiers?: DuesTier[];
  frequency: 'monthly' | 'quarterly' | 'annually';
  isCompulsory: boolean;
}

interface DuesTier {
  minSalary: number;
  maxSalary: number;
  amount: number;
}

interface UnionMembership {
  id: string;
  employeeId: string;
  unionId: string;
  membershipNumber: string;
  joinDate: string;
  status: 'active' | 'suspended' | 'terminated' | 'pending';
  membershipType: 'regular' | 'associate' | 'honorary' | 'life';
  position?: string;
  monthleDues: number;
  totalPaid: number;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  suspensionReason?: string;
  terminationDate?: string;
  terminationReason?: string;
  notes?: string;
}

interface UnionPayment {
  id: string;
  membershipId: string;
  paymentDate: string;
  amount: number;
  paymentPeriod: string; // "2025-01" format
  paymentType: 'regular_dues' | 'special_assessment' | 'initiation_fee' | 'arrears';
  paymentMethod: 'salary_deduction' | 'cash' | 'bank_transfer' | 'mobile_money';
  receiptNumber: string;
  payrollPeriodId?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed';
}

interface UnionReport {
  id: string;
  unionId: string;
  reportType: 'membership' | 'financial' | 'activities';
  reportPeriod: string;
  generatedDate: string;
  generatedBy: string;
  data: any;
  isSubmitted: boolean;
  submissionDate?: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  grossSalary: number;
  employmentDate: string;
  isActive: boolean;
}

const UnionDues: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageUnions = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canProcessPayments = hasAnyRole([UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('unions');
  const [unions, setUnions] = useState<Union[]>([]);
  const [unionMemberships, setUnionMemberships] = useState<UnionMembership[]>([]);
  const [unionPayments, setUnionPayments] = useState<UnionPayment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredUnions, setFilteredUnions] = useState<Union[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<UnionMembership[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unionFilter, setUnionFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedUnion, setSelectedUnion] = useState<Union | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMembershipForm, setShowMembershipForm] = useState(false);

  // Form state
  const [newMembership, setNewMembership] = useState<Partial<UnionMembership>>({});

  // Mock data
  const mockUnions: Union[] = [
    {
      id: 'cotu_k',
      name: 'Central Organization of Trade Unions - Kenya',
      abbreviation: 'COTU-K',
      description: 'Umbrella body for trade unions in Kenya',
      registrationNumber: 'REG/UNION/001/1965',
      headquarters: 'Nairobi',
      contactPerson: 'Francis Atwoli',
      phoneNumber: '020-2721929',
      emailAddress: 'info@cotu-kenya.org',
      website: 'www.cotu-kenya.org',
      foundedDate: '1965-07-01',
      sector: 'Multi-sector',
      membershipRequirements: [
        'Must be employed',
        'Aged 18 years and above',
        'Payment of initiation fee'
      ],
      benefits: [
        'Legal representation',
        'Collective bargaining',
        'Training and development',
        'Welfare support'
      ],
      duesStructure: [
        {
          id: 'cotu_regular',
          category: 'Regular Membership',
          description: 'Monthly union dues',
          calculationType: 'percentage',
          percentage: 1.5,
          frequency: 'monthly',
          isCompulsory: true
        }
      ],
      isRecognized: true,
      isActive: true
    },
    {
      id: 'knut',
      name: 'Kenya National Union of Teachers',
      abbreviation: 'KNUT',
      description: 'Trade union for teachers in Kenya',
      registrationNumber: 'REG/UNION/015/1957',
      headquarters: 'Nairobi',
      contactPerson: 'Wilson Sossion',
      phoneNumber: '020-2729571',
      emailAddress: 'info@knut.ac.ke',
      website: 'www.knut.ac.ke',
      foundedDate: '1957-04-15',
      sector: 'Education',
      membershipRequirements: [
        'Must be a qualified teacher',
        'Employed by government or approved institution',
        'Payment of registration fee'
      ],
      benefits: [
        'Professional development',
        'Legal aid',
        'Medical cover',
        'Loan facilities',
        'Retirement benefits'
      ],
      duesStructure: [
        {
          id: 'knut_tiered',
          category: 'Monthly Dues',
          description: 'Tiered dues based on salary',
          calculationType: 'tiered',
          tiers: [
            { minSalary: 0, maxSalary: 50000, amount: 300 },
            { minSalary: 50001, maxSalary: 100000, amount: 500 },
            { minSalary: 100001, maxSalary: 200000, amount: 800 },
            { minSalary: 200001, maxSalary: 999999999, amount: 1200 }
          ],
          frequency: 'monthly',
          isCompulsory: true
        }
      ],
      isRecognized: true,
      isActive: true
    },
    {
      id: 'kudheiha',
      name: 'Kenya Union of Domestic, Hotels, Educational Institutions, Hospitals and Allied Workers',
      abbreviation: 'KUDHEIHA',
      description: 'Union for hospitality and service workers',
      registrationNumber: 'REG/UNION/045/1962',
      headquarters: 'Nairobi',
      contactPerson: 'Albert Njeru',
      phoneNumber: '020-2713630',
      emailAddress: 'info@kudheiha.or.ke',
      foundedDate: '1962-08-12',
      sector: 'Hospitality & Services',
      membershipRequirements: [
        'Employed in covered sectors',
        'Above 18 years',
        'Payment of membership fee'
      ],
      benefits: [
        'Collective bargaining',
        'Grievance handling',
        'Training programs',
        'Emergency assistance'
      ],
      duesStructure: [
        {
          id: 'kudheiha_fixed',
          category: 'Standard Membership',
          description: 'Fixed monthly dues',
          calculationType: 'fixed',
          fixedAmount: 400,
          frequency: 'monthly',
          isCompulsory: true
        }
      ],
      isRecognized: true,
      isActive: true
    }
  ];

  const mockEmployees: Employee[] = [
    {
      id: 'emp_001',
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Mwangi',
      department: 'Finance',
      position: 'Accountant',
      grossSalary: 150000,
      employmentDate: '2023-01-15',
      isActive: true
    },
    {
      id: 'emp_002',
      employeeNumber: 'EMP002',
      firstName: 'Grace',
      lastName: 'Wanjiku',
      department: 'HR',
      position: 'HR Manager',
      grossSalary: 200000,
      employmentDate: '2022-06-20',
      isActive: true
    },
    {
      id: 'emp_003',
      employeeNumber: 'EMP003',
      firstName: 'Peter',
      lastName: 'Kiprotich',
      department: 'IT',
      position: 'Software Developer',
      grossSalary: 300000,
      employmentDate: '2021-03-10',
      isActive: true
    }
  ];

  const mockMemberships: UnionMembership[] = [
    {
      id: 'mem_001',
      employeeId: 'emp_001',
      unionId: 'cotu_k',
      membershipNumber: 'COTU/2023/001',
      joinDate: '2023-02-01',
      status: 'active',
      membershipType: 'regular',
      monthleDues: 2250, // 1.5% of 150,000
      totalPaid: 27000,
      lastPaymentDate: '2025-01-01',
      nextPaymentDate: '2025-02-01'
    },
    {
      id: 'mem_002',
      employeeId: 'emp_002',
      unionId: 'knut',
      membershipNumber: 'KNUT/2022/156',
      joinDate: '2022-07-01',
      status: 'active',
      membershipType: 'regular',
      monthleDues: 1200, // Tier for 200,000 salary
      totalPaid: 36000,
      lastPaymentDate: '2025-01-01',
      nextPaymentDate: '2025-02-01'
    },
    {
      id: 'mem_003',
      employeeId: 'emp_003',
      unionId: 'kudheiha',
      membershipNumber: 'KUD/2021/089',
      joinDate: '2021-04-15',
      status: 'suspended',
      membershipType: 'regular',
      monthleDues: 400,
      totalPaid: 14400,
      suspensionReason: 'Non-payment of dues for 3 months',
      lastPaymentDate: '2024-10-01'
    }
  ];

  // Initialize data
  useEffect(() => {
    setUnions(mockUnions);
    setUnionMemberships(mockMemberships);
    setEmployees(mockEmployees);
    setFilteredUnions(mockUnions);
    setFilteredMemberships(mockMemberships);
  }, []);

  // Filter unions
  useEffect(() => {
    let filtered = unions;

    if (searchTerm) {
      filtered = filtered.filter(union =>
        union.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        union.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        union.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUnions(filtered);
  }, [unions, searchTerm]);

  // Filter memberships
  useEffect(() => {
    let filtered = unionMemberships;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(membership => membership.status === statusFilter);
    }

    if (unionFilter !== 'all') {
      filtered = filtered.filter(membership => membership.unionId === unionFilter);
    }

    setFilteredMemberships(filtered);
  }, [unionMemberships, statusFilter, unionFilter]);

  // Calculate dues for employee and union
  const calculateDues = (employee: Employee, union: Union): number => {
    const duesStructure = union.duesStructure[0]; // Taking first dues structure

    switch (duesStructure.calculationType) {
      case 'fixed':
        return duesStructure.fixedAmount || 0;
      
      case 'percentage':
        return Math.round(employee.grossSalary * (duesStructure.percentage || 0) / 100);
      
      case 'tiered':
        if (duesStructure.tiers) {
          const tier = duesStructure.tiers.find(t => 
            employee.grossSalary >= t.minSalary && employee.grossSalary <= t.maxSalary
          );
          return tier?.amount || 0;
        }
        return 0;
      
      default:
        return 0;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get membership type color
  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'bg-blue-100 text-blue-800';
      case 'associate': return 'bg-purple-100 text-purple-800';
      case 'honorary': return 'bg-gold-100 text-yellow-800';
      case 'life': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canManageUnions) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage union dues.
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
          <h1 className="text-3xl font-bold text-gray-900">Union Dues Management</h1>
          <p className="text-gray-600">Trade union registration, membership, and dues collection</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <Flag className="w-4 h-4 mr-1" />
            {unions.length} Unions
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <Users className="w-4 h-4 mr-1" />
            {unionMemberships.length} Members
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="unions">Unions</TabsTrigger>
          <TabsTrigger value="memberships">Memberships</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        {/* Unions Tab */}
        <TabsContent value="unions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Registered Trade Unions
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Register Union
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search unions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Unions Grid */}
              <div className="grid gap-6">
                {filteredUnions.map((union) => (
                  <Card key={union.id} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-lg">{union.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {union.abbreviation}
                            </Badge>
                            {union.isRecognized && (
                              <Badge className="bg-green-100 text-green-800">
                                <Award className="w-3 h-3 mr-1" />
                                Recognized
                              </Badge>
                            )}
                            <Badge variant={union.isActive ? "default" : "secondary"}>
                              {union.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{union.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <Label>Registration Number</Label>
                              <div className="font-medium">{union.registrationNumber}</div>
                            </div>
                            <div>
                              <Label>Sector</Label>
                              <div className="font-medium">{union.sector}</div>
                            </div>
                            <div>
                              <Label>Founded</Label>
                              <div>{new Date(union.foundedDate).getFullYear()}</div>
                            </div>
                            <div>
                              <Label>Headquarters</Label>
                              <div>{union.headquarters}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label>Contact Person</Label>
                              <div className="font-medium">{union.contactPerson}</div>
                              <div className="text-sm text-gray-600">{union.phoneNumber}</div>
                              <div className="text-sm text-gray-600">{union.emailAddress}</div>
                            </div>
                            <div>
                              <Label>Dues Structure</Label>
                              {union.duesStructure.map((dues, index) => (
                                <div key={index} className="text-sm">
                                  <div className="font-medium">{dues.category}</div>
                                  <div className="text-gray-600">
                                    {dues.calculationType === 'fixed' && `${formatKES(dues.fixedAmount || 0)} ${dues.frequency}`}
                                    {dues.calculationType === 'percentage' && `${dues.percentage}% of salary ${dues.frequency}`}
                                    {dues.calculationType === 'tiered' && `Tiered structure ${dues.frequency}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Benefits */}
                          <div className="mb-4">
                            <Label>Member Benefits</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {union.benefits.slice(0, 4).map((benefit, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                              {union.benefits.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{union.benefits.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Membership Requirements */}
                          <div>
                            <Label>Membership Requirements</Label>
                            <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                              {union.membershipRequirements.slice(0, 3).map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memberships Tab */}
        <TabsContent value="memberships" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Union Memberships
                </CardTitle>
                <Button onClick={() => setShowMembershipForm(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={unionFilter} onValueChange={setUnionFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by union" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Unions</SelectItem>
                    {unions.map((union) => (
                      <SelectItem key={union.id} value={union.id}>
                        {union.abbreviation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Memberships Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Union</TableHead>
                    <TableHead>Membership #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Monthly Dues</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMemberships.map((membership) => {
                    const employee = employees.find(e => e.id === membership.employeeId);
                    const union = unions.find(u => u.id === membership.unionId);

                    return (
                      <TableRow key={membership.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Flag className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium">{union?.abbreviation}</div>
                              <div className="text-sm text-gray-500">{union?.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{membership.membershipNumber}</TableCell>
                        <TableCell>
                          <Badge className={getMembershipTypeColor(membership.membershipType)}>
                            {membership.membershipType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatKES(membership.monthleDues)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(membership.status)}>
                            {membership.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(membership.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {membership.status === 'suspended' && (
                              <Button variant="outline" size="sm" className="text-green-600">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Membership Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Membership Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {unionMemberships.filter(m => m.status === 'active').length}
                    </div>
                    <div className="text-sm text-blue-600">Active Members</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {unionMemberships.filter(m => m.status === 'pending').length}
                    </div>
                    <div className="text-sm text-yellow-600">Pending</div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {unionMemberships.filter(m => m.status === 'suspended').length}
                    </div>
                    <div className="text-sm text-orange-600">Suspended</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatKES(unionMemberships.reduce((sum, m) => sum + m.monthleDues, 0))}
                    </div>
                    <div className="text-sm text-green-600">Monthly Collections</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Union Dues Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Processing</h3>
                <p className="text-gray-600 mb-4">Process and track union dues payments</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Process Payments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Union Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Membership Report</h3>
                    <p className="text-sm text-gray-600">Active members by union</p>
                  </div>
                </Card>
                <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-green-300 cursor-pointer">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Financial Report</h3>
                    <p className="text-sm text-gray-600">Dues collection summary</p>
                  </div>
                </Card>
                <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-purple-300 cursor-pointer">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Compliance Report</h3>
                    <p className="text-sm text-gray-600">Regulatory compliance status</p>
                  </div>
                </Card>
              </div>
              
              <div className="text-center">
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Union Dues Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Select Employee & Union</h3>
                  
                  <div>
                    <Label>Employee</Label>
                    <Select
                      value={selectedEmployee?.id || ''}
                      onValueChange={(value) => {
                        const employee = employees.find(e => e.id === value);
                        setSelectedEmployee(employee || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {formatKES(employee.grossSalary)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Union</Label>
                    <Select
                      value={selectedUnion?.id || ''}
                      onValueChange={(value) => {
                        const union = unions.find(u => u.id === value);
                        setSelectedUnion(union || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select union" />
                      </SelectTrigger>
                      <SelectContent>
                        {unions.map((union) => (
                          <SelectItem key={union.id} value={union.id}>
                            {union.abbreviation} - {union.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Dues Calculation</h3>
                  
                  {selectedEmployee && selectedUnion ? (
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Employee Salary:</span>
                        <span className="font-semibold">{formatKES(selectedEmployee.grossSalary)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Calculation Method:</span>
                        <span className="font-semibold">{selectedUnion.duesStructure[0]?.calculationType}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 rounded">
                        <span>Monthly Dues:</span>
                        <span className="font-semibold text-blue-600">
                          {formatKES(calculateDues(selectedEmployee, selectedUnion))}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-green-50 rounded">
                        <span>Annual Dues:</span>
                        <span className="font-semibold text-green-600">
                          {formatKES(calculateDues(selectedEmployee, selectedUnion) * 12)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Select employee and union to calculate dues</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnionDues;
