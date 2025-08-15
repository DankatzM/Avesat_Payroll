import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Printer,
  FileText,
  Users,
  Settings,
  Download,
  Eye,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Copy,
  Archive,
  BarChart3,
  Calendar,
  Package,
  Zap,
} from 'lucide-react';
import { Employee, Payslip, UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface PrintJob {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  printSettings: {
    printerName: string;
    paperSize: 'A4' | 'Letter' | 'Legal' | 'A5';
    orientation: 'portrait' | 'landscape';
    quality: 'draft' | 'normal' | 'high';
    copies: number;
    collate: boolean;
    duplex: 'none' | 'short-edge' | 'long-edge';
    colorMode: 'color' | 'grayscale' | 'blackwhite';
  };
  payslips: Array<{
    payslipId: string;
    employeeId: string;
    employeeName: string;
    status: 'pending' | 'printed' | 'failed';
    error?: string;
    printedAt?: string;
    pages: number;
  }>;
  batchSettings: {
    separateByDepartment: boolean;
    sortBy: 'name' | 'employee-number' | 'department';
    includeHeaders: boolean;
    includeSeparators: boolean;
    groupSize: number;
  };
  statistics: {
    totalPayslips: number;
    totalPages: number;
    printed: number;
    failed: number;
    estimatedCost: number;
    paperUsed: number;
  };
  schedule?: {
    scheduled: boolean;
    scheduledDate: string;
    recurring: boolean;
    recurringPattern?: 'weekly' | 'monthly' | 'quarterly';
  };
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface PrinterConfig {
  id: string;
  name: string;
  type: 'local' | 'network' | 'cloud';
  status: 'online' | 'offline' | 'busy' | 'error';
  location: string;
  capabilities: {
    supportedSizes: string[];
    supportsDuplex: boolean;
    supportsColor: boolean;
    maxCopies: number;
    resolutions: string[];
  };
  costPerPage: {
    blackWhite: number;
    color: number;
  };
  paperLevels: {
    A4: number;
    Letter: number;
    Legal: number;
  };
  isDefault: boolean;
  lastUsed?: string;
}

interface PrintTemplate {
  id: string;
  name: string;
  description: string;
  settings: {
    paperSize: 'A4' | 'Letter' | 'Legal' | 'A5';
    orientation: 'portrait' | 'landscape';
    quality: 'draft' | 'normal' | 'high';
    colorMode: 'color' | 'grayscale' | 'blackwhite';
    headerFooter: boolean;
    pageNumbers: boolean;
    watermark?: string;
  };
  layout: {
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    spacing: number;
    fontSize: number;
    fontFamily: string;
  };
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export default function PrintPayslips() {
  const { user, hasAnyRole } = useAuth();
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([]);
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const [isJobDetailsDialogOpen, setIsJobDetailsDialogOpen] = useState(false);
  const [isPrinterConfigDialogOpen, setIsPrinterConfigDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Form state for creating print jobs
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    printerName: '',
    paperSize: 'A4' as 'A4' | 'Letter' | 'Legal' | 'A5',
    orientation: 'portrait' as 'portrait' | 'landscape',
    quality: 'normal' as 'draft' | 'normal' | 'high',
    copies: 1,
    collate: true,
    duplex: 'none' as 'none' | 'short-edge' | 'long-edge',
    colorMode: 'blackwhite' as 'color' | 'grayscale' | 'blackwhite',
    selectedPayslips: [] as string[],
    separateByDepartment: false,
    sortBy: 'name' as 'name' | 'employee-number' | 'department',
    includeHeaders: true,
    includeSeparators: false,
    groupSize: 50,
    scheduled: false,
    scheduledDate: '',
    recurring: false,
    recurringPattern: 'monthly' as 'weekly' | 'monthly' | 'quarterly',
  });

  const canManagePrinting = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  useEffect(() => {
    fetchPrintJobs();
    fetchPrinters();
    fetchPrintTemplates();
    fetchEmployees();
    fetchPayslips();
  }, []);

  useEffect(() => {
    // Auto-refresh printing jobs
    const interval = setInterval(() => {
      setPrintJobs(prev => prev.map(job => {
        if (job.status === 'printing') {
          const newPrinted = Math.min(
            job.statistics.printed + Math.floor(Math.random() * 2) + 1,
            job.statistics.totalPayslips
          );
          
          const isCompleted = newPrinted >= job.statistics.totalPayslips;
          
          return {
            ...job,
            status: isCompleted ? 'completed' : job.status,
            statistics: {
              ...job.statistics,
              printed: newPrinted,
              paperUsed: newPrinted * 2, // Assuming 2 pages per payslip
            },
            completedAt: isCompleted ? new Date().toISOString() : job.completedAt,
          };
        }
        return job;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchPrintJobs = async () => {
    // Mock print jobs data
    const mockJobs: PrintJob[] = [
      {
        id: '1',
        name: 'March 2024 Payslips - All Departments',
        description: 'Print all payslips for March 2024 across all departments',
        status: 'completed',
        priority: 'high',
        printSettings: {
          printerName: 'HR-Printer-001',
          paperSize: 'A4',
          orientation: 'portrait',
          quality: 'normal',
          copies: 1,
          collate: true,
          duplex: 'long-edge',
          colorMode: 'blackwhite',
        },
        payslips: [
          {
            payslipId: 'payslip-1',
            employeeId: '1',
            employeeName: 'John Mwangi',
            status: 'printed',
            printedAt: '2024-03-25T11:15:00Z',
            pages: 2,
          },
          {
            payslipId: 'payslip-2',
            employeeId: '2',
            employeeName: 'Grace Wanjiku',
            status: 'printed',
            printedAt: '2024-03-25T11:16:00Z',
            pages: 2,
          },
          {
            payslipId: 'payslip-3',
            employeeId: '3',
            employeeName: 'Samuel Otieno',
            status: 'failed',
            error: 'Printer paper jam',
            pages: 2,
          },
        ],
        batchSettings: {
          separateByDepartment: true,
          sortBy: 'department',
          includeHeaders: true,
          includeSeparators: true,
          groupSize: 50,
        },
        statistics: {
          totalPayslips: 156,
          totalPages: 312,
          printed: 153,
          failed: 3,
          estimatedCost: 780.00,
          paperUsed: 306,
        },
        createdBy: 'hr@avesat.co.ke',
        createdAt: '2024-03-25T10:30:00Z',
        startedAt: '2024-03-25T11:00:00Z',
        completedAt: '2024-03-25T12:45:00Z',
      },
      {
        id: '2',
        name: 'Executive Payslips - April 2024',
        description: 'Print executive payslips with special formatting',
        status: 'printing',
        priority: 'urgent',
        printSettings: {
          printerName: 'Executive-Printer',
          paperSize: 'A4',
          orientation: 'portrait',
          quality: 'high',
          copies: 2,
          collate: true,
          duplex: 'none',
          colorMode: 'color',
        },
        payslips: [],
        batchSettings: {
          separateByDepartment: false,
          sortBy: 'name',
          includeHeaders: false,
          includeSeparators: false,
          groupSize: 10,
        },
        statistics: {
          totalPayslips: 12,
          totalPages: 24,
          printed: 8,
          failed: 0,
          estimatedCost: 360.00,
          paperUsed: 16,
        },
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-04-25T14:00:00Z',
        startedAt: '2024-04-25T14:15:00Z',
      },
      {
        id: '3',
        name: 'Engineering Department - Monthly',
        description: 'Regular monthly print job for Engineering department',
        status: 'queued',
        priority: 'medium',
        printSettings: {
          printerName: 'Dept-Printer-002',
          paperSize: 'A4',
          orientation: 'portrait',
          quality: 'normal',
          copies: 1,
          collate: true,
          duplex: 'long-edge',
          colorMode: 'blackwhite',
        },
        payslips: [],
        batchSettings: {
          separateByDepartment: false,
          sortBy: 'employee-number',
          includeHeaders: true,
          includeSeparators: false,
          groupSize: 25,
        },
        statistics: {
          totalPayslips: 45,
          totalPages: 90,
          printed: 0,
          failed: 0,
          estimatedCost: 225.00,
          paperUsed: 0,
        },
        schedule: {
          scheduled: true,
          scheduledDate: '2024-04-30T09:00:00Z',
          recurring: true,
          recurringPattern: 'monthly',
        },
        createdBy: 'payroll@avesat.co.ke',
        createdAt: '2024-04-20T16:30:00Z',
      },
    ];
    setPrintJobs(mockJobs);
  };

  const fetchPrinters = async () => {
    // Mock printers data
    const mockPrinters: PrinterConfig[] = [
      {
        id: '1',
        name: 'HR-Printer-001',
        type: 'network',
        status: 'online',
        location: 'HR Department - Floor 2',
        capabilities: {
          supportedSizes: ['A4', 'Letter', 'Legal'],
          supportsDuplex: true,
          supportsColor: false,
          maxCopies: 999,
          resolutions: ['300dpi', '600dpi', '1200dpi'],
        },
        costPerPage: {
          blackWhite: 2.50,
          color: 0,
        },
        paperLevels: {
          A4: 85,
          Letter: 0,
          Legal: 20,
        },
        isDefault: true,
        lastUsed: '2024-03-25T12:45:00Z',
      },
      {
        id: '2',
        name: 'Executive-Printer',
        type: 'network',
        status: 'busy',
        location: 'Executive Office - Floor 3',
        capabilities: {
          supportedSizes: ['A4', 'Letter', 'Legal', 'A5'],
          supportsDuplex: true,
          supportsColor: true,
          maxCopies: 100,
          resolutions: ['600dpi', '1200dpi', '2400dpi'],
        },
        costPerPage: {
          blackWhite: 3.00,
          color: 15.00,
        },
        paperLevels: {
          A4: 95,
          Letter: 50,
          Legal: 10,
        },
        isDefault: false,
        lastUsed: '2024-04-25T14:15:00Z',
      },
      {
        id: '3',
        name: 'Dept-Printer-002',
        type: 'local',
        status: 'offline',
        location: 'Department Office - Floor 1',
        capabilities: {
          supportedSizes: ['A4', 'Letter'],
          supportsDuplex: true,
          supportsColor: false,
          maxCopies: 500,
          resolutions: ['300dpi', '600dpi'],
        },
        costPerPage: {
          blackWhite: 2.00,
          color: 0,
        },
        paperLevels: {
          A4: 0,
          Letter: 0,
          Legal: 0,
        },
        isDefault: false,
        lastUsed: '2024-04-15T10:20:00Z',
      },
    ];
    setPrinters(mockPrinters);
  };

  const fetchPrintTemplates = async () => {
    // Mock print templates
    const mockTemplates: PrintTemplate[] = [
      {
        id: '1',
        name: 'Standard Payslip Template',
        description: 'Default template for regular payslip printing',
        settings: {
          paperSize: 'A4',
          orientation: 'portrait',
          quality: 'normal',
          colorMode: 'blackwhite',
          headerFooter: true,
          pageNumbers: true,
        },
        layout: {
          margins: { top: 20, right: 15, bottom: 20, left: 15 },
          spacing: 1.5,
          fontSize: 11,
          fontFamily: 'Arial',
        },
        isDefault: true,
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-01-15T00:00:00Z',
        usageCount: 245,
      },
      {
        id: '2',
        name: 'Executive Template',
        description: 'High-quality template for executive payslips',
        settings: {
          paperSize: 'A4',
          orientation: 'portrait',
          quality: 'high',
          colorMode: 'color',
          headerFooter: true,
          pageNumbers: false,
          watermark: 'CONFIDENTIAL',
        },
        layout: {
          margins: { top: 25, right: 20, bottom: 25, left: 20 },
          spacing: 2.0,
          fontSize: 12,
          fontFamily: 'Calibri',
        },
        isDefault: false,
        createdBy: 'hr@avesat.co.ke',
        createdAt: '2024-02-01T00:00:00Z',
        usageCount: 23,
      },
    ];
    setPrintTemplates(mockTemplates);
  };

  const fetchEmployees = async () => {
    // Mock employees data (subset)
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
      // Add more mock employees as needed
    ];
    setEmployees(mockEmployees);
  };

  const fetchPayslips = async () => {
    // Mock payslips data
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
    ];
    setPayslips(mockPayslips);
  };

  const handleCreatePrintJob = async () => {
    if (!formData.name.trim() || !formData.printerName) {
      alert('Please fill in all required fields');
      return;
    }

    const newJob: PrintJob = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status: formData.scheduled ? 'queued' : 'draft',
      priority: formData.priority,
      printSettings: {
        printerName: formData.printerName,
        paperSize: formData.paperSize,
        orientation: formData.orientation,
        quality: formData.quality,
        copies: formData.copies,
        collate: formData.collate,
        duplex: formData.duplex,
        colorMode: formData.colorMode,
      },
      payslips: [],
      batchSettings: {
        separateByDepartment: formData.separateByDepartment,
        sortBy: formData.sortBy,
        includeHeaders: formData.includeHeaders,
        includeSeparators: formData.includeSeparators,
        groupSize: formData.groupSize,
      },
      statistics: {
        totalPayslips: formData.selectedPayslips.length,
        totalPages: formData.selectedPayslips.length * 2, // Assuming 2 pages per payslip
        printed: 0,
        failed: 0,
        estimatedCost: formData.selectedPayslips.length * 5, // Estimated cost
        paperUsed: 0,
      },
      schedule: formData.scheduled ? {
        scheduled: true,
        scheduledDate: formData.scheduledDate,
        recurring: formData.recurring,
        recurringPattern: formData.recurringPattern,
      } : undefined,
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
    };

    setPrintJobs(prev => [newJob, ...prev]);
    setIsCreateJobDialogOpen(false);
    resetForm();
    alert('Print job created successfully!');
  };

  const handleStartPrintJob = async (jobId: string) => {
    setPrintJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status: 'printing',
            startedAt: new Date().toISOString(),
          }
        : job
    ));
  };

  const handlePausePrintJob = async (jobId: string) => {
    setPrintJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'queued' } : job
    ));
  };

  const handleCancelPrintJob = async (jobId: string) => {
    setPrintJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'cancelled' } : job
    ));
  };

  const handleDeletePrintJob = async (jobId: string) => {
    setPrintJobs(prev => prev.filter(job => job.id !== jobId));
    alert('Print job deleted successfully!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 'medium',
      printerName: '',
      paperSize: 'A4',
      orientation: 'portrait',
      quality: 'normal',
      copies: 1,
      collate: true,
      duplex: 'none',
      colorMode: 'blackwhite',
      selectedPayslips: [],
      separateByDepartment: false,
      sortBy: 'name',
      includeHeaders: true,
      includeSeparators: false,
      groupSize: 50,
      scheduled: false,
      scheduledDate: '',
      recurring: false,
      recurringPattern: 'monthly',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'queued': return 'bg-blue-100 text-blue-800';
      case 'printing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrinterStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'printing': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'queued': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredJobs = printJobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || job.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Print Payslips</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage physical printing of payslips and documents
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          {canManagePrinting && (
            <>
              <Button variant="outline" onClick={() => setIsPrinterConfigDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Printers
              </Button>
              <Button onClick={() => setIsCreateJobDialogOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Create Print Job
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Print Jobs</TabsTrigger>
          <TabsTrigger value="printers">Printers</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search print jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="printing">Printing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {canManagePrinting && (
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Print Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Print Jobs ({filteredJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Printer className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No print jobs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {canManagePrinting ? "Create your first print job to get started." : "No print jobs have been created yet."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Printer</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{job.name}</div>
                            <div className="text-sm text-gray-500">{job.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {job.statistics.totalPayslips} payslips • {job.statistics.totalPages} pages
                              {job.schedule?.scheduled && ' • Scheduled'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(job.status)}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1">{job.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(job.priority)}>
                            {job.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {job.printSettings.printerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {job.printSettings.paperSize} • {job.printSettings.quality}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.statistics.totalPayslips > 0 ? (
                            <div className="space-y-1">
                              <Progress 
                                value={(job.statistics.printed / job.statistics.totalPayslips) * 100} 
                                className="h-2 w-24"
                              />
                              <div className="text-xs text-gray-500">
                                {job.statistics.printed}/{job.statistics.totalPayslips}
                                {job.statistics.failed > 0 && ` (${job.statistics.failed} failed)`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not started</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {formatKES(job.statistics.estimatedCost)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {job.statistics.paperUsed} sheets
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job);
                                setIsJobDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManagePrinting && (
                              <>
                                {job.status === 'draft' || job.status === 'queued' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartPrintJob(job.id)}
                                  >
                                    <Play className="h-4 w-4 text-green-600" />
                                  </Button>
                                ) : null}
                                {job.status === 'printing' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePausePrintJob(job.id)}
                                  >
                                    <Pause className="h-4 w-4 text-orange-600" />
                                  </Button>
                                ) : null}
                                {job.status === 'printing' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelPrintJob(job.id)}
                                  >
                                    <Square className="h-4 w-4 text-red-600" />
                                  </Button>
                                ) : null}
                                {job.status === 'draft' || job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled' ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Print Job</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{job.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeletePrintJob(job.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : null}
                              </>
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

        <TabsContent value="printers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Printers ({printers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {printers.map((printer) => (
                  <Card key={printer.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Printer className="h-5 w-5 text-gray-600" />
                        <h3 className="font-medium">{printer.name}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <Badge className={getPrinterStatusColor(printer.status)}>
                          {printer.status}
                        </Badge>
                        {printer.isDefault && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Location:</span> {printer.location}
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span> {printer.type}
                      </div>
                      <div>
                        <span className="text-gray-600">Supported sizes:</span> {printer.capabilities.supportedSizes.join(', ')}
                      </div>
                      <div>
                        <span className="text-gray-600">Features:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {printer.capabilities.supportsDuplex && (
                            <Badge variant="outline" className="text-xs">Duplex</Badge>
                          )}
                          {printer.capabilities.supportsColor && (
                            <Badge variant="outline" className="text-xs">Color</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Paper levels */}
                      <div className="space-y-1">
                        <span className="text-gray-600">Paper levels:</span>
                        {Object.entries(printer.paperLevels).map(([size, level]) => (
                          <div key={size} className="flex items-center justify-between">
                            <span className="text-xs">{size}:</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={level} className="h-1 w-16" />
                              <span className="text-xs">{level}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <span className="text-gray-600">Cost per page:</span>
                        <div className="text-xs">
                          B&W: {formatKES(printer.costPerPage.blackWhite)}
                          {printer.capabilities.supportsColor && 
                            ` • Color: ${formatKES(printer.costPerPage.color)}`
                          }
                        </div>
                      </div>
                      
                      {printer.lastUsed && (
                        <div className="text-xs text-gray-500">
                          Last used: {new Date(printer.lastUsed).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {canManagePrinting && (
                      <div className="mt-3 flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <Zap className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Print Templates ({printTemplates.length})</CardTitle>
                {canManagePrinting && (
                  <Button onClick={() => setIsTemplateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {printTemplates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      {template.isDefault && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Paper: {template.settings.paperSize} • {template.settings.orientation}</div>
                      <div>Quality: {template.settings.quality} • {template.settings.colorMode}</div>
                      <div>Font: {template.layout.fontFamily}, {template.layout.fontSize}pt</div>
                      <div>Used: {template.usageCount} times</div>
                    </div>
                    {canManagePrinting && (
                      <div className="mt-3 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Apply template settings to form
                            setFormData(prev => ({
                              ...prev,
                              paperSize: template.settings.paperSize,
                              orientation: template.settings.orientation,
                              quality: template.settings.quality,
                              colorMode: template.settings.colorMode,
                            }));
                            setIsCreateJobDialogOpen(true);
                          }}
                        >
                          Use Template
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold">{printJobs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">
                      {printJobs.filter(j => j.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pages Printed</p>
                    <p className="text-2xl font-bold">
                      {printJobs.reduce((sum, j) => sum + j.statistics.paperUsed, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold">
                      {formatKES(printJobs.reduce((sum, j) => sum + j.statistics.estimatedCost, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Print Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {printJobs
                  .filter(job => job.completedAt || job.startedAt)
                  .slice(0, 5)
                  .map((job) => (
                    <div key={job.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-medium">{job.name}</div>
                      <div className="text-sm text-gray-600">
                        {job.statistics.printed}/{job.statistics.totalPayslips} printed • 
                        {formatKES(job.statistics.estimatedCost)} cost
                      </div>
                      <div className="text-xs text-gray-400">
                        {job.completedAt ? 
                          `Completed: ${new Date(job.completedAt).toLocaleString()}` :
                          `Started: ${new Date(job.startedAt!).toLocaleString()}`
                        }
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Print Job Dialog */}
      <Dialog open={isCreateJobDialogOpen} onOpenChange={setIsCreateJobDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Print Job</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Job Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter job name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter job description"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Print Settings</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Printer *</Label>
                  <Select 
                    value={formData.printerName} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, printerName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select printer" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers.filter(p => p.status === 'online').map(printer => (
                        <SelectItem key={printer.id} value={printer.name}>
                          {printer.name} ({printer.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select 
                    value={formData.paperSize} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paperSize: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select 
                    value={formData.orientation} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, orientation: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Print Quality</Label>
                  <Select 
                    value={formData.quality} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, quality: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Copies</Label>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    value={formData.copies}
                    onChange={(e) => setFormData(prev => ({ ...prev, copies: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color Mode</Label>
                  <Select 
                    value={formData.colorMode} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, colorMode: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blackwhite">Black & White</SelectItem>
                      <SelectItem value="grayscale">Grayscale</SelectItem>
                      <SelectItem value="color">Color</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="collate"
                    checked={formData.collate}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, collate: checked }))}
                  />
                  <Label htmlFor="collate">Collate copies</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duplex Printing</Label>
                <Select 
                  value={formData.duplex} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duplex: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Single-sided</SelectItem>
                    <SelectItem value="long-edge">Double-sided (Long edge)</SelectItem>
                    <SelectItem value="short-edge">Double-sided (Short edge)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Batch Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="separateByDepartment"
                    checked={formData.separateByDepartment}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, separateByDepartment: checked }))}
                  />
                  <Label htmlFor="separateByDepartment">Separate by department</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeHeaders"
                    checked={formData.includeHeaders}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeHeaders: checked }))}
                  />
                  <Label htmlFor="includeHeaders">Include section headers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeSeparators"
                    checked={formData.includeSeparators}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeSeparators: checked }))}
                  />
                  <Label htmlFor="includeSeparators">Include page separators</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select 
                    value={formData.sortBy} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sortBy: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Employee Name</SelectItem>
                      <SelectItem value="employee-number">Employee Number</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Group Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.groupSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, groupSize: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="scheduled"
                  checked={formData.scheduled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, scheduled: checked }))}
                />
                <Label htmlFor="scheduled">Schedule for later</Label>
              </div>

              {formData.scheduled && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label>Scheduled Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recurring"
                      checked={formData.recurring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurring: checked }))}
                    />
                    <Label htmlFor="recurring">Recurring job</Label>
                  </div>
                  {formData.recurring && (
                    <div className="space-y-2">
                      <Label>Recurrence Pattern</Label>
                      <Select 
                        value={formData.recurringPattern} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, recurringPattern: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateJobDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePrintJob} className="bg-indigo-600 hover:bg-indigo-700">
              Create Print Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={isJobDetailsDialogOpen} onOpenChange={setIsJobDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Job Details: {selectedJob?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="mt-4">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedJob.status)}>
                          {getStatusIcon(selectedJob.status)}
                          <span className="ml-1">{selectedJob.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Priority</Label>
                      <div className="mt-1">
                        <Badge className={getPriorityColor(selectedJob.priority)}>
                          {selectedJob.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Printer</Label>
                      <p className="mt-1">{selectedJob.printSettings.printerName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Estimated Cost</Label>
                      <p className="mt-1">{formatKES(selectedJob.statistics.estimatedCost)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="mt-1">{selectedJob.description}</p>
                  </div>
                </TabsContent>

                <TabsContent value="progress" className="space-y-4">
                  {selectedJob.statistics.totalPayslips > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Print Progress</span>
                          <span className="text-sm text-gray-600">
                            {selectedJob.statistics.printed}/{selectedJob.statistics.totalPayslips}
                          </span>
                        </div>
                        <Progress value={(selectedJob.statistics.printed / selectedJob.statistics.totalPayslips) * 100} />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{selectedJob.statistics.printed}</div>
                            <div className="text-sm text-gray-600">Printed</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{selectedJob.statistics.failed}</div>
                            <div className="text-sm text-gray-600">Failed</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {selectedJob.statistics.totalPayslips - selectedJob.statistics.printed}
                            </div>
                            <div className="text-sm text-gray-600">Remaining</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Job not started</h3>
                      <p className="mt-1 text-sm text-gray-500">Progress will be shown when the job starts printing.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Paper Size</Label>
                      <p className="mt-1">{selectedJob.printSettings.paperSize}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Orientation</Label>
                      <p className="mt-1">{selectedJob.printSettings.orientation}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Quality</Label>
                      <p className="mt-1">{selectedJob.printSettings.quality}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Color Mode</Label>
                      <p className="mt-1">{selectedJob.printSettings.colorMode}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Copies</Label>
                      <p className="mt-1">{selectedJob.printSettings.copies}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Duplex</Label>
                      <p className="mt-1">{selectedJob.printSettings.duplex}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Batch Settings</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>Sort by: {selectedJob.batchSettings.sortBy}</div>
                      <div>Group size: {selectedJob.batchSettings.groupSize}</div>
                      <div>Headers: {selectedJob.batchSettings.includeHeaders ? 'Yes' : 'No'}</div>
                      <div>Separators: {selectedJob.batchSettings.includeSeparators ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
