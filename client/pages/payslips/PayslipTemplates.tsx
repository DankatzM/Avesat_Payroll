import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Upload,
  Settings,
  Palette,
  Layout,
  Code,
  Save,
  RefreshCw,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { UserRole } from '@shared/api';

interface PayslipTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'standard' | 'detailed' | 'minimal' | 'custom';
  isDefault: boolean;
  isActive: boolean;
  headerSettings: {
    showCompanyLogo: boolean;
    companyName: string;
    companyAddress: string;
    showPayPeriod: boolean;
    showEmployeePhoto: boolean;
  };
  layoutSettings: {
    orientation: 'portrait' | 'landscape';
    pageSize: 'A4' | 'Letter' | 'Legal';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    columns: number;
    fontFamily: string;
    fontSize: number;
  };
  contentSettings: {
    sections: {
      personalInfo: boolean;
      earnings: boolean;
      deductions: boolean;
      ytdSummary: boolean;
      bankDetails: boolean;
      taxInfo: boolean;
      leaveBalance: boolean;
      notes: boolean;
    };
    showCalculations: boolean;
    showFormulas: boolean;
    groupDeductions: boolean;
  };
  styleSettings: {
    primaryColor: string;
    secondaryColor: string;
    headerBackgroundColor: string;
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted';
    borderWidth: number;
    borderColor: string;
  };
  customFields: Array<{
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    position: 'header' | 'body' | 'footer';
    required: boolean;
  }>;
  htmlTemplate: string;
  cssStyles: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  usageCount: number;
  lastUsed?: string;
}

interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  position: 'header' | 'body' | 'footer';
  required: boolean;
}

