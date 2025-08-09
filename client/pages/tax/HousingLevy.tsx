import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  History,
  Eye,
  Shield,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings,
  Database,
  Calculator,
  Users,
  Activity,
  Send,
  Clock,
  FileCheck,
  AlertTriangle,
  Search,
  Filter,
  FileX,
  Printer,
  Mail,
  Home,
  Construction,
  Target,
  Award,
  Percent
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES, calculateHousingLevy, KENYA_TAX_CONSTANTS } from '@shared/kenya-tax';
import { logTaxAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

interface HousingLevyRate {
  id: string;
  rateName: string;
  levyRate: number; // Percentage
  maxMonthlyDeduction: number;
  minSalaryThreshold: number;
  maxSalaryThreshold: number;
  description: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface HousingLevyContribution {
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  applicableSalary: number;
  levyRate: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  month: string;
  year: number;
  status: 'calculated' | 'submitted' | 'paid' | 'overdue';
  submissionDate?: string;
  paymentDate?: string;
  exemptionReason?: string;
}

interface HousingFund {
  id: string;
  fundName: string;
  fundType: 'development' | 'affordable' | 'rental' | 'cooperative';
  totalContributions: number;
  totalProjects: number;
  beneficiaries: number;
  status: 'active' | 'completed' | 'suspended';
  establishedDate: string;
  targetAmount: number;
  currentAmount: number;
  description: string;
}

interface HousingProject {
  id: string;
  projectName: string;
  location: string;
  projectType: 'affordable_housing' | 'rental_housing' | 'cooperative_housing';
  totalCost: number;
  fundingSource: string;
  startDate: string;
  expectedCompletion: string;
  actualCompletion?: string;
  unitsPlanned: number;
  unitsCompleted: number;
  beneficiaries: string[];
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  progress: number;
}

interface HousingBeneficiary {
  employeeId: string;
  employeeName: string;
  nationalId: string;
  phoneNumber: string;
  applicationDate: string;
  housingNeed: 'purchase' | 'rental' | 'renovation';
  incomeLevel: 'low' | 'middle' | 'upper_middle';
  familySize: number;
  totalContributions: number;
  eligibilityStatus: 'eligible' | 'pending' | 'ineligible';
  allocationStatus: 'waiting' | 'allocated' | 'declined';
  allocatedProject?: string;
}

const HousingLevy: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // State management
  const [housingRates, setHousingRates] = useState<HousingLevyRate[]>([]);
  const [contributions, setContributions] = useState<HousingLevyContribution[]>([]);
  const [funds, setFunds] = useState<HousingFund[]>([]);
  const [projects, setProjects] = useState<HousingProject[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<HousingBeneficiary[]>([]);
  const [selectedTab, setSelectedTab] = useState('rates');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [selectedRate, setSelectedRate] = useState<HousingLevyRate | null>(null);
  const [formData, setFormData] = useState({
    rateName: '',
    levyRate: '',
    maxMonthlyDeduction: '',
    minSalaryThreshold: '',
    maxSalaryThreshold: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth() + 1 + '');
  const [filterYear, setFilterYear] = useState<string>('2025');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load housing levy data
  useEffect(() => {
    loadHousingLevyData();
  }, []);

  const loadHousingLevyData = () => {
    setIsLoading(true);
    
    // Housing Levy Rates for 2025
    const defaultRates: HousingLevyRate[] = [
      {
        id: 'hl-rate-2025-1',
        rateName: 'Standard Housing Levy',
        levyRate: 1.5, // 1.5% of gross salary
        maxMonthlyDeduction: 5000,
        minSalaryThreshold: 0,
        maxSalaryThreshold: 999999999,
        description: 'Standard housing development levy for all employees',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ];

    // Mock contribution data
    const mockContributions: HousingLevyContribution[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'John Mwangi',
        grossSalary: 150000,
        applicableSalary: 150000,
        levyRate: 1.5,
        employeeContribution: 2250,
        employerContribution: 2250,
        totalContribution: 4500,
        month: 'January',
        year: 2025,
        status: 'paid',
        submissionDate: '2025-01-15',
        paymentDate: '2025-01-20'
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Grace Wanjiku',
        grossSalary: 200000,
        applicableSalary: 200000,
        levyRate: 1.5,
        employeeContribution: 3000,
        employerContribution: 3000,
        totalContribution: 6000,
        month: 'January',
        year: 2025,
        status: 'paid',
        submissionDate: '2025-01-15',
        paymentDate: '2025-01-20'
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Peter Kiprotich',
        grossSalary: 400000,
        applicableSalary: 333333, // Capped at max deduction calculation
        levyRate: 1.5,
        employeeContribution: 5000, // Max deduction
        employerContribution: 5000, // Max deduction
        totalContribution: 10000,
        month: 'January',
        year: 2025,
        status: 'submitted',
        submissionDate: '2025-01-15'
      },
      {
        employeeId: 'EMP004',
        employeeName: 'Mary Achieng',
        grossSalary: 45000,
        applicableSalary: 45000,
        levyRate: 1.5,
        employeeContribution: 675,
        employerContribution: 675,
        totalContribution: 1350,
        month: 'January',
        year: 2025,
        status: 'calculated'
      },
      {
        employeeId: 'EMP005',
        employeeName: 'Samuel Otieno',
        grossSalary: 350000,
        applicableSalary: 333333, // Capped at max deduction calculation
        levyRate: 1.5,
        employeeContribution: 5000, // Max deduction
        employerContribution: 5000, // Max deduction
        totalContribution: 10000,
        month: 'January',
        year: 2025,
        status: 'paid',
        submissionDate: '2025-01-15',
        paymentDate: '2025-01-18'
      }
    ];

    // Mock housing funds data
    const mockFunds: HousingFund[] = [
      {
        id: 'fund-001',
        fundName: 'National Affordable Housing Fund',
        fundType: 'affordable',
        totalContributions: 5600000000, // 5.6 billion KES
        totalProjects: 45,
        beneficiaries: 12500,
        status: 'active',
        establishedDate: '2023-01-01',
        targetAmount: 10000000000, // 10 billion KES
        currentAmount: 5600000000,
        description: 'Primary fund for affordable housing development across Kenya'
      },
      {
        id: 'fund-002',
        fundName: 'Urban Rental Housing Fund',
        fundType: 'rental',
        totalContributions: 2800000000, // 2.8 billion KES
        totalProjects: 25,
        beneficiaries: 8500,
        status: 'active',
        establishedDate: '2023-06-01',
        targetAmount: 5000000000, // 5 billion KES
        currentAmount: 2800000000,
        description: 'Dedicated fund for urban rental housing projects'
      },
      {
        id: 'fund-003',
        fundName: 'Cooperative Housing Development Fund',
        fundType: 'cooperative',
        totalContributions: 1400000000, // 1.4 billion KES
        totalProjects: 15,
        beneficiaries: 4200,
        status: 'active',
        establishedDate: '2024-01-01',
        targetAmount: 3000000000, // 3 billion KES
        currentAmount: 1400000000,
        description: 'Support fund for housing cooperative societies'
      }
    ];

    // Mock housing projects data
    const mockProjects: HousingProject[] = [
      {
        id: 'proj-001',
        projectName: 'Pangani Housing Estate Phase I',
        location: 'Nairobi, Pangani',
        projectType: 'affordable_housing',
        totalCost: 3500000000,
        fundingSource: 'National Affordable Housing Fund',
        startDate: '2024-03-01',
        expectedCompletion: '2026-12-31',
        unitsPlanned: 1500,
        unitsCompleted: 450,
        beneficiaries: ['EMP001', 'EMP003', 'EMP015'],
        status: 'ongoing',
        progress: 30
      },
      {
        id: 'proj-002',
        projectName: 'Kibera Slum Upgrading Project',
        location: 'Nairobi, Kibera',
        projectType: 'affordable_housing',
        totalCost: 2800000000,
        fundingSource: 'National Affordable Housing Fund',
        startDate: '2024-01-15',
        expectedCompletion: '2025-12-31',
        unitsPlanned: 800,
        unitsCompleted: 200,
        beneficiaries: ['EMP002', 'EMP007'],
        status: 'ongoing',
        progress: 25
      },
      {
        id: 'proj-003',
        projectName: 'Mombasa Coastal Apartments',
        location: 'Mombasa, Coast',
        projectType: 'rental_housing',
        totalCost: 1900000000,
        fundingSource: 'Urban Rental Housing Fund',
        startDate: '2023-09-01',
        expectedCompletion: '2025-06-30',
        actualCompletion: '2025-06-15',
        unitsPlanned: 600,
        unitsCompleted: 600,
        beneficiaries: ['EMP004', 'EMP012'],
        status: 'completed',
        progress: 100
      }
    ];

    // Mock beneficiaries data
    const mockBeneficiaries: HousingBeneficiary[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'John Mwangi',
        nationalId: '12345678',
        phoneNumber: '+254700123456',
        applicationDate: '2024-01-15',
        housingNeed: 'purchase',
        incomeLevel: 'middle',
        familySize: 4,
        totalContributions: 54000, // 12 months * 4500
        eligibilityStatus: 'eligible',
        allocationStatus: 'allocated',
        allocatedProject: 'Pangani Housing Estate Phase I'
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Grace Wanjiku',
        nationalId: '87654321',
        phoneNumber: '+254700654321',
        applicationDate: '2024-02-20',
        housingNeed: 'purchase',
        incomeLevel: 'upper_middle',
        familySize: 3,
        totalContributions: 72000, // 12 months * 6000
        eligibilityStatus: 'eligible',
        allocationStatus: 'allocated',
        allocatedProject: 'Kibera Slum Upgrading Project'
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Peter Kiprotich',
        nationalId: '55566677',
        phoneNumber: '+254700555666',
        applicationDate: '2024-03-10',
        housingNeed: 'rental',
        incomeLevel: 'upper_middle',
        familySize: 2,
        totalContributions: 120000, // 12 months * 10000
        eligibilityStatus: 'eligible',
        allocationStatus: 'waiting'
      },
      {
        employeeId: 'EMP004',
        employeeName: 'Mary Achieng',
        nationalId: '11122233',
        phoneNumber: '+254700111222',
        applicationDate: '2024-04-05',
        housingNeed: 'rental',
        incomeLevel: 'low',
        familySize: 5,
        totalContributions: 16200, // 12 months * 1350
        eligibilityStatus: 'eligible',
        allocationStatus: 'allocated',
        allocatedProject: 'Mombasa Coastal Apartments'
      }
    ];

    setHousingRates(defaultRates);
    setContributions(mockContributions);
    setFunds(mockFunds);
    setProjects(mockProjects);
    setBeneficiaries(mockBeneficiaries);
    setIsLoading(false);
  };

  const calculateHousingLevyForSalary = (grossSalary: number): { employeeShare: number; employerShare: number; total: number } => {
    const levyAmount = calculateHousingLevy(grossSalary);
    
    return {
      employeeShare: levyAmount,
      employerShare: levyAmount,
      total: levyAmount * 2
    };
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.rateName) {
      errors.rateName = 'Rate name is required';
    }

    if (!formData.levyRate || parseFloat(formData.levyRate) < 0 || parseFloat(formData.levyRate) > 100) {
      errors.levyRate = 'Levy rate must be between 0% and 100%';
    }

    if (!formData.maxMonthlyDeduction || parseFloat(formData.maxMonthlyDeduction) < 0) {
      errors.maxMonthlyDeduction = 'Maximum monthly deduction must be 0 or greater';
    }

    if (!formData.minSalaryThreshold || parseFloat(formData.minSalaryThreshold) < 0) {
      errors.minSalaryThreshold = 'Minimum salary threshold must be 0 or greater';
    }

    if (!formData.description) {
      errors.description = 'Description is required';
    }

    if (!formData.effectiveDate) {
      errors.effectiveDate = 'Effective date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRate = () => {
    if (!validateForm()) return;

    const newRate: HousingLevyRate = {
      id: `custom-${Date.now()}`,
      rateName: formData.rateName,
      levyRate: parseFloat(formData.levyRate),
      maxMonthlyDeduction: parseFloat(formData.maxMonthlyDeduction),
      minSalaryThreshold: parseFloat(formData.minSalaryThreshold),
      maxSalaryThreshold: parseFloat(formData.maxSalaryThreshold) || 999999999,
      description: formData.description,
      effectiveDate: formData.effectiveDate,
      status: 'active',
      createdBy: user?.id || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setHousingRates(prev => [...prev, newRate]);
    setShowAddDialog(false);
    resetForm();

    // Log action
    logTaxAction(
      {
        userId: user?.id || 'system',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1'
      },
      AuditAction.CREATE,
      `housing_levy_rate_${newRate.id}`,
      undefined,
      newRate
    );
  };

  const resetForm = () => {
    setFormData({
      rateName: '',
      levyRate: '',
      maxMonthlyDeduction: '',
      minSalaryThreshold: '',
      maxSalaryThreshold: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
    setValidationErrors({});
  };

  const exportContributions = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      period: `${filterMonth}/${filterYear}`,
      contributions: getFilteredContributions(),
      summary: {
        totalEmployees: getFilteredContributions().length,
        totalContributions: getFilteredContributions().reduce((sum, c) => sum + c.totalContribution, 0),
        employeeShare: getFilteredContributions().reduce((sum, c) => sum + c.employeeContribution, 0),
        employerShare: getFilteredContributions().reduce((sum, c) => sum + c.employerContribution, 0)
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `housing-levy-${filterMonth}-${filterYear}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'calculated': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'eligible': return 'bg-green-100 text-green-800';
      case 'ineligible': return 'bg-red-100 text-red-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'allocated': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredContributions = () => {
    return contributions.filter(contribution => {
      const statusMatch = filterStatus === 'all' || contribution.status === filterStatus;
      const searchMatch = !searchTerm || 
        contribution.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && searchMatch;
    });
  };

  // Check permissions
  const canManageTax = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER]);
  const canEditRates = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);

  if (!canManageTax) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the Housing Levy module. 
            Contact your administrator for access.
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
          <h1 className="text-3xl font-bold text-gray-900">Housing Levy Management</h1>
          <p className="text-gray-600">National Housing Development Fund (NHDF) contribution management for 2025</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            NHDF 2025 Compliant
          </Badge>
          <Badge variant="outline">
            <Building2 className="w-4 h-4 mr-1" />
            {housingRates.filter(r => r.status === 'active').length} Active Rates
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contributing Employees</p>
                <p className="text-2xl font-bold">{contributions.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Collections</p>
                <p className="text-2xl font-bold">
                  {formatKES(contributions.reduce((sum, c) => sum + c.totalContribution, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'ongoing').length}</p>
              </div>
              <Construction className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Beneficiaries</p>
                <p className="text-2xl font-bold">{beneficiaries.length}</p>
              </div>
              <Home className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fund Value</p>
                <p className="text-2xl font-bold">
                  {formatKES(funds.reduce((sum, f) => sum + f.currentAmount, 0))}
                </p>
              </div>
              <Target className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-6">
            <TabsTrigger value="rates">Levy Rates</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="funds">Housing Funds</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {canEditRates && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Rate
              </Button>
            )}
            <Button
              variant="outline"
              onClick={exportContributions}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={loadHousingLevyData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Levy Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Housing Levy Rates (2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading housing levy rates...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rate Name</TableHead>
                      <TableHead>Levy Rate</TableHead>
                      <TableHead>Max Monthly Deduction</TableHead>
                      <TableHead>Salary Threshold</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {housingRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.rateName}</TableCell>
                        <TableCell className="font-bold text-blue-600">{rate.levyRate}%</TableCell>
                        <TableCell className="font-bold text-green-600">{formatKES(rate.maxMonthlyDeduction)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatKES(rate.minSalaryThreshold)} - {rate.maxSalaryThreshold === 999999999 ? 'No limit' : formatKES(rate.maxSalaryThreshold)}
                        </TableCell>
                        <TableCell>{new Date(rate.effectiveDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(rate.status)}>
                            {rate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contributions Tab */}
        <TabsContent value="contributions" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-end">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by employee name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="calculated">Calculated</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="month-filter">Month</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {new Date(0, i).toLocaleString('en', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Employee Housing Levy Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Applicable Salary</TableHead>
                    <TableHead>Levy Rate</TableHead>
                    <TableHead>Employee Share</TableHead>
                    <TableHead>Employer Share</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredContributions().map((contribution) => (
                    <TableRow key={contribution.employeeId}>
                      <TableCell className="font-medium">{contribution.employeeName}</TableCell>
                      <TableCell>{formatKES(contribution.grossSalary)}</TableCell>
                      <TableCell>{formatKES(contribution.applicableSalary)}</TableCell>
                      <TableCell>{contribution.levyRate}%</TableCell>
                      <TableCell className="text-blue-600">{formatKES(contribution.employeeContribution)}</TableCell>
                      <TableCell className="text-green-600">{formatKES(contribution.employerContribution)}</TableCell>
                      <TableCell className="font-bold">{formatKES(contribution.totalContribution)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contribution.status)}>
                          {contribution.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Housing Funds Tab */}
        <TabsContent value="funds" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {funds.map((fund) => (
              <Card key={fund.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{fund.fundName}</h3>
                      <p className="text-sm text-gray-600 capitalize">{fund.fundType.replace('_', ' ')}</p>
                    </div>
                    <Badge className={getStatusColor(fund.status)}>
                      {fund.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{fund.description}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Target Amount:</span>
                      <span className="font-bold">{formatKES(fund.targetAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Amount:</span>
                      <span className="font-bold text-green-600">{formatKES(fund.currentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Progress:</span>
                      <span className="font-bold">{Math.round((fund.currentAmount / fund.targetAmount) * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Projects:</span>
                      <span className="font-bold">{fund.totalProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Beneficiaries:</span>
                      <span className="font-bold">{fund.beneficiaries.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min((fund.currentAmount / fund.targetAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="w-5 h-5" />
                Housing Development Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Units Planned</TableHead>
                    <TableHead>Units Completed</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>{project.location}</TableCell>
                      <TableCell className="capitalize">{project.projectType.replace('_', ' ')}</TableCell>
                      <TableCell>{formatKES(project.totalCost)}</TableCell>
                      <TableCell>{project.unitsPlanned.toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-green-600">{project.unitsCompleted.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beneficiaries Tab */}
        <TabsContent value="beneficiaries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Housing Beneficiaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>National ID</TableHead>
                    <TableHead>Housing Need</TableHead>
                    <TableHead>Income Level</TableHead>
                    <TableHead>Family Size</TableHead>
                    <TableHead>Total Contributions</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead>Allocation Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiaries.map((beneficiary) => (
                    <TableRow key={beneficiary.employeeId}>
                      <TableCell className="font-medium">{beneficiary.employeeName}</TableCell>
                      <TableCell className="font-mono text-sm">{beneficiary.nationalId}</TableCell>
                      <TableCell className="capitalize">{beneficiary.housingNeed}</TableCell>
                      <TableCell className="capitalize">{beneficiary.incomeLevel.replace('_', ' ')}</TableCell>
                      <TableCell>{beneficiary.familySize}</TableCell>
                      <TableCell className="font-bold text-green-600">{formatKES(beneficiary.totalContributions)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(beneficiary.eligibilityStatus)}>
                          {beneficiary.eligibilityStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(beneficiary.allocationStatus)}>
                          {beneficiary.allocationStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Housing Levy Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="salary-input">Monthly Gross Salary (KES)</Label>
                  <Input
                    id="salary-input"
                    type="number"
                    placeholder="Enter gross salary"
                    onChange={(e) => {
                      const salary = parseFloat(e.target.value) || 0;
                      const result = calculateHousingLevyForSalary(salary);
                      // Could update state to show result
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Calculation Result</h4>
                  <div className="text-sm text-gray-600">
                    Enter a salary amount to see the housing levy calculation
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Levy Rate</p>
                      <p className="text-lg font-bold text-blue-600">1.5%</p>
                      <p className="text-xs text-gray-500">of gross salary</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Maximum Monthly</p>
                      <p className="text-lg font-bold text-green-600">{formatKES(5000)}</p>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Contribution Split</p>
                      <p className="text-lg font-bold text-purple-600">50/50</p>
                      <p className="text-xs text-gray-500">Employee/Employer</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Rate Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Housing Levy Rate</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rateName">Rate Name</Label>
              <Input
                id="rateName"
                value={formData.rateName}
                onChange={(e) => setFormData({...formData, rateName: e.target.value})}
                placeholder="Custom Housing Levy Rate"
              />
              {validationErrors.rateName && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.rateName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="levyRate">Levy Rate (%)</Label>
              <Input
                id="levyRate"
                type="number"
                step="0.1"
                value={formData.levyRate}
                onChange={(e) => setFormData({...formData, levyRate: e.target.value})}
                placeholder="1.5"
              />
              {validationErrors.levyRate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.levyRate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="maxMonthlyDeduction">Max Monthly Deduction (KES)</Label>
              <Input
                id="maxMonthlyDeduction"
                type="number"
                value={formData.maxMonthlyDeduction}
                onChange={(e) => setFormData({...formData, maxMonthlyDeduction: e.target.value})}
                placeholder="5000"
              />
              {validationErrors.maxMonthlyDeduction && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.maxMonthlyDeduction}</p>
              )}
            </div>
            <div>
              <Label htmlFor="minSalaryThreshold">Min Salary Threshold (KES)</Label>
              <Input
                id="minSalaryThreshold"
                type="number"
                value={formData.minSalaryThreshold}
                onChange={(e) => setFormData({...formData, minSalaryThreshold: e.target.value})}
                placeholder="0"
              />
              {validationErrors.minSalaryThreshold && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.minSalaryThreshold}</p>
              )}
            </div>
            <div>
              <Label htmlFor="maxSalaryThreshold">Max Salary Threshold (KES)</Label>
              <Input
                id="maxSalaryThreshold"
                type="number"
                value={formData.maxSalaryThreshold}
                onChange={(e) => setFormData({...formData, maxSalaryThreshold: e.target.value})}
                placeholder="Leave empty for no limit"
              />
            </div>
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
              />
              {validationErrors.effectiveDate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.effectiveDate}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Description of the housing levy rate"
                rows={3}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRate}>
              <Save className="w-4 h-4 mr-2" />
              Add Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HousingLevy;
