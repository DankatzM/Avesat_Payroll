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
import {
  PiggyBank,
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
  FileText,
  Shield,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings,
  Database,
  Calculator,
  Users,
  Building2,
  Activity,
  Target,
  Award,
  Clock,
  Percent
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES, calculateNSSF, KENYA_TAX_CONSTANTS } from '@shared/kenya-tax';
import { logTaxAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

interface NSSFTier {
  id: string;
  tierName: string;
  pensionableEarningsMin: number;
  pensionableEarningsMax: number;
  employeeRate: number;
  employerRate: number;
  maxMonthlyContribution: number;
  description: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface NSSFContribution {
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  pensionableEarnings: number;
  tier1Employee: number;
  tier1Employer: number;
  tier2Employee: number;
  tier2Employer: number;
  totalEmployee: number;
  totalEmployer: number;
  totalContribution: number;
  month: string;
  year: number;
  status: 'paid' | 'pending' | 'overdue';
  submissionDate?: string;
  nssfNumber?: string;
}

interface NSSFReport {
  period: string;
  totalEmployees: number;
  totalPensionableEarnings: number;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  totalContributions: number;
  tier1Contributions: number;
  tier2Contributions: number;
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
  submissionStatus: 'submitted' | 'pending' | 'overdue';
}

interface NSSFMember {
  employeeId: string;
  employeeName: string;
  nssfNumber: string;
  dateJoined: string;
  totalContributions: number;
  vested: boolean;
  beneficiaries: number;
  lastContribution: string;
  status: 'active' | 'inactive' | 'exited';
}

const NSSFManagement: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // State management
  const [nssfTiers, setNSSFTiers] = useState<NSSFTier[]>([]);
  const [contributions, setContributions] = useState<NSSFContribution[]>([]);
  const [members, setMembers] = useState<NSSFMember[]>([]);
  const [selectedTab, setSelectedTab] = useState('tiers');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<NSSFTier | null>(null);
  const [selectedMember, setSelectedMember] = useState<NSSFMember | null>(null);
  const [formData, setFormData] = useState({
    tierName: '',
    pensionableEarningsMin: '',
    pensionableEarningsMax: '',
    employeeRate: '',
    employerRate: '',
    maxMonthlyContribution: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth() + 1 + '');
  const [filterYear, setFilterYear] = useState<string>('2025');
  const [filterTier, setFilterTier] = useState<string>('all');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load NSSF data
  useEffect(() => {
    loadNSSFData();
  }, []);

  const loadNSSFData = () => {
    setIsLoading(true);
    
    // NSSF Tiers for 2025 (updated rates)
    const defaultNSSFTiers: NSSFTier[] = [
      {
        id: 'nssf-tier1-2025',
        tierName: 'Tier I',
        pensionableEarningsMin: 0,
        pensionableEarningsMax: 18000,
        employeeRate: 6.0,
        employerRate: 6.0,
        maxMonthlyContribution: 1080,
        description: 'NSSF Tier I - Lower earnings band',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'nssf-tier2-2025',
        tierName: 'Tier II',
        pensionableEarningsMin: 18001,
        pensionableEarningsMax: 36000,
        employeeRate: 6.0,
        employerRate: 6.0,
        maxMonthlyContribution: 1080,
        description: 'NSSF Tier II - Higher earnings band',
        effectiveDate: '2025-01-01',
        status: 'active',
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ];

    // Mock contribution data
    const mockContributions: NSSFContribution[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'John Mwangi',
        grossSalary: 150000,
        pensionableEarnings: 150000,
        tier1Employee: 1080,
        tier1Employer: 1080,
        tier2Employee: 1080,
        tier2Employer: 1080,
        totalEmployee: 2160,
        totalEmployer: 2160,
        totalContribution: 4320,
        month: 'January',
        year: 2025,
        status: 'paid',
        submissionDate: '2025-01-15',
        nssfNumber: 'NSSF001234567'
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Grace Wanjiku',
        grossSalary: 200000,
        pensionableEarnings: 200000,
        tier1Employee: 1080,
        tier1Employer: 1080,
        tier2Employee: 1080,
        tier2Employer: 1080,
        totalEmployee: 2160,
        totalEmployer: 2160,
        totalContribution: 4320,
        month: 'January',
        year: 2025,
        status: 'paid',
        submissionDate: '2025-01-15',
        nssfNumber: 'NSSF001234568'
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Peter Kiprotich',
        grossSalary: 80000,
        pensionableEarnings: 80000,
        tier1Employee: 1080,
        tier1Employer: 1080,
        tier2Employee: 1080,
        tier2Employer: 1080,
        totalEmployee: 2160,
        totalEmployer: 2160,
        totalContribution: 4320,
        month: 'January',
        year: 2025,
        status: 'pending',
        nssfNumber: 'NSSF001234569'
      },
      {
        employeeId: 'EMP004',
        employeeName: 'Mary Achieng',
        grossSalary: 45000,
        pensionableEarnings: 45000,
        tier1Employee: 1080,
        tier1Employer: 1080,
        tier2Employee: 1080,
        tier2Employer: 1080,
        totalEmployee: 2160,
        totalEmployer: 2160,
        totalContribution: 4320,
        month: 'January',
        year: 2025,
        status: 'paid',
        submissionDate: '2025-01-15',
        nssfNumber: 'NSSF001234570'
      },
      {
        employeeId: 'EMP005',
        employeeName: 'Samuel Otieno',
        grossSalary: 15000,
        pensionableEarnings: 15000,
        tier1Employee: 900,
        tier1Employer: 900,
        tier2Employee: 0,
        tier2Employer: 0,
        totalEmployee: 900,
        totalEmployer: 900,
        totalContribution: 1800,
        month: 'January',
        year: 2025,
        status: 'paid',
        submissionDate: '2025-01-15',
        nssfNumber: 'NSSF001234571'
      }
    ];

    // Mock member data
    const mockMembers: NSSFMember[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'John Mwangi',
        nssfNumber: 'NSSF001234567',
        dateJoined: '2020-01-15',
        totalContributions: 259200, // 5 years worth
        vested: true,
        beneficiaries: 2,
        lastContribution: '2025-01-15',
        status: 'active'
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Grace Wanjiku',
        nssfNumber: 'NSSF001234568',
        dateJoined: '2018-03-20',
        totalContributions: 362880, // 7 years worth
        vested: true,
        beneficiaries: 3,
        lastContribution: '2025-01-15',
        status: 'active'
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Peter Kiprotich',
        nssfNumber: 'NSSF001234569',
        dateJoined: '2022-06-10',
        totalContributions: 138240, // 2.5 years worth
        vested: false,
        beneficiaries: 1,
        lastContribution: '2024-12-15',
        status: 'active'
      },
      {
        employeeId: 'EMP004',
        employeeName: 'Mary Achieng',
        nssfNumber: 'NSSF001234570',
        dateJoined: '2021-08-01',
        totalContributions: 186624, // 3.5 years worth
        vested: true,
        beneficiaries: 1,
        lastContribution: '2025-01-15',
        status: 'active'
      },
      {
        employeeId: 'EMP005',
        employeeName: 'Samuel Otieno',
        nssfNumber: 'NSSF001234571',
        dateJoined: '2023-04-15',
        totalContributions: 36000, // 1.5 years worth
        vested: false,
        beneficiaries: 0,
        lastContribution: '2025-01-15',
        status: 'active'
      }
    ];

    setNSSFTiers(defaultNSSFTiers);
    setContributions(mockContributions);
    setMembers(mockMembers);
    setIsLoading(false);
  };

  const calculateNSSFForSalary = (grossSalary: number): { tier1: number; tier2: number; total: number; breakdown: any } => {
    const nssfResult = calculateNSSF(grossSalary);
    
    return {
      tier1: nssfResult.tier1,
      tier2: nssfResult.tier2,
      total: nssfResult.total,
      breakdown: {
        tier1Employee: nssfResult.tier1,
        tier1Employer: nssfResult.tier1,
        tier2Employee: nssfResult.tier2,
        tier2Employer: nssfResult.tier2,
        totalEmployee: nssfResult.tier1 + nssfResult.tier2,
        totalEmployer: nssfResult.tier1 + nssfResult.tier2,
        grandTotal: (nssfResult.tier1 + nssfResult.tier2) * 2
      }
    };
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.tierName) {
      errors.tierName = 'Tier name is required';
    }

    if (!formData.pensionableEarningsMin || parseFloat(formData.pensionableEarningsMin) < 0) {
      errors.pensionableEarningsMin = 'Minimum pensionable earnings is required and must be 0 or greater';
    }

    if (!formData.pensionableEarningsMax || parseFloat(formData.pensionableEarningsMax) <= parseFloat(formData.pensionableEarningsMin)) {
      errors.pensionableEarningsMax = 'Maximum pensionable earnings must be greater than minimum';
    }

    if (!formData.employeeRate || parseFloat(formData.employeeRate) < 0 || parseFloat(formData.employeeRate) > 100) {
      errors.employeeRate = 'Employee contribution rate must be between 0% and 100%';
    }

    if (!formData.employerRate || parseFloat(formData.employerRate) < 0 || parseFloat(formData.employerRate) > 100) {
      errors.employerRate = 'Employer contribution rate must be between 0% and 100%';
    }

    if (!formData.maxMonthlyContribution || parseFloat(formData.maxMonthlyContribution) < 0) {
      errors.maxMonthlyContribution = 'Maximum monthly contribution must be 0 or greater';
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

  const handleAddTier = () => {
    if (!validateForm()) return;

    const newTier: NSSFTier = {
      id: `custom-${Date.now()}`,
      tierName: formData.tierName,
      pensionableEarningsMin: parseFloat(formData.pensionableEarningsMin),
      pensionableEarningsMax: parseFloat(formData.pensionableEarningsMax),
      employeeRate: parseFloat(formData.employeeRate),
      employerRate: parseFloat(formData.employerRate),
      maxMonthlyContribution: parseFloat(formData.maxMonthlyContribution),
      description: formData.description,
      effectiveDate: formData.effectiveDate,
      status: 'active',
      createdBy: user?.id || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNSSFTiers(prev => [...prev, newTier]);
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
      `nssf_tier_${newTier.id}`,
      undefined,
      newTier
    );
  };

  const resetForm = () => {
    setFormData({
      tierName: '',
      pensionableEarningsMin: '',
      pensionableEarningsMax: '',
      employeeRate: '',
      employerRate: '',
      maxMonthlyContribution: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
    setValidationErrors({});
  };

  const openEditDialog = (tier: NSSFTier) => {
    setSelectedTier(tier);
    setFormData({
      tierName: tier.tierName,
      pensionableEarningsMin: tier.pensionableEarningsMin.toString(),
      pensionableEarningsMax: tier.pensionableEarningsMax === 999999999 ? '' : tier.pensionableEarningsMax.toString(),
      employeeRate: tier.employeeRate.toString(),
      employerRate: tier.employerRate.toString(),
      maxMonthlyContribution: tier.maxMonthlyContribution.toString(),
      description: tier.description,
      effectiveDate: tier.effectiveDate
    });
    setShowEditDialog(true);
  };

  const exportContributions = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      period: `${filterMonth}/${filterYear}`,
      tier: filterTier,
      contributions: getFilteredContributions(),
      summary: {
        totalEmployees: getFilteredContributions().length,
        totalContributions: getFilteredContributions().reduce((sum, c) => sum + c.totalContribution, 0),
        tier1Total: getFilteredContributions().reduce((sum, c) => sum + c.tier1Employee + c.tier1Employer, 0),
        tier2Total: getFilteredContributions().reduce((sum, c) => sum + c.tier2Employee + c.tier2Employer, 0)
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nssf-contributions-${filterMonth}-${filterYear}.json`;
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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'exited': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredTiers = () => {
    return nssfTiers.filter(tier => {
      const statusMatch = filterStatus === 'all' || tier.status === filterStatus;
      return statusMatch;
    }).sort((a, b) => a.pensionableEarningsMin - b.pensionableEarningsMin);
  };

  const getFilteredContributions = () => {
    return contributions.filter(contribution => {
      const statusMatch = filterStatus === 'all' || contribution.status === filterStatus;
      const tierMatch = filterTier === 'all' || true; // Could implement tier filtering
      return statusMatch && tierMatch;
    });
  };

  const getFilteredMembers = () => {
    return members.filter(member => {
      const statusMatch = filterStatus === 'all' || member.status === filterStatus;
      return statusMatch;
    });
  };

  // Check permissions
  const canManageTax = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER]);
  const canEditTiers = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);

  if (!canManageTax) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the NSSF Management module. 
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
          <h1 className="text-3xl font-bold text-gray-900">NSSF Management</h1>
          <p className="text-gray-600">National Social Security Fund (NSSF) pension contribution management for 2025</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            NSSF 2025 Compliant
          </Badge>
          <Badge variant="outline">
            <PiggyBank className="w-4 h-4 mr-1" />
            {nssfTiers.filter(t => t.status === 'active').length} Active Tiers
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{members.filter(m => m.status === 'active').length}</p>
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
                <p className="text-sm font-medium text-gray-600">Vested Members</p>
                <p className="text-2xl font-bold">{members.filter(m => m.vested).length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((contributions.filter(c => c.status === 'paid').length / contributions.length) * 100)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fund</p>
                <p className="text-2xl font-bold">
                  {formatKES(members.reduce((sum, m) => sum + m.totalContributions, 0))}
                </p>
              </div>
              <Target className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-5">
            <TabsTrigger value="tiers">NSSF Tiers</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {canEditTiers && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Tier
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
              onClick={loadNSSFData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* NSSF Tiers Tab */}
        <TabsContent value="tiers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5" />
                NSSF Contribution Tiers (2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading NSSF tiers...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Pensionable Earnings Range</TableHead>
                      <TableHead>Employee Rate</TableHead>
                      <TableHead>Employer Rate</TableHead>
                      <TableHead>Max Monthly Contribution</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredTiers().map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-bold">{tier.tierName}</TableCell>
                        <TableCell className="font-mono">
                          {formatKES(tier.pensionableEarningsMin)} - {tier.pensionableEarningsMax === 999999999 ? 'Above' : formatKES(tier.pensionableEarningsMax)}
                        </TableCell>
                        <TableCell className="text-blue-600">{tier.employeeRate}%</TableCell>
                        <TableCell className="text-green-600">{tier.employerRate}%</TableCell>
                        <TableCell className="font-bold text-purple-600">{formatKES(tier.maxMonthlyContribution)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tier.status)}>
                            {tier.status}
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
                              <DropdownMenuItem onClick={() => openEditDialog(tier)}>
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
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
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
                <div>
                  <Label htmlFor="year-filter">Year</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
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
                Employee NSSF Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>NSSF Number</TableHead>
                    <TableHead>Pensionable Earnings</TableHead>
                    <TableHead>Employee Total</TableHead>
                    <TableHead>Employer Total</TableHead>
                    <TableHead>Grand Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredContributions().map((contribution) => (
                    <TableRow key={contribution.employeeId}>
                      <TableCell className="font-medium">{contribution.employeeName}</TableCell>
                      <TableCell className="font-mono text-sm">{contribution.nssfNumber}</TableCell>
                      <TableCell>{formatKES(contribution.pensionableEarnings)}</TableCell>
                      <TableCell className="text-blue-600">{formatKES(contribution.totalEmployee)}</TableCell>
                      <TableCell className="text-green-600">{formatKES(contribution.totalEmployer)}</TableCell>
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

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                NSSF Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>NSSF Number</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead>Total Contributions</TableHead>
                    <TableHead>Vested</TableHead>
                    <TableHead>Beneficiaries</TableHead>
                    <TableHead>Last Contribution</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredMembers().map((member) => (
                    <TableRow key={member.employeeId}>
                      <TableCell className="font-medium">{member.employeeName}</TableCell>
                      <TableCell className="font-mono text-sm">{member.nssfNumber}</TableCell>
                      <TableCell>{new Date(member.dateJoined).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold text-green-600">{formatKES(member.totalContributions)}</TableCell>
                      <TableCell>
                        <Badge className={member.vested ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {member.vested ? 'Vested' : 'Not Vested'}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.beneficiaries}</TableCell>
                      <TableCell>{new Date(member.lastContribution).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
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
                NSSF Contribution Calculator
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
                      const result = calculateNSSFForSalary(salary);
                      // Could update state to show result
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Calculation Breakdown</h4>
                  <div className="text-sm text-gray-600">
                    Enter a salary amount to see the NSSF contribution calculation
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Tier I Contribution</p>
                      <p className="text-lg font-bold text-blue-600">6% + 6%</p>
                      <p className="text-xs text-gray-500">Employee + Employer</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Tier II Contribution</p>
                      <p className="text-lg font-bold text-green-600">6% + 6%</p>
                      <p className="text-xs text-gray-500">Employee + Employer</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Max Monthly</p>
                      <p className="text-lg font-bold text-purple-600">{formatKES(2160)}</p>
                      <p className="text-xs text-gray-500">Combined Total</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">NSSF Reports</h3>
              <p className="text-gray-600">Comprehensive NSSF reporting and analytics will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Tier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New NSSF Tier</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tierName">Tier Name</Label>
              <Input
                id="tierName"
                value={formData.tierName}
                onChange={(e) => setFormData({...formData, tierName: e.target.value})}
                placeholder="Tier III"
              />
              {validationErrors.tierName && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.tierName}</p>
              )}
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
            <div>
              <Label htmlFor="pensionableEarningsMin">Min Pensionable Earnings (KES)</Label>
              <Input
                id="pensionableEarningsMin"
                type="number"
                value={formData.pensionableEarningsMin}
                onChange={(e) => setFormData({...formData, pensionableEarningsMin: e.target.value})}
                placeholder="36001"
              />
              {validationErrors.pensionableEarningsMin && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.pensionableEarningsMin}</p>
              )}
            </div>
            <div>
              <Label htmlFor="pensionableEarningsMax">Max Pensionable Earnings (KES)</Label>
              <Input
                id="pensionableEarningsMax"
                type="number"
                value={formData.pensionableEarningsMax}
                onChange={(e) => setFormData({...formData, pensionableEarningsMax: e.target.value})}
                placeholder="54000"
              />
              {validationErrors.pensionableEarningsMax && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.pensionableEarningsMax}</p>
              )}
            </div>
            <div>
              <Label htmlFor="employeeRate">Employee Rate (%)</Label>
              <Input
                id="employeeRate"
                type="number"
                step="0.1"
                value={formData.employeeRate}
                onChange={(e) => setFormData({...formData, employeeRate: e.target.value})}
                placeholder="6.0"
              />
              {validationErrors.employeeRate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.employeeRate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="employerRate">Employer Rate (%)</Label>
              <Input
                id="employerRate"
                type="number"
                step="0.1"
                value={formData.employerRate}
                onChange={(e) => setFormData({...formData, employerRate: e.target.value})}
                placeholder="6.0"
              />
              {validationErrors.employerRate && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.employerRate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="maxMonthlyContribution">Max Monthly Contribution (KES)</Label>
              <Input
                id="maxMonthlyContribution"
                type="number"
                value={formData.maxMonthlyContribution}
                onChange={(e) => setFormData({...formData, maxMonthlyContribution: e.target.value})}
                placeholder="1080"
              />
              {validationErrors.maxMonthlyContribution && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.maxMonthlyContribution}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="NSSF Tier III - Highest earnings band"
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
            <Button onClick={handleAddTier}>
              <Save className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NSSFManagement;
