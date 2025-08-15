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
  Mail,
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Archive,
  FileText,
  Zap,
  Timer,
} from 'lucide-react';
import { Employee, Payslip, UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface EmailDistribution {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  emailTemplate: string;
  subject: string;
  body: string;
  recipients: Array<{
    employeeId: string;
    employeeName: string;
    email: string;
    payslipId: string;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    sentAt?: string;
    error?: string;
    opens?: number;
    lastOpened?: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: 'payslip' | 'document' | 'image';
    size: number;
  }>;
  settings: {
    sendImmediately: boolean;
    scheduledDate?: string;
    trackOpens: boolean;
    allowReply: boolean;
    bccHR: boolean;
    retryFailed: boolean;
    maxRetries: number;
  };
  statistics: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    failed: number;
    bounced: number;
  };
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'payslip' | 'reminder' | 'notification' | 'custom';
  isDefault: boolean;
  variables: string[];
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

interface EmailLog {
  id: string;
  distributionId: string;
  recipientEmail: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed' | 'bounced';
  timestamp: string;
  error?: string;
  metadata?: Record<string, any>;
}

export default function EmailDistribution() {
  const { user, hasAnyRole } = useAuth();
  const [distributions, setDistributions] = useState<EmailDistribution[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [selectedDistribution, setSelectedDistribution] = useState<EmailDistribution | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('distributions');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Form state for creating distributions
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emailTemplate: '',
    subject: 'Your Monthly Payslip - {{MONTH}} {{YEAR}}',
    body: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for {{MONTH}} {{YEAR}}.\n\nIf you have any questions, please contact HR.\n\nBest regards,\nHR Department',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    selectedEmployees: [] as string[],
    selectedPayslips: [] as string[],
    sendImmediately: true,
    scheduledDate: '',
    trackOpens: true,
    allowReply: false,
    bccHR: true,
    retryFailed: true,
    maxRetries: 3,
  });

  // Template form state
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'payslip' as 'payslip' | 'reminder' | 'notification' | 'custom',
    isDefault: false,
  });

  const canManageEmails = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  useEffect(() => {
    fetchDistributions();
    fetchEmailTemplates();
    fetchEmailLogs();
    fetchEmployees();
    fetchPayslips();
  }, []);

  useEffect(() => {
    // Auto-refresh sending distributions
    const interval = setInterval(() => {
      setDistributions(prev => prev.map(dist => {
        if (dist.status === 'sending') {
          const newSent = Math.min(
            dist.statistics.sent + Math.floor(Math.random() * 3) + 1,
            dist.statistics.totalRecipients
          );
          const newDelivered = Math.min(newSent, dist.statistics.delivered + Math.floor(Math.random() * 2));
          const newOpened = Math.min(newDelivered, dist.statistics.opened + Math.floor(Math.random() * 1));
          
          const isCompleted = newSent >= dist.statistics.totalRecipients;
          
          return {
            ...dist,
            status: isCompleted ? 'completed' : dist.status,
            statistics: {
              ...dist.statistics,
              sent: newSent,
              delivered: newDelivered,
              opened: newOpened,
            },
            completedAt: isCompleted ? new Date().toISOString() : dist.completedAt,
          };
        }
        return dist;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchDistributions = async () => {
    // Mock email distributions data
    const mockDistributions: EmailDistribution[] = [
      {
        id: '1',
        name: 'March 2024 Payslip Distribution',
        description: 'Monthly payslip distribution for all employees',
        status: 'completed',
        priority: 'high',
        emailTemplate: 'default-payslip',
        subject: 'Your Monthly Payslip - March 2024',
        body: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for March 2024.\n\nIf you have any questions, please contact HR.\n\nBest regards,\nHR Department',
        recipients: [
          {
            employeeId: '1',
            employeeName: 'John Mwangi',
            email: 'john.mwangi@company.co.ke',
            payslipId: 'payslip-1',
            status: 'sent',
            sentAt: '2024-03-25T10:15:00Z',
            opens: 3,
            lastOpened: '2024-03-26T08:30:00Z',
          },
          {
            employeeId: '2',
            employeeName: 'Grace Wanjiku',
            email: 'grace.wanjiku@company.co.ke',
            payslipId: 'payslip-2',
            status: 'sent',
            sentAt: '2024-03-25T10:16:00Z',
            opens: 1,
            lastOpened: '2024-03-25T14:20:00Z',
          },
          {
            employeeId: '3',
            employeeName: 'Samuel Otieno',
            email: 'samuel.otieno@company.co.ke',
            payslipId: 'payslip-3',
            status: 'failed',
            error: 'Invalid email address',
          },
        ],
        attachments: [
          {
            id: '1',
            name: 'Company_Policy_Update.pdf',
            type: 'document',
            size: 245760,
          },
        ],
        settings: {
          sendImmediately: true,
          trackOpens: true,
          allowReply: false,
          bccHR: true,
          retryFailed: true,
          maxRetries: 3,
        },
        statistics: {
          totalRecipients: 3,
          sent: 3,
          delivered: 2,
          opened: 2,
          failed: 1,
          bounced: 0,
        },
        createdBy: 'hr@avesat.co.ke',
        createdAt: '2024-03-25T09:30:00Z',
        sentAt: '2024-03-25T10:00:00Z',
        completedAt: '2024-03-25T10:20:00Z',
      },
      {
        id: '2',
        name: 'April 2024 Payslip Distribution',
        description: 'Monthly payslip distribution for April 2024',
        status: 'sending',
        priority: 'medium',
        emailTemplate: 'default-payslip',
        subject: 'Your Monthly Payslip - April 2024',
        body: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for April 2024.',
        recipients: [],
        attachments: [],
        settings: {
          sendImmediately: true,
          trackOpens: true,
          allowReply: false,
          bccHR: true,
          retryFailed: true,
          maxRetries: 3,
        },
        statistics: {
          totalRecipients: 156,
          sent: 89,
          delivered: 82,
          opened: 45,
          failed: 2,
          bounced: 1,
        },
        createdBy: 'payroll@avesat.co.ke',
        createdAt: '2024-04-25T08:45:00Z',
        sentAt: '2024-04-25T09:00:00Z',
      },
      {
        id: '3',
        name: 'Bonus Payment Notification',
        description: 'Q1 bonus payment notification emails',
        status: 'scheduled',
        priority: 'urgent',
        emailTemplate: 'bonus-notification',
        subject: 'Q1 Bonus Payment Notification',
        body: 'Dear {{EMPLOYEE_NAME}},\n\nWe are pleased to inform you about your Q1 bonus payment.',
        recipients: [],
        attachments: [],
        settings: {
          sendImmediately: false,
          scheduledDate: '2024-04-30T09:00:00Z',
          trackOpens: true,
          allowReply: true,
          bccHR: false,
          retryFailed: true,
          maxRetries: 2,
        },
        statistics: {
          totalRecipients: 28,
          sent: 0,
          delivered: 0,
          opened: 0,
          failed: 0,
          bounced: 0,
        },
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-04-20T15:30:00Z',
      },
    ];
    setDistributions(mockDistributions);
  };

  const fetchEmailTemplates = async () => {
    // Mock email templates
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Default Payslip Template',
        subject: 'Your Monthly Payslip - {{MONTH}} {{YEAR}}',
        body: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for {{MONTH}} {{YEAR}}.\n\nIf you have any questions, please contact HR.\n\nBest regards,\nHR Department',
        type: 'payslip',
        isDefault: true,
        variables: ['EMPLOYEE_NAME', 'MONTH', 'YEAR', 'COMPANY_NAME'],
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-01-15T00:00:00Z',
        usageCount: 245,
      },
      {
        id: '2',
        name: 'Payslip Reminder',
        subject: 'Reminder: Your {{MONTH}} Payslip is Available',
        body: 'Dear {{EMPLOYEE_NAME}},\n\nThis is a reminder that your payslip for {{MONTH}} {{YEAR}} is available.\n\nPlease check your email for the payslip attachment.\n\nThank you,\nHR Department',
        type: 'reminder',
        isDefault: false,
        variables: ['EMPLOYEE_NAME', 'MONTH', 'YEAR'],
        createdBy: 'hr@avesat.co.ke',
        createdAt: '2024-02-01T00:00:00Z',
        usageCount: 45,
      },
      {
        id: '3',
        name: 'Executive Payslip Template',
        subject: 'Executive Compensation Statement - {{MONTH}} {{YEAR}}',
        body: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your executive compensation statement for {{MONTH}} {{YEAR}}.\n\nThis document contains confidential information.\n\nRegards,\nExecutive Compensation Team',
        type: 'payslip',
        isDefault: false,
        variables: ['EMPLOYEE_NAME', 'MONTH', 'YEAR'],
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-01-20T00:00:00Z',
        usageCount: 12,
      },
    ];
    setEmailTemplates(mockTemplates);
  };

  const fetchEmailLogs = async () => {
    // Mock email logs
    const mockLogs: EmailLog[] = [
      {
        id: '1',
        distributionId: '1',
        recipientEmail: 'john.mwangi@company.co.ke',
        status: 'sent',
        timestamp: '2024-03-25T10:15:00Z',
      },
      {
        id: '2',
        distributionId: '1',
        recipientEmail: 'grace.wanjiku@company.co.ke',
        status: 'delivered',
        timestamp: '2024-03-25T10:16:30Z',
      },
      {
        id: '3',
        distributionId: '1',
        recipientEmail: 'samuel.otieno@company.co.ke',
        status: 'failed',
        timestamp: '2024-03-25T10:17:00Z',
        error: 'Invalid email address',
      },
    ];
    setEmailLogs(mockLogs);
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

  const handleCreateDistribution = async () => {
    if (!formData.name.trim() || !formData.subject.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const newDistribution: EmailDistribution = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status: formData.sendImmediately ? 'draft' : 'scheduled',
      priority: formData.priority,
      emailTemplate: formData.emailTemplate,
      subject: formData.subject,
      body: formData.body,
      recipients: [], // Will be populated based on selection
      attachments: [],
      settings: {
        sendImmediately: formData.sendImmediately,
        scheduledDate: formData.scheduledDate,
        trackOpens: formData.trackOpens,
        allowReply: formData.allowReply,
        bccHR: formData.bccHR,
        retryFailed: formData.retryFailed,
        maxRetries: formData.maxRetries,
      },
      statistics: {
        totalRecipients: formData.selectedEmployees.length,
        sent: 0,
        delivered: 0,
        opened: 0,
        failed: 0,
        bounced: 0,
      },
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
    };

    setDistributions(prev => [newDistribution, ...prev]);
    setIsCreateDialogOpen(false);
    resetForm();
    alert('Email distribution created successfully!');
  };

  const handleSendDistribution = async (distributionId: string) => {
    setDistributions(prev => prev.map(dist => 
      dist.id === distributionId 
        ? { 
            ...dist, 
            status: 'sending',
            sentAt: new Date().toISOString(),
          }
        : dist
    ));
  };

  const handleCancelDistribution = async (distributionId: string) => {
    setDistributions(prev => prev.map(dist => 
      dist.id === distributionId ? { ...dist, status: 'cancelled' } : dist
    ));
  };

  const handleDeleteDistribution = async (distributionId: string) => {
    setDistributions(prev => prev.filter(dist => dist.id !== distributionId));
    alert('Distribution deleted successfully!');
  };

  const handleCreateTemplate = async () => {
    if (!templateFormData.name.trim() || !templateFormData.subject.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: templateFormData.name,
      subject: templateFormData.subject,
      body: templateFormData.body,
      type: templateFormData.type,
      isDefault: templateFormData.isDefault,
      variables: extractVariables(templateFormData.body + ' ' + templateFormData.subject),
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };

    setEmailTemplates(prev => [newTemplate, ...prev]);
    setIsTemplateDialogOpen(false);
    resetTemplateForm();
    alert('Email template created successfully!');
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    return matches ? [...new Set(matches.map(m => m.replace(/[{}]/g, '')))] : [];
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      emailTemplate: '',
      subject: 'Your Monthly Payslip - {{MONTH}} {{YEAR}}',
      body: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your payslip for {{MONTH}} {{YEAR}}.\n\nIf you have any questions, please contact HR.\n\nBest regards,\nHR Department',
      priority: 'medium',
      selectedEmployees: [],
      selectedPayslips: [],
      sendImmediately: true,
      scheduledDate: '',
      trackOpens: true,
      allowReply: false,
      bccHR: true,
      retryFailed: true,
      maxRetries: 3,
    });
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      subject: '',
      body: '',
      type: 'payslip',
      isDefault: false,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
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
      case 'sending': return <Timer className="h-4 w-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const filteredDistributions = distributions.filter(dist => {
    const matchesSearch = dist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dist.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || dist.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || dist.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Distribution</h1>
          <p className="mt-1 text-sm text-gray-600">
            Send payslips and notifications to employees via email
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          {canManageEmails && (
            <>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Templates
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Emails
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="distributions">Email Distributions</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="distributions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search distributions..."
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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
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
                {canManageEmails && (
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distributions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email Distributions ({filteredDistributions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDistributions.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No distributions found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {canManageEmails ? "Create your first email distribution to get started." : "No email distributions have been created yet."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distribution</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Statistics</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDistributions.map((distribution) => (
                      <TableRow key={distribution.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{distribution.name}</div>
                            <div className="text-sm text-gray-500">{distribution.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Subject: {distribution.subject}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(distribution.status)}>
                            {getStatusIcon(distribution.status)}
                            <span className="ml-1">{distribution.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(distribution.priority)}>
                            {distribution.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {distribution.statistics.sent}/{distribution.statistics.totalRecipients} sent
                            </div>
                            {distribution.statistics.totalRecipients > 0 && (
                              <Progress 
                                value={(distribution.statistics.sent / distribution.statistics.totalRecipients) * 100} 
                                className="h-2 w-24"
                              />
                            )}
                            <div className="text-xs text-gray-500">
                              {distribution.statistics.opened} opened • {distribution.statistics.failed} failed
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(distribution.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">{distribution.createdBy}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDistribution(distribution);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageEmails && (
                              <>
                                {distribution.status === 'draft' || distribution.status === 'scheduled' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSendDistribution(distribution.id)}
                                  >
                                    <Send className="h-4 w-4 text-green-600" />
                                  </Button>
                                ) : null}
                                {distribution.status === 'sending' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelDistribution(distribution.id)}
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  </Button>
                                ) : null}
                                {distribution.status === 'draft' || distribution.status === 'completed' || distribution.status === 'failed' || distribution.status === 'cancelled' ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Distribution</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{distribution.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteDistribution(distribution.id)}
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
              <div className="flex justify-between items-center">
                <CardTitle>Email Templates ({emailTemplates.length})</CardTitle>
                {canManageEmails && (
                  <Button onClick={() => setIsTemplateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emailTemplates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <div className="flex space-x-2">
                        {template.isDefault && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Default
                          </Badge>
                        )}
                        <Badge className={`${
                          template.type === 'payslip' ? 'bg-green-100 text-green-800' :
                          template.type === 'reminder' ? 'bg-orange-100 text-orange-800' :
                          template.type === 'notification' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <div><strong>Subject:</strong> {template.subject}</div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Variables: {template.variables.join(', ')}</div>
                      <div>Used: {template.usageCount} times</div>
                      <div>Created: {new Date(template.createdAt).toLocaleDateString()}</div>
                    </div>
                    {canManageEmails && (
                      <div className="mt-3 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              emailTemplate: template.id,
                              subject: template.subject,
                              body: template.body,
                            }));
                            setIsCreateDialogOpen(true);
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

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Logs ({emailLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Distribution</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.recipientEmail}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        {distributions.find(d => d.id === log.distributionId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {log.error && (
                          <span className="text-red-600 text-sm">{log.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Mail className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold">
                      {distributions.reduce((sum, d) => sum + d.statistics.sent, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold">
                      {distributions.reduce((sum, d) => sum + d.statistics.delivered, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Opened</p>
                    <p className="text-2xl font-bold">
                      {distributions.reduce((sum, d) => sum + d.statistics.opened, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold">
                      {distributions.reduce((sum, d) => sum + d.statistics.failed, 0)}
                    </p>
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
                {distributions
                  .filter(dist => dist.sentAt)
                  .slice(0, 5)
                  .map((dist) => (
                    <div key={dist.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-medium">{dist.name}</div>
                      <div className="text-sm text-gray-600">
                        {dist.statistics.sent}/{dist.statistics.totalRecipients} emails sent
                      </div>
                      <div className="text-xs text-gray-400">
                        {dist.sentAt && new Date(dist.sentAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Distribution Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Distribution</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Distribution Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter distribution name"
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
                placeholder="Enter distribution description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailTemplate">Email Template</Label>
              <Select 
                value={formData.emailTemplate} 
                onValueChange={(value) => {
                  const template = emailTemplates.find(t => t.id === value);
                  if (template) {
                    setFormData(prev => ({ 
                      ...prev, 
                      emailTemplate: value,
                      subject: template.subject,
                      body: template.body,
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Email Body *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Enter email body"
                rows={8}
              />
              <p className="text-xs text-gray-500">
                Use variables: {{EMPLOYEE_NAME}}, {{MONTH}}, {{YEAR}}, {{COMPANY_NAME}}
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Email Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sendImmediately"
                    checked={formData.sendImmediately}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendImmediately: checked }))}
                  />
                  <Label htmlFor="sendImmediately">Send immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackOpens"
                    checked={formData.trackOpens}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackOpens: checked }))}
                  />
                  <Label htmlFor="trackOpens">Track email opens</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowReply"
                    checked={formData.allowReply}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowReply: checked }))}
                  />
                  <Label htmlFor="allowReply">Allow replies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bccHR"
                    checked={formData.bccHR}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bccHR: checked }))}
                  />
                  <Label htmlFor="bccHR">BCC HR department</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="retryFailed"
                    checked={formData.retryFailed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, retryFailed: checked }))}
                  />
                  <Label htmlFor="retryFailed">Retry failed emails</Label>
                </div>
              </div>

              {!formData.sendImmediately && (
                <div className="space-y-2">
                  <Label>Scheduled Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
              )}

              {formData.retryFailed && (
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxRetries}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                  />
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
            <Button onClick={handleCreateDistribution} className="bg-indigo-600 hover:bg-indigo-700">
              Create Distribution
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Select 
                  value={templateFormData.type} 
                  onValueChange={(value) => setTemplateFormData(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payslip">Payslip</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSubject">Subject *</Label>
              <Input
                id="templateSubject"
                value={templateFormData.subject}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateBody">Body *</Label>
              <Textarea
                id="templateBody"
                value={templateFormData.body}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Enter email body"
                rows={10}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefaultTemplate"
                checked={templateFormData.isDefault}
                onCheckedChange={(checked) => setTemplateFormData(prev => ({ ...prev, isDefault: checked }))}
              />
              <Label htmlFor="isDefaultTemplate">Set as default template</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsTemplateDialogOpen(false);
                resetTemplateForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} className="bg-indigo-600 hover:bg-indigo-700">
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Distribution Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Distribution Details: {selectedDistribution?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedDistribution && (
            <div className="mt-4">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="recipients">Recipients</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedDistribution.status)}>
                          {getStatusIcon(selectedDistribution.status)}
                          <span className="ml-1">{selectedDistribution.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Priority</Label>
                      <div className="mt-1">
                        <Badge className={getPriorityColor(selectedDistribution.priority)}>
                          {selectedDistribution.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Subject</Label>
                    <p className="mt-1">{selectedDistribution.subject}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Body</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                      {selectedDistribution.body}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recipients" className="space-y-4">
                  {selectedDistribution.recipients.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead>Opens</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDistribution.recipients.map((recipient, index) => (
                          <TableRow key={index}>
                            <TableCell>{recipient.employeeName}</TableCell>
                            <TableCell>{recipient.email}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(recipient.status)}>
                                {recipient.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {recipient.sentAt ? new Date(recipient.sentAt).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell>
                              {recipient.opens || 0}
                              {recipient.lastOpened && (
                                <div className="text-xs text-gray-500">
                                  Last: {new Date(recipient.lastOpened).toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No recipients</h3>
                      <p className="mt-1 text-sm text-gray-500">No recipients have been added to this distribution.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{selectedDistribution.statistics.totalRecipients}</div>
                        <div className="text-sm text-gray-600">Total Recipients</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedDistribution.statistics.sent}</div>
                        <div className="text-sm text-gray-600">Sent</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedDistribution.statistics.delivered}</div>
                        <div className="text-sm text-gray-600">Delivered</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{selectedDistribution.statistics.opened}</div>
                        <div className="text-sm text-gray-600">Opened</div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedDistribution.statistics.totalRecipients > 0 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Delivery Rate</Label>
                        <Progress 
                          value={(selectedDistribution.statistics.delivered / selectedDistribution.statistics.totalRecipients) * 100} 
                          className="mt-2"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {Math.round((selectedDistribution.statistics.delivered / selectedDistribution.statistics.totalRecipients) * 100)}% delivered
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Open Rate</Label>
                        <Progress 
                          value={(selectedDistribution.statistics.opened / selectedDistribution.statistics.delivered) * 100} 
                          className="mt-2"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedDistribution.statistics.delivered > 0 
                            ? Math.round((selectedDistribution.statistics.opened / selectedDistribution.statistics.delivered) * 100)
                            : 0}% opened
                        </p>
                      </div>
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
