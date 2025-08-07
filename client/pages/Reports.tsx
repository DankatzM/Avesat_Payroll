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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Eye,
  FileSpreadsheet,
  Clock,
  CheckCircle,
  Calculator,
} from 'lucide-react';
import { 
  Employee, 
  UserRole,
  ReportType 
} from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface ReportStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface ReportFilter {
  month: string;
  year: string;
  department: string;
  employeeStatus: 'all' | 'active' | 'inactive';
  payrollCategory: string;
  salaryRange: {
    min: number;
    max: number;
  };
}

interface ReportData {
  id: string;
  type: ReportType;
  title: string;
  filters: ReportFilter;
  data: any[];
  aggregatedData: any;
  generatedAt: string;
  generatedBy: string;
}

interface ReportTypeOption {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
}

export default function Reports() {
  const { user, hasAnyRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  
  // Form state
  const [selectedReportType, setSelectedReportType] = useState<ReportType | ''>('');
  const [filters, setFilters] = useState<ReportFilter>({
    month: 'all',
    year: new Date().getFullYear().toString(),
    department: 'all',
    employeeStatus: 'all',
    payrollCategory: 'all',
    salaryRange: { min: 0, max: 10000000 },
  });
  
  // Data state
  const [generatedReports, setGeneratedReports] = useState<ReportData[]>([]);
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Mock employees data
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
  ]);

  // Algorithm steps
  const algorithmSteps: ReportStep[] = [
    {
      step: 1,
      title: 'Select Report Type',
      description: 'User selects report type (summary, bank list, deductions, etc.)',
      completed: false,
      current: false,
    },
    {
      step: 2,
      title: 'Input Filters',
      description: 'Input filters (month, department, employee status)',
      completed: false,
      current: false,
    },
    {
      step: 3,
      title: 'Fetch Records',
      description: 'Fetch matching records from payroll and employee tables',
      completed: false,
      current: false,
    },
    {
      step: 4,
      title: 'Aggregate Data',
      description: 'Aggregate data based on report type',
      completed: false,
      current: false,
    },
    {
      step: 5,
      title: 'Format & Preview',
      description: 'Format report as table/chart and render preview',
      completed: false,
      current: false,
    },
    {
      step: 6,
      title: 'Export Options',
      description: 'Allow export to PDF, Excel or CSV',
      completed: false,
      current: false,
    },
  ];

  const [steps, setSteps] = useState(algorithmSteps);

  // Report type options
  const reportTypes: ReportTypeOption[] = [
    {
      id: ReportType.PAYROLL_SUMMARY,
      name: 'Payroll Summary',
      description: 'Overview of payroll totals by department and period',
      icon: <DollarSign className="h-5 w-5" />,
      fields: ['employee', 'department', 'grossPay', 'deductions', 'netPay'],
    },
    {
      id: ReportType.PAYE_REPORT,
      name: 'PAYE Tax Report',
      description: 'PAYE tax calculations and KRA submission data',
      icon: <Calculator className="h-5 w-5" />,
      fields: ['employee', 'grossPay', 'taxableIncome', 'payeTax', 'personalRelief'],
    },
    {
      id: ReportType.NHIF_REPORT,
      name: 'NHIF Report',
      description: 'NHIF contributions and employee details',
      icon: <Users className="h-5 w-5" />,
      fields: ['employee', 'nhifNumber', 'grossPay', 'nhifContribution'],
    },
    {
      id: ReportType.NSSF_REPORT,
      name: 'NSSF Report',
      description: 'NSSF contributions (Tier 1 & 2)',
      icon: <Building2 className="h-5 w-5" />,
      fields: ['employee', 'nssfNumber', 'pensionableEarnings', 'nssfContribution'],
    },
    {
      id: ReportType.HOUSING_LEVY_REPORT,
      name: 'Housing Levy Report',
      description: 'Housing development levy contributions',
      icon: <Building2 className="h-5 w-5" />,
      fields: ['employee', 'grossPay', 'housingLevy'],
    },
    {
      id: ReportType.EMPLOYEE_COST,
      name: 'Employee Cost Analysis',
      description: 'Total employment costs by department',
      icon: <TrendingUp className="h-5 w-5" />,
      fields: ['employee', 'department', 'basicSalary', 'allowances', 'benefits', 'totalCost'],
    },
    {
      id: ReportType.DEPARTMENT_ANALYSIS,
      name: 'Department Analysis',
      description: 'Departmental payroll breakdown and statistics',
      icon: <BarChart3 className="h-5 w-5" />,
      fields: ['department', 'employeeCount', 'totalPayroll', 'averageSalary', 'totalCost'],
    },
  ];

  const updateStepStatus = (stepNumber: number, completed: boolean, current: boolean) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      completed: step.step < stepNumber ? true : (step.step === stepNumber ? completed : false),
      current: step.step === stepNumber ? current : false,
    })));
  };

  // Step 1: Validate report type selection
  const validateReportType = (): boolean => {
    if (!selectedReportType) {
      alert('Please select a report type');
      return false;
    }
    return true;
  };

  // Step 2: Validate filters
  const validateFilters = (): boolean => {
    if (!filters.year) {
      alert('Please select a year');
      return false;
    }
    return true;
  };

  // Step 3: Fetch matching records
  const fetchMatchingRecords = async () => {
    // Filter employees based on criteria
    let filteredEmployees = employees.filter(emp => {
      const matchesDepartment = filters.department === 'all' || emp.department === filters.department;
      const matchesStatus = filters.employeeStatus === 'all' || 
        (filters.employeeStatus === 'active' && emp.isActive) ||
        (filters.employeeStatus === 'inactive' && !emp.isActive);
      const matchesSalaryRange = emp.salary >= filters.salaryRange.min && emp.salary <= filters.salaryRange.max;
      
      return matchesDepartment && matchesStatus && matchesSalaryRange;
    });

    // Generate mock payroll data for filtered employees
    const payrollData = filteredEmployees.map(emp => {
      const monthlySalary = emp.salary / 12;
      const grossPay = monthlySalary + Math.floor(Math.random() * 15000); // Random allowances
      const payeTax = grossPay * 0.15; // Simplified tax
      const nhif = grossPay <= 5999 ? 150 : grossPay <= 7999 ? 300 : grossPay <= 11999 ? 400 : 1700;
      const nssf = Math.min(grossPay * 0.06, 2160);
      const housingLevy = Math.min(grossPay * 0.015, 5000);
      const pension = grossPay * (emp.taxInformation.pensionContribution / 100);
      const totalDeductions = payeTax + nhif + nssf + housingLevy + pension;
      const netPay = grossPay - totalDeductions;

      return {
        employee: emp,
        grossPay: Math.round(grossPay),
        payeTax: Math.round(payeTax),
        nhifContribution: nhif,
        nssfContribution: Math.round(nssf),
        housingLevy: Math.round(housingLevy),
        pensionContribution: Math.round(pension),
        totalDeductions: Math.round(totalDeductions),
        netPay: Math.round(netPay),
        taxableIncome: Math.round(grossPay - pension - nssf),
        personalRelief: 2400, // Monthly personal relief
      };
    });

    return payrollData;
  };

  // Step 4: Aggregate data based on report type
  const aggregateData = (rawData: any[], reportType: ReportType) => {
    switch (reportType) {
      case ReportType.PAYROLL_SUMMARY:
        return {
          totalEmployees: rawData.length,
          totalGrossPay: rawData.reduce((sum, item) => sum + item.grossPay, 0),
          totalDeductions: rawData.reduce((sum, item) => sum + item.totalDeductions, 0),
          totalNetPay: rawData.reduce((sum, item) => sum + item.netPay, 0),
          byDepartment: Object.values(
            rawData.reduce((acc: any, item) => {
              const dept = item.employee.department;
              if (!acc[dept]) {
                acc[dept] = {
                  department: dept,
                  employeeCount: 0,
                  totalGross: 0,
                  totalNet: 0,
                };
              }
              acc[dept].employeeCount++;
              acc[dept].totalGross += item.grossPay;
              acc[dept].totalNet += item.netPay;
              return acc;
            }, {})
          ),
        };

      case ReportType.PAYE_REPORT:
        return {
          totalTaxableIncome: rawData.reduce((sum, item) => sum + item.taxableIncome, 0),
          totalPAYETax: rawData.reduce((sum, item) => sum + item.payeTax, 0),
          totalPersonalRelief: rawData.reduce((sum, item) => sum + item.personalRelief, 0),
          effectiveRate: rawData.length > 0 ? 
            (rawData.reduce((sum, item) => sum + item.payeTax, 0) / 
             rawData.reduce((sum, item) => sum + item.taxableIncome, 0)) * 100 : 0,
        };

      case ReportType.DEPARTMENT_ANALYSIS:
        return Object.values(
          rawData.reduce((acc: any, item) => {
            const dept = item.employee.department;
            if (!acc[dept]) {
              acc[dept] = {
                department: dept,
                employeeCount: 0,
                totalPayroll: 0,
                averageSalary: 0,
                totalCost: 0,
              };
            }
            acc[dept].employeeCount++;
            acc[dept].totalPayroll += item.netPay;
            acc[dept].totalCost += item.grossPay;
            return acc;
          }, {})
        ).map((dept: any) => ({
          ...dept,
          averageSalary: Math.round(dept.totalPayroll / dept.employeeCount),
        }));

      default:
        return {
          recordCount: rawData.length,
          totalAmount: rawData.reduce((sum, item) => sum + (item.grossPay || 0), 0),
        };
    }
  };

  // Step 5: Format data for preview
  const formatDataForPreview = (rawData: any[], reportType: ReportType) => {
    const reportTypeConfig = reportTypes.find(rt => rt.id === reportType);
    if (!reportTypeConfig) return rawData;

    return rawData.map(item => {
      const formattedItem: any = {};
      
      reportTypeConfig.fields.forEach(field => {
        switch (field) {
          case 'employee':
            formattedItem.employee = `${item.employee.firstName} ${item.employee.lastName}`;
            formattedItem.employeeNumber = item.employee.employeeNumber;
            break;
          case 'department':
            formattedItem.department = item.employee.department;
            break;
          case 'grossPay':
            formattedItem.grossPay = formatKES(item.grossPay);
            break;
          case 'deductions':
            formattedItem.deductions = formatKES(item.totalDeductions);
            break;
          case 'netPay':
            formattedItem.netPay = formatKES(item.netPay);
            break;
          case 'payeTax':
            formattedItem.payeTax = formatKES(item.payeTax);
            break;
          case 'nhifContribution':
            formattedItem.nhifContribution = formatKES(item.nhifContribution);
            break;
          case 'nssfContribution':
            formattedItem.nssfContribution = formatKES(item.nssfContribution);
            break;
          case 'housingLevy':
            formattedItem.housingLevy = formatKES(item.housingLevy);
            break;
          case 'taxableIncome':
            formattedItem.taxableIncome = formatKES(item.taxableIncome);
            break;
          case 'personalRelief':
            formattedItem.personalRelief = formatKES(item.personalRelief);
            break;
          case 'nhifNumber':
            formattedItem.nhifNumber = item.employee.taxInformation.nhifNumber;
            break;
          case 'nssfNumber':
            formattedItem.nssfNumber = item.employee.taxInformation.nssfNumber;
            break;
          default:
            formattedItem[field] = item[field] || 'N/A';
        }
      });
      
      return formattedItem;
    });
  };

  // Main report generation handler
  const handleGenerateReport = async () => {
    // Step 1: Validate report type
    if (!validateReportType()) return;
    
    setIsGenerating(true);
    setCurrentStep(1);
    updateStepStatus(1, true, true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 2: Validate filters
    setCurrentStep(2);
    updateStepStatus(2, false, true);
    if (!validateFilters()) {
      setIsGenerating(false);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus(2, true, false);

    // Step 3: Fetch matching records
    setCurrentStep(3);
    updateStepStatus(3, false, true);
    const rawData = await fetchMatchingRecords();
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateStepStatus(3, true, false);

    // Step 4: Aggregate data
    setCurrentStep(4);
    updateStepStatus(4, false, true);
    const aggregatedData = aggregateData(rawData, selectedReportType as ReportType);
    await new Promise(resolve => setTimeout(resolve, 1200));
    updateStepStatus(4, true, false);

    // Step 5: Format and preview
    setCurrentStep(5);
    updateStepStatus(5, false, true);
    const formattedData = formatDataForPreview(rawData, selectedReportType as ReportType);
    setPreviewData(formattedData);
    
    // Generate chart data for visualization
    if (selectedReportType === ReportType.DEPARTMENT_ANALYSIS) {
      setChartData(aggregatedData as any[]);
    } else if (selectedReportType === ReportType.PAYROLL_SUMMARY) {
      setChartData((aggregatedData as any).byDepartment);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus(5, true, false);

    // Step 6: Enable export options
    setCurrentStep(6);
    updateStepStatus(6, true, false);

    // Create report record
    const newReport: ReportData = {
      id: Date.now().toString(),
      type: selectedReportType as ReportType,
      title: reportTypes.find(rt => rt.id === selectedReportType)?.name || 'Unknown Report',
      filters,
      data: rawData,
      aggregatedData,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.email || 'Unknown',
    };

    setCurrentReport(newReport);
    setGeneratedReports(prev => [newReport, ...prev]);
    setIsGenerating(false);
    setShowGenerateForm(false);
  };

  const resetForm = () => {
    setSelectedReportType('');
    setFilters({
      month: '',
      year: new Date().getFullYear().toString(),
      department: 'all',
      employeeStatus: 'all',
      payrollCategory: 'all',
      salaryRange: { min: 0, max: 10000000 },
    });
    setCurrentStep(1);
    setSteps(algorithmSteps);
    setCurrentReport(null);
    setPreviewData([]);
    setChartData([]);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!currentReport) return;
    
    console.log(`Exporting ${currentReport.title} as ${format.toUpperCase()}`);
    alert(`Exporting ${currentReport.title} as ${format.toUpperCase()}`);
  };

  const getDepartments = () => {
    return [...new Set(employees.map(emp => emp.department))];
  };

  const canGenerateReports = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate comprehensive payroll and employee reports with data visualization
          </p>
        </div>
        {canGenerateReports && (
          <Button onClick={() => setShowGenerateForm(true)} className="mt-4 sm:mt-0">
            <BarChart3 className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        )}
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Algorithm Steps */}
          {showGenerateForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Report Generation Process Steps
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

          {/* Step 1: Report Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Report Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((reportType) => (
                  <Card
                    key={reportType.id}
                    className={`cursor-pointer border-2 transition-colors ${
                      selectedReportType === reportType.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReportType(reportType.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1 text-indigo-600">
                          {reportType.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{reportType.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{reportType.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reportType.fields.slice(0, 3).map((field, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                            {reportType.fields.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{reportType.fields.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Filters */}
          {selectedReportType && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Configure Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Month (Optional)</Label>
                    <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({...prev, month: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All months" />
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
                  
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({...prev, year: value}))}>
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
                    <Label>Department</Label>
                    <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({...prev, department: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {getDepartments().map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee Status</Label>
                    <Select value={filters.employeeStatus} onValueChange={(value) => setFilters(prev => ({...prev, employeeStatus: value as any}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Salary Range (Annual KES)</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.salaryRange.min}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          salaryRange: { ...prev.salaryRange, min: Number(e.target.value) }
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.salaryRange.max}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          salaryRange: { ...prev.salaryRange, max: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !selectedReportType}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Preview */}
          {currentReport && previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Report Preview: {currentReport.title}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => handleExport('csv')}>
                      <FileText className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('excel')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('pdf')}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Stats */}
                {currentReport.aggregatedData && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {currentReport.type === ReportType.PAYROLL_SUMMARY && (
                      <>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                              {currentReport.aggregatedData.totalEmployees}
                            </div>
                            <p className="text-sm text-gray-600">Total Employees</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatKES(currentReport.aggregatedData.totalGrossPay)}
                            </div>
                            <p className="text-sm text-gray-600">Total Gross Pay</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {formatKES(currentReport.aggregatedData.totalDeductions)}
                            </div>
                            <p className="text-sm text-gray-600">Total Deductions</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatKES(currentReport.aggregatedData.totalNetPay)}
                            </div>
                            <p className="text-sm text-gray-600">Total Net Pay</p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}

                {/* Chart Visualization */}
                {chartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Visualization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        {currentReport.type === ReportType.DEPARTMENT_ANALYSIS ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="department" />
                              <YAxis />
                              <Tooltip formatter={(value: any) => formatKES(value)} />
                              <Legend />
                              <Bar dataKey="totalPayroll" fill="#6366f1" name="Total Payroll" />
                              <Bar dataKey="totalCost" fill="#8b5cf6" name="Total Cost" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="totalGross"
                                label={({department, totalGross}) => `${department}: ${formatKES(totalGross)}`}
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => formatKES(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Data Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(previewData[0] || {}).map((key) => (
                          <TableHead key={key} className="whitespace-nowrap">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: any, cellIndex) => (
                            <TableCell key={cellIndex} className="whitespace-nowrap">
                              {value}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {previewData.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Showing 10 of {previewData.length} records in preview
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedReports.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reports generated</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate your first report to see it here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Generated By</TableHead>
                      <TableHead>Generated At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          {report.filters.month ? 
                            `${report.filters.month}/${report.filters.year}` : 
                            report.filters.year
                          }
                        </TableCell>
                        <TableCell>{report.data.length}</TableCell>
                        <TableCell>{report.generatedBy}</TableCell>
                        <TableCell>
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExport('pdf')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
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
      </Tabs>

      {/* Generate Form Dialog */}
      <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Follow the 6-step process to generate comprehensive reports with data visualization and export options.
            </p>
            <Button onClick={resetForm} className="w-full">
              Start Report Generation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
