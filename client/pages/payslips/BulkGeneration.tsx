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
  FileText,
  Users,
  Play,
  Pause,
  Square,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Upload,
  Calendar,
  BarChart3,
  RefreshCw,
  Settings,
  Eye,
  Trash2,
} from 'lucide-react';
import { Employee, UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface BulkJob {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  parameters: {
    month: string;
    year: string;
    departments: string[];
    employeeIds: string[];
    template: string;
    outputFormat: 'pdf' | 'excel' | 'both';
    includeEmail: boolean;
    emailSubject?: string;
    emailBody?: string;
  };
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    currentItem?: string;
  };
  schedule?: {
    scheduled: boolean;
    scheduledDate: string;
    recurring: boolean;
    recurringPattern?: 'monthly' | 'quarterly' | 'annually';
  };
  results: {
    successfulPayslips: Array<{
      employeeId: string;
      employeeName: string;
      fileName: string;
      generatedAt: string;
      emailSent?: boolean;
    }>;
    failedPayslips: Array<{
      employeeId: string;
      employeeName: string;
      error: string;
      timestamp: string;
    }>;
  };
  executionLog: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  estimatedDuration?: number;
  actualDuration?: number;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface BulkJobTemplate {
  id: string;
  name: string;
  description: string;
  departments: string[];
  template: string;
  outputFormat: 'pdf' | 'excel' | 'both';
  includeEmail: boolean;
  emailSubject: string;
  emailBody: string;
  isDefault: boolean;
}

export default function BulkGeneration() {
  const { user, hasAnyRole } = useAuth();
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [jobTemplates, setJobTemplates] = useState<BulkJobTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedJob, setSelectedJob] = useState<BulkJob | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Form state for creating jobs
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    month: '',
    year: new Date().getFullYear().toString(),
    departments: [] as string[],
    employeeIds: [] as string[],
    template: '',
    outputFormat: 'pdf' as 'pdf' | 'excel' | 'both',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    includeEmail: false,
    emailSubject: 'Your Monthly Payslip - {{MONTH}} {{YEAR}}',
    emailBody: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for {{MONTH}} {{YEAR}}.\n\nBest regards,\nHR Department',
    scheduled: false,
    scheduledDate: '',
    recurring: false,
    recurringPattern: 'monthly' as 'monthly' | 'quarterly' | 'annually',
  });

  const [simulationMode, setSimulationMode] = useState(false);

  const canManageBulkJobs = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  useEffect(() => {
    fetchJobs();
    fetchJobTemplates();
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Auto-refresh running jobs
    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'running') {
          // Simulate progress
          const newProcessed = Math.min(job.progress.processed + Math.floor(Math.random() * 3) + 1, job.progress.total);
          const newSuccessful = job.progress.successful + (newProcessed - job.progress.processed);
          
          const isCompleted = newProcessed >= job.progress.total;
          
          return {
            ...job,
            status: isCompleted ? 'completed' : job.status,
            progress: {
              ...job.progress,
              processed: newProcessed,
              successful: newSuccessful,
              currentItem: isCompleted ? undefined : `Processing employee ${newProcessed + 1}...`,
            },
            completedAt: isCompleted ? new Date().toISOString() : job.completedAt,
            actualDuration: isCompleted && job.startedAt ? 
              Date.now() - new Date(job.startedAt).getTime() : job.actualDuration,
          };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    // Mock bulk jobs data
    const mockJobs: BulkJob[] = [
      {
        id: '1',
        name: 'March 2024 All Departments',
        description: 'Generate payslips for all employees across all departments for March 2024',
        status: 'completed',
        priority: 'high',
        parameters: {
          month: '03',
          year: '2024',
          departments: ['Engineering', 'Marketing', 'Sales', 'Finance'],
          employeeIds: [],
          template: 'standard-kenya',
          outputFormat: 'both',
          includeEmail: true,
          emailSubject: 'Your Monthly Payslip - March 2024',
          emailBody: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for March 2024.\n\nBest regards,\nHR Department',
        },
        progress: {
          total: 156,
          processed: 156,
          successful: 153,
          failed: 3,
        },
        results: {
          successfulPayslips: [
            {
              employeeId: '1',
              employeeName: 'John Mwangi',
              fileName: 'payslip-EMP001-2024-03.pdf',
              generatedAt: '2024-03-25T10:15:00Z',
              emailSent: true,
            },
            {
              employeeId: '2',
              employeeName: 'Grace Wanjiku',
              fileName: 'payslip-EMP002-2024-03.pdf',
              generatedAt: '2024-03-25T10:16:00Z',
              emailSent: true,
            },
          ],
          failedPayslips: [
            {
              employeeId: '15',
              employeeName: 'Michael Otieno',
              error: 'Missing salary information',
              timestamp: '2024-03-25T10:45:00Z',
            },
            {
              employeeId: '42',
              employeeName: 'Sarah Kimani',
              error: 'Invalid bank details',
              timestamp: '2024-03-25T11:12:00Z',
            },
            {
              employeeId: '78',
              employeeName: 'David Mutua',
              error: 'Template rendering failed',
              timestamp: '2024-03-25T11:30:00Z',
            },
          ],
        },
        executionLog: [
          {
            timestamp: '2024-03-25T10:00:00Z',
            level: 'info',
            message: 'Started bulk payslip generation job',
          },
          {
            timestamp: '2024-03-25T10:15:00Z',
            level: 'info',
            message: 'Generated 50 payslips successfully',
          },
          {
            timestamp: '2024-03-25T10:45:00Z',
            level: 'warning',
            message: 'Failed to generate payslip for employee EMP015 - Missing salary information',
          },
          {
            timestamp: '2024-03-25T12:30:00Z',
            level: 'info',
            message: 'Bulk generation completed. 153/156 successful',
          },
        ],
        estimatedDuration: 150000,
        actualDuration: 145000,
        createdBy: 'hr@avesat.co.ke',
        createdAt: '2024-03-25T09:45:00Z',
        startedAt: '2024-03-25T10:00:00Z',
        completedAt: '2024-03-25T12:30:00Z',
      },
      {
        id: '2',
        name: 'Engineering Department - April 2024',
        description: 'Generate payslips for Engineering department only',
        status: 'running',
        priority: 'medium',
        parameters: {
          month: '04',
          year: '2024',
          departments: ['Engineering'],
          employeeIds: [],
          template: 'detailed-executive',
          outputFormat: 'pdf',
          includeEmail: true,
        },
        progress: {
          total: 45,
          processed: 32,
          successful: 31,
          failed: 1,
          currentItem: 'Processing employee 33...',
        },
        results: {
          successfulPayslips: [],
          failedPayslips: [
            {
              employeeId: '23',
              employeeName: 'Alex Ndungu',
              error: 'Connection timeout',
              timestamp: '2024-04-25T14:22:00Z',
            },
          ],
        },
        executionLog: [
          {
            timestamp: '2024-04-25T14:00:00Z',
            level: 'info',
            message: 'Started bulk payslip generation for Engineering department',
          },
          {
            timestamp: '2024-04-25T14:22:00Z',
            level: 'error',
            message: 'Failed to generate payslip for employee EMP023 - Connection timeout',
          },
        ],
        estimatedDuration: 90000,
        createdBy: 'payroll@avesat.co.ke',
        createdAt: '2024-04-25T13:45:00Z',
        startedAt: '2024-04-25T14:00:00Z',
      },
      {
        id: '3',
        name: 'Quarterly Bonus Payslips',
        description: 'Generate special payslips for Q1 bonus distribution',
        status: 'queued',
        priority: 'urgent',
        parameters: {
          month: '04',
          year: '2024',
          departments: ['Sales', 'Marketing'],
          employeeIds: [],
          template: 'bonus-template',
          outputFormat: 'both',
          includeEmail: true,
        },
        progress: {
          total: 28,
          processed: 0,
          successful: 0,
          failed: 0,
        },
        schedule: {
          scheduled: true,
          scheduledDate: '2024-04-30T09:00:00Z',
          recurring: false,
        },
        results: {
          successfulPayslips: [],
          failedPayslips: [],
        },
        executionLog: [],
        estimatedDuration: 60000,
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-04-20T15:30:00Z',
      },
    ];
    setJobs(mockJobs);
  };

  const fetchJobTemplates = async () => {
    // Mock job templates
    const mockTemplates: BulkJobTemplate[] = [
      {
        id: '1',
        name: 'Monthly All Departments',
        description: 'Generate payslips for all employees across all departments',
        departments: ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'],
        template: 'standard-kenya',
        outputFormat: 'both',
        includeEmail: true,
        emailSubject: 'Your Monthly Payslip - {{MONTH}} {{YEAR}}',
        emailBody: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for {{MONTH}} {{YEAR}}.\n\nBest regards,\nHR Department',
        isDefault: true,
      },
      {
        id: '2',
        name: 'Executive Payslips',
        description: 'Detailed payslips for executive staff',
        departments: ['Executive'],
        template: 'detailed-executive',
        outputFormat: 'pdf',
        includeEmail: true,
        emailSubject: 'Executive Payslip - {{MONTH}} {{YEAR}}',
        emailBody: 'Dear {{EMPLOYEE_NAME}},\n\nYour executive payslip for {{MONTH}} {{YEAR}} is attached.\n\nConfidential - HR Department',
        isDefault: false,
      },
    ];
    setJobTemplates(mockTemplates);
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

  const handleCreateJob = async () => {
    if (!formData.name.trim() || !formData.month || !formData.year) {
      alert('Please fill in all required fields');
      return;
    }

    const newJob: BulkJob = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status: formData.scheduled ? 'queued' : 'draft',
      priority: formData.priority,
      parameters: {
        month: formData.month,
        year: formData.year,
        departments: formData.departments,
        employeeIds: formData.employeeIds,
        template: formData.template,
        outputFormat: formData.outputFormat,
        includeEmail: formData.includeEmail,
        emailSubject: formData.emailSubject,
        emailBody: formData.emailBody,
      },
      progress: {
        total: 0, // Will be calculated based on selection
        processed: 0,
        successful: 0,
        failed: 0,
      },
      schedule: formData.scheduled ? {
        scheduled: true,
        scheduledDate: formData.scheduledDate,
        recurring: formData.recurring,
        recurringPattern: formData.recurringPattern,
      } : undefined,
      results: {
        successfulPayslips: [],
        failedPayslips: [],
      },
      executionLog: [],
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
    };

    setJobs(prev => [newJob, ...prev]);
    setIsCreateDialogOpen(false);
    resetForm();
    alert('Bulk job created successfully!');
  };

  const handleStartJob = async (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status: 'running',
            startedAt: new Date().toISOString(),
            progress: {
              ...job.progress,
              total: Math.floor(Math.random() * 50) + 20, // Mock total
            },
          }
        : job
    ));
  };

  const handlePauseJob = async (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'paused' } : job
    ));
  };

  const handleStopJob = async (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'cancelled' } : job
    ));
  };

  const handleDeleteJob = async (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    alert('Job deleted successfully!');
  };

  const handleViewDetails = (job: BulkJob) => {
    setSelectedJob(job);
    setIsDetailsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      month: '',
      year: new Date().getFullYear().toString(),
      departments: [],
      employeeIds: [],
      template: '',
      outputFormat: 'pdf',
      priority: 'medium',
      includeEmail: false,
      emailSubject: 'Your Monthly Payslip - {{MONTH}} {{YEAR}}',
      emailBody: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for {{MONTH}} {{YEAR}}.\n\nBest regards,\nHR Department',
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
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDepartments = () => {
    return [...new Set(employees.map(emp => emp.department))];
  };

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || job.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Payslip Generation</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage bulk payslip generation jobs for multiple employees
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          {canManageBulkJobs && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Create Bulk Job
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Bulk Jobs</TabsTrigger>
          <TabsTrigger value="templates">Job Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
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
                {canManageBulkJobs && (
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Jobs ({filteredJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bulk jobs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {canManageBulkJobs ? "Create your first bulk job to get started." : "No bulk jobs have been created yet."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created</TableHead>
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
                              {job.parameters.month}/{job.parameters.year} • {job.parameters.outputFormat.toUpperCase()}
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
                          {job.progress.total > 0 ? (
                            <div className="space-y-1">
                              <Progress 
                                value={(job.progress.processed / job.progress.total) * 100} 
                                className="h-2 w-24"
                              />
                              <div className="text-xs text-gray-500">
                                {job.progress.processed}/{job.progress.total}
                                {job.progress.failed > 0 && ` (${job.progress.failed} failed)`}
                              </div>
                              {job.progress.currentItem && (
                                <div className="text-xs text-blue-600">{job.progress.currentItem}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not started</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">{job.createdBy}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(job)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageBulkJobs && (
                              <>
                                {job.status === 'draft' || job.status === 'queued' || job.status === 'paused' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartJob(job.id)}
                                  >
                                    <Play className="h-4 w-4 text-green-600" />
                                  </Button>
                                ) : null}
                                {job.status === 'running' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePauseJob(job.id)}
                                  >
                                    <Pause className="h-4 w-4 text-orange-600" />
                                  </Button>
                                ) : null}
                                {job.status === 'running' || job.status === 'paused' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStopJob(job.id)}
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
                                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{job.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteJob(job.id)}
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

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Templates</CardTitle>
              <p className="text-sm text-gray-600">Predefined templates for common bulk generation scenarios</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobTemplates.map((template) => (
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
                      <div>Departments: {template.departments.join(', ')}</div>
                      <div>Format: {template.outputFormat.toUpperCase()}</div>
                      <div>Email: {template.includeEmail ? 'Yes' : 'No'}</div>
                    </div>
                    {canManageBulkJobs && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            departments: template.departments,
                            template: template.template,
                            outputFormat: template.outputFormat,
                            includeEmail: template.includeEmail,
                            emailSubject: template.emailSubject,
                            emailBody: template.emailBody,
                          }));
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        Use Template
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold">{jobs.length}</p>
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
                    <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'completed').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Running</p>
                    <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'running').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs
                  .filter(job => job.executionLog.length > 0)
                  .slice(0, 5)
                  .map((job) => (
                    <div key={job.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-medium">{job.name}</div>
                      <div className="text-sm text-gray-600">{job.executionLog[job.executionLog.length - 1]?.message}</div>
                      <div className="text-xs text-gray-400">
                        {job.executionLog[job.executionLog.length - 1]?.timestamp && 
                          new Date(job.executionLog[job.executionLog.length - 1].timestamp).toLocaleString()
                        }
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bulk Payslip Generation Job</DialogTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Month *</Label>
                <Select 
                  value={formData.month} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}
                >
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
                <Label>Year *</Label>
                <Select 
                  value={formData.year} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                >
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
                <Label>Output Format</Label>
                <Select 
                  value={formData.outputFormat} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, outputFormat: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Only</SelectItem>
                    <SelectItem value="excel">Excel Only</SelectItem>
                    <SelectItem value="both">Both PDF & Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Departments</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {getDepartments().map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox
                      id={dept}
                      checked={formData.departments.includes(dept)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, departments: [...prev.departments, dept] }));
                        } else {
                          setFormData(prev => ({ ...prev, departments: prev.departments.filter(d => d !== dept) }));
                        }
                      }}
                    />
                    <Label htmlFor={dept} className="text-sm">{dept}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeEmail"
                  checked={formData.includeEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeEmail: checked }))}
                />
                <Label htmlFor="includeEmail">Send payslips via email</Label>
              </div>

              {formData.includeEmail && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input
                      value={formData.emailSubject}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
                      placeholder="Email subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Body</Label>
                    <Textarea
                      value={formData.emailBody}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailBody: e.target.value }))}
                      placeholder="Email body"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      Use variables: {{EMPLOYEE_NAME}}, {{MONTH}}, {{YEAR}}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
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
                    <Checkbox
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
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
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
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateJob} className="bg-indigo-600 hover:bg-indigo-700">
              Create Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details: {selectedJob?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="mt-4">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
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
                      <Label className="text-sm font-medium text-gray-600">Period</Label>
                      <p className="mt-1">{selectedJob.parameters.month}/{selectedJob.parameters.year}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Output Format</Label>
                      <p className="mt-1">{selectedJob.parameters.outputFormat.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created By</Label>
                      <p className="mt-1">{selectedJob.createdBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created At</Label>
                      <p className="mt-1">{new Date(selectedJob.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="mt-1">{selectedJob.description}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Departments</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedJob.parameters.departments.map(dept => (
                        <Badge key={dept} variant="outline">{dept}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="progress" className="space-y-4">
                  {selectedJob.progress.total > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm text-gray-600">
                            {selectedJob.progress.processed}/{selectedJob.progress.total}
                          </span>
                        </div>
                        <Progress value={(selectedJob.progress.processed / selectedJob.progress.total) * 100} />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{selectedJob.progress.successful}</div>
                            <div className="text-sm text-gray-600">Successful</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{selectedJob.progress.failed}</div>
                            <div className="text-sm text-gray-600">Failed</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {selectedJob.progress.total - selectedJob.progress.processed}
                            </div>
                            <div className="text-sm text-gray-600">Remaining</div>
                          </CardContent>
                        </Card>
                      </div>

                      {selectedJob.progress.currentItem && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-800">Current Task</div>
                          <div className="text-sm text-blue-600">{selectedJob.progress.currentItem}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Job not started</h3>
                      <p className="mt-1 text-sm text-gray-500">Progress will be shown when the job starts executing.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="results" className="space-y-4">
                  <div className="space-y-4">
                    {selectedJob.results.successfulPayslips.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Successful Payslips ({selectedJob.results.successfulPayslips.length})</Label>
                        <div className="mt-2 max-h-48 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>File Name</TableHead>
                                <TableHead>Generated</TableHead>
                                <TableHead>Email</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedJob.results.successfulPayslips.map((result, index) => (
                                <TableRow key={index}>
                                  <TableCell>{result.employeeName}</TableCell>
                                  <TableCell className="font-mono text-xs">{result.fileName}</TableCell>
                                  <TableCell>{new Date(result.generatedAt).toLocaleString()}</TableCell>
                                  <TableCell>
                                    {result.emailSent ? (
                                      <Badge className="bg-green-100 text-green-800">Sent</Badge>
                                    ) : (
                                      <Badge variant="secondary">Not sent</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {selectedJob.results.failedPayslips.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Failed Payslips ({selectedJob.results.failedPayslips.length})</Label>
                        <div className="mt-2 max-h-48 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Error</TableHead>
                                <TableHead>Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedJob.results.failedPayslips.map((result, index) => (
                                <TableRow key={index}>
                                  <TableCell>{result.employeeName}</TableCell>
                                  <TableCell className="text-red-600">{result.error}</TableCell>
                                  <TableCell>{new Date(result.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {selectedJob.results.successfulPayslips.length === 0 && selectedJob.results.failedPayslips.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Results will appear here once the job starts processing.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  {selectedJob.executionLog.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {selectedJob.executionLog.map((log, index) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${
                          log.level === 'error' ? 'border-red-500 bg-red-50' :
                          log.level === 'warning' ? 'border-orange-500 bg-orange-50' :
                          'border-blue-500 bg-blue-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${
                                log.level === 'error' ? 'text-red-800' :
                                log.level === 'warning' ? 'text-orange-800' :
                                'text-blue-800'
                              }`}>
                                {log.message}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 ml-4">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No logs available</h3>
                      <p className="mt-1 text-sm text-gray-500">Execution logs will appear here when the job runs.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
