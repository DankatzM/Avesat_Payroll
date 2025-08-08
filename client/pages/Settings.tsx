import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Settings,
  Building2,
  Calculator,
  Shield,
  CreditCard,
  Calendar,
  Users,
  FileText,
  Bell,
  Database,
  Plug,
  ClipboardList,
  Save,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  Key,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Camera,
  Palette,
  Clock,
  DollarSign,
  Percent,
  Hash,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  UserX,
  Archive,
  RotateCcw,
  Zap,
  Link,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

// Comprehensive interfaces for settings
interface OrganizationProfile {
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  financialYearStart: string;
  financialYearEnd: string;
  defaultCurrency: string;
  payrollMonthStart: number;
  payrollMonthEnd: number;
  taxPin: string;
  nhifNumber: string;
  nssfNumber: string;
}

interface PayrollRules {
  salaryFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  workingDaysPerMonth: number;
  normalHoursRate: number;
  weekendHoursRate: number;
  publicHolidayRate: number;
  latePenaltyRate: number;
  absenteeismPolicy: string;
  earningsRounding: 'up' | 'down' | 'nearest';
  deductionsRounding: 'up' | 'down' | 'nearest';
  overtimeThreshold: number;
}

interface TaxBracket {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  rate: number;
  personalRelief: number;
  isActive: boolean;
}

interface NHIFBand {
  id: string;
  minSalary: number;
  maxSalary: number;
  contribution: number;
  isActive: boolean;
}

interface AllowanceType {
  id: string;
  name: string;
  description: string;
  isTaxable: boolean;
  isFixed: boolean;
  defaultAmount: number;
  category: string;
  isActive: boolean;
}

interface DeductionType {
  id: string;
  name: string;
  description: string;
  isPercentage: boolean;
  defaultRate: number;
  maxAmount: number;
  priority: number;
  category: string;
  isActive: boolean;
}

interface LeaveType {
  id: string;
  name: string;
  daysEntitled: number;
  accrualType: 'monthly' | 'yearly' | 'on-demand';
  carryForward: boolean;
  maxCarryForward: number;
  expiryMonths: number;
  isActive: boolean;
}

interface UserAccount {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string;
  twoFactorEnabled: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  payrollCompletion: boolean;
  leaveApprovals: boolean;
  deductionUpdates: boolean;
  statutoryDeadlines: boolean;
  systemAlerts: boolean;
}

interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  retentionDays: number;
  lastBackup: string;
}

interface IntegrationSettings {
  accountingSystem: string;
  accountingApiKey: string;
  bankingSystem: string;
  bankingApiKey: string;
  attendanceSystem: string;
  attendanceApiKey: string;
}

