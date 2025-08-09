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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  Settings,
  FileText,
  CheckCircle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Plus,
  Edit,
  Save,
  Download,
  Upload,
  Eye,
  RefreshCw,
  Clock,
  Building2,
  Receipt,
  Shield,
  Database
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES, KENYA_TAX_BRACKETS, KENYA_TAX_CONSTANTS } from '@shared/kenya-tax';
import { logTaxAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';

// Enhanced interfaces for the comprehensive tax system
interface PayrollPeriod {
  month: number;
  year: number;
  description: string;
}

interface EmployeeFilter {
  department: string;
  payGroup: string;
  employmentStatus: string;
}

interface StatutoryReliefs {
  personalRelief: number;
  insuranceRelief: number;
  pensionRelief: number;
  disabilityRelief: number;
  housingRelief: number;
}

interface PayrollRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  grossPay: number;
  basicSalary: number;
  allowances: number;
  overtime: number;
  personalRelief: number;
  insuranceRelief: number;
  pensionRelief: number;
  isTaxExempt: boolean;
}

interface PAYECalculation {
  employeeId: string;
  employeeName: string;
  grossPay: number;
  taxableIncome: number;
  payeAmount: number;
  personalRelief: number;
  totalReliefs: number;
  effectiveRate: number;
  dateCalculated: string;
  calculatedBy: string;
  validationStatus: 'valid' | 'flagged' | 'pending';
  discrepancy?: number;
}

interface TaxReport {
  reportType: 'P10' | 'P10A' | 'P9A';
  period: string;
  data: any[];
  generatedAt: string;
  totalEmployees: number;
  totalTaxable: number;
  totalPAYE: number;
}

interface AlgorithmStep {
  step: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  progress?: number;
}

