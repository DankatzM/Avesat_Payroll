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
  Calculator,
  Clock,
  DollarSign,
  Percent,
  Calendar,
  AlertTriangle,
  Save,
  RefreshCw,
  Info,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  History,
  FileText,
  Download,
  Upload,
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface PayrollRule {
  id: string;
  name: string;
  category: 'calculation' | 'policy' | 'compliance' | 'overtime' | 'deduction';
  description: string;
  ruleType: 'fixed' | 'percentage' | 'formula' | 'conditional';
  value: number | string;
  isActive: boolean;
  effectiveDate: string;
  expiryDate?: string;
  priority: number;
  conditions?: string;
  formula?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

interface PayrollConfiguration {
  salaryFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  normalHoursRate: number;
  weekendHoursRate: number;
  publicHolidayRate: number;
  nightShiftRate: number;
  overtimeThreshold: number;
  latePenaltyRate: number;
  absenteeismPolicy: string;
  earningsRounding: 'up' | 'down' | 'nearest';
  deductionsRounding: 'up' | 'down' | 'nearest';
  minimumWage: number;
  probationPeriod: number;
  retirementAge: number;
  autoCalculateOvertime: boolean;
  allowNegativeNet: boolean;
  enforceMinimumWage: boolean;
}

interface PayrollCalendar {
  id: string;
  month: number;
  year: number;
  payrollStartDate: string;
  payrollEndDate: string;
  payrollDate: string;
  cutoffDate: string;
  isProcessed: boolean;
  status: 'pending' | 'processing' | 'completed' | 'archived';
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  category: string;
}

export default function PayrollRules() {
  const { user, hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState('configuration');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // State for payroll configuration
  const [config, setConfig] = useState<PayrollConfiguration>({
    salaryFrequency: 'monthly',
    workingDaysPerMonth: 22,
    workingHoursPerDay: 8,
    normalHoursRate: 1.0,
    weekendHoursRate: 1.5,
    publicHolidayRate: 2.0,
    nightShiftRate: 1.25,
    overtimeThreshold: 8,
    latePenaltyRate: 0.5,
    absenteeismPolicy: 'Deduct full day salary for unauthorized absence. Three consecutive days of absence without notice will result in disciplinary action.',
    earningsRounding: 'nearest',
    deductionsRounding: 'nearest',
    minimumWage: 15000,
    probationPeriod: 6,
    retirementAge: 60,
    autoCalculateOvertime: true,
    allowNegativeNet: false,
    enforceMinimumWage: true,
  });

  // State for custom payroll rules
  const [customRules, setCustomRules] = useState<PayrollRule[]>([
    {
      id: '1',
      name: 'Transport Allowance Calculation',
      category: 'calculation',
      description: 'Calculate transport allowance based on distance from office',
      ruleType: 'formula',
      value: 'distance * 50',
      isActive: true,
      effectiveDate: '2024-01-01',
      priority: 1,
      formula: 'IF(distance <= 10, distance * 50, IF(distance <= 25, 500 + (distance - 10) * 30, 950 + (distance - 25) * 20))',
      createdBy: 'admin@avesat.co.ke',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-03-15T00:00:00Z',
    },
    {
      id: '2',
      name: 'Late Coming Penalty',
      category: 'policy',
      description: 'Deduction for late arrivals exceeding 15 minutes',
      ruleType: 'conditional',
      value: 0.5,
      isActive: true,
      effectiveDate: '2024-01-01',
      priority: 2,
      conditions: 'late_minutes > 15',
      formula: '(late_minutes - 15) * (daily_salary / (8 * 60)) * 0.5',
      createdBy: 'hr@avesat.co.ke',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-02-10T00:00:00Z',
    },
    {
      id: '3',
      name: 'Performance Bonus',
      category: 'calculation',
      description: 'Monthly performance bonus calculation',
      ruleType: 'percentage',
      value: 10,
      isActive: true,
      effectiveDate: '2024-01-01',
      priority: 3,
      conditions: 'performance_score >= 85',
      formula: 'basic_salary * (performance_score - 80) / 100',
      createdBy: 'admin@avesat.co.ke',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-03-01T00:00:00Z',
    },
    {
      id: '4',
      name: 'Night Shift Differential',
      category: 'overtime',
      description: 'Additional payment for night shift workers',
      ruleType: 'percentage',
      value: 25,
      isActive: true,
      effectiveDate: '2024-01-01',
      priority: 4,
      conditions: 'shift_type = "night"',
      formula: 'basic_salary * 0.25',
      createdBy: 'admin@avesat.co.ke',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-15T00:00:00Z',
    },
    {
      id: '5',
      name: 'HELB Recovery',
      category: 'deduction',
      description: 'Higher Education Loans Board recovery calculation',
      ruleType: 'percentage',
      value: 1.0,
      isActive: true,
      effectiveDate: '2024-01-01',
      priority: 5,
      conditions: 'gross_salary > 20000',
      formula: 'gross_salary * 0.01',
      createdBy: 'compliance@avesat.co.ke',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ]);

  // State for payroll calendar
  const [payrollCalendar, setPayrollCalendar] = useState<PayrollCalendar[]>([
    {
      id: '1',
      month: 3,
      year: 2024,
      payrollStartDate: '2024-03-01',
      payrollEndDate: '2024-03-31',
      payrollDate: '2024-03-25',
      cutoffDate: '2024-03-20',
      isProcessed: true,
      status: 'completed',
      totalEmployees: 156,
      totalGrossPay: 15600000,
      totalDeductions: 4680000,
      totalNetPay: 10920000,
    },
    {
      id: '2',
      month: 4,
      year: 2024,
      payrollStartDate: '2024-04-01',
      payrollEndDate: '2024-04-30',
      payrollDate: '2024-04-25',
      cutoffDate: '2024-04-20',
      isProcessed: false,
      status: 'pending',
      totalEmployees: 158,
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0,
    },
    {
      id: '3',
      month: 5,
      year: 2024,
      payrollStartDate: '2024-05-01',
      payrollEndDate: '2024-05-31',
      payrollDate: '2024-05-25',
      cutoffDate: '2024-05-20',
      isProcessed: false,
      status: 'pending',
      totalEmployees: 158,
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0,
    },
  ]);

  // State for audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      action: 'UPDATE_PAYROLL_CONFIG',
      description: 'Updated overtime threshold from 8 to 9 hours',
      performedBy: 'admin@avesat.co.ke',
      timestamp: '2024-03-15T14:30:00Z',
      oldValue: '8',
      newValue: '9',
      category: 'Configuration',
    },
    {
      id: '2',
      action: 'CREATE_CUSTOM_RULE',
      description: 'Created new rule: Night Shift Differential',
      performedBy: 'admin@avesat.co.ke',
      timestamp: '2024-03-10T10:15:00Z',
      category: 'Custom Rules',
    },
    {
      id: '3',
      action: 'DISABLE_RULE',
      description: 'Disabled rule: Old Transport Allowance',
      performedBy: 'hr@avesat.co.ke',
      timestamp: '2024-03-05T16:45:00Z',
      oldValue: 'true',
      newValue: 'false',
      category: 'Custom Rules',
    },
  ]);

  const canManageRules = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER]);
  const canViewRules = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  if (!canViewRules) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view payroll rules.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const saveConfiguration = async () => {
    if (!canManageRules) {
      alert('You do not have permission to modify payroll rules.');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date().toISOString());
      
      // Add to audit log
      const newLog: AuditLog = {
        id: Date.now().toString(),
        action: 'UPDATE_PAYROLL_CONFIG',
        description: 'Updated payroll configuration settings',
        performedBy: user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        category: 'Configuration',
      };
      setAuditLogs(prev => [newLog, ...prev]);
      
      alert('Payroll configuration saved successfully!');
    } catch (error) {
      alert('Error saving configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    if (!canManageRules) {
      alert('You do not have permission to modify payroll rules.');
      return;
    }

    const rule = customRules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedRules = customRules.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive, lastModified: new Date().toISOString() } : r
    );
    setCustomRules(updatedRules);

    // Add to audit log
    const newLog: AuditLog = {
      id: Date.now().toString(),
      action: rule.isActive ? 'DISABLE_RULE' : 'ENABLE_RULE',
      description: `${rule.isActive ? 'Disabled' : 'Enabled'} rule: ${rule.name}`,
      performedBy: user?.email || 'unknown',
      timestamp: new Date().toISOString(),
      oldValue: rule.isActive.toString(),
      newValue: (!rule.isActive).toString(),
      category: 'Custom Rules',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const deleteRule = async (ruleId: string) => {
    if (!canManageRules) {
      alert('You do not have permission to modify payroll rules.');
      return;
    }

    const rule = customRules.find(r => r.id === ruleId);
    if (!rule) return;

    if (confirm(`Are you sure you want to delete the rule "${rule.name}"? This action cannot be undone.`)) {
      setCustomRules(prev => prev.filter(r => r.id !== ruleId));
      
      // Add to audit log
      const newLog: AuditLog = {
        id: Date.now().toString(),
        action: 'DELETE_RULE',
        description: `Deleted rule: ${rule.name}`,
        performedBy: user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        category: 'Custom Rules',
      };
      setAuditLogs(prev => [newLog, ...prev]);
      
      alert('Rule deleted successfully!');
    }
  };

  const exportRules = () => {
    const dataStr = JSON.stringify({ configuration: config, customRules }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `payroll-rules-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.configuration) {
          setConfig(importedData.configuration);
        }
        if (importedData.customRules) {
          setCustomRules(importedData.customRules);
        }
        alert('Rules imported successfully!');
      } catch (error) {
        alert('Error importing rules. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'calculation': return 'bg-blue-100 text-blue-800';
      case 'policy': return 'bg-green-100 text-green-800';
      case 'compliance': return 'bg-red-100 text-red-800';
      case 'overtime': return 'bg-purple-100 text-purple-800';
      case 'deduction': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-gray-100 text-gray-800';
      case 'percentage': return 'bg-blue-100 text-blue-800';
      case 'formula': return 'bg-purple-100 text-purple-800';
      case 'conditional': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Rules & Configuration</h1>
          <p className="text-gray-600">Configure payroll calculation rules and policies</p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="text-sm text-gray-500">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </div>
          )}
          <Badge className={canManageRules ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            <Settings className="w-4 h-4 mr-1" />
            {canManageRules ? 'Full Access' : 'Read Only'}
          </Badge>
        </div>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="custom-rules">Custom Rules</TabsTrigger>
          <TabsTrigger value="calendar">Payroll Calendar</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>

        {/* Basic Configuration */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  General Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="salaryFrequency">Salary Frequency</Label>
                  <Select 
                    value={config.salaryFrequency} 
                    onValueChange={(value) => setConfig({...config, salaryFrequency: value as any})} 
                    disabled={!canManageRules}
                  >
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workingDaysPerMonth">Working Days/Month</Label>
                    <Input
                      id="workingDaysPerMonth"
                      type="number"
                      value={config.workingDaysPerMonth}
                      onChange={(e) => setConfig({...config, workingDaysPerMonth: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workingHoursPerDay">Working Hours/Day</Label>
                    <Input
                      id="workingHoursPerDay"
                      type="number"
                      value={config.workingHoursPerDay}
                      onChange={(e) => setConfig({...config, workingHoursPerDay: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minimumWage">Minimum Wage (KES)</Label>
                    <Input
                      id="minimumWage"
                      type="number"
                      value={config.minimumWage}
                      onChange={(e) => setConfig({...config, minimumWage: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retirementAge">Retirement Age</Label>
                    <Input
                      id="retirementAge"
                      type="number"
                      value={config.retirementAge}
                      onChange={(e) => setConfig({...config, retirementAge: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Calculate Overtime</Label>
                      <p className="text-sm text-gray-600">Automatically calculate overtime pay</p>
                    </div>
                    <Switch 
                      checked={config.autoCalculateOvertime}
                      onCheckedChange={(checked) => setConfig({...config, autoCalculateOvertime: checked})}
                      disabled={!canManageRules}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Negative Net Pay</Label>
                      <p className="text-sm text-gray-600">Allow net pay to be negative</p>
                    </div>
                    <Switch 
                      checked={config.allowNegativeNet}
                      onCheckedChange={(checked) => setConfig({...config, allowNegativeNet: checked})}
                      disabled={!canManageRules}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enforce Minimum Wage</Label>
                      <p className="text-sm text-gray-600">Ensure all salaries meet minimum wage</p>
                    </div>
                    <Switch 
                      checked={config.enforceMinimumWage}
                      onCheckedChange={(checked) => setConfig({...config, enforceMinimumWage: checked})}
                      disabled={!canManageRules}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overtime & Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Overtime & Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="overtimeThreshold">Overtime Threshold (hours)</Label>
                  <Input
                    id="overtimeThreshold"
                    type="number"
                    value={config.overtimeThreshold}
                    onChange={(e) => setConfig({...config, overtimeThreshold: Number(e.target.value)})}
                    disabled={!canManageRules}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="normalHoursRate">Normal Hours Rate</Label>
                    <Input
                      id="normalHoursRate"
                      type="number"
                      step="0.1"
                      value={config.normalHoursRate}
                      onChange={(e) => setConfig({...config, normalHoursRate: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekendHoursRate">Weekend Rate</Label>
                    <Input
                      id="weekendHoursRate"
                      type="number"
                      step="0.1"
                      value={config.weekendHoursRate}
                      onChange={(e) => setConfig({...config, weekendHoursRate: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publicHolidayRate">Public Holiday Rate</Label>
                    <Input
                      id="publicHolidayRate"
                      type="number"
                      step="0.1"
                      value={config.publicHolidayRate}
                      onChange={(e) => setConfig({...config, publicHolidayRate: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nightShiftRate">Night Shift Rate</Label>
                    <Input
                      id="nightShiftRate"
                      type="number"
                      step="0.1"
                      value={config.nightShiftRate}
                      onChange={(e) => setConfig({...config, nightShiftRate: Number(e.target.value)})}
                      disabled={!canManageRules}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="latePenaltyRate">Late Penalty Rate (%)</Label>
                  <Input
                    id="latePenaltyRate"
                    type="number"
                    step="0.1"
                    value={config.latePenaltyRate}
                    onChange={(e) => setConfig({...config, latePenaltyRate: Number(e.target.value)})}
                    disabled={!canManageRules}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rounding & Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Rounding & Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="earningsRounding">Earnings Rounding</Label>
                    <Select 
                      value={config.earningsRounding} 
                      onValueChange={(value) => setConfig({...config, earningsRounding: value as any})} 
                      disabled={!canManageRules}
                    >
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
                    <Select 
                      value={config.deductionsRounding} 
                      onValueChange={(value) => setConfig({...config, deductionsRounding: value as any})} 
                      disabled={!canManageRules}
                    >
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
                </div>

                <div>
                  <Label htmlFor="probationPeriod">Probation Period (months)</Label>
                  <Input
                    id="probationPeriod"
                    type="number"
                    value={config.probationPeriod}
                    onChange={(e) => setConfig({...config, probationPeriod: Number(e.target.value)})}
                    disabled={!canManageRules}
                  />
                </div>

                <div>
                  <Label htmlFor="absenteeismPolicy">Absenteeism Policy</Label>
                  <Textarea
                    id="absenteeismPolicy"
                    value={config.absenteeismPolicy}
                    onChange={(e) => setConfig({...config, absenteeismPolicy: e.target.value})}
                    disabled={!canManageRules}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {canManageRules && (
            <div className="flex justify-end">
              <Button onClick={saveConfiguration} disabled={isSaving}>
                {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Configuration
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Custom Rules */}
        <TabsContent value="custom-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Custom Payroll Rules
                </div>
                {canManageRules && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value/Formula</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-500">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(rule.category)}>
                          {rule.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRuleTypeColor(rule.ruleType)}>
                          {rule.ruleType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {rule.ruleType === 'formula' || rule.ruleType === 'conditional' 
                          ? rule.formula 
                          : typeof rule.value === 'number' 
                            ? rule.ruleType === 'percentage' 
                              ? `${rule.value}%` 
                              : formatKES(rule.value)
                            : rule.value
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(rule.effectiveDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageRules && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRule(rule.id)}
                            >
                              {rule.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteRule(rule.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* Payroll Calendar */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Payroll Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Payroll Date</TableHead>
                    <TableHead>Cutoff Date</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollCalendar.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(period.payrollStartDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(period.payrollStartDate).toLocaleDateString()} - {new Date(period.payrollEndDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(period.payrollDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(period.cutoffDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{period.totalEmployees}</TableCell>
                      <TableCell>
                        {period.isProcessed ? formatKES(period.totalGrossPay) : '-'}
                      </TableCell>
                      <TableCell>
                        {period.isProcessed ? formatKES(period.totalNetPay) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(period.status)}>
                          {period.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                          {!period.isProcessed && canManageRules && (
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.category}</Badge>
                      </TableCell>
                      <TableCell>{log.performedBy}</TableCell>
                      <TableCell>
                        {log.oldValue && log.newValue && (
                          <div className="text-sm">
                            <span className="text-red-600">{log.oldValue}</span> → <span className="text-green-600">{log.newValue}</span>
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

        {/* Import/Export */}
        <TabsContent value="import-export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Export Payroll Configuration</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Export all payroll rules and configuration as a JSON file
                  </p>
                  <Button onClick={exportRules} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Import Payroll Configuration</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Import payroll rules from a JSON file
                  </p>
                  <Input 
                    type="file" 
                    accept=".json" 
                    onChange={importRules}
                    disabled={!canManageRules}
                  />
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Importing will overwrite existing configuration. Make sure to backup current settings first.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