const Settings: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Settings state
  const [orgProfile, setOrgProfile] = useState<OrganizationProfile>({
    companyName: 'Avesat Systems Limited',
    address: '123 Business Street',
    city: 'Nairobi',
    postalCode: '00100',
    country: 'Kenya',
    phone: '+254 700 123 456',
    email: 'info@avesatsystems.co.ke',
    website: 'www.avesatsystems.co.ke',
    logo: '',
    financialYearStart: '2024-01-01',
    financialYearEnd: '2024-12-31',
    defaultCurrency: 'KES',
    payrollMonthStart: 1,
    payrollMonthEnd: 31,
    taxPin: 'P051234567A',
    nhifNumber: 'NH001234567',
    nssfNumber: 'NS001234567'
  });

  const [payrollRules, setPayrollRules] = useState<PayrollRules>({
    salaryFrequency: 'monthly',
    workingDaysPerMonth: 22,
    normalHoursRate: 1.0,
    weekendHoursRate: 1.5,
    publicHolidayRate: 2.0,
    latePenaltyRate: 0.5,
    absenteeismPolicy: 'Deduct full day salary for unauthorized absence',
    earningsRounding: 'nearest',
    deductionsRounding: 'nearest',
    overtimeThreshold: 8
  });

  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([
    { id: '1', name: 'Band 1', minAmount: 0, maxAmount: 24000, rate: 10, personalRelief: 2400, isActive: true },
    { id: '2', name: 'Band 2', minAmount: 24001, maxAmount: 32333, rate: 25, personalRelief: 2400, isActive: true },
    { id: '3', name: 'Band 3', minAmount: 32334, maxAmount: 500000, rate: 30, personalRelief: 2400, isActive: true },
    { id: '4', name: 'Band 4', minAmount: 500001, maxAmount: 800000, rate: 32.5, personalRelief: 2400, isActive: true },
    { id: '5', name: 'Band 5', minAmount: 800001, maxAmount: 999999999, rate: 35, personalRelief: 2400, isActive: true }
  ]);

  const [nhifBands, setNhifBands] = useState<NHIFBand[]>([
    { id: '1', minSalary: 0, maxSalary: 5999, contribution: 150, isActive: true },
    { id: '2', minSalary: 6000, maxSalary: 7999, contribution: 300, isActive: true },
    { id: '3', minSalary: 8000, maxSalary: 11999, contribution: 400, isActive: true },
    { id: '4', minSalary: 12000, maxSalary: 14999, contribution: 500, isActive: true },
    { id: '5', minSalary: 15000, maxSalary: 19999, contribution: 600, isActive: true },
    { id: '6', minSalary: 20000, maxSalary: 24999, contribution: 750, isActive: true },
    { id: '7', minSalary: 25000, maxSalary: 29999, contribution: 850, isActive: true },
    { id: '8', minSalary: 30000, maxSalary: 34999, contribution: 900, isActive: true },
    { id: '9', minSalary: 35000, maxSalary: 39999, contribution: 950, isActive: true },
    { id: '10', minSalary: 40000, maxSalary: 44999, contribution: 1000, isActive: true },
    { id: '11', minSalary: 45000, maxSalary: 49999, contribution: 1100, isActive: true },
    { id: '12', minSalary: 50000, maxSalary: 59999, contribution: 1200, isActive: true },
    { id: '13', minSalary: 60000, maxSalary: 69999, contribution: 1300, isActive: true },
    { id: '14', minSalary: 70000, maxSalary: 79999, contribution: 1400, isActive: true },
    { id: '15', minSalary: 80000, maxSalary: 89999, contribution: 1500, isActive: true },
    { id: '16', minSalary: 90000, maxSalary: 99999, contribution: 1600, isActive: true },
    { id: '17', minSalary: 100000, maxSalary: 999999999, contribution: 1700, isActive: true }
  ]);

  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([
    { id: '1', name: 'House Allowance', description: 'Housing allowance', isTaxable: true, isFixed: false, defaultAmount: 15000, category: 'accommodation', isActive: true },
    { id: '2', name: 'Transport Allowance', description: 'Transport allowance', isTaxable: true, isFixed: false, defaultAmount: 8000, category: 'transport', isActive: true },
    { id: '3', name: 'Medical Allowance', description: 'Medical allowance', isTaxable: false, isFixed: false, defaultAmount: 5000, category: 'medical', isActive: true },
    { id: '4', name: 'Risk Allowance', description: 'Risk allowance', isTaxable: true, isFixed: false, defaultAmount: 10000, category: 'risk', isActive: true },
    { id: '5', name: 'Lunch Allowance', description: 'Lunch allowance', isTaxable: false, isFixed: true, defaultAmount: 3000, category: 'meals', isActive: true }
  ]);

  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([
    { id: '1', name: 'Company Loan', description: 'Staff loan repayment', isPercentage: false, defaultRate: 0, maxAmount: 50000, priority: 1, category: 'loans', isActive: true },
    { id: '2', name: 'SACCO Savings', description: 'SACCO savings contribution', isPercentage: true, defaultRate: 10, maxAmount: 20000, priority: 2, category: 'savings', isActive: true },
    { id: '3', name: 'Union Dues', description: 'Trade union dues', isPercentage: false, defaultRate: 500, maxAmount: 1000, priority: 3, category: 'dues', isActive: true },
    { id: '4', name: 'Welfare Fund', description: 'Employee welfare fund', isPercentage: true, defaultRate: 2, maxAmount: 5000, priority: 4, category: 'welfare', isActive: true }
  ]);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    { id: '1', name: 'Annual Leave', daysEntitled: 21, accrualType: 'yearly', carryForward: true, maxCarryForward: 7, expiryMonths: 12, isActive: true },
    { id: '2', name: 'Sick Leave', daysEntitled: 14, accrualType: 'yearly', carryForward: false, maxCarryForward: 0, expiryMonths: 12, isActive: true },
    { id: '3', name: 'Maternity Leave', daysEntitled: 90, accrualType: 'on-demand', carryForward: false, maxCarryForward: 0, expiryMonths: 0, isActive: true },
    { id: '4', name: 'Paternity Leave', daysEntitled: 14, accrualType: 'on-demand', carryForward: false, maxCarryForward: 0, expiryMonths: 0, isActive: true },
    { id: '5', name: 'Compassionate Leave', daysEntitled: 7, accrualType: 'yearly', carryForward: false, maxCarryForward: 0, expiryMonths: 12, isActive: true }
  ]);

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([
    { id: '1', username: 'admin', email: 'admin@payrollke.co.ke', firstName: 'James', lastName: 'Mwangi', role: UserRole.ADMIN, isActive: true, lastLogin: '2024-01-15T10:30:00Z', twoFactorEnabled: true },
    { id: '2', username: 'hr_manager', email: 'hr@payrollke.co.ke', firstName: 'Grace', lastName: 'Wanjiku', role: UserRole.HR_MANAGER, isActive: true, lastLogin: '2024-01-15T09:15:00Z', twoFactorEnabled: false },
    { id: '3', username: 'payroll_officer', email: 'payroll@payrollke.co.ke', firstName: 'Peter', lastName: 'Kiprotich', role: UserRole.PAYROLL_OFFICER, isActive: true, lastLogin: '2024-01-15T08:45:00Z', twoFactorEnabled: true }
  ]);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    payrollCompletion: true,
    leaveApprovals: true,
    deductionUpdates: false,
    statutoryDeadlines: true,
    systemAlerts: true
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    lastBackup: '2024-01-15T02:00:00Z'
  });

  const [integrations, setIntegrations] = useState<IntegrationSettings>({
    accountingSystem: 'quickbooks',
    accountingApiKey: '',
    bankingSystem: 'equity_bank',
    bankingApiKey: '',
    attendanceSystem: 'biometric',
    attendanceApiKey: ''
  });

  // Check permissions
  const canManageSettings = hasAnyRole([UserRole.ADMIN]);
  const canViewSettings = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER]);

  if (!canViewSettings) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view system settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const saveSettings = async (settingType: string) => {
    if (!canManageSettings) {
      alert('You do not have permission to modify settings.');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date().toISOString());
      alert(`${settingType} settings saved successfully!`);
    } catch (error) {
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadBackup = () => {
    // Simulate backup download
    alert('Backup file download started. Check your downloads folder.');
  };

  const restoreBackup = () => {
    if (confirm('Are you sure you want to restore from backup? This will overwrite current data.')) {
      alert('Backup restore initiated. System will restart after completion.');
    }
  };

  const testIntegration = (system: string) => {
    alert(`Testing ${system} integration... Connection successful!`);
  };

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'payroll-rules', label: 'Payroll Rules', icon: Calculator },
    { id: 'statutory', label: 'Statutory Rates', icon: Shield },
    { id: 'allowances', label: 'Allowances', icon: DollarSign },
    { id: 'deductions', label: 'Deductions', icon: CreditCard },
    { id: 'leave', label: 'Leave Settings', icon: Calendar },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'audit', label: 'Audit & Logs', icon: ClipboardList }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure and manage your payroll system settings</p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="text-sm text-gray-500">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </div>
          )}
          <Badge className={canManageSettings ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            <Shield className="w-4 h-4 mr-1" />
            {canManageSettings ? 'Full Access' : 'Read Only'}
          </Badge>
        </div>
      </div>

      {/* Main Settings Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* 1. Organization Profile */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={orgProfile.companyName}
                      onChange={(e) => setOrgProfile({...orgProfile, companyName: e.target.value})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={orgProfile.address}
                      onChange={(e) => setOrgProfile({...orgProfile, address: e.target.value})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={orgProfile.city}
                        onChange={(e) => setOrgProfile({...orgProfile, city: e.target.value})}
                        disabled={!canManageSettings}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={orgProfile.postalCode}
                        onChange={(e) => setOrgProfile({...orgProfile, postalCode: e.target.value})}
                        disabled={!canManageSettings}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={orgProfile.phone}
                      onChange={(e) => setOrgProfile({...orgProfile, phone: e.target.value})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orgProfile.email}
                      onChange={(e) => setOrgProfile({...orgProfile, email: e.target.value})}
                      disabled={!canManageSettings}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={orgProfile.website}
                      onChange={(e) => setOrgProfile({...orgProfile, website: e.target.value})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="financialYearStart">Financial Year Start</Label>
                      <Input
                        id="financialYearStart"
                        type="date"
                        value={orgProfile.financialYearStart}
                        onChange={(e) => setOrgProfile({...orgProfile, financialYearStart: e.target.value})}
                        disabled={!canManageSettings}
                      />
                    </div>
                    <div>
                      <Label htmlFor="financialYearEnd">Financial Year End</Label>
                      <Input
                        id="financialYearEnd"
                        type="date"
                        value={orgProfile.financialYearEnd}
                        onChange={(e) => setOrgProfile({...orgProfile, financialYearEnd: e.target.value})}
                        disabled={!canManageSettings}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Select value={orgProfile.defaultCurrency} onValueChange={(value) => setOrgProfile({...orgProfile, defaultCurrency: value})} disabled={!canManageSettings}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="taxPin">KRA PIN</Label>
                      <Input
                        id="taxPin"
                        value={orgProfile.taxPin}
                        onChange={(e) => setOrgProfile({...orgProfile, taxPin: e.target.value})}
                        disabled={!canManageSettings}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nhifNumber">NHIF Number</Label>
                      <Input
                        id="nhifNumber"
                        value={orgProfile.nhifNumber}
                        onChange={(e) => setOrgProfile({...orgProfile, nhifNumber: e.target.value})}
                        disabled={!canManageSettings}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nssfNumber">NSSF Number</Label>
                      <Input
                        id="nssfNumber"
                        value={orgProfile.nssfNumber}
                        onChange={(e) => setOrgProfile({...orgProfile, nssfNumber: e.target.value})}
                        disabled={!canManageSettings}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {canManageSettings && (
                <div className="flex justify-end">
                  <Button onClick={() => saveSettings('Organization')} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Organization Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Payroll Rules & Policies */}
        <TabsContent value="payroll-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Payroll Rules & Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="salaryFrequency">Salary Frequency</Label>
                    <Select value={payrollRules.salaryFrequency} onValueChange={(value) => setPayrollRules({...payrollRules, salaryFrequency: value as any})} disabled={!canManageSettings}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="workingDaysPerMonth">Working Days per Month</Label>
                    <Input
                      id="workingDaysPerMonth"
                      type="number"
                      value={payrollRules.workingDaysPerMonth}
                      onChange={(e) => setPayrollRules({...payrollRules, workingDaysPerMonth: Number(e.target.value)})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtimeThreshold">Overtime Threshold (hours)</Label>
                    <Input
                      id="overtimeThreshold"
                      type="number"
                      value={payrollRules.overtimeThreshold}
                      onChange={(e) => setPayrollRules({...payrollRules, overtimeThreshold: Number(e.target.value)})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div>
                    <Label htmlFor="normalHoursRate">Normal Hours Rate Multiplier</Label>
                    <Input
                      id="normalHoursRate"
                      type="number"
                      step="0.1"
                      value={payrollRules.normalHoursRate}
                      onChange={(e) => setPayrollRules({...payrollRules, normalHoursRate: Number(e.target.value)})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekendHoursRate">Weekend Hours Rate Multiplier</Label>
                    <Input
                      id="weekendHoursRate"
                      type="number"
                      step="0.1"
                      value={payrollRules.weekendHoursRate}
                      onChange={(e) => setPayrollRules({...payrollRules, weekendHoursRate: Number(e.target.value)})}
                      disabled={!canManageSettings}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="publicHolidayRate">Public Holiday Rate Multiplier</Label>
                    <Input
                      id="publicHolidayRate"
                      type="number"
                      step="0.1"
                      value={payrollRules.publicHolidayRate}
                      onChange={(e) => setPayrollRules({...payrollRules, publicHolidayRate: Number(e.target.value)})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div>
                    <Label htmlFor="latePenaltyRate">Late Penalty Rate (%)</Label>
                    <Input
                      id="latePenaltyRate"
                      type="number"
                      step="0.1"
                      value={payrollRules.latePenaltyRate}
                      onChange={(e) => setPayrollRules({...payrollRules, latePenaltyRate: Number(e.target.value)})}
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div>
                    <Label htmlFor="earningsRounding">Earnings Rounding</Label>
                    <Select value={payrollRules.earningsRounding} onValueChange={(value) => setPayrollRules({...payrollRules, earningsRounding: value as any})} disabled={!canManageSettings}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">Round Up</SelectItem>
                        <SelectItem value="down">Round Down</SelectItem>
                        <SelectItem value="nearest">Round to Nearest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deductionsRounding">Deductions Rounding</Label>
                    <Select value={payrollRules.deductionsRounding} onValueChange={(value) => setPayrollRules({...payrollRules, deductionsRounding: value as any})} disabled={!canManageSettings}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">Round Up</SelectItem>
                        <SelectItem value="down">Round Down</SelectItem>
                        <SelectItem value="nearest">Round to Nearest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="absenteeismPolicy">Absenteeism Policy</Label>
                    <Textarea
                      id="absenteeismPolicy"
                      value={payrollRules.absenteeismPolicy}
                      onChange={(e) => setPayrollRules({...payrollRules, absenteeismPolicy: e.target.value})}
                      disabled={!canManageSettings}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              {canManageSettings && (
                <div className="flex justify-end">
                  <Button onClick={() => saveSettings('Payroll Rules')} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Payroll Rules
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Statutory Rates & Compliance */}
        <TabsContent value="statutory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                PAYE Tax Brackets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Band Name</TableHead>
                    <TableHead>Min Amount (KES)</TableHead>
                    <TableHead>Max Amount (KES)</TableHead>
                    <TableHead>Rate (%)</TableHead>
                    <TableHead>Personal Relief</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxBrackets.map((bracket) => (
                    <TableRow key={bracket.id}>
                      <TableCell>{bracket.name}</TableCell>
                      <TableCell>{formatKES(bracket.minAmount)}</TableCell>
                      <TableCell>{bracket.maxAmount === 999999999 ? 'No Limit' : formatKES(bracket.maxAmount)}</TableCell>
                      <TableCell>{bracket.rate}%</TableCell>
                      <TableCell>{formatKES(bracket.personalRelief)}</TableCell>
                      <TableCell>
                        <Badge variant={bracket.isActive ? "default" : "secondary"}>
                          {bracket.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageSettings && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                NHIF Contribution Bands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Band</TableHead>
                    <TableHead>Min Salary</TableHead>
                    <TableHead>Max Salary</TableHead>
                    <TableHead>Contribution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nhifBands.slice(0, 10).map((band) => (
                    <TableRow key={band.id}>
                      <TableCell>Band {band.id}</TableCell>
                      <TableCell>{formatKES(band.minSalary)}</TableCell>
                      <TableCell>{band.maxSalary === 999999999 ? 'No Limit' : formatKES(band.maxSalary)}</TableCell>
                      <TableCell>{formatKES(band.contribution)}</TableCell>
                      <TableCell>
                        <Badge variant={band.isActive ? "default" : "secondary"}>
                          {band.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageSettings && (
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Button variant="outline">View All NHIF Bands</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Statutory Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nssfRate">NSSF Rate (%)</Label>
                  <Input id="nssfRate" type="number" defaultValue="6" disabled={!canManageSettings} />
                </div>
                <div>
                  <Label htmlFor="nssfCeiling">NSSF Ceiling (KES)</Label>
                  <Input id="nssfCeiling" type="number" defaultValue="36000" disabled={!canManageSettings} />
                </div>
                <div>
                  <Label htmlFor="housingLevy">Housing Levy Rate (%)</Label>
                  <Input id="housingLevy" type="number" step="0.1" defaultValue="1.5" disabled={!canManageSettings} />
                </div>
                <div>
                  <Label htmlFor="helbRate">HELB Recovery Rate (%)</Label>
                  <Input id="helbRate" type="number" step="0.1" defaultValue="1.0" disabled={!canManageSettings} />
                </div>
              </div>
              
              {canManageSettings && (
                <div className="flex justify-end">
                  <Button onClick={() => saveSettings('Statutory Rates')} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Statutory Rates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Allowances & Benefits */}
        <TabsContent value="allowances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Allowance Types
                </div>
                {canManageSettings && (
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Allowance
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Allowance Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Default Amount</TableHead>
                    <TableHead>Taxable</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowanceTypes.map((allowance) => (
                    <TableRow key={allowance.id}>
                      <TableCell className="font-medium">{allowance.name}</TableCell>
                      <TableCell className="capitalize">{allowance.category}</TableCell>
                      <TableCell>{formatKES(allowance.defaultAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={allowance.isTaxable ? "destructive" : "default"}>
                          {allowance.isTaxable ? 'Taxable' : 'Non-Taxable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {allowance.isFixed ? 'Fixed' : 'Variable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={allowance.isActive ? "default" : "secondary"}>
                          {allowance.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageSettings && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Deductions */}
        <TabsContent value="deductions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Deduction Types
                </div>
                {canManageSettings && (
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deduction
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deduction Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Default Rate/Amount</TableHead>
                    <TableHead>Max Amount</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductionTypes.map((deduction) => (
                    <TableRow key={deduction.id}>
                      <TableCell className="font-medium">{deduction.name}</TableCell>
                      <TableCell className="capitalize">{deduction.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deduction.isPercentage ? 'Percentage' : 'Fixed Amount'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deduction.isPercentage 
                          ? `${deduction.defaultRate}%` 
                          : formatKES(deduction.defaultRate)
                        }
                      </TableCell>
                      <TableCell>{formatKES(deduction.maxAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{deduction.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deduction.isActive ? "default" : "secondary"}>
                          {deduction.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageSettings && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Leave Settings */}
        <TabsContent value="leave" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Leave Types Configuration
                </div>
                {canManageSettings && (
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Leave Type
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Days Entitled</TableHead>
                    <TableHead>Accrual Type</TableHead>
                    <TableHead>Carry Forward</TableHead>
                    <TableHead>Max Carry Forward</TableHead>
                    <TableHead>Expiry (Months)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.name}</TableCell>
                      <TableCell>{leave.daysEntitled}</TableCell>
                      <TableCell className="capitalize">{leave.accrualType}</TableCell>
                      <TableCell>
                        <Badge variant={leave.carryForward ? "default" : "secondary"}>
                          {leave.carryForward ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>{leave.maxCarryForward}</TableCell>
                      <TableCell>{leave.expiryMonths || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={leave.isActive ? "default" : "secondary"}>
                          {leave.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageSettings && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. User Management & Roles */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Accounts
                </div>
                {canManageSettings && (
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.username}</TableCell>
                      <TableCell>{account.firstName} {account.lastName}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>
                        <Badge className="capitalize">{account.role.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.twoFactorEnabled ? "default" : "secondary"}>
                          {account.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(account.lastLogin).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageSettings && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Lock className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. Payslip & Report Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Payslip Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payslipLogo">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <Input type="file" accept="image/*" disabled={!canManageSettings} />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="payslipColor">Primary Color</Label>
                  <Input type="color" defaultValue="#3b82f6" disabled={!canManageSettings} />
                </div>
                <div>
                  <Label htmlFor="payslipDisclaimer">Disclaimer Text</Label>
                  <Textarea 
                    defaultValue="This payslip is computer generated and does not require a signature."
                    disabled={!canManageSettings}
                    rows={3}
                  />
                </div>
                {canManageSettings && (
                  <Button className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Payslip Template
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Report Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Export Formats</Label>
                  <div className="space-y-2">
                    {['PDF', 'Excel', 'CSV'].map((format) => (
                      <div key={format} className="flex items-center space-x-2">
                        <Switch disabled={!canManageSettings} defaultChecked />
                        <Label>{format}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="reportHeader">Report Header</Label>
                  <Input 
                    defaultValue="Avesat Systems Limited - Payroll Report"
                    disabled={!canManageSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="reportFooter">Report Footer</Label>
                  <Input 
                    defaultValue="Generated by PayrollKE System"
                    disabled={!canManageSettings}
                  />
                </div>
                {canManageSettings && (
                  <Button className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Report Templates
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 9. Notification & Alerts */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Send notifications via email</p>
                  </div>
                  <Switch 
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Send notifications via SMS</p>
                  </div>
                  <Switch 
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, smsNotifications: checked})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payroll Completion Alerts</Label>
                    <p className="text-sm text-gray-600">Notify when payroll processing is complete</p>
                  </div>
                  <Switch 
                    checked={notifications.payrollCompletion}
                    onCheckedChange={(checked) => setNotifications({...notifications, payrollCompletion: checked})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Leave Approval Notifications</Label>
                    <p className="text-sm text-gray-600">Notify managers of pending leave requests</p>
                  </div>
                  <Switch 
                    checked={notifications.leaveApprovals}
                    onCheckedChange={(checked) => setNotifications({...notifications, leaveApprovals: checked})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Statutory Deadline Reminders</Label>
                    <p className="text-sm text-gray-600">Remind about KRA, NHIF, NSSF submission deadlines</p>
                  </div>
                  <Switch 
                    checked={notifications.statutoryDeadlines}
                    onCheckedChange={(checked) => setNotifications({...notifications, statutoryDeadlines: checked})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Alerts</Label>
                    <p className="text-sm text-gray-600">Critical system notifications</p>
                  </div>
                  <Switch 
                    checked={notifications.systemAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, systemAlerts: checked})}
                    disabled={!canManageSettings}
                  />
                </div>
              </div>
              
              {canManageSettings && (
                <div className="flex justify-end">
                  <Button onClick={() => saveSettings('Notifications')} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Notification Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 10. Backup & Restore */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Automatic Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Auto Backup</Label>
                    <p className="text-sm text-gray-600">Automatically backup database</p>
                  </div>
                  <Switch 
                    checked={backupSettings.autoBackupEnabled}
                    onCheckedChange={(checked) => setBackupSettings({...backupSettings, autoBackupEnabled: checked})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select 
                    value={backupSettings.backupFrequency} 
                    onValueChange={(value) => setBackupSettings({...backupSettings, backupFrequency: value as any})}
                    disabled={!canManageSettings}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="backupTime">Backup Time</Label>
                  <Input 
                    id="backupTime"
                    type="time"
                    value={backupSettings.backupTime}
                    onChange={(e) => setBackupSettings({...backupSettings, backupTime: e.target.value})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="retentionDays">Retention Days</Label>
                  <Input 
                    id="retentionDays"
                    type="number"
                    value={backupSettings.retentionDays}
                    onChange={(e) => setBackupSettings({...backupSettings, retentionDays: Number(e.target.value)})}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Last Backup:</strong> {new Date(backupSettings.lastBackup).toLocaleString()}</p>
                </div>
                {canManageSettings && (
                  <Button onClick={() => saveSettings('Backup')} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Backup Settings
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Manual Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Create Manual Backup</Label>
                  <p className="text-sm text-gray-600 mb-2">Generate a backup file now</p>
                  <Button onClick={downloadBackup} className="w-full" disabled={!canManageSettings}>
                    <Download className="w-4 h-4 mr-2" />
                    Create & Download Backup
                  </Button>
                </div>
                
                <div>
                  <Label>Restore from Backup</Label>
                  <p className="text-sm text-gray-600 mb-2">Upload and restore backup file</p>
                  <div className="space-y-2">
                    <Input type="file" accept=".sql,.backup" disabled={!canManageSettings} />
                    <Button onClick={restoreBackup} variant="destructive" className="w-full" disabled={!canManageSettings}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore from Backup
                    </Button>
                  </div>
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Restore operations will overwrite all current data. Ensure you have a recent backup before proceeding.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 11. Integration Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5" />
                  Accounting Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="accountingSystem">Accounting System</Label>
                  <Select 
                    value={integrations.accountingSystem} 
                    onValueChange={(value) => setIntegrations({...integrations, accountingSystem: value})}
                    disabled={!canManageSettings}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quickbooks">QuickBooks</SelectItem>
                      <SelectItem value="sage">Sage</SelectItem>
                      <SelectItem value="xero">Xero</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountingApiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="accountingApiKey"
                      type="password"
                      value={integrations.accountingApiKey}
                      onChange={(e) => setIntegrations({...integrations, accountingApiKey: e.target.value})}
                      disabled={!canManageSettings}
                      placeholder="Enter API key"
                    />
                    <Button variant="outline" size="sm" disabled={!canManageSettings}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => testIntegration('Accounting')} 
                  variant="outline" 
                  className="w-full"
                  disabled={!canManageSettings}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5" />
                  Banking Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bankingSystem">Banking System</Label>
                  <Select 
                    value={integrations.bankingSystem} 
                    onValueChange={(value) => setIntegrations({...integrations, bankingSystem: value})}
                    disabled={!canManageSettings}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equity_bank">Equity Bank</SelectItem>
                      <SelectItem value="kcb">KCB Bank</SelectItem>
                      <SelectItem value="cooperative_bank">Cooperative Bank</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bankingApiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="bankingApiKey"
                      type="password"
                      value={integrations.bankingApiKey}
                      onChange={(e) => setIntegrations({...integrations, bankingApiKey: e.target.value})}
                      disabled={!canManageSettings}
                      placeholder="Enter API key"
                    />
                    <Button variant="outline" size="sm" disabled={!canManageSettings}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => testIntegration('Banking')} 
                  variant="outline" 
                  className="w-full"
                  disabled={!canManageSettings}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5" />
                  Attendance Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="attendanceSystem">Attendance System</Label>
                  <Select 
                    value={integrations.attendanceSystem} 
                    onValueChange={(value) => setIntegrations({...integrations, attendanceSystem: value})}
                    disabled={!canManageSettings}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="biometric">Biometric System</SelectItem>
                      <SelectItem value="card_reader">Card Reader</SelectItem>
                      <SelectItem value="mobile_app">Mobile App</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="attendanceApiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="attendanceApiKey"
                      type="password"
                      value={integrations.attendanceApiKey}
                      onChange={(e) => setIntegrations({...integrations, attendanceApiKey: e.target.value})}
                      disabled={!canManageSettings}
                      placeholder="Enter API key"
                    />
                    <Button variant="outline" size="sm" disabled={!canManageSettings}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => testIntegration('Attendance')} 
                  variant="outline" 
                  className="w-full"
                  disabled={!canManageSettings}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Accounting System', status: 'connected', system: integrations.accountingSystem },
                    { name: 'Banking System', status: 'disconnected', system: integrations.bankingSystem },
                    { name: 'Attendance System', status: 'connected', system: integrations.attendanceSystem }
                  ].map((integration, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-gray-600 capitalize">{integration.system.replace('_', ' ')}</div>
                      </div>
                      <Badge variant={integration.status === 'connected' ? "default" : "secondary"}>
                        {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 12. Audit & Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Audit Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Audit Trail</Label>
                    <p className="text-sm text-gray-600">Track all system changes</p>
                  </div>
                  <Switch defaultChecked disabled={!canManageSettings} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log User Activities</Label>
                    <p className="text-sm text-gray-600">Record user login/logout activities</p>
                  </div>
                  <Switch defaultChecked disabled={!canManageSettings} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log Data Changes</Label>
                    <p className="text-sm text-gray-600">Track all data modifications</p>
                  </div>
                  <Switch defaultChecked disabled={!canManageSettings} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log Security Events</Label>
                    <p className="text-sm text-gray-600">Record security-related events</p>
                  </div>
                  <Switch defaultChecked disabled={!canManageSettings} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logRetention">Log Retention Period (days)</Label>
                  <Input 
                    id="logRetention"
                    type="number"
                    defaultValue="365"
                    disabled={!canManageSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLogSize">Max Log File Size (MB)</Label>
                  <Input 
                    id="maxLogSize"
                    type="number"
                    defaultValue="100"
                    disabled={!canManageSettings}
                  />
                </div>
              </div>
              
              {canManageSettings && (
                <div className="flex justify-end">
                  <Button onClick={() => saveSettings('Audit')} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Audit Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { timestamp: '2024-01-15 10:30:00', user: 'admin', action: 'Update', module: 'Settings', details: 'Modified payroll rules' },
                    { timestamp: '2024-01-15 10:25:00', user: 'hr_manager', action: 'Create', module: 'Employees', details: 'Added new employee' },
                    { timestamp: '2024-01-15 10:20:00', user: 'payroll_officer', action: 'Calculate', module: 'Payroll', details: 'Processed monthly payroll' },
                    { timestamp: '2024-01-15 10:15:00', user: 'admin', action: 'Login', module: 'Authentication', details: 'User logged in' }
                  ].map((event, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{event.timestamp}</TableCell>
                      <TableCell>{event.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.action}</Badge>
                      </TableCell>
                      <TableCell>{event.module}</TableCell>
                      <TableCell>{event.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
