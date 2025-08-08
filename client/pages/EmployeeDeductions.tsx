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
  Filter,
  Save,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Shield,
  Users,
  Building2,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES, KENYA_TAX_CONSTANTS } from '@shared/kenya-tax';
import { logEmployeeAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Interfaces for the deductions system
interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  status: 'open' | 'closed' | 'processing';
  description: string;
  deadline: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  branch: string;
  position: string;
  grossSalary: number;
  basicSalary: number;
  isActive: boolean;
}

interface DeductionType {
  id: string;
  category: 'statutory' | 'loans' | 'other';
  name: string;
  description: string;
  isAutoCalculated: boolean;
  hasLimit: boolean;
  maxAmount?: number;
  calculationBasis?: 'fixed' | 'percentage' | 'bracket';
  isRequired: boolean;
  helpText?: string;
}

interface EmployeeDeduction {
  id: string;
  employeeId: string;
  payrollPeriodId: string;
  deductionTypeId: string;
  amount: number;
  calculatedAmount?: number;
  notes: string;
  isAutoCalculated: boolean;
  status: 'pending' | 'approved' | 'locked';
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

const EmployeeDeductions: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  
  // Access control
  const canProcessDeductions = hasAnyRole([UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER, UserRole.ADMIN]);
  
  // State management
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [employeeDeductions, setEmployeeDeductions] = useState<EmployeeDeduction[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviousMonth, setShowPreviousMonth] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Calculations
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [netPay, setNetPay] = useState(0);

  // Mock data for demonstration
  const mockPayrollPeriods: PayrollPeriod[] = [
    {
      id: 'period_2024_01',
      month: 1,
      year: 2024,
      status: 'open',
      description: 'January 2024 Payroll',
      deadline: '2024-01-31'
    },
    {
      id: 'period_2024_02',
      month: 2,
      year: 2024,
      status: 'closed',
      description: 'February 2024 Payroll',
      deadline: '2024-02-29'
    },
    {
      id: 'period_2024_03',
      month: 3,
      year: 2024,
      status: 'open',
      description: 'March 2024 Payroll',
      deadline: '2024-03-31'
    }
  ];

  const mockEmployees: Employee[] = [
    {
      id: 'emp_001',
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Mwangi',
      department: 'Finance',
      branch: 'Nairobi',
      position: 'Accountant',
      grossSalary: 150000,
      basicSalary: 120000,
      isActive: true
    },
    {
      id: 'emp_002',
      employeeNumber: 'EMP002',
      firstName: 'Grace',
      lastName: 'Wanjiku',
      department: 'HR',
      branch: 'Nairobi',
      position: 'HR Manager',
      grossSalary: 200000,
      basicSalary: 180000,
      isActive: true
    },
    {
      id: 'emp_003',
      employeeNumber: 'EMP003',
      firstName: 'Peter',
      lastName: 'Kiprotich',
      department: 'IT',
      branch: 'Mombasa',
      position: 'Software Developer',
      grossSalary: 300000,
      basicSalary: 250000,
      isActive: true
    },
    {
      id: 'emp_004',
      employeeNumber: 'EMP004',
      firstName: 'Mary',
      lastName: 'Achieng',
      department: 'Sales',
      branch: 'Kisumu',
      position: 'Sales Executive',
      grossSalary: 80000,
      basicSalary: 70000,
      isActive: true
    }
  ];

