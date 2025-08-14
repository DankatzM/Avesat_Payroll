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
  Shield,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Download,
  RefreshCw,
  Settings,
  Heart,
  Car,
  Home,
  Briefcase,
  UserCheck,
  Activity
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Interfaces
interface InsurancePolicy {
  id: string;
  name: string;
  description: string;
  policyType: 'medical' | 'life' | 'disability' | 'auto' | 'property' | 'group';
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premiumType: 'fixed' | 'percentage' | 'tier_based';
  basePremium?: number;
  premiumPercentage?: number;
  premiumTiers?: PremiumTier[];
  deductible: number;
  waitingPeriod: number; // days
  maxAge: number;
  minAge: number;
  requiresMedicalExam: boolean;
  dependentsAllowed: boolean;
  maxDependents: number;
  isCompulsory: boolean;
  isActive: boolean;
  effectiveDate: string;
  renewalDate: string;
  benefits: string[];
  exclusions: string[];
}

interface PremiumTier {
  ageMin: number;
  ageMax: number;
  premium: number;
  dependentPremium: number;
}

interface EmployeeInsurance {
  id: string;
  employeeId: string;
  policyId: string;
  enrollmentDate: string;
  effectiveDate: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  monthlyPremium: number;
  coverageAmount: number;
  beneficiaries: Beneficiary[];
  dependents: Dependent[];
  medicalExamDate?: string;
  medicalExamStatus?: 'pending' | 'passed' | 'failed';
  notes?: string;
  lastPremiumDate?: string;
  nextPremiumDate?: string;
}

interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  idNumber: string;
  phoneNumber: string;
  address: string;
}

interface Dependent {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  idNumber: string;
  isActive: boolean;
}

interface InsuranceClaim {
  id: string;
  employeeInsuranceId: string;
  claimNumber: string;
  claimDate: string;
  incidentDate: string;
  claimType: 'medical' | 'life' | 'disability' | 'property' | 'auto';
  description: string;
  claimedAmount: number;
  approvedAmount?: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  submittedDocuments: string[];
  reviewNotes?: string;
  paymentDate?: string;
  paymentMethod?: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  grossSalary: number;
  dateOfBirth: string;
  employmentDate: string;
  maritalStatus: string;
  dependents: number;
  isActive: boolean;
}