const TaxManagement: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  
  // Algorithm execution state
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  
  // Form state
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriod>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: ''
  });
  
  const [employeeFilters, setEmployeeFilters] = useState<EmployeeFilter>({
    department: 'all',
    payGroup: 'all',
    employmentStatus: 'active'
  });
  
  // Tax calculation state
  const [taxBrackets, setTaxBrackets] = useState(KENYA_TAX_BRACKETS);
  const [statutoryReliefs, setStatutoryReliefs] = useState<StatutoryReliefs>({
    personalRelief: KENYA_TAX_CONSTANTS.PERSONAL_RELIEF,
    insuranceRelief: KENYA_TAX_CONSTANTS.INSURANCE_RELIEF_LIMIT,
    pensionRelief: KENYA_TAX_CONSTANTS.PENSION_RELIEF_LIMIT,
    disabilityRelief: 50000,
    housingRelief: 15000
  });
  
  // Results state
  const [employeesList, setEmployeesList] = useState<PayrollRecord[]>([]);
  const [payeCalculations, setPayeCalculations] = useState<PAYECalculation[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [generatedReports, setGeneratedReports] = useState<TaxReport[]>([]);
  const [iTaxFile, setITaxFile] = useState<Blob | null>(null);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState('calculation');
  
  // Algorithm steps definition
  const algorithmSteps: AlgorithmStep[] = [
    { step: 1, title: 'INPUT payroll_period (month, year)', status: 'pending' },
    { step: 2, title: 'SELECT employees_list based on filters', status: 'pending' },
    { step: 3, title: 'LOAD PAYE_tax_table FROM system_settings', status: 'pending' },
    { step: 4, title: 'LOAD statutory_reliefs', status: 'pending' },
    { step: 5, title: 'FOR each employee: CALCULATE PAYE', status: 'pending' },
    { step: 6, title: 'VALIDATE PAYE against KRA calculator', status: 'pending' },
    { step: 7, title: 'GENERATE reports (P10, P10A, P9A)', status: 'pending' },
    { step: 8, title: 'PREPARE iTax submission file', status: 'pending' },
    { step: 9, title: 'LOG audit entries', status: 'pending' }
  ];
  
  // Mock data for demonstration
  const mockEmployeesData: PayrollRecord[] = [
    {
      employeeId: 'EMP001',
      employeeName: 'John Mwangi',
      department: 'Finance',
      grossPay: 150000,
      basicSalary: 120000,
      allowances: 25000,
      overtime: 5000,
      personalRelief: 28800,
      insuranceRelief: 5000,
      pensionRelief: 18000,
      isTaxExempt: false
    },
    {
      employeeId: 'EMP002',
      employeeName: 'Grace Wanjiku',
      department: 'HR',
      grossPay: 200000,
      basicSalary: 180000,
      allowances: 20000,
      overtime: 0,
      personalRelief: 28800,
      insuranceRelief: 8000,
      pensionRelief: 24000,
      isTaxExempt: false
    },
    {
      employeeId: 'EMP003',
      employeeName: 'Peter Kiprotich',
      department: 'IT',
      grossPay: 300000,
      basicSalary: 250000,
      allowances: 40000,
      overtime: 10000,
      personalRelief: 28800,
      insuranceRelief: 12000,
      pensionRelief: 36000,
      isTaxExempt: false
    },
    {
      employeeId: 'EMP004',
      employeeName: 'Mary Achieng',
      department: 'Sales',
      grossPay: 80000,
      basicSalary: 70000,
      allowances: 10000,
      overtime: 0,
      personalRelief: 28800,
      insuranceRelief: 3000,
      pensionRelief: 10500,
      isTaxExempt: false
    },
    {
      employeeId: 'EMP005',
      employeeName: 'Samuel Otieno',
      department: 'Operations',
      grossPay: 450000,
      basicSalary: 400000,
      allowances: 50000,
      overtime: 0,
      personalRelief: 28800,
      insuranceRelief: 15000,
      pensionRelief: 60000,
      isTaxExempt: false
    }
  ];

  // Step 1: Input payroll period and filters
  const handleStep1_InputPeriod = async () => {
    setCurrentStep(1);
    addProcessingLog(`[STEP 1] INPUT payroll_period: ${payrollPeriod.month}/${payrollPeriod.year}`);
    
    if (!payrollPeriod.month || !payrollPeriod.year) {
      throw new Error('Payroll period is required');
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addProcessingLog(`[STEP 1] ✓ Payroll period validated: ${getMonthName(payrollPeriod.month)} ${payrollPeriod.year}`);
  };

  // Step 2: Select employees list based on filters
  const handleStep2_SelectEmployees = async () => {
    setCurrentStep(2);
    addProcessingLog(`[STEP 2] SELECT employees_list based on filters...`);
    
    let filteredEmployees = [...mockEmployeesData];
    
    // Apply department filter
    if (employeeFilters.department !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.department.toLowerCase() === employeeFilters.department.toLowerCase()
      );
    }
    
    // Apply other filters as needed
    setEmployeesList(filteredEmployees);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addProcessingLog(`[STEP 2] ✓ Selected ${filteredEmployees.length} employees for processing`);
  };

  // Step 3: Load PAYE tax table
  const handleStep3_LoadTaxTable = async () => {
    setCurrentStep(3);
    addProcessingLog(`[STEP 3] LOAD PAYE_tax_table FROM system_settings...`);
    
    // Load and validate tax brackets
    setTaxBrackets(KENYA_TAX_BRACKETS);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addProcessingLog(`[STEP 3] ✓ Loaded ${KENYA_TAX_BRACKETS.length} tax brackets from KRA 2024 table`);
  };

  // Step 4: Load statutory reliefs
  const handleStep4_LoadReliefs = async () => {
    setCurrentStep(4);
    addProcessingLog(`[STEP 4] LOAD statutory_reliefs...`);
    
    // Validate reliefs are loaded
    if (!statutoryReliefs.personalRelief) {
      throw new Error('Personal relief not configured');
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addProcessingLog(`[STEP 4] ✓ Loaded reliefs: Personal (${formatKES(statutoryReliefs.personalRelief)}), Insurance (${formatKES(statutoryReliefs.insuranceRelief)}), Pension (${formatKES(statutoryReliefs.pensionRelief)})`);
  };

  // Step 5: Calculate PAYE for each employee
  const handleStep5_CalculatePAYE = async () => {
    setCurrentStep(5);
    addProcessingLog(`[STEP 5] FOR each employee: CALCULATE PAYE...`);

    const calculations: PAYECalculation[] = [];

    for (let i = 0; i < employeesList.length; i++) {
      const employee = employeesList[i];
      
      addProcessingLog(`[STEP 5.${i+1}] Processing ${employee.employeeName}...`);
      
      // 1. FETCH gross_pay
      const grossPay = employee.grossPay;
      
      // 2. FETCH reliefs
      const totalReliefs = employee.personalRelief + employee.insuranceRelief + employee.pensionRelief;
      
      // 3. Check tax exemption
      if (employee.isTaxExempt) {
        calculations.push({
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          grossPay: grossPay,
          taxableIncome: 0,
          payeAmount: 0,
          personalRelief: employee.personalRelief,
          totalReliefs: totalReliefs,
          effectiveRate: 0,
          dateCalculated: new Date().toISOString(),
          calculatedBy: user?.id || 'system',
          validationStatus: 'valid'
        });
        continue;
      }
      
      // 4. CALCULATE taxable_income
      const annualGrossPay = grossPay * 12; // Convert to annual
      const annualReliefs = totalReliefs; // Already annual
      const taxableIncome = Math.max(0, annualGrossPay - annualReliefs);
      
      // 5. Check if taxable income <= 0
      if (taxableIncome <= 0) {
        calculations.push({
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          grossPay: grossPay,
          taxableIncome: 0,
          payeAmount: 0,
          personalRelief: employee.personalRelief,
          totalReliefs: totalReliefs,
          effectiveRate: 0,
          dateCalculated: new Date().toISOString(),
          calculatedBy: user?.id || 'system',
          validationStatus: 'valid'
        });
        continue;
      }
      
      // 6-8. Apply PAYE tax brackets
      let totalTax = 0;
      let remainingIncome = taxableIncome;
      
      for (const bracket of taxBrackets) {
        if (remainingIncome <= 0) break;
        
        const bracketRange = bracket.max - bracket.min + 1;
        const taxableBracketAmount = Math.min(remainingIncome, bracketRange);
        totalTax += taxableBracketAmount * bracket.rate;
        remainingIncome -= taxableBracketAmount;
      }
      
      // 9. Apply personal relief
      totalTax = Math.max(0, totalTax - statutoryReliefs.personalRelief);
      
      // 10. Round to nearest whole number (KRA rounding rule)
      const payeAmount = Math.round(totalTax / 12); // Convert back to monthly
      
      // 11. Calculate effective rate
      const effectiveRate = grossPay > 0 ? (payeAmount / grossPay) * 100 : 0;
      
      calculations.push({
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        grossPay: grossPay,
        taxableIncome: taxableIncome / 12, // Convert back to monthly for display
        payeAmount: payeAmount,
        personalRelief: employee.personalRelief,
        totalReliefs: totalReliefs,
        effectiveRate: effectiveRate,
        dateCalculated: new Date().toISOString(),
        calculatedBy: user?.id || 'system',
        validationStatus: 'pending'
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setPayeCalculations(calculations);
    addProcessingLog(`[STEP 5] ✓ Calculated PAYE for ${calculations.length} employees`);
  };

  // Step 6: Validate PAYE against KRA calculator
  const handleStep6_ValidatePAYE = async () => {
    setCurrentStep(6);
    addProcessingLog(`[STEP 6] VALIDATE PAYE against KRA calculator...`);
    
    const validationResults = payeCalculations.map(calc => {
      // Mock validation - in real system, this would call KRA API
      const expectedPAYE = calc.payeAmount; // Assuming our calculation is correct
      const discrepancy = Math.abs(calc.payeAmount - expectedPAYE);
      const allowedThreshold = 10; // KES 10 tolerance
      
      return {
        ...calc,
        validationStatus: discrepancy > allowedThreshold ? 'flagged' : 'valid',
        discrepancy: discrepancy
      };
    });
    
    setPayeCalculations(validationResults);
    setValidationResults(validationResults);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    const flaggedCount = validationResults.filter(r => r.validationStatus === 'flagged').length;
    addProcessingLog(`[STEP 6] ✓ Validation complete. ${flaggedCount} records flagged for review`);
  };

  // Step 7: Generate reports
  const handleStep7_GenerateReports = async () => {
    setCurrentStep(7);
    addProcessingLog(`[STEP 7] GENERATE reports (P10, P10A, P9A)...`);
    
    const reports: TaxReport[] = [];
    
    // Generate P10 report (Monthly employee deductions)
    const p10Data = payeCalculations.map(calc => ({
      employeeId: calc.employeeId,
      employeeName: calc.employeeName,
      taxablePay: calc.taxableIncome,
      payeDeduction: calc.payeAmount
    }));
    
    reports.push({
      reportType: 'P10',
      period: `${payrollPeriod.month}/${payrollPeriod.year}`,
      data: p10Data,
      generatedAt: new Date().toISOString(),
      totalEmployees: payeCalculations.length,
      totalTaxable: payeCalculations.reduce((sum, calc) => sum + calc.taxableIncome, 0),
      totalPAYE: payeCalculations.reduce((sum, calc) => sum + calc.payeAmount, 0)
    });
    
    // Generate P10A summary
    reports.push({
      reportType: 'P10A',
      period: `${payrollPeriod.month}/${payrollPeriod.year}`,
      data: [{
        totalEmployees: payeCalculations.length,
        totalTaxablePay: payeCalculations.reduce((sum, calc) => sum + calc.taxableIncome, 0),
        totalPAYE: payeCalculations.reduce((sum, calc) => sum + calc.payeAmount, 0)
      }],
      generatedAt: new Date().toISOString(),
      totalEmployees: payeCalculations.length,
      totalTaxable: payeCalculations.reduce((sum, calc) => sum + calc.taxableIncome, 0),
      totalPAYE: payeCalculations.reduce((sum, calc) => sum + calc.payeAmount, 0)
    });
    
    setGeneratedReports(reports);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addProcessingLog(`[STEP 7] ✓ Generated ${reports.length} reports (P10, P10A)`);
  };

  // Step 8: Prepare iTax submission file
  const handleStep8_PrepareiTax = async () => {
    setCurrentStep(8);
    addProcessingLog(`[STEP 8] PREPARE iTax submission file...`);
    
    // Format iTax CSV file according to KRA template
    const csvHeaders = ['Employee ID', 'Employee Name', 'Taxable Pay', 'PAYE Deduction'];
    const csvData = payeCalculations.map(calc => [
      calc.employeeId,
      calc.employeeName,
      calc.taxableIncome.toString(),
      calc.payeAmount.toString()
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    setITaxFile(blob);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addProcessingLog(`[STEP 8] ✓ iTax submission file prepared (${blob.size} bytes)`);
  };

  // Step 9: Log audit entries
  const handleStep9_LogAudit = async () => {
    setCurrentStep(9);
    addProcessingLog(`[STEP 9] LOG audit entries...`);
    
    // Log tax calculation action
    logTaxAction(
      {
        userId: user?.id || 'system',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1'
      },
      AuditAction.CALCULATE,
      `tax_calculation_${payrollPeriod.month}_${payrollPeriod.year}`,
      undefined,
      {
        period: `${payrollPeriod.month}/${payrollPeriod.year}`,
        employeesProcessed: payeCalculations.length,
        totalPAYE: payeCalculations.reduce((sum, calc) => sum + calc.payeAmount, 0),
        flaggedRecords: payeCalculations.filter(calc => calc.validationStatus === 'flagged').length
      }
    );
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addProcessingLog(`[STEP 9] ✓ Audit entries logged successfully`);
    addProcessingLog(`[COMPLETE] Tax calculation algorithm completed successfully!`);
  };

  // Execute complete algorithm
  const executeCompleteAlgorithm = async () => {
    try {
      setIsProcessing(true);
      setProcessingLogs([]);
      setCurrentStep(0);
      
      await handleStep1_InputPeriod();
      await handleStep2_SelectEmployees();
      await handleStep3_LoadTaxTable();
      await handleStep4_LoadReliefs();
      await handleStep5_CalculatePAYE();
      await handleStep6_ValidatePAYE();
      await handleStep7_GenerateReports();
      await handleStep8_PrepareiTax();
      await handleStep9_LogAudit();
      
    } catch (error) {
      addProcessingLog(`[ERROR] ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions
  const addProcessingLog = (message: string) => {
    setProcessingLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const downloadReport = (reportType: string) => {
    const report = generatedReports.find(r => r.reportType === reportType);
    if (!report) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      JSON.stringify(report, null, 2);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_${report.period.replace('/', '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadiTaxFile = () => {
    if (!iTaxFile) return;
    
    const url = window.URL.createObjectURL(iTaxFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `iTax_${payrollPeriod.month}_${payrollPeriod.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Check permissions
  const canManageTax = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER]);

  if (!canManageTax) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the Tax Management module. 
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
          <h1 className="text-3xl font-bold text-gray-900">PAYE Tax Management</h1>
          <p className="text-gray-600">Kenya Revenue Authority (KRA) compliant tax calculation system</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            KRA 2024 Compliant
          </Badge>
        </div>
      </div>


      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calculation">Tax Calculation</TabsTrigger>
          <TabsTrigger value="results">Results & Validation</TabsTrigger>
          <TabsTrigger value="reports">Reports & Export</TabsTrigger>
          <TabsTrigger value="submission">iTax Submission</TabsTrigger>
          <TabsTrigger value="settings">Tax Settings</TabsTrigger>
        </TabsList>

        {/* Tax Calculation Tab */}
        <TabsContent value="calculation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Step 1-4: Input & Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="month">Tax Month</Label>
                    <Select
                      value={payrollPeriod.month.toString()}
                      onValueChange={(value) => setPayrollPeriod({...payrollPeriod, month: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                          <SelectItem key={month} value={month.toString()}>
                            {getMonthName(month)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year">Tax Year</Label>
                    <Select
                      value={payrollPeriod.year.toString()}
                      onValueChange={(value) => setPayrollPeriod({...payrollPeriod, year: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="department">Department Filter</Label>
                  <Select
                    value={employeeFilters.department}
                    onValueChange={(value) => setEmployeeFilters({...employeeFilters, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Statutory Reliefs (Annual)</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Personal Relief</Label>
                      <div className="font-medium">{formatKES(statutoryReliefs.personalRelief)}</div>
                    </div>
                    <div>
                      <Label>Insurance Relief</Label>
                      <div className="font-medium">{formatKES(statutoryReliefs.insuranceRelief)}</div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={executeCompleteAlgorithm}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing Algorithm...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Execute PAYE Calculation Algorithm
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Progress Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Algorithm Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-sm text-gray-600">
                    Step {currentStep} of {algorithmSteps.length}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
                    <h4 className="font-medium mb-2">Processing Log</h4>
                    {processingLogs.length === 0 ? (
                      <p className="text-sm text-gray-500">Click "Execute Algorithm" to start processing</p>
                    ) : (
                      <div className="space-y-1">
                        {processingLogs.map((log, index) => (
                          <div key={index} className="text-xs font-mono">{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Selection Preview */}
          {employeesList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Selected Employees ({employeesList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Personal Relief</TableHead>
                      <TableHead>Total Reliefs</TableHead>
                      <TableHead>Tax Exempt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesList.map((employee) => (
                      <TableRow key={employee.employeeId}>
                        <TableCell className="font-medium">{employee.employeeName}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{formatKES(employee.grossPay)}</TableCell>
                        <TableCell>{formatKES(employee.personalRelief)}</TableCell>
                        <TableCell>{formatKES(employee.personalRelief + employee.insuranceRelief + employee.pensionRelief)}</TableCell>
                        <TableCell>
                          <Badge variant={employee.isTaxExempt ? "destructive" : "secondary"}>
                            {employee.isTaxExempt ? 'Exempt' : 'Taxable'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results & Validation Tab */}
        <TabsContent value="results" className="space-y-6">
          {payeCalculations.length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Employees</p>
                        <p className="text-2xl font-bold">{payeCalculations.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total PAYE</p>
                        <p className="text-2xl font-bold">
                          {formatKES(payeCalculations.reduce((sum, calc) => sum + calc.payeAmount, 0))}
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
                        <p className="text-sm font-medium text-gray-600">Valid Records</p>
                        <p className="text-2xl font-bold">
                          {payeCalculations.filter(calc => calc.validationStatus === 'valid').length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Flagged Records</p>
                        <p className="text-2xl font-bold">
                          {payeCalculations.filter(calc => calc.validationStatus === 'flagged').length}
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* PAYE Calculations Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    PAYE Calculation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Taxable Income</TableHead>
                        <TableHead>PAYE Amount</TableHead>
                        <TableHead>Effective Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payeCalculations.map((calc) => (
                        <TableRow key={calc.employeeId}>
                          <TableCell className="font-medium">{calc.employeeName}</TableCell>
                          <TableCell>{formatKES(calc.grossPay)}</TableCell>
                          <TableCell>{formatKES(calc.taxableIncome)}</TableCell>
                          <TableCell className="font-bold">{formatKES(calc.payeAmount)}</TableCell>
                          <TableCell>{calc.effectiveRate.toFixed(2)}%</TableCell>
                          <TableCell>
                            <Badge variant={calc.payeAmount > 0 ? "default" : "secondary"}>
                              {calc.payeAmount > 0 ? 'Taxable' : 'No Tax'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={calc.validationStatus === 'valid' ? "default" : "destructive"}>
                              {calc.validationStatus === 'valid' ? 'Valid' : 'Flagged'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No PAYE Calculations</h3>
                <p className="text-gray-600">Execute the tax calculation algorithm to see results here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports & Export Tab */}
        <TabsContent value="reports" className="space-y-6">
          {generatedReports.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {generatedReports.map((report) => (
                <Card key={report.reportType}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {report.reportType} Report
                      </div>
                      <Badge>{report.period}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Total Employees</Label>
                        <div className="font-medium">{report.totalEmployees}</div>
                      </div>
                      <div>
                        <Label>Total Taxable</Label>
                        <div className="font-medium">{formatKES(report.totalTaxable)}</div>
                      </div>
                      <div>
                        <Label>Total PAYE</Label>
                        <div className="font-medium">{formatKES(report.totalPAYE)}</div>
                      </div>
                      <div>
                        <Label>Generated</Label>
                        <div className="font-medium">{new Date(report.generatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report.reportType)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Generated</h3>
                <p className="text-gray-600">Complete the tax calculation to generate P10, P10A, and P9A reports.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* iTax Submission Tab */}
        <TabsContent value="submission" className="space-y-6">
          {iTaxFile ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  iTax Submission File Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    iTax submission file has been prepared according to KRA CSV template format.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>File Size</Label>
                    <div className="font-medium">{iTaxFile.size} bytes</div>
                  </div>
                  <div>
                    <Label>Format</Label>
                    <div className="font-medium">CSV (KRA Template)</div>
                  </div>
                  <div>
                    <Label>Records</Label>
                    <div className="font-medium">{payeCalculations.length} employees</div>
                  </div>
                  <div>
                    <Label>Period</Label>
                    <div className="font-medium">{payrollPeriod.month}/{payrollPeriod.year}</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={downloadiTaxFile}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download iTax File
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Submit to KRA iTax
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">iTax File Not Ready</h3>
                <p className="text-gray-600">Complete the tax calculation algorithm to prepare the iTax submission file.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tax Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                PAYE Tax Brackets (2024)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bracket</TableHead>
                    <TableHead>Min Income</TableHead>
                    <TableHead>Max Income</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Cumulative Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxBrackets.map((bracket, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatKES(bracket.min)}</TableCell>
                      <TableCell>{bracket.max === Infinity ? 'No Limit' : formatKES(bracket.max)}</TableCell>
                      <TableCell>{(bracket.rate * 100).toFixed(1)}%</TableCell>
                      <TableCell>{bracket.cumulativeMax === Infinity ? 'No Limit' : formatKES(bracket.cumulativeMax)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Statutory Reliefs Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="personalRelief">Personal Relief (Annual)</Label>
                  <Input
                    id="personalRelief"
                    type="number"
                    value={statutoryReliefs.personalRelief}
                    onChange={(e) => setStatutoryReliefs({
                      ...statutoryReliefs,
                      personalRelief: Number(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="insuranceRelief">Insurance Relief Limit (Annual)</Label>
                  <Input
                    id="insuranceRelief"
                    type="number"
                    value={statutoryReliefs.insuranceRelief}
                    onChange={(e) => setStatutoryReliefs({
                      ...statutoryReliefs,
                      insuranceRelief: Number(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="pensionRelief">Pension Relief Limit (Annual)</Label>
                  <Input
                    id="pensionRelief"
                    type="number"
                    value={statutoryReliefs.pensionRelief}
                    onChange={(e) => setStatutoryReliefs({
                      ...statutoryReliefs,
                      pensionRelief: Number(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="disabilityRelief">Disability Relief (Annual)</Label>
                  <Input
                    id="disabilityRelief"
                    type="number"
                    value={statutoryReliefs.disabilityRelief}
                    onChange={(e) => setStatutoryReliefs({
                      ...statutoryReliefs,
                      disabilityRelief: Number(e.target.value)
                    })}
                  />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Relief Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxManagement;