  const mockDeductionTypes: DeductionType[] = [
    // Statutory Deductions
    {
      id: 'paye',
      category: 'statutory',
      name: 'PAYE Tax',
      description: 'Pay As You Earn tax',
      isAutoCalculated: true,
      hasLimit: false,
      isRequired: true,
      calculationBasis: 'bracket',
      helpText: 'Automatically calculated based on KRA tax brackets'
    },
    {
      id: 'nhif',
      category: 'statutory',
      name: 'NHIF',
      description: 'National Hospital Insurance Fund',
      isAutoCalculated: true,
      hasLimit: true,
      maxAmount: 1700,
      isRequired: true,
      calculationBasis: 'bracket',
      helpText: 'NHIF contribution based on gross salary brackets'
    },
    {
      id: 'nssf',
      category: 'statutory',
      name: 'NSSF',
      description: 'National Social Security Fund',
      isAutoCalculated: true,
      hasLimit: true,
      maxAmount: 2160,
      isRequired: true,
      calculationBasis: 'percentage',
      helpText: 'NSSF contribution (6% of pensionable pay, max KES 2,160)'
    },
    {
      id: 'housing_levy',
      category: 'statutory',
      name: 'Housing Levy',
      description: 'Affordable Housing Levy',
      isAutoCalculated: true,
      hasLimit: false,
      isRequired: true,
      calculationBasis: 'percentage',
      helpText: '1.5% of gross salary for housing development'
    },
    
    // Loan Deductions
    {
      id: 'company_loan',
      category: 'loans',
      name: 'Company Loan',
      description: 'Staff loan from company',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Monthly installment for company staff loan'
    },
    {
      id: 'sacco_loan',
      category: 'loans',
      name: 'SACCO Loan',
      description: 'SACCO loan deduction',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Monthly SACCO loan repayment'
    },
    {
      id: 'bank_loan',
      category: 'loans',
      name: 'Bank Loan',
      description: 'Bank loan deduction',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Bank loan installment deduction'
    },
    {
      id: 'helb_loan',
      category: 'loans',
      name: 'HELB Loan',
      description: 'Higher Education Loans Board',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'HELB loan repayment deduction'
    },
    
    // Other Deductions
    {
      id: 'union_dues',
      category: 'other',
      name: 'Union Dues',
      description: 'Trade union membership fees',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Monthly union membership dues'
    },
    {
      id: 'pension_voluntary',
      category: 'other',
      name: 'Voluntary Pension',
      description: 'Additional pension contribution',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Additional voluntary pension contribution'
    },
    {
      id: 'medical_insurance',
      category: 'other',
      name: 'Medical Insurance',
      description: 'Private medical insurance',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Private medical insurance premium'
    },
    {
      id: 'welfare_fund',
      category: 'other',
      name: 'Welfare Fund',
      description: 'Employee welfare/benevolent fund',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Contribution to employee welfare fund'
    },
    {
      id: 'court_order',
      category: 'other',
      name: 'Court Order/Garnishment',
      description: 'Court-ordered salary deduction',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Court-ordered garnishment or attachment'
    },
    {
      id: 'salary_advance',
      category: 'other',
      name: 'Salary Advance Recovery',
      description: 'Recovery of salary advance',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Monthly recovery of salary advance'
    },
    {
      id: 'staff_shop',
      category: 'other',
      name: 'Staff Shop Purchases',
      description: 'Staff shop/canteen purchases',
      isAutoCalculated: false,
      hasLimit: false,
      isRequired: false,
      calculationBasis: 'fixed',
      helpText: 'Deduction for staff shop purchases'
    }
  ];