const InsuranceDeductions: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageInsurance = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);
  const canProcessClaims = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('policies');
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [employeeInsurances, setEmployeeInsurances] = useState<EmployeeInsurance[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<InsuranceClaim[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<InsurancePolicy[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<EmployeeInsurance[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  // Form state
  const [newEnrollment, setNewEnrollment] = useState<Partial<EmployeeInsurance>>({});
  const [newBeneficiaries, setNewBeneficiaries] = useState<Beneficiary[]>([]);

  // Mock data
  const mockInsurancePolicies: InsurancePolicy[] = [
    {
      id: 'medical_basic',
      name: 'Basic Medical Cover',
      description: 'Essential medical insurance for all employees',
      policyType: 'medical',
      provider: 'AAR Insurance',
      policyNumber: 'AAR-MED-2025-001',
      coverageAmount: 500000,
      premiumType: 'tier_based',
      premiumTiers: [
        { ageMin: 18, ageMax: 35, premium: 2500, dependentPremium: 1500 },
        { ageMin: 36, ageMax: 50, premium: 3500, dependentPremium: 2000 },
        { ageMin: 51, ageMax: 65, premium: 5000, dependentPremium: 2500 }
      ],
      deductible: 5000,
      waitingPeriod: 30,
      maxAge: 65,
      minAge: 18,
      requiresMedicalExam: false,
      dependentsAllowed: true,
      maxDependents: 5,
      isCompulsory: true,
      isActive: true,
      effectiveDate: '2025-01-01',
      renewalDate: '2025-12-31',
      benefits: [
        'Inpatient treatment',
        'Outpatient treatment',
        'Maternity care',
        'Emergency treatment',
        'Prescription drugs'
      ],
      exclusions: [
        'Pre-existing conditions (first 12 months)',
        'Cosmetic surgery',
        'Experimental treatments'
      ]
    },
    {
      id: 'life_insurance',
      name: 'Group Life Insurance',
      description: 'Life insurance coverage for employees',
      policyType: 'life',
      provider: 'Jubilee Insurance',
      policyNumber: 'JUB-LIFE-2025-002',
      coverageAmount: 1000000,
      premiumType: 'percentage',
      premiumPercentage: 0.5, // 0.5% of annual salary
      deductible: 0,
      waitingPeriod: 0,
      maxAge: 60,
      minAge: 18,
      requiresMedicalExam: true,
      dependentsAllowed: false,
      maxDependents: 0,
      isCompulsory: true,
      isActive: true,
      effectiveDate: '2025-01-01',
      renewalDate: '2025-12-31',
      benefits: [
        'Death benefit',
        'Accidental death benefit',
        'Permanent disability benefit'
      ],
      exclusions: [
        'Suicide (first 2 years)',
        'Death due to war',
        'Death due to illegal activities'
      ]
    },
    {
      id: 'comprehensive_medical',
      name: 'Comprehensive Medical Cover',
      description: 'Enhanced medical insurance with extended benefits',
      policyType: 'medical',
      provider: 'CIC Insurance',
      policyNumber: 'CIC-MED-2025-003',
      coverageAmount: 1500000,
      premiumType: 'tier_based',
      premiumTiers: [
        { ageMin: 18, ageMax: 35, premium: 4500, dependentPremium: 2500 },
        { ageMin: 36, ageMax: 50, premium: 6500, dependentPremium: 3500 },
        { ageMin: 51, ageMax: 65, premium: 9000, dependentPremium: 4500 }
      ],
      deductible: 2500,
      waitingPeriod: 15,
      maxAge: 65,
      minAge: 18,
      requiresMedicalExam: false,
      dependentsAllowed: true,
      maxDependents: 6,
      isCompulsory: false,
      isActive: true,
      effectiveDate: '2025-01-01',
      renewalDate: '2025-12-31',
      benefits: [
        'All basic benefits',
        'Specialist consultations',
        'Dental care',
        'Optical care',
        'Mental health services',
        'Wellness programs'
      ],
      exclusions: [
        'Cosmetic surgery',
        'Experimental treatments',
        'Fertility treatments'
      ]
    },
    {
      id: 'group_personal_accident',
      name: 'Group Personal Accident',
      description: 'Personal accident insurance for workplace injuries',
      policyType: 'disability',
      provider: 'Madison Insurance',
      policyNumber: 'MAD-ACC-2025-004',
      coverageAmount: 750000,
      premiumType: 'fixed',
      basePremium: 1200,
      deductible: 0,
      waitingPeriod: 0,
      maxAge: 65,
      minAge: 18,
      requiresMedicalExam: false,
      dependentsAllowed: false,
      maxDependents: 0,
      isCompulsory: true,
      isActive: true,
      effectiveDate: '2025-01-01',
      renewalDate: '2025-12-31',
      benefits: [
        'Accidental death',
        'Permanent disability',
        'Temporary disability',
        'Medical expenses due to accident'
      ],
      exclusions: [
        'Self-inflicted injuries',
        'Injuries due to alcohol/drugs',
        'Injuries during illegal activities'
      ]
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
      dateOfBirth: '1985-06-15',
      employmentDate: '2023-01-15',
      maritalStatus: 'married',
      dependents: 2,
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
      dateOfBirth: '1980-03-22',
      employmentDate: '2022-06-20',
      maritalStatus: 'single',
      dependents: 0,
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
      dateOfBirth: '1990-11-08',
      employmentDate: '2021-03-10',
      maritalStatus: 'married',
      dependents: 1,
      isActive: true
    }
  ];

  const mockEmployeeInsurances: EmployeeInsurance[] = [
    {
      id: 'ins_001',
      employeeId: 'emp_001',
      policyId: 'medical_basic',
      enrollmentDate: '2023-01-15',
      effectiveDate: '2023-02-15',
      status: 'active',
      monthlyPremium: 3500,
      coverageAmount: 500000,
      beneficiaries: [
        {
          id: 'ben_001',
          name: 'Mary Mwangi',
          relationship: 'Spouse',
          percentage: 60,
          idNumber: '25123456',
          phoneNumber: '0722123456',
          address: 'Nairobi'
        },
        {
          id: 'ben_002',
          name: 'James Mwangi',
          relationship: 'Child',
          percentage: 40,
          idNumber: '35123456',
          phoneNumber: '0722123456',
          address: 'Nairobi'
        }
      ],
      dependents: [
        {
          id: 'dep_001',
          name: 'Mary Mwangi',
          relationship: 'Spouse',
          dateOfBirth: '1987-08-20',
          idNumber: '25123456',
          isActive: true
        },
        {
          id: 'dep_002',
          name: 'James Mwangi',
          relationship: 'Child',
          dateOfBirth: '2015-12-10',
          idNumber: '35123456',
          isActive: true
        }
      ],
      lastPremiumDate: '2025-01-01',
      nextPremiumDate: '2025-02-01'
    },
    {
      id: 'ins_002',
      employeeId: 'emp_002',
      policyId: 'comprehensive_medical',
      enrollmentDate: '2022-06-20',
      effectiveDate: '2022-07-20',
      status: 'active',
      monthlyPremium: 6500,
      coverageAmount: 1500000,
      beneficiaries: [
        {
          id: 'ben_003',
          name: 'Joseph Wanjiku',
          relationship: 'Father',
          percentage: 100,
          idNumber: '15123456',
          phoneNumber: '0733123456',
          address: 'Nakuru'
        }
      ],
      dependents: [],
      lastPremiumDate: '2025-01-01',
      nextPremiumDate: '2025-02-01'
    }
  ];

  // Initialize data
  useEffect(() => {
    setInsurancePolicies(mockInsurancePolicies);
    setEmployeeInsurances(mockEmployeeInsurances);
    setEmployees(mockEmployees);
    setFilteredPolicies(mockInsurancePolicies);
    setFilteredEnrollments(mockEmployeeInsurances);
  }, []);

  // Filter policies
  useEffect(() => {
    let filtered = insurancePolicies;

    if (searchTerm) {
      filtered = filtered.filter(policy =>
        policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(policy => policy.policyType === typeFilter);
    }

    setFilteredPolicies(filtered);
  }, [insurancePolicies, searchTerm, typeFilter]);

  // Filter enrollments
  useEffect(() => {
    let filtered = employeeInsurances;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
    }

    setFilteredEnrollments(filtered);
  }, [employeeInsurances, statusFilter]);

  // Calculate premium for employee
  const calculatePremium = (employee: Employee, policy: InsurancePolicy): number => {
    const age = Math.floor((new Date().getTime() - new Date(employee.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    switch (policy.premiumType) {
      case 'fixed':
        return policy.basePremium || 0;
      
      case 'percentage':
        return Math.round((employee.grossSalary * 12 * (policy.premiumPercentage || 0) / 100) / 12);
      
      case 'tier_based':
        if (policy.premiumTiers) {
          const tier = policy.premiumTiers.find(t => age >= t.ageMin && age <= t.ageMax);
          if (tier) {
            const dependentCost = employee.dependents * tier.dependentPremium;
            return tier.premium + dependentCost;
          }
        }
        return 0;
      
      default:
        return 0;
    }
  };

  // Get policy type icon
  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Heart className="w-4 h-4" />;
      case 'life': return <Shield className="w-4 h-4" />;
      case 'disability': return <Activity className="w-4 h-4" />;
      case 'auto': return <Car className="w-4 h-4" />;
      case 'property': return <Home className="w-4 h-4" />;
      case 'group': return <Users className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canManageInsurance) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage insurance deductions.
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
          <h1 className="text-3xl font-bold text-gray-900">Insurance Management</h1>
          <p className="text-gray-600">Employee insurance policies, enrollments, and claims management</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <Shield className="w-4 h-4 mr-1" />
            {insurancePolicies.length} Policies
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <Users className="w-4 h-4 mr-1" />
            {employeeInsurances.length} Enrollments
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Insurance Policies
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search policies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                    <SelectItem value="disability">Disability</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Policies Grid */}
              <div className="grid gap-6">
                {filteredPolicies.map((policy) => (
                  <Card key={policy.id} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPolicyTypeIcon(policy.policyType)}
                            <h3 className="font-semibold text-lg">{policy.name}</h3>
                            <Badge variant={policy.isActive ? "default" : "secondary"}>
                              {policy.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {policy.isCompulsory && (
                              <Badge variant="outline" className="border-red-200 text-red-600">
                                Compulsory
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-4">{policy.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <Label>Provider</Label>
                              <div className="font-medium">{policy.provider}</div>
                            </div>
                            <div>
                              <Label>Policy Number</Label>
                              <div className="font-medium">{policy.policyNumber}</div>
                            </div>
                            <div>
                              <Label>Coverage Amount</Label>
                              <div className="font-medium">{formatKES(policy.coverageAmount)}</div>
                            </div>
                            <div>
                              <Label>Deductible</Label>
                              <div className="font-medium">{formatKES(policy.deductible)}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <Label>Age Range</Label>
                              <div>{policy.minAge} - {policy.maxAge} years</div>
                            </div>
                            <div>
                              <Label>Waiting Period</Label>
                              <div>{policy.waitingPeriod} days</div>
                            </div>
                            <div>
                              <Label>Medical Exam</Label>
                              <div>{policy.requiresMedicalExam ? 'Required' : 'Not Required'}</div>
                            </div>
                            <div>
                              <Label>Dependents</Label>
                              <div>
                                {policy.dependentsAllowed ? `Up to ${policy.maxDependents}` : 'Not Allowed'}
                              </div>
                            </div>
                          </div>

                          {/* Premium Structure */}
                          <div className="mb-4">
                            <Label>Premium Structure</Label>
                            {policy.premiumType === 'fixed' && (
                              <div className="text-sm">Fixed: {formatKES(policy.basePremium || 0)} per month</div>
                            )}
                            {policy.premiumType === 'percentage' && (
                              <div className="text-sm">{policy.premiumPercentage}% of annual salary</div>
                            )}
                            {policy.premiumType === 'tier_based' && policy.premiumTiers && (
                              <div className="space-y-1">
                                {policy.premiumTiers.map((tier, index) => (
                                  <div key={index} className="text-sm">
                                    Age {tier.ageMin}-{tier.ageMax}: {formatKES(tier.premium)} 
                                    (Dependent: {formatKES(tier.dependentPremium)})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Benefits */}
                          <div className="mb-4">
                            <Label>Benefits</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {policy.benefits.slice(0, 3).map((benefit, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                              {policy.benefits.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{policy.benefits.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Effective:</span> {new Date(policy.effectiveDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Renewal:</span> {new Date(policy.renewalDate).toLocaleDateString()}
                            </div>
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

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Employee Enrollments
                </CardTitle>
                <Button onClick={() => setShowEnrollmentForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status Filter */}
              <div className="flex gap-4 mb-6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enrollments Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Monthly Premium</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment) => {
                    const employee = employees.find(e => e.id === enrollment.employeeId);
                    const policy = insurancePolicies.find(p => p.id === enrollment.policyId);

                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                            <div className="text-sm text-gray-500">{employee?.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {policy && getPolicyTypeIcon(policy.policyType)}
                            <div>
                              <div className="font-medium">{policy?.name}</div>
                              <div className="text-sm text-gray-500">{policy?.provider}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatKES(enrollment.coverageAmount)}</TableCell>
                        <TableCell className="font-medium">{formatKES(enrollment.monthlyPremium)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(enrollment.status)}>
                            {enrollment.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Premium Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Premium Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Select Employee</Label>
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
                            {employee.firstName} {employee.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Policy</Label>
                    <Select
                      value={selectedPolicy?.id || ''}
                      onValueChange={(value) => {
                        const policy = insurancePolicies.find(p => p.id === value);
                        setSelectedPolicy(policy || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        {insurancePolicies.map((policy) => (
                          <SelectItem key={policy.id} value={policy.id}>
                            {policy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Premium Calculation</h3>
                  
                  {selectedEmployee && selectedPolicy ? (
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Employee Premium:</span>
                        <span className="font-semibold">
                          {formatKES(calculatePremium(selectedEmployee, selectedPolicy))}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Coverage Amount:</span>
                        <span className="font-semibold">{formatKES(selectedPolicy.coverageAmount)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Deductible:</span>
                        <span className="font-semibold">{formatKES(selectedPolicy.deductible)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Select employee and policy to calculate premium</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beneficiaries Tab */}
        <TabsContent value="beneficiaries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Beneficiaries Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Beneficiaries & Dependents</h3>
                <p className="text-gray-600 mb-4">Manage insurance beneficiaries and dependents</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Beneficiary
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Insurance Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Claims Processing</h3>
                <p className="text-gray-600 mb-4">Submit and track insurance claims</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Claim
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
                <TrendingUp className="w-5 h-5" />
                Insurance Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{employeeInsurances.length}</div>
                    <div className="text-sm text-blue-600">Total Enrollments</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatKES(employeeInsurances.reduce((sum, ins) => sum + ins.monthlyPremium, 0))}
                    </div>
                    <div className="text-sm text-green-600">Monthly Premiums</div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatKES(employeeInsurances.reduce((sum, ins) => sum + ins.coverageAmount, 0))}
                    </div>
                    <div className="text-sm text-orange-600">Total Coverage</div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">85%</div>
                    <div className="text-sm text-purple-600">Enrollment Rate</div>
                  </CardContent>
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
      </Tabs>
    </div>
  );
};

export default InsuranceDeductions;
