import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  FileText,
  Download,
  Mail,
  Eye,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Calculator,
  Send,
  Printer,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { 
  Employee, 
  PayrollEntry, 
  Payslip,
  UserRole 
} from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface PayslipGenerationStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface PayslipGenerationRequest {
  month: string;
  year: string;
  employeeIds: string[];
  batchType: 'individual' | 'department' | 'all';
  department?: string;
}

interface PayslipData {
  employee: Employee;
  payrollEntry: PayrollEntry;
  payslip: Payslip;
}

export default function Payslips() {
  const { user, hasAnyRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  
  // Form state
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [batchType, setBatchType] = useState<'individual' | 'department' | 'all'>('individual');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availablePayslips, setAvailablePayslips] = useState<Payslip[]>([]);
  const [generatedPayslips, setGeneratedPayslips] = useState<PayslipData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  
  // Algorithm steps
  const algorithmSteps: PayslipGenerationStep[] = [
    {
      step: 1,
      title: 'Select Parameters',
      description: 'Select month and employee ID (or batch)',
      completed: false,
      current: false,
    },
    {
      step: 2,
      title: 'Retrieve Payroll Data',
      description: 'Retrieve payroll data for selected period',
      completed: false,
      current: false,
    },
    {
      step: 3,
      title: 'Get Breakdown',
      description: 'Retrieve earning and deduction breakdown',
      completed: false,
      current: false,
    },
    {
      step: 4,
      title: 'Generate Payslip',
      description: 'Generate PDF/HTML payslip with full breakdown',
      completed: false,
      current: false,
    },
    {
      step: 5,
      title: 'Distribute',
      description: 'Email payslip to employee and/or allow download',
      completed: false,
      current: false,
    },
    {
      step: 6,
      title: 'Audit Log',
      description: 'Log payslip generation in audit trail',
      completed: false,
      current: false,
    },
  ];

  const [steps, setSteps] = useState(algorithmSteps);

  useEffect(() => {
    fetchEmployees();
    fetchExistingPayslips();
  }, []);

  const fetchEmployees = async () => {
    // Mock employees data
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
        payrollCategory: 'monthly' as any,
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
        payrollCategory: 'monthly' as any,
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
        payrollCategory: 'monthly' as any,
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
      },
    ];
    setEmployees(mockEmployees);
  };

  const fetchExistingPayslips = async () => {
    // Mock existing payslips
    const mockPayslips: Payslip[] = [
      {
        id: '1',
        employeeId: '1',
        payrollPeriodId: 'period-2024-03',
        employee: {
          firstName: 'John',
          lastName: 'Mwangi',
          employeeNumber: 'EMP001',
          position: 'Software Engineer',
          department: 'Engineering',
        },
        payPeriod: {
          startDate: '2024-03-01',
          endDate: '2024-03-31',
          payDate: '2024-03-25',
        },
        earnings: {
          basicSalary: 100000,
          overtime: 5000,
          allowances: 10000,
          bonus: 0,
          commission: 0,
          gross: 115000,
        },
        deductions: {
          payeTax: 15000,
          nhif: 1700,
          nssf: 2160,
          housingLevy: 1725,
          pension: 5000,
          other: 0,
          total: 25585,
        },
        totals: {
          gross: 115000,
          deductions: 25585,
          net: 89415,
        },
        ytdTotals: {
          grossEarnings: 345000,
          totalDeductions: 76755,
          netPay: 268245,
          taxPaid: 45000,
        },
        generatedAt: '2024-03-25T10:00:00Z',
      },
      {
        id: '2',
        employeeId: '2',
        payrollPeriodId: 'period-2024-03',
        employee: {
          firstName: 'Grace',
          lastName: 'Wanjiku',
          employeeNumber: 'EMP002',
          position: 'Marketing Manager',
          department: 'Marketing',
        },
        payPeriod: {
          startDate: '2024-03-01',
          endDate: '2024-03-31',
          payDate: '2024-03-25',
        },
        earnings: {
          basicSalary: 79167,
          overtime: 0,
          allowances: 8000,
          bonus: 5000,
          commission: 0,
          gross: 92167,
        },
        deductions: {
          payeTax: 12000,
          nhif: 1600,
          nssf: 2160,
          housingLevy: 1383,
          pension: 4750,
          other: 0,
          total: 21893,
        },
        totals: {
          gross: 92167,
          deductions: 21893,
          net: 70274,
        },
        ytdTotals: {
          grossEarnings: 276500,
          totalDeductions: 65679,
          netPay: 210821,
          taxPaid: 36000,
        },
        generatedAt: '2024-03-25T10:00:00Z',
      },
    ];
    setAvailablePayslips(mockPayslips);
  };

  const updateStepStatus = (stepNumber: number, completed: boolean, current: boolean) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      completed: step.step < stepNumber ? true : (step.step === stepNumber ? completed : false),
      current: step.step === stepNumber ? current : false,
    })));
  };

  // Step 1: Selection validation
  const validateSelection = (): boolean => {
    if (!selectedMonth || !selectedYear) {
      alert('Please select month and year');
      return false;
    }

    if (batchType === 'individual' && selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return false;
    }

    if (batchType === 'department' && !selectedDepartment) {
      alert('Please select a department');
      return false;
    }

    return true;
  };

  // Main payslip generation handler implementing the algorithm
  const handleGeneratePayslips = async () => {
    // Step 1: Validate selection
    if (!validateSelection()) {
      return;
    }

    setIsGenerating(true);
    setCurrentStep(1);
    updateStepStatus(1, true, true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Retrieve payroll data
    setCurrentStep(2);
    updateStepStatus(2, false, true);
    
    let targetEmployees: Employee[] = [];
    
    if (batchType === 'individual') {
      targetEmployees = employees.filter(emp => selectedEmployees.includes(emp.id));
    } else if (batchType === 'department') {
      targetEmployees = employees.filter(emp => emp.department === selectedDepartment);
    } else {
      targetEmployees = employees;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    updateStepStatus(2, true, false);

    // Step 3: Retrieve earning and deduction breakdown
    setCurrentStep(3);
    updateStepStatus(3, false, true);
    
    const payslipData: PayslipData[] = [];
    
    for (const employee of targetEmployees) {
      // Mock payroll calculation
      const monthlySalary = employee.salary / 12;
      const grossPay = monthlySalary + Math.floor(Math.random() * 10000); // Add random allowances
      const payeTax = grossPay * 0.15; // Simplified tax
      const nhif = 1700;
      const nssf = 2160;
      const housingLevy = grossPay * 0.015;
      const pension = grossPay * (employee.taxInformation.pensionContribution / 100);
      const totalDeductions = payeTax + nhif + nssf + housingLevy + pension;
      const netPay = grossPay - totalDeductions;

      const payslip: Payslip = {
        id: `${employee.id}-${selectedYear}-${selectedMonth}`,
        employeeId: employee.id,
        payrollPeriodId: `period-${selectedYear}-${selectedMonth}`,
        employee: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeNumber: employee.employeeNumber,
          position: employee.position,
          department: employee.department,
        },
        payPeriod: {
          startDate: `${selectedYear}-${selectedMonth}-01`,
          endDate: new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).toISOString().split('T')[0],
          payDate: `${selectedYear}-${selectedMonth}-25`,
        },
        earnings: {
          basicSalary: Math.round(monthlySalary),
          overtime: Math.floor(Math.random() * 5000),
          allowances: Math.floor(Math.random() * 10000),
          bonus: Math.floor(Math.random() * 15000),
          commission: 0,
          gross: Math.round(grossPay),
        },
        deductions: {
          payeTax: Math.round(payeTax),
          nhif,
          nssf,
          housingLevy: Math.round(housingLevy),
          pension: Math.round(pension),
          other: 0,
          total: Math.round(totalDeductions),
        },
        totals: {
          gross: Math.round(grossPay),
          deductions: Math.round(totalDeductions),
          net: Math.round(netPay),
        },
        ytdTotals: {
          grossEarnings: Math.round(grossPay * parseInt(selectedMonth)),
          totalDeductions: Math.round(totalDeductions * parseInt(selectedMonth)),
          netPay: Math.round(netPay * parseInt(selectedMonth)),
          taxPaid: Math.round(payeTax * parseInt(selectedMonth)),
        },
        generatedAt: new Date().toISOString(),
      };

      payslipData.push({
        employee,
        payrollEntry: {} as PayrollEntry, // Mock
        payslip,
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    updateStepStatus(3, true, false);

    // Step 4: Generate PDF/HTML payslip
    setCurrentStep(4);
    updateStepStatus(4, false, true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStepStatus(4, true, false);

    // Step 5: Email and download preparation
    setCurrentStep(5);
    updateStepStatus(5, false, true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus(5, true, false);

    // Step 6: Audit logging
    setCurrentStep(6);
    updateStepStatus(6, false, true);
    
    // Log generation
    console.log('Audit Log: Payslips generated', {
      generatedBy: user?.email,
      timestamp: new Date().toISOString(),
      count: payslipData.length,
      period: `${selectedYear}-${selectedMonth}`,
      employees: payslipData.map(p => p.employee.employeeNumber),
    });

    await new Promise(resolve => setTimeout(resolve, 800));
    updateStepStatus(6, true, false);

    // Complete
    setGeneratedPayslips(payslipData);
    setAvailablePayslips(prev => [...payslipData.map(p => p.payslip), ...prev]);
    setIsGenerating(false);
    setShowGenerateForm(false);
    resetForm();
    
    alert(`Successfully generated ${payslipData.length} payslips!`);
  };

  const resetForm = () => {
    setSelectedMonth('');
    setSelectedEmployees([]);
    setBatchType('individual');
    setSelectedDepartment('');
    setCurrentStep(1);
    setSteps(algorithmSteps);
  };

  const handleDownloadPayslip = (payslip: Payslip) => {
    // Mock PDF download
    console.log('Downloading payslip for', payslip.employee.employeeNumber);
    alert(`Downloading payslip for ${payslip.employee.firstName} ${payslip.employee.lastName}`);
  };

  const handleEmailPayslip = (payslip: Payslip) => {
    // Mock email sending
    console.log('Emailing payslip to', payslip.employee.employeeNumber);
    alert(`Payslip emailed to ${payslip.employee.firstName} ${payslip.employee.lastName}`);
  };

  const handleViewPayslip = (payslip: Payslip) => {
    // Mock payslip preview
    console.log('Viewing payslip for', payslip.employee.employeeNumber);
    alert(`Opening payslip preview for ${payslip.employee.firstName} ${payslip.employee.lastName}`);
  };

  const getDepartments = () => {
    return [...new Set(employees.map(emp => emp.department))];
  };

  const filteredPayslips = availablePayslips.filter(payslip => {
    const matchesSearch = `${payslip.employee.firstName} ${payslip.employee.lastName} ${payslip.employee.employeeNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesMonth = filterMonth === 'all' || 
      payslip.payPeriod.startDate.startsWith(`${new Date().getFullYear()}-${filterMonth.padStart(2, '0')}`);
    
    return matchesSearch && matchesMonth;
  });

  const canGeneratePayslips = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  // Set default month to current month
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    if (!selectedMonth) {
      setSelectedMonth(currentMonth.toString().padStart(2, '0'));
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payslips</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate and manage employee payslips with detailed breakdowns
          </p>
        </div>
        {canGeneratePayslips && (
          <Button onClick={() => setShowGenerateForm(true)} className="mt-4 sm:mt-0">
            <FileText className="mr-2 h-4 w-4" />
            Generate Payslips
          </Button>
        )}
      </div>

      <Tabs defaultValue="payslips" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payslips">All Payslips</TabsTrigger>
          {canGeneratePayslips && <TabsTrigger value="generate">Generate New</TabsTrigger>}
        </TabsList>

        <TabsContent value="payslips" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                        {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payslips Table */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Payslips ({filteredPayslips.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPayslips.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payslips found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {canGeneratePayslips 
                      ? "Generate payslips to get started."
                      : "No payslips have been generated yet."
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payslip.employee.firstName} {payslip.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payslip.employee.employeeNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(payslip.payPeriod.startDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell>{formatKES(payslip.totals.gross)}</TableCell>
                        <TableCell>{formatKES(payslip.totals.deductions)}</TableCell>
                        <TableCell className="font-medium">
                          {formatKES(payslip.totals.net)}
                        </TableCell>
                        <TableCell>
                          {new Date(payslip.generatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPayslip(payslip)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPayslip(payslip)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canGeneratePayslips && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEmailPayslip(payslip)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canGeneratePayslips && (
          <TabsContent value="generate" className="space-y-6">
            {/* Algorithm Steps */}
            {showGenerateForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="mr-2 h-5 w-5" />
                    Payslip Generation Process Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={(steps.filter(s => s.completed).length / steps.length) * 100} className="h-2" />
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm">
                      {steps.map((step) => (
                        <div
                          key={step.step}
                          className={`text-center p-3 rounded-lg ${
                            step.completed
                              ? 'bg-green-100 text-green-800'
                              : step.current
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <div className="font-medium">{step.step}</div>
                          <div className="text-xs mt-1">{step.title}</div>
                          {step.completed && <CheckCircle className="mx-auto mt-1 h-3 w-3" />}
                          {step.current && <Clock className="mx-auto mt-1 h-3 w-3 animate-pulse" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Payslips</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleGeneratePayslips(); }} className="space-y-6">
                  {/* Step 1: Selection Parameters */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Step 1: Select Parameters</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                                {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Generation Type</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="individual"
                            checked={batchType === 'individual'}
                            onCheckedChange={() => setBatchType('individual')}
                          />
                          <Label htmlFor="individual">Individual Employees</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="department"
                            checked={batchType === 'department'}
                            onCheckedChange={() => setBatchType('department')}
                          />
                          <Label htmlFor="department">By Department</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="all"
                            checked={batchType === 'all'}
                            onCheckedChange={() => setBatchType('all')}
                          />
                          <Label htmlFor="all">All Employees</Label>
                        </div>
                      </div>
                    </div>

                    {batchType === 'individual' && (
                      <div className="space-y-2">
                        <Label>Select Employees</Label>
                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                          {employees.map((employee) => (
                            <div key={employee.id} className="flex items-center space-x-2 mb-2">
                              <Checkbox
                                id={employee.id}
                                checked={selectedEmployees.includes(employee.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEmployees(prev => [...prev, employee.id]);
                                  } else {
                                    setSelectedEmployees(prev => prev.filter(id => id !== employee.id));
                                  }
                                }}
                              />
                              <Label htmlFor={employee.id} className="flex-1 cursor-pointer">
                                {employee.firstName} {employee.lastName} ({employee.employeeNumber})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {batchType === 'department' && (
                      <div className="space-y-2">
                        <Label>Select Department</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDepartments().map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowGenerateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isGenerating}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isGenerating ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Payslips
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Generate Dialog */}
      <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New Payslips</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Follow the 6-step process to generate payslips for selected employees.
            </p>
            <Button onClick={() => setShowGenerateForm(false)} className="w-full">
              Start Generation Process
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