  // Initialize data
  useEffect(() => {
    setEmployees(mockEmployees);
    setFilteredEmployees(mockEmployees);
    setDeductionTypes(mockDeductionTypes);
    
    // Set default period to the first open period
    const openPeriod = mockPayrollPeriods.find(p => p.status === 'open');
    if (openPeriod) {
      setSelectedPeriod(openPeriod);
    }
  }, []);

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = employees.filter(emp => emp.isActive);
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }
    
    if (branchFilter !== 'all') {
      filtered = filtered.filter(emp => emp.branch === branchFilter);
    }
    
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter, branchFilter]);

  // Calculate totals when deductions change
  useEffect(() => {
    const total = employeeDeductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    setTotalDeductions(total);
    
    if (selectedEmployee) {
      setNetPay(selectedEmployee.grossSalary - total);
    }
  }, [employeeDeductions, selectedEmployee]);

  // Load employee deductions
  const loadEmployeeDeductions = (employee: Employee) => {
    if (!selectedPeriod) return;
    
    // Mock loading existing deductions for the employee and period
    const existingDeductions: EmployeeDeduction[] = [
      {
        id: `ded_${employee.id}_paye`,
        employeeId: employee.id,
        payrollPeriodId: selectedPeriod.id,
        deductionTypeId: 'paye',
        amount: calculatePAYE(employee.grossSalary),
        calculatedAmount: calculatePAYE(employee.grossSalary),
        notes: 'Auto-calculated PAYE',
        isAutoCalculated: true,
        status: 'pending',
        createdBy: user?.id || 'system',
        createdAt: new Date().toISOString()
      },
      {
        id: `ded_${employee.id}_nhif`,
        employeeId: employee.id,
        payrollPeriodId: selectedPeriod.id,
        deductionTypeId: 'nhif',
        amount: calculateNHIF(employee.grossSalary),
        calculatedAmount: calculateNHIF(employee.grossSalary),
        notes: 'Auto-calculated NHIF',
        isAutoCalculated: true,
        status: 'pending',
        createdBy: user?.id || 'system',
        createdAt: new Date().toISOString()
      },
      {
        id: `ded_${employee.id}_nssf`,
        employeeId: employee.id,
        payrollPeriodId: selectedPeriod.id,
        deductionTypeId: 'nssf',
        amount: calculateNSSF(employee.grossSalary),
        calculatedAmount: calculateNSSF(employee.grossSalary),
        notes: 'Auto-calculated NSSF',
        isAutoCalculated: true,
        status: 'pending',
        createdBy: user?.id || 'system',
        createdAt: new Date().toISOString()
      },
      {
        id: `ded_${employee.id}_housing`,
        employeeId: employee.id,
        payrollPeriodId: selectedPeriod.id,
        deductionTypeId: 'housing_levy',
        amount: Math.round(employee.grossSalary * 0.015),
        calculatedAmount: Math.round(employee.grossSalary * 0.015),
        notes: 'Auto-calculated Housing Levy (1.5%)',
        isAutoCalculated: true,
        status: 'pending',
        createdBy: user?.id || 'system',
        createdAt: new Date().toISOString()
      }
    ];
    
    setEmployeeDeductions(existingDeductions);
    setValidationErrors([]);
  };

  // PAYE calculation (simplified)
  const calculatePAYE = (grossSalary: number): number => {
    const annualSalary = grossSalary * 12;
    const personalRelief = KENYA_TAX_CONSTANTS.PERSONAL_RELIEF;
    const taxableIncome = Math.max(0, annualSalary - personalRelief);
    
    let tax = 0;
    
    // Apply tax brackets (simplified)
    if (taxableIncome > 0) {
      if (taxableIncome <= 288000) {
        tax = taxableIncome * 0.10;
      } else if (taxableIncome <= 388000) {
        tax = 28800 + (taxableIncome - 288000) * 0.25;
      } else if (taxableIncome <= 6000000) {
        tax = 53800 + (taxableIncome - 388000) * 0.30;
      } else {
        tax = 1737400 + (taxableIncome - 6000000) * 0.35;
      }
    }
    
    return Math.max(0, Math.round(tax / 12)); // Monthly PAYE
  };

  // NHIF calculation
  const calculateNHIF = (grossSalary: number): number => {
    const nhifRates = KENYA_TAX_CONSTANTS.NHIF_RATES;
    for (const rate of nhifRates) {
      if (grossSalary >= rate.min && grossSalary <= rate.max) {
        return rate.amount;
      }
    }
    return 1700; // Maximum NHIF
  };

  // NSSF calculation
  const calculateNSSF = (grossSalary: number): number => {
    const pensionablePay = Math.min(grossSalary, 36000); // NSSF ceiling
    return Math.round(pensionablePay * 0.06);
  };

  // Validation functions
  const validateDeduction = (deduction: EmployeeDeduction): ValidationError[] => {
    const errors: ValidationError[] = [];
    const deductionType = deductionTypes.find(dt => dt.id === deduction.deductionTypeId);
    
    if (!deductionType) {
      errors.push({
        field: 'deductionType',
        message: 'Invalid deduction type',
        type: 'error'
      });
      return errors;
    }
    
    // Check amount is positive
    if (deduction.amount < 0) {
      errors.push({
        field: 'amount',
        message: 'Amount cannot be negative',
        type: 'error'
      });
    }
    
    // Check statutory limits
    if (deductionType.hasLimit && deductionType.maxAmount && deduction.amount > deductionType.maxAmount) {
      errors.push({
        field: 'amount',
        message: `Amount exceeds maximum limit of ${formatKES(deductionType.maxAmount)}`,
        type: 'error'
      });
    }
    
    // Check NHIF bracket compliance
    if (deductionType.id === 'nhif' && selectedEmployee) {
      const correctNHIF = calculateNHIF(selectedEmployee.grossSalary);
      if (Math.abs(deduction.amount - correctNHIF) > 10) {
        errors.push({
          field: 'amount',
          message: `NHIF amount should be ${formatKES(correctNHIF)} for this salary bracket`,
          type: 'warning'
        });
      }
    }
    
    return errors;
  };

  const validateAllDeductions = (): boolean => {
    const allErrors: ValidationError[] = [];
    
    employeeDeductions.forEach((deduction, index) => {
      const errors = validateDeduction(deduction);
      errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `${error.field}_${index}`
        });
      });
    });
    
    // Check total deductions don't exceed gross salary
    if (selectedEmployee && totalDeductions > selectedEmployee.grossSalary) {
      allErrors.push({
        field: 'total',
        message: 'Total deductions cannot exceed gross salary',
        type: 'error'
      });
    }
    
    setValidationErrors(allErrors);
    return allErrors.filter(e => e.type === 'error').length === 0;
  };

  // Event handlers
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    loadEmployeeDeductions(employee);
  };

  const handleDeductionChange = (index: number, field: string, value: any) => {
    const updatedDeductions = [...employeeDeductions];
    updatedDeductions[index] = {
      ...updatedDeductions[index],
      [field]: value,
      updatedBy: user?.id || 'system',
      updatedAt: new Date().toISOString()
    };
    setEmployeeDeductions(updatedDeductions);
  };

  const addDeduction = (deductionTypeId: string) => {
    if (!selectedEmployee || !selectedPeriod) return;
    
    const deductionType = deductionTypes.find(dt => dt.id === deductionTypeId);
    if (!deductionType) return;
    
    const newDeduction: EmployeeDeduction = {
      id: `ded_${selectedEmployee.id}_${deductionTypeId}_${Date.now()}`,
      employeeId: selectedEmployee.id,
      payrollPeriodId: selectedPeriod.id,
      deductionTypeId: deductionTypeId,
      amount: 0,
      notes: '',
      isAutoCalculated: deductionType.isAutoCalculated,
      status: 'pending',
      createdBy: user?.id || 'system',
      createdAt: new Date().toISOString()
    };
    
    setEmployeeDeductions([...employeeDeductions, newDeduction]);
  };

  const removeDeduction = (index: number) => {
    const deduction = employeeDeductions[index];
    const deductionType = deductionTypes.find(dt => dt.id === deduction.deductionTypeId);
    
    // Don't allow removal of required statutory deductions
    if (deductionType?.isRequired) {
      alert('Cannot remove required statutory deductions');
      return;
    }
    
    const updatedDeductions = employeeDeductions.filter((_, i) => i !== index);
    setEmployeeDeductions(updatedDeductions);
  };

  const saveDeductions = async () => {
    if (!selectedEmployee || !selectedPeriod) return;
    
    if (!validateAllDeductions()) {
      alert('Please fix validation errors before saving');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log audit action
      logEmployeeAction(
        {
          userId: user?.id || 'system',
          userAgent: navigator.userAgent,
          ipAddress: '127.0.0.1'
        },
        AuditAction.UPDATE,
        selectedEmployee.id,
        undefined,
        {
          action: 'deductions_updated',
          period: `${selectedPeriod.month}/${selectedPeriod.year}`,
          totalDeductions: totalDeductions,
          deductionCount: employeeDeductions.length
        }
      );
      
      alert('Deductions saved successfully!');
    } catch (error) {
      alert('Error saving deductions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cloneFromPreviousMonth = () => {
    if (!selectedEmployee) return;
    
    // Mock cloning logic - in real system, fetch from previous month
    alert('Previous month deductions cloned successfully!');
  };

  const getDeductionTypeIcon = (category: string) => {
    switch (category) {
      case 'statutory': return <Shield className="w-4 h-4" />;
      case 'loans': return <CreditCard className="w-4 h-4" />;
      case 'other': return <FileText className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'statutory': return 'bg-red-100 text-red-800';
      case 'loans': return 'bg-blue-100 text-blue-800';
      case 'other': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!canProcessDeductions) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to process payroll deductions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Period locked check
  if (selectedPeriod && selectedPeriod.status === 'closed') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Payroll period is locked. Please contact payroll administrator.
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
          <h1 className="text-3xl font-bold text-gray-900">Employee Deductions Management</h1>
          <p className="text-gray-600">Secure payroll deductions processing with Kenyan compliance</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            <Shield className="w-4 h-4 mr-1" />
            Authorized Access
          </Badge>
          {selectedPeriod && (
            <Badge className={selectedPeriod.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              <Clock className="w-4 h-4 mr-1" />
              {selectedPeriod.status.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Period & Employee Selection */}
        <div className="space-y-6">
          {/* Payroll Period Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Payroll Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="period">Select Period</Label>
                  <Select
                    value={selectedPeriod?.id || ''}
                    onValueChange={(value) => {
                      const period = mockPayrollPeriods.find(p => p.id === value);
                      setSelectedPeriod(period || null);
                      setSelectedEmployee(null);
                      setEmployeeDeductions([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payroll period" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPayrollPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{period.description}</span>
                            <Badge className={`ml-2 ${period.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {period.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedPeriod && (
                  <div className="text-sm text-gray-600">
                    <p><strong>Deadline:</strong> {new Date(selectedPeriod.deadline).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {selectedPeriod.status.toUpperCase()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Selection */}
          {selectedPeriod && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Employee Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          <SelectItem value="Nairobi">Nairobi</SelectItem>
                          <SelectItem value="Mombasa">Mombasa</SelectItem>
                          <SelectItem value="Kisumu">Kisumu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Employee List */}
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleEmployeeSelect(employee)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEmployee?.id === employee.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-600">{employee.employeeNumber}</div>
                        <div className="text-sm text-gray-500">{employee.department} • {employee.branch}</div>
                        <div className="text-sm font-medium text-green-600">{formatKES(employee.grossSalary)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Panel - Deduction Entry Form */}
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cloneFromPreviousMonth}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Clone Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode(!previewMode)}
                        className="flex items-center gap-2"
                      >
                        {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {previewMode ? 'Edit' : 'Preview'}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label>Employee Number</Label>
                      <div className="font-medium">{selectedEmployee.employeeNumber}</div>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <div className="font-medium">{selectedEmployee.department}</div>
                    </div>
                    <div>
                      <Label>Basic Salary</Label>
                      <div className="font-medium">{formatKES(selectedEmployee.basicSalary)}</div>
                    </div>
                    <div>
                      <Label>Gross Salary</Label>
                      <div className="font-medium text-green-600">{formatKES(selectedEmployee.grossSalary)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deduction Entry Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Deduction Entry
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Deduction
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Deduction</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {Object.entries(
                            deductionTypes.reduce((acc, dt) => {
                              if (!acc[dt.category]) acc[dt.category] = [];
                              acc[dt.category].push(dt);
                              return acc;
                            }, {} as Record<string, DeductionType[]>)
                          ).map(([category, types]) => (
                            <div key={category}>
                              <h4 className="font-medium capitalize mb-2">{category} Deductions</h4>
                              <div className="space-y-2">
                                {types.map((type) => (
                                  <Button
                                    key={type.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addDeduction(type.id)}
                                    className="w-full justify-start"
                                    disabled={employeeDeductions.some(ed => ed.deductionTypeId === type.id)}
                                  >
                                    {getDeductionTypeIcon(type.category)}
                                    <span className="ml-2">{type.name}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employeeDeductions.length > 0 ? (
                    <div className="space-y-4">
                      {/* Validation Errors */}
                      {validationErrors.length > 0 && (
                        <Alert variant={validationErrors.some(e => e.type === 'error') ? "destructive" : "default"}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              {validationErrors.map((error, index) => (
                                <div key={index} className={error.type === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                                  {error.message}
                                </div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Deductions Table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Deduction Type</TableHead>
                            <TableHead>Amount (KES)</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employeeDeductions.map((deduction, index) => {
                            const deductionType = deductionTypes.find(dt => dt.id === deduction.deductionTypeId);
                            if (!deductionType) return null;

                            return (
                              <TableRow key={deduction.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getDeductionTypeIcon(deductionType.category)}
                                    <div>
                                      <div className="font-medium">{deductionType.name}</div>
                                      <div className="text-xs text-gray-500">{deductionType.description}</div>
                                    </div>
                                    <Badge className={getCategoryColor(deductionType.category)}>
                                      {deductionType.category}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={deduction.amount}
                                      onChange={(e) => handleDeductionChange(index, 'amount', Number(e.target.value))}
                                      disabled={previewMode || deduction.isAutoCalculated}
                                      className="w-32"
                                      min="0"
                                      step="0.01"
                                    />
                                    {deduction.isAutoCalculated && (
                                      <Badge variant="secondary" className="text-xs">
                                        Auto
                                      </Badge>
                                    )}
                                  </div>
                                  {deductionType.helpText && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {deductionType.helpText}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Textarea
                                    value={deduction.notes}
                                    onChange={(e) => handleDeductionChange(index, 'notes', e.target.value)}
                                    disabled={previewMode}
                                    placeholder="Add notes..."
                                    className="min-h-[60px]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge variant={deduction.status === 'pending' ? 'default' : 'secondary'}>
                                    {deduction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {!previewMode && !deductionType.isRequired && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeDeduction(index)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No deductions entered yet. Click "Add Deduction" to start.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Calculation Preview */}
              {employeeDeductions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Calculation Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatKES(selectedEmployee.grossSalary)}</div>
                        <div className="text-sm text-blue-600">Gross Salary</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{formatKES(totalDeductions)}</div>
                        <div className="text-sm text-red-600">Total Deductions</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatKES(netPay)}</div>
                        <div className="text-sm text-green-600">Net Pay</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Save Actions */}
              {employeeDeductions.length > 0 && !previewMode && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Status: Pending Payroll Processing
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => validateAllDeductions()}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Validate
                        </Button>
                        <Button
                          onClick={saveDeductions}
                          disabled={isSaving || validationErrors.some(e => e.type === 'error')}
                          className="flex items-center gap-2"
                        >
                          {isSaving ? (
                            <RotateCcw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {isSaving ? 'Saving...' : 'Save Deductions'}
                        </Button>
                        <Button variant="secondary">
                          Save & Next Employee
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Employee</h3>
                <p className="text-gray-600">
                  Choose an employee from the list to view and manage their payroll deductions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDeductions;
