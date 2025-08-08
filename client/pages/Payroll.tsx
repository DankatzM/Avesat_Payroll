import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logPayrollAction } from '@shared/audit-service';
import { AuditAction } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Calendar,
  Users,
  Calculator,
  CheckCircle,
  Play,
  FileText,
  Clock,
  DollarSign,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Employee, PayrollPeriod, PayrollEntry, PayrollStatus, PayrollCategory, UserRole } from '@shared/api';
import { calculateKenyaPayroll, formatKES } from '@shared/kenya-tax';
import { Link } from 'react-router-dom';

interface PayrollBatch {
  id: string;
  name: string;
  department?: string;
  payGroup?: string;
  employeeCount: number;
  employees: Employee[];
}

interface AttendanceData {
  employeeId: string;
  daysWorked: number;
  overtimeHours: number;
  absentDays: number;
  lateDays: number;
}

interface PayrollCalculation {
  employeeId: string;
  employee: Employee;
  attendance: AttendanceData;
  earnings: {
    baseSalary: number;
    bonuses: number;
    allowances: number;
    overtime: number;
    gross: number;
  };
  deductions: {
    payeTax: number;
    nhif: number;
    nssf: number;
    housingLevy: number;
    pension: number;
    loans: number;
    other: number;
    total: number;
  };
  netSalary: number;
  processed: boolean;
}

interface PayrollRun {
  id: string;
  period: PayrollPeriod;
  batch: PayrollBatch;
  calculations: PayrollCalculation[];
  status: 'setup' | 'calculating' | 'completed' | 'approved';
  createdAt: string;
  processedAt?: string;
}