export default function PayslipTemplates() {
  const { user, hasAnyRole } = useAuth();
  const [templates, setTemplates] = useState<PayslipTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PayslipTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state for creating/editing templates
  const [formData, setFormData] = useState<Partial<PayslipTemplate>>({
    name: '',
    description: '',
    templateType: 'standard',
    isDefault: false,
    isActive: true,
    headerSettings: {
      showCompanyLogo: true,
      companyName: 'Your Company Name',
      companyAddress: 'Company Address',
      showPayPeriod: true,
      showEmployeePhoto: false,
    },
    layoutSettings: {
      orientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      columns: 1,
      fontFamily: 'Arial',
      fontSize: 12,
    },
    contentSettings: {
      sections: {
        personalInfo: true,
        earnings: true,
        deductions: true,
        ytdSummary: true,
        bankDetails: false,
        taxInfo: true,
        leaveBalance: false,
        notes: false,
      },
      showCalculations: true,
      showFormulas: false,
      groupDeductions: true,
    },
    styleSettings: {
      primaryColor: '#3b82f6',
      secondaryColor: '#6b7280',
      headerBackgroundColor: '#f8fafc',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    customFields: [],
    htmlTemplate: '',
    cssStyles: '',
  });

  const [newField, setNewField] = useState<TemplateField>({
    id: '',
    name: '',
    type: 'text',
    position: 'body',
    required: false,
  });

  const canManageTemplates = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    // Mock templates data
    const mockTemplates: PayslipTemplate[] = [
      {
        id: '1',
        name: 'Standard Kenya Payslip',
        description: 'Standard payslip template compliant with Kenya labor laws',
        templateType: 'standard',
        isDefault: true,
        isActive: true,
        headerSettings: {
          showCompanyLogo: true,
          companyName: 'Avesat Systems',
          companyAddress: 'P.O. Box 12345, Nairobi, Kenya',
          showPayPeriod: true,
          showEmployeePhoto: false,
        },
        layoutSettings: {
          orientation: 'portrait',
          pageSize: 'A4',
          margins: { top: 20, right: 15, bottom: 20, left: 15 },
          columns: 1,
          fontFamily: 'Arial',
          fontSize: 12,
        },
        contentSettings: {
          sections: {
            personalInfo: true,
            earnings: true,
            deductions: true,
            ytdSummary: true,
            bankDetails: false,
            taxInfo: true,
            leaveBalance: false,
            notes: false,
          },
          showCalculations: true,
          showFormulas: false,
          groupDeductions: true,
        },
        styleSettings: {
          primaryColor: '#3b82f6',
          secondaryColor: '#6b7280',
          headerBackgroundColor: '#f8fafc',
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#e5e7eb',
        },
        customFields: [],
        htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip</title>
  <style>{{CSS_STYLES}}</style>
</head>
<body>
  <div class="payslip">
    <div class="header">
      <h1>{{COMPANY_NAME}}</h1>
      <p>{{COMPANY_ADDRESS}}</p>
    </div>
    <div class="employee-info">
      <p><strong>Employee:</strong> {{EMPLOYEE_NAME}}</p>
      <p><strong>ID:</strong> {{EMPLOYEE_NUMBER}}</p>
      <p><strong>Position:</strong> {{POSITION}}</p>
    </div>
    <div class="earnings">
      <h3>Earnings</h3>
      {{EARNINGS_TABLE}}
    </div>
    <div class="deductions">
      <h3>Deductions</h3>
      {{DEDUCTIONS_TABLE}}
    </div>
    <div class="totals">
      <p><strong>Net Pay:</strong> {{NET_PAY}}</p>
    </div>
  </div>
</body>
</html>`,
        cssStyles: `.payslip { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
.header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
.employee-info { margin-bottom: 20px; }
.earnings, .deductions { margin-bottom: 20px; }
.totals { border-top: 2px solid #3b82f6; padding-top: 10px; text-align: right; }`,
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
        version: 1,
        usageCount: 145,
        lastUsed: '2024-03-25T00:00:00Z',
      },
      {
        id: '2',
        name: 'Detailed Executive Payslip',
        description: 'Comprehensive payslip template for executive staff with detailed breakdowns',
        templateType: 'detailed',
        isDefault: false,
        isActive: true,
        headerSettings: {
          showCompanyLogo: true,
          companyName: 'Avesat Systems',
          companyAddress: 'P.O. Box 12345, Nairobi, Kenya',
          showPayPeriod: true,
          showEmployeePhoto: true,
        },
        layoutSettings: {
          orientation: 'portrait',
          pageSize: 'A4',
          margins: { top: 25, right: 20, bottom: 25, left: 20 },
          columns: 2,
          fontFamily: 'Calibri',
          fontSize: 11,
        },
        contentSettings: {
          sections: {
            personalInfo: true,
            earnings: true,
            deductions: true,
            ytdSummary: true,
            bankDetails: true,
            taxInfo: true,
            leaveBalance: true,
            notes: true,
          },
          showCalculations: true,
          showFormulas: true,
          groupDeductions: false,
        },
        styleSettings: {
          primaryColor: '#059669',
          secondaryColor: '#4b5563',
          headerBackgroundColor: '#ecfdf5',
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#d1d5db',
        },
        customFields: [
          {
            id: '1',
            name: 'Performance Bonus',
            type: 'number',
            position: 'body',
            required: false,
          },
          {
            id: '2',
            name: 'Stock Options',
            type: 'text',
            position: 'body',
            required: false,
          },
        ],
        htmlTemplate: '<!-- Detailed executive template -->',
        cssStyles: '/* Executive styles */',
        createdBy: 'hr@avesat.co.ke',
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-03-10T00:00:00Z',
        version: 2,
        usageCount: 23,
        lastUsed: '2024-03-20T00:00:00Z',
      },
      {
        id: '3',
        name: 'Minimal Basic Payslip',
        description: 'Simple, minimal payslip template with essential information only',
        templateType: 'minimal',
        isDefault: false,
        isActive: true,
        headerSettings: {
          showCompanyLogo: false,
          companyName: 'Avesat Systems',
          companyAddress: '',
          showPayPeriod: true,
          showEmployeePhoto: false,
        },
        layoutSettings: {
          orientation: 'portrait',
          pageSize: 'A4',
          margins: { top: 15, right: 10, bottom: 15, left: 10 },
          columns: 1,
          fontFamily: 'Times New Roman',
          fontSize: 10,
        },
        contentSettings: {
          sections: {
            personalInfo: true,
            earnings: true,
            deductions: true,
            ytdSummary: false,
            bankDetails: false,
            taxInfo: false,
            leaveBalance: false,
            notes: false,
          },
          showCalculations: false,
          showFormulas: false,
          groupDeductions: true,
        },
        styleSettings: {
          primaryColor: '#6b7280',
          secondaryColor: '#9ca3af',
          headerBackgroundColor: '#ffffff',
          borderStyle: 'none',
          borderWidth: 0,
          borderColor: '#ffffff',
        },
        customFields: [],
        htmlTemplate: '<!-- Minimal template -->',
        cssStyles: '/* Minimal styles */',
        createdBy: 'admin@avesat.co.ke',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z',
        version: 1,
        usageCount: 87,
        lastUsed: '2024-03-22T00:00:00Z',
      },
    ];
    setTemplates(mockTemplates);
  };

  const handleCreateTemplate = async () => {
    if (!formData.name?.trim()) {
      alert('Please enter a template name');
      return;
    }

    const newTemplate: PayslipTemplate = {
      ...formData as PayslipTemplate,
      id: Date.now().toString(),
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      usageCount: 0,
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setIsCreateDialogOpen(false);
    resetForm();
    alert('Template created successfully!');
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !formData.name?.trim()) {
      return;
    }

    const updatedTemplate: PayslipTemplate = {
      ...selectedTemplate,
      ...formData,
      updatedAt: new Date().toISOString(),
      version: selectedTemplate.version + 1,
    } as PayslipTemplate;

    setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t));
    setIsEditDialogOpen(false);
    setSelectedTemplate(null);
    resetForm();
    alert('Template updated successfully!');
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    alert('Template deleted successfully!');
  };

  const handleDuplicateTemplate = async (template: PayslipTemplate) => {
    const duplicatedTemplate: PayslipTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      usageCount: 0,
      lastUsed: undefined,
    };

    setTemplates(prev => [duplicatedTemplate, ...prev]);
    alert('Template duplicated successfully!');
  };

  const handleSetDefault = async (templateId: string) => {
    setTemplates(prev => prev.map(t => ({
      ...t,
      isDefault: t.id === templateId,
    })));
    alert('Default template updated!');
  };

  const handleToggleActive = async (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const handlePreviewTemplate = (template: PayslipTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleExportTemplate = (template: PayslipTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `payslip-template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplate = JSON.parse(e.target?.result as string);
        const newTemplate: PayslipTemplate = {
          ...importedTemplate,
          id: Date.now().toString(),
          name: `${importedTemplate.name} (Imported)`,
          isDefault: false,
          createdBy: user?.email || 'unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          usageCount: 0,
          lastUsed: undefined,
        };
        setTemplates(prev => [newTemplate, ...prev]);
        alert('Template imported successfully!');
      } catch (error) {
        alert('Error importing template. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      templateType: 'standard',
      isDefault: false,
      isActive: true,
      headerSettings: {
        showCompanyLogo: true,
        companyName: 'Your Company Name',
        companyAddress: 'Company Address',
        showPayPeriod: true,
        showEmployeePhoto: false,
      },
      layoutSettings: {
        orientation: 'portrait',
        pageSize: 'A4',
        margins: { top: 20, right: 15, bottom: 20, left: 15 },
        columns: 1,
        fontFamily: 'Arial',
        fontSize: 12,
      },
      contentSettings: {
        sections: {
          personalInfo: true,
          earnings: true,
          deductions: true,
          ytdSummary: true,
          bankDetails: false,
          taxInfo: true,
          leaveBalance: false,
          notes: false,
        },
        showCalculations: true,
        showFormulas: false,
        groupDeductions: true,
      },
      styleSettings: {
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280',
        headerBackgroundColor: '#f8fafc',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      customFields: [],
      htmlTemplate: '',
      cssStyles: '',
    });
    setNewField({
      id: '',
      name: '',
      type: 'text',
      position: 'body',
      required: false,
    });
  };

  const addCustomField = () => {
    if (!newField.name.trim()) {
      alert('Please enter a field name');
      return;
    }

    const field: TemplateField = {
      ...newField,
      id: Date.now().toString(),
    };

    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), field],
    }));

    setNewField({
      id: '',
      name: '',
      type: 'text',
      position: 'body',
      required: false,
    });
  };

  const removeCustomField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields?.filter(f => f.id !== fieldId) || [],
    }));
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'detailed': return 'bg-green-100 text-green-800';
      case 'minimal': return 'bg-gray-100 text-gray-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.templateType === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && template.isActive) ||
                         (filterStatus === 'inactive' && !template.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payslip Templates</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage payslip templates for different employee groups
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          {canManageTemplates && (
            <>
              <label htmlFor="import-template">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </span>
                </Button>
              </label>
              <input
                id="import-template"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportTemplate}
              />
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {canManageTemplates ? "Create your first template to get started." : "No templates have been created yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="font-medium">{template.name}</div>
                          {template.isDefault && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTemplateTypeColor(template.templateType)}>
                        {template.templateType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{template.usageCount} times</div>
                        <div className="text-gray-500">v{template.version}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.lastUsed ? (
                        <div className="text-sm">
                          {new Date(template.lastUsed).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportTemplate(template)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canManageTemplates && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setFormData(template);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!template.isDefault && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
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

      {/* Create/Edit Template Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? 'Create New Template' : 'Edit Template'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select 
                    value={formData.templateType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, templateType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
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
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                  />
                  <Label htmlFor="isDefault">Set as default template</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page Orientation</Label>
                  <Select 
                    value={formData.layoutSettings?.orientation} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      layoutSettings: { ...prev.layoutSettings!, orientation: value as any } 
                    }))}
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
                  <Label>Page Size</Label>
                  <Select 
                    value={formData.layoutSettings?.pageSize} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      layoutSettings: { ...prev.layoutSettings!, pageSize: value as any } 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Top Margin (mm)</Label>
                  <Input
                    type="number"
                    value={formData.layoutSettings?.margins.top}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      layoutSettings: { 
                        ...prev.layoutSettings!, 
                        margins: { ...prev.layoutSettings!.margins, top: parseInt(e.target.value) } 
                      } 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Right Margin (mm)</Label>
                  <Input
                    type="number"
                    value={formData.layoutSettings?.margins.right}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      layoutSettings: { 
                        ...prev.layoutSettings!, 
                        margins: { ...prev.layoutSettings!.margins, right: parseInt(e.target.value) } 
                      } 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bottom Margin (mm)</Label>
                  <Input
                    type="number"
                    value={formData.layoutSettings?.margins.bottom}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      layoutSettings: { 
                        ...prev.layoutSettings!, 
                        margins: { ...prev.layoutSettings!.margins, bottom: parseInt(e.target.value) } 
                      } 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Left Margin (mm)</Label>
                  <Input
                    type="number"
                    value={formData.layoutSettings?.margins.left}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      layoutSettings: { 
                        ...prev.layoutSettings!, 
                        margins: { ...prev.layoutSettings!.margins, left: parseInt(e.target.value) } 
                      } 
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Include Sections</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(formData.contentSettings?.sections || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          contentSettings: { 
                            ...prev.contentSettings!, 
                            sections: { ...prev.contentSettings!.sections, [key]: checked } 
                          } 
                        }))}
                      />
                      <Label htmlFor={key} className="text-sm">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Display Options</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showCalculations"
                      checked={formData.contentSettings?.showCalculations}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        contentSettings: { ...prev.contentSettings!, showCalculations: checked } 
                      }))}
                    />
                    <Label htmlFor="showCalculations">Show calculation details</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showFormulas"
                      checked={formData.contentSettings?.showFormulas}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        contentSettings: { ...prev.contentSettings!, showFormulas: checked } 
                      }))}
                    />
                    <Label htmlFor="showFormulas">Show formulas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="groupDeductions"
                      checked={formData.contentSettings?.groupDeductions}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        contentSettings: { ...prev.contentSettings!, groupDeductions: checked } 
                      }))}
                    />
                    <Label htmlFor="groupDeductions">Group similar deductions</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={formData.styleSettings?.primaryColor}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      styleSettings: { ...prev.styleSettings!, primaryColor: e.target.value } 
                    }))}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <Input
                    type="color"
                    value={formData.styleSettings?.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      styleSettings: { ...prev.styleSettings!, secondaryColor: e.target.value } 
                    }))}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Header Background</Label>
                  <Input
                    type="color"
                    value={formData.styleSettings?.headerBackgroundColor}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      styleSettings: { ...prev.styleSettings!, headerBackgroundColor: e.target.value } 
                    }))}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Border Style</Label>
                  <Select 
                    value={formData.styleSettings?.borderStyle} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      styleSettings: { ...prev.styleSettings!, borderStyle: value as any } 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Border Width (px)</Label>
                  <Input
                    type="number"
                    value={formData.styleSettings?.borderWidth}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      styleSettings: { ...prev.styleSettings!, borderWidth: parseInt(e.target.value) } 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <Input
                    type="color"
                    value={formData.styleSettings?.borderColor}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      styleSettings: { ...prev.styleSettings!, borderColor: e.target.value } 
                    }))}
                    className="h-10"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Custom Fields</Label>
                <div className="mt-2 space-y-4">
                  {/* Add new field form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Add Custom Field</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <Input
                          placeholder="Field name"
                          value={newField.name}
                          onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <Select 
                          value={newField.type} 
                          onValueChange={(value) => setNewField(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select 
                          value={newField.position} 
                          onValueChange={(value) => setNewField(prev => ({ ...prev, position: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="body">Body</SelectItem>
                            <SelectItem value="footer">Footer</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="required"
                            checked={newField.required}
                            onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked }))}
                          />
                          <Label htmlFor="required" className="text-xs">Required</Label>
                        </div>
                        <Button onClick={addCustomField}>Add</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Existing fields */}
                  {formData.customFields && formData.customFields.length > 0 && (
                    <div className="space-y-2">
                      {formData.customFields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{field.name}</div>
                            <div className="text-sm text-gray-500">
                              {field.type} • {field.position} • {field.required ? 'Required' : 'Optional'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>HTML Template</Label>
                  <Textarea
                    value={formData.htmlTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, htmlTemplate: e.target.value }))}
                    placeholder="Enter HTML template code..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CSS Styles</Label>
                  <Textarea
                    value={formData.cssStyles}
                    onChange={(e) => setFormData(prev => ({ ...prev, cssStyles: e.target.value }))}
                    placeholder="Enter CSS styles..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={isCreateDialogOpen ? handleCreateTemplate : handleUpdateTemplate}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {isCreateDialogOpen ? 'Create Template' : 'Update Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Type:</strong> {selectedTemplate.templateType}
                  </div>
                  <div>
                    <strong>Version:</strong> {selectedTemplate.version}
                  </div>
                  <div>
                    <strong>Usage:</strong> {selectedTemplate.usageCount} times
                  </div>
                  <div>
                    <strong>Last Used:</strong> {selectedTemplate.lastUsed ? new Date(selectedTemplate.lastUsed).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div className="border border-gray-300 p-4 bg-white rounded-lg">
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">Payslip Preview</h3>
                    <p className="text-gray-500">Template preview would be rendered here</p>
                    <div className="mt-4 text-sm text-gray-600">
                      <div>Company: {selectedTemplate.headerSettings.companyName}</div>
                      <div>Layout: {selectedTemplate.layoutSettings.orientation} • {selectedTemplate.layoutSettings.pageSize}</div>
                      <div>Style: {selectedTemplate.styleSettings.primaryColor}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