export default function Payroll() {
  const { user, hasAnyRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);
  
  // Step 1: Selection state
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [processingMode, setProcessingMode] = useState<'batch' | 'single'>('batch');
  const [selectedBatch, setSelectedBatch] = useState<PayrollBatch | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [availableBatches, setAvailableBatches] = useState<PayrollBatch[]>([]);
  
  // Mock data
  const [employees] = useState<Employee[]>([
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
      payrollCategory: PayrollCategory.MONTHLY,
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
      payrollCategory: PayrollCategory.MONTHLY,
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
      payrollCategory: PayrollCategory.MONTHLY,
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
  ]);

  useEffect(() => {
    // Generate batches based on departments and pay groups
    const departments = [...new Set(employees.map(emp => emp.department))];
    const batches: PayrollBatch[] = [
      {
        id: 'all',
        name: 'All Employees',
        employeeCount: employees.length,
        employees: employees,
      },
      ...departments.map(dept => ({
        id: dept.toLowerCase(),
        name: `${dept} Department`,
        department: dept,
        employeeCount: employees.filter(emp => emp.department === dept).length,
        employees: employees.filter(emp => emp.department === dept),
      })),
      {
        id: 'monthly',
        name: 'Monthly Employees',
        payGroup: 'monthly',
        employeeCount: employees.filter(emp => emp.payrollCategory === PayrollCategory.MONTHLY).length,
        employees: employees.filter(emp => emp.payrollCategory === PayrollCategory.MONTHLY),
      },
    ];
    setAvailableBatches(batches);
    
    // Set default month to current month
    const currentMonth = new Date().getMonth() + 1;
    setSelectedMonth(currentMonth.toString().padStart(2, '0'));
  }, [employees]);

  const generateAttendanceData = (employeeId: string): AttendanceData => {
    // Mock attendance data - in real app, fetch from attendance system
    return {
      employeeId,
      daysWorked: Math.floor(Math.random() * 3) + 20, // 20-22 days
      overtimeHours: Math.floor(Math.random() * 10), // 0-9 hours
      absentDays: Math.floor(Math.random() * 3), // 0-2 days
      lateDays: Math.floor(Math.random() * 2), // 0-1 days
    };
  };

  const calculateEmployeePayroll = (employee: Employee, attendance: AttendanceData): PayrollCalculation => {
    const monthlySalary = employee.salary / 12;
    
    // Step 3: Calculate earnings
    const baseSalary = (monthlySalary / 22) * attendance.daysWorked; // Pro-rated for days worked
    const overtimePay = (monthlySalary / 22 / 8) * 1.5 * attendance.overtimeHours; // 1.5x overtime rate
    const bonuses = Math.random() > 0.7 ? Math.floor(Math.random() * 50000) : 0; // Random bonus
    const allowances = Math.floor(Math.random() * 20000); // Random allowances
    const grossEarnings = baseSalary + overtimePay + bonuses + allowances;

    // Step 4 & 5: Calculate deductions using Kenya tax calculator
    const taxCalc = calculateKenyaPayroll(grossEarnings, employee.taxInformation.pensionContribution / 100);
    
    // Additional deductions
    const loans = Math.random() > 0.8 ? Math.floor(Math.random() * 30000) : 0; // Random loan deduction
    const otherDeductions = Math.floor(Math.random() * 5000); // Other deductions
    
    const totalDeductions = taxCalc.netTax + taxCalc.nhifDeduction + taxCalc.totalNssf + 
                           taxCalc.housingLevy + taxCalc.pensionContribution + loans + otherDeductions;
    
    const netSalary = grossEarnings - totalDeductions;

    return {
      employeeId: employee.id,
      employee,
      attendance,
      earnings: {
        baseSalary: Math.round(baseSalary),
        bonuses: bonuses,
        allowances: allowances,
        overtime: Math.round(overtimePay),
        gross: Math.round(grossEarnings),
      },
      deductions: {
        payeTax: taxCalc.netTax,
        nhif: taxCalc.nhifDeduction,
        nssf: taxCalc.totalNssf,
        housingLevy: taxCalc.housingLevy,
        pension: taxCalc.pensionContribution,
        loans: loans,
        other: otherDeductions,
        total: Math.round(totalDeductions),
      },
      netSalary: Math.round(netSalary),
      processed: false,
    };
  };

  const processPayroll = async () => {
    if (!selectedMonth || !selectedYear) return;
    if (processingMode === 'batch' && !selectedBatch) return;
    if (processingMode === 'single' && !selectedEmployee) return;
    
    setIsProcessing(true);
    setCurrentStep(2);

    try {
      // Determine the batch to process
      const processingBatch = processingMode === 'batch'
        ? selectedBatch!
        : {
            id: `single-${selectedEmployee!.id}`,
            name: `Single Employee: ${selectedEmployee!.firstName} ${selectedEmployee!.lastName}`,
            employeeCount: 1,
            employees: [selectedEmployee!]
          };

      // Step 6: Create payroll period
      const period: PayrollPeriod = {
        id: `payroll-${Date.now()}`,
        startDate: `${selectedYear}-${selectedMonth}-01`,
        endDate: new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).toISOString().split('T')[0],
        payDate: new Date(parseInt(selectedYear), parseInt(selectedMonth), 25).toISOString().split('T')[0],
        status: PayrollStatus.CALCULATING,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDeductions: 0,
        totalTax: 0,
        employeeCount: processingBatch.employees.length,
        createdAt: new Date().toISOString(),
      };

      const calculations: PayrollCalculation[] = [];

      // Process each employee
      for (let i = 0; i < processingBatch.employees.length; i++) {
        const employee = processingBatch.employees[i];
        setCurrentStep(2 + (i / processingBatch.employees.length) * 4); // Steps 2-6
        
        // Step 2: Retrieve attendance data
        const attendance = generateAttendanceData(employee.id);
        
        // Step 3-5: Calculate payroll
        const calculation = calculateEmployeePayroll(employee, attendance);
        calculations.push(calculation);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update period totals
      period.totalGrossPay = calculations.reduce((sum, calc) => sum + calc.earnings.gross, 0);
      period.totalNetPay = calculations.reduce((sum, calc) => sum + calc.netSalary, 0);
      period.totalDeductions = calculations.reduce((sum, calc) => sum + calc.deductions.total, 0);
      period.totalTax = calculations.reduce((sum, calc) => sum + calc.deductions.payeTax, 0);
      period.status = PayrollStatus.CALCULATED;

      // Step 6 & 7: Store payroll run and flag as processed
      const newRun: PayrollRun = {
        id: period.id,
        period,
        batch: processingBatch,
        calculations,
        status: 'completed',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      };

      setPayrollRuns(prev => [newRun, ...prev]);
      setCurrentRun(newRun);
      setCurrentStep(7);

      // Log audit entry for payroll processing
      logPayrollAction(
        {
          userId: user?.id || 'unknown',
          userAgent: navigator.userAgent,
          ipAddress: '127.0.0.1' // In production, get from server
        },
        AuditAction.CALCULATE,
        newRun.id,
        undefined,
        {
          batchName: processingBatch.name,
          period: `${selectedMonth}/${selectedYear}`,
          totalGrossPay: period.totalGrossPay,
          totalNetPay: period.totalNetPay,
          totalDeductions: period.totalDeductions,
          employeeCount: period.employeeCount,
          status: period.status,
          processingMode: processingMode
        }
      );
      
    } catch (error) {
      console.error('Payroll processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPayrollRun = () => {
    setCurrentStep(1);
    setCurrentRun(null);
    setSelectedBatch(null);
    setSelectedEmployee(null);
    setProcessingMode('batch');
  };

  const approvePayroll = (runId: string) => {
    const payrollRun = payrollRuns.find(run => run.id === runId);

    setPayrollRuns(prev =>
      prev.map(run =>
        run.id === runId
          ? { ...run, status: 'approved' as const }
          : run
      )
    );

    // Log audit entry for payroll approval
    if (payrollRun) {
      logPayrollAction(
        {
          userId: user?.id || 'unknown',
          userAgent: navigator.userAgent,
          ipAddress: '127.0.0.1' // In production, get from server
        },
        AuditAction.APPROVE,
        runId,
        { status: payrollRun.status },
        { status: 'approved' }
      );
    }
  };

  const canProcessPayroll = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  if (!canProcessPayroll) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access payroll processing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Process monthly payroll for employee batches with Kenya tax calculations
          </p>
        </div>
        {currentRun && (
          <Button onClick={resetPayrollRun} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            New Payroll Run
          </Button>
        )}
      </div>

      <Tabs defaultValue="process" className="space-y-6">
        <TabsList>
          <TabsTrigger value="process">Process Payroll</TabsTrigger>
          <TabsTrigger value="history">Payroll History</TabsTrigger>
        </TabsList>

        <TabsContent value="process" className="space-y-6">
          {/* Progress Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Payroll Processing Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={(currentStep / 7) * 100} className="h-2" />
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-sm">
                  {[
                    'Select Batch',
                    'Get Attendance',
                    'Calculate Earnings',
                    'Apply Deductions',
                    'Compute Net Pay',
                    'Store Records',
                    'Mark Complete'
                  ].map((step, index) => (
                    <div
                      key={index}
                      className={`text-center p-2 rounded ${
                        index + 1 <= currentStep
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="font-medium">{index + 1}</div>
                      <div className="text-xs">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Step 1: Select Payroll Period and Processing Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Payroll Month</Label>
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
                  <div className="space-y-2">
                    <Label>Processing Mode</Label>
                    <Select value={processingMode} onValueChange={(value: 'batch' | 'single') => {
                      setProcessingMode(value);
                      setSelectedBatch(null);
                      setSelectedEmployee(null);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batch">Batch Processing</SelectItem>
                        <SelectItem value="single">Single Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {processingMode === 'batch' && (
                  <div className="space-y-4">
                    <Label>Employee Batch</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableBatches.map(batch => (
                        <Card
                          key={batch.id}
                          className={`cursor-pointer border-2 transition-colors ${
                            selectedBatch?.id === batch.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedBatch(batch)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{batch.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {batch.employeeCount} employees
                                </p>
                                {batch.department && (
                                  <Badge variant="outline" className="mt-1">
                                    {batch.department}
                                  </Badge>
                                )}
                                {batch.payGroup && (
                                  <Badge variant="outline" className="mt-1">
                                    {batch.payGroup}
                                  </Badge>
                                )}
                              </div>
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {processingMode === 'single' && (
                  <div className="space-y-4">
                    <Label>Select Employee</Label>
                    <Select value={selectedEmployee?.id || ''} onValueChange={(employeeId) => {
                      const employee = employees.find(emp => emp.id === employeeId);
                      setSelectedEmployee(employee || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <div className="flex items-center space-x-2">
                              <span>{employee.firstName} {employee.lastName}</span>
                              <Badge variant="outline" className="text-xs">
                                {employee.employeeNumber}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedEmployee && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</h4>
                              <p className="text-sm text-gray-600">{selectedEmployee.position} • {selectedEmployee.department}</p>
                              <p className="text-sm font-medium">{selectedEmployee.employeeNumber}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                <Button
                  onClick={processPayroll}
                  disabled={
                    !selectedMonth ||
                    !selectedYear ||
                    (processingMode === 'batch' && !selectedBatch) ||
                    (processingMode === 'single' && !selectedEmployee) ||
                    isProcessing
                  }
                  className="w-full md:w-auto"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start {processingMode === 'batch' ? 'Batch' : 'Single Employee'} Processing
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Processing Steps 2-6 */}
          {currentStep > 1 && currentStep < 7 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Processing Payroll...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Processing {processingMode === 'batch' ? selectedBatch?.name : `${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}</span>
                    <span>{selectedMonth}/{selectedYear}</span>
                  </div>
                  <Progress value={(currentStep / 7) * 100} className="h-2" />
                  <p className="text-sm text-gray-600">
                    {currentStep === 2 && "Retrieving employee data and attendance records..."}
                    {currentStep === 3 && "Calculating base salary, bonuses, and allowances..."}
                    {currentStep === 4 && "Applying PAYE, NHIF, NSSF, and other deductions..."}
                    {currentStep === 5 && "Computing final net salary amounts..."}
                    {currentStep === 6 && "Storing payroll records in database..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Completed */}
          {currentStep === 7 && currentRun && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Payroll Processing Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {currentRun.calculations.length}
                    </div>
                    <div className="text-sm text-green-800">Employees Processed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatKES(currentRun.period.totalGrossPay)}
                    </div>
                    <div className="text-sm text-blue-800">Total Gross Pay</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatKES(currentRun.period.totalDeductions)}
                    </div>
                    <div className="text-sm text-red-800">Total Deductions</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {formatKES(currentRun.period.totalNetPay)}
                    </div>
                    <div className="text-sm text-indigo-800">Total Net Pay</div>
                  </div>
                </div>

                {/* Payroll Details Table */}
                <div className="space-y-4">
                  <h4 className="font-medium">Payroll Details</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>PAYE Tax</TableHead>
                        <TableHead>NHIF</TableHead>
                        <TableHead>NSSF</TableHead>
                        <TableHead>Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRun.calculations.map((calc) => (
                        <TableRow key={calc.employeeId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {calc.employee.firstName} {calc.employee.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {calc.employee.employeeNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatKES(calc.earnings.gross)}</TableCell>
                          <TableCell>{formatKES(calc.deductions.payeTax)}</TableCell>
                          <TableCell>{formatKES(calc.deductions.nhif)}</TableCell>
                          <TableCell>{formatKES(calc.deductions.nssf)}</TableCell>
                          <TableCell className="font-medium">
                            {formatKES(calc.netSalary)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => approvePayroll(currentRun.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Payroll
                  </Button>
                  <Link to="/payslips">
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Payslips
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => {
                    // Create and download CSV report
                    const csvData = currentRun.calculations.map(calc => ({
                      'Employee Number': calc.employee.employeeNumber,
                      'Employee Name': `${calc.employee.firstName} ${calc.employee.lastName}`,
                      'Department': calc.employee.department,
                      'Gross Pay': calc.earnings.gross,
                      'PAYE Tax': calc.deductions.payeTax,
                      'NHIF': calc.deductions.nhif,
                      'NSSF': calc.deductions.nssf,
                      'Housing Levy': calc.deductions.housingLevy,
                      'Total Deductions': calc.deductions.total,
                      'Net Pay': calc.netSalary
                    }));

                    const csv = [
                      Object.keys(csvData[0]).join(','),
                      ...csvData.map(row => Object.values(row).join(','))
                    ].join('\n');

                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `payroll-${selectedMonth}-${selectedYear}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              {payrollRuns.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll runs</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by processing your first payroll run.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          {new Date(run.period.startDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell>{run.batch.name}</TableCell>
                        <TableCell>{run.calculations.length}</TableCell>
                        <TableCell>{formatKES(run.period.totalNetPay)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={run.status === 'approved' ? 'default' : 'secondary'}
                            className={
                              run.status === 'approved' ? 'bg-green-100 text-green-800' : ''
                            }
                          >
                            {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentRun(run);
                              setCurrentStep(7);
                            }}
                            title="View payroll details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
