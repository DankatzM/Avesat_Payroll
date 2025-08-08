import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Building2,
  DollarSign,
  Users,
  Settings,
  Eye,
  Copy,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  MoreHorizontal,
  Save,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

// Types for salary structure
interface SalaryComponent {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  category: 'fixed' | 'variable' | 'statutory';
  calculationType: 'fixed_amount' | 'percentage_of_basic' | 'percentage_of_gross' | 'formula';
  value: number;
  formula?: string;
  isActive: boolean;
  isTaxable: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface SalaryGrade {
  id: string;
  name: string;
  code: string;
  level: number;
  minSalary: number;
  maxSalary: number;
  midSalary: number;
  department?: string;
  description: string;
  components: string[]; // Array of component IDs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SalaryScale {
  id: string;
  name: string;
  grades: string[]; // Array of grade IDs
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface SalaryComponentFormData {
  name: string;
  type: 'earning' | 'deduction';
  category: 'fixed' | 'variable' | 'statutory';
  calculationType: 'fixed_amount' | 'percentage_of_basic' | 'percentage_of_gross' | 'formula';
  value: number;
  formula: string;
  isActive: boolean;
  isTaxable: boolean;
  description: string;
}

interface SalaryGradeFormData {
  name: string;
  code: string;
  level: number;
  minSalary: number;
  maxSalary: number;
  department: string;
  description: string;
  components: string[];
  isActive: boolean;
}

export default function SalaryStructure() {
  const { user, hasAnyRole } = useAuth();
  
  // Mock data for salary components
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponent[]>([
    {
      id: '1',
      name: 'Basic Salary',
      type: 'earning',
      category: 'fixed',
      calculationType: 'fixed_amount',
      value: 0,
      isActive: true,
      isTaxable: true,
      description: 'Base salary component for all employees',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'House Allowance',
      type: 'earning',
      category: 'fixed',
      calculationType: 'percentage_of_basic',
      value: 15,
      isActive: true,
      isTaxable: true,
      description: 'Monthly housing allowance',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Transport Allowance',
      type: 'earning',
      category: 'fixed',
      calculationType: 'fixed_amount',
      value: 15000,
      isActive: true,
      isTaxable: true,
      description: 'Monthly transport allowance',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '4',
      name: 'Medical Allowance',
      type: 'earning',
      category: 'fixed',
      calculationType: 'fixed_amount',
      value: 10000,
      isActive: true,
      isTaxable: false,
      description: 'Monthly medical allowance',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '5',
      name: 'Performance Bonus',
      type: 'earning',
      category: 'variable',
      calculationType: 'percentage_of_basic',
      value: 10,
      isActive: true,
      isTaxable: true,
      description: 'Quarterly performance-based bonus',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '6',
      name: 'PAYE Tax',
      type: 'deduction',
      category: 'statutory',
      calculationType: 'formula',
      value: 0,
      formula: 'calculatePAYE(grossSalary)',
      isActive: true,
      isTaxable: false,
      description: 'Pay As You Earn tax deduction',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '7',
      name: 'NHIF Contribution',
      type: 'deduction',
      category: 'statutory',
      calculationType: 'formula',
      value: 0,
      formula: 'calculateNHIF(grossSalary)',
      isActive: true,
      isTaxable: false,
      description: 'National Hospital Insurance Fund contribution',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '8',
      name: 'NSSF Contribution',
      type: 'deduction',
      category: 'statutory',
      calculationType: 'formula',
      value: 0,
      formula: 'calculateNSSF(grossSalary)',
      isActive: true,
      isTaxable: false,
      description: 'National Social Security Fund contribution',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }
  ]);

  // Mock data for salary grades
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([
    {
      id: '1',
      name: 'Junior Level',
      code: 'JL',
      level: 1,
      minSalary: 300000,
      maxSalary: 500000,
      midSalary: 400000,
      department: 'All',
      description: 'Entry level positions',
      components: ['1', '2', '3', '4', '6', '7', '8'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Senior Level',
      code: 'SL',
      level: 2,
      minSalary: 500000,
      maxSalary: 800000,
      midSalary: 650000,
      department: 'All',
      description: 'Senior level positions',
      components: ['1', '2', '3', '4', '5', '6', '7', '8'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Management Level',
      code: 'ML',
      level: 3,
      minSalary: 800000,
      maxSalary: 1500000,
      midSalary: 1150000,
      department: 'All',
      description: 'Management positions',
      components: ['1', '2', '3', '4', '5', '6', '7', '8'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }
  ]);

  // Mock data for salary scales
  const [salaryScales, setSalaryScales] = useState<SalaryScale[]>([
    {
      id: '1',
      name: 'Standard Salary Scale 2024',
      grades: ['1', '2', '3'],
      effectiveDate: '2024-01-01',
      isActive: true,
      description: 'Standard company salary scale for 2024',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }
  ]);

  // State management
  const [loading, setLoading] = useState(false);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
  const [editingGrade, setEditingGrade] = useState<SalaryGrade | null>(null);
  const [editingScale, setEditingScale] = useState<SalaryScale | null>(null);

  // Form state
  const [componentForm, setComponentForm] = useState<SalaryComponentFormData>({
    name: '',
    type: 'earning',
    category: 'fixed',
    calculationType: 'fixed_amount',
    value: 0,
    formula: '',
    isActive: true,
    isTaxable: true,
    description: ''
  });

  const [gradeForm, setGradeForm] = useState<SalaryGradeFormData>({
    name: '',
    code: '',
    level: 1,
    minSalary: 0,
    maxSalary: 0,
    department: '',
    description: '',
    components: [],
    isActive: true
  });

  // Helper functions
  const getComponentName = (id: string) => {
    const component = salaryComponents.find(c => c.id === id);
    return component ? component.name : 'Unknown Component';
  };

  const getGradeName = (id: string) => {
    const grade = salaryGrades.find(g => g.id === id);
    return grade ? grade.name : 'Unknown Grade';
  };

  const calculateGrossForGrade = (grade: SalaryGrade, baseSalary: number) => {
    let gross = baseSalary;
    
    grade.components.forEach(componentId => {
      const component = salaryComponents.find(c => c.id === componentId && c.type === 'earning');
      if (component) {
        switch (component.calculationType) {
          case 'fixed_amount':
            gross += component.value;
            break;
          case 'percentage_of_basic':
            gross += (baseSalary * component.value) / 100;
            break;
          case 'percentage_of_gross':
            // This would need iterative calculation in real implementation
            break;
        }
      }
    });
    
    return gross;
  };

  // Form handlers
  const handleComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingComponent) {
      // Update existing component
      setSalaryComponents(prev => prev.map(component => 
        component.id === editingComponent.id 
          ? {
              ...component,
              ...componentForm,
              updatedAt: new Date().toISOString()
            }
          : component
      ));
    } else {
      // Create new component
      const newComponent: SalaryComponent = {
        id: Date.now().toString(),
        ...componentForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSalaryComponents(prev => [...prev, newComponent]);
    }
    
    resetComponentForm();
    setIsComponentDialogOpen(false);
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const midSalary = (gradeForm.minSalary + gradeForm.maxSalary) / 2;
    
    if (editingGrade) {
      // Update existing grade
      setSalaryGrades(prev => prev.map(grade => 
        grade.id === editingGrade.id 
          ? {
              ...grade,
              ...gradeForm,
              midSalary,
              updatedAt: new Date().toISOString()
            }
          : grade
      ));
    } else {
      // Create new grade
      const newGrade: SalaryGrade = {
        id: Date.now().toString(),
        ...gradeForm,
        midSalary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSalaryGrades(prev => [...prev, newGrade]);
    }
    
    resetGradeForm();
    setIsGradeDialogOpen(false);
  };

  const resetComponentForm = () => {
    setComponentForm({
      name: '',
      type: 'earning',
      category: 'fixed',
      calculationType: 'fixed_amount',
      value: 0,
      formula: '',
      isActive: true,
      isTaxable: true,
      description: ''
    });
    setEditingComponent(null);
  };

  const resetGradeForm = () => {
    setGradeForm({
      name: '',
      code: '',
      level: 1,
      minSalary: 0,
      maxSalary: 0,
      department: '',
      description: '',
      components: [],
      isActive: true
    });
    setEditingGrade(null);
  };

  const handleEditComponent = (component: SalaryComponent) => {
    setEditingComponent(component);
    setComponentForm({
      name: component.name,
      type: component.type,
      category: component.category,
      calculationType: component.calculationType,
      value: component.value,
      formula: component.formula || '',
      isActive: component.isActive,
      isTaxable: component.isTaxable,
      description: component.description
    });
    setIsComponentDialogOpen(true);
  };

  const handleEditGrade = (grade: SalaryGrade) => {
    setEditingGrade(grade);
    setGradeForm({
      name: grade.name,
      code: grade.code,
      level: grade.level,
      minSalary: grade.minSalary,
      maxSalary: grade.maxSalary,
      department: grade.department || '',
      description: grade.description,
      components: grade.components,
      isActive: grade.isActive
    });
    setIsGradeDialogOpen(true);
  };

  const handleDeleteComponent = (id: string) => {
    if (confirm('Are you sure you want to delete this salary component?')) {
      setSalaryComponents(prev => prev.filter(component => component.id !== id));
    }
  };

  const handleDeleteGrade = (id: string) => {
    if (confirm('Are you sure you want to delete this salary grade?')) {
      setSalaryGrades(prev => prev.filter(grade => grade.id !== id));
    }
  };

  const exportSalaryStructure = () => {
    const data = {
      components: salaryComponents,
      grades: salaryGrades,
      scales: salaryScales,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-structure-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Check permissions
  const canManageSalaryStructure = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER]);

  if (!canManageSalaryStructure) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage salary structures.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/payroll">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payroll
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Structure</h1>
            <p className="text-gray-600">Define and manage salary components, grades, and scales</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" onClick={exportSalaryStructure}>
            <Download className="w-4 h-4 mr-2" />
            Export Structure
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Components</p>
                <p className="text-2xl font-bold">{salaryComponents.length}</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salary Grades</p>
                <p className="text-2xl font-bold">{salaryGrades.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Scales</p>
                <p className="text-2xl font-bold">{salaryScales.filter(s => s.isActive).length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Max Salary</p>
                <p className="text-lg font-bold">{formatKES(Math.max(...salaryGrades.map(g => g.maxSalary)))}</p>
              </div>
              <DollarSign className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="components" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="components">Salary Components</TabsTrigger>
          <TabsTrigger value="grades">Salary Grades</TabsTrigger>
          <TabsTrigger value="scales">Salary Scales</TabsTrigger>
        </TabsList>

        {/* Salary Components Tab */}
        <TabsContent value="components">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Salary Components
              </CardTitle>
              <Button onClick={() => setIsComponentDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Component
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Taxable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryComponents.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">{component.name}</TableCell>
                      <TableCell>
                        <Badge variant={component.type === 'earning' ? 'default' : 'destructive'}>
                          {component.type === 'earning' ? 'Earning' : 'Deduction'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {component.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {component.calculationType === 'fixed_amount' && 'Fixed Amount'}
                        {component.calculationType === 'percentage_of_basic' && '% of Basic'}
                        {component.calculationType === 'percentage_of_gross' && '% of Gross'}
                        {component.calculationType === 'formula' && 'Formula'}
                      </TableCell>
                      <TableCell>
                        {component.calculationType === 'fixed_amount' 
                          ? formatKES(component.value)
                          : component.calculationType === 'formula'
                          ? 'Custom'
                          : `${component.value}%`
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={component.isTaxable ? 'default' : 'secondary'}>
                          {component.isTaxable ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={component.isActive ? 'default' : 'secondary'}>
                          {component.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditComponent(component)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteComponent(component.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Grades Tab */}
        <TabsContent value="grades">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Salary Grades
              </CardTitle>
              <Button onClick={() => setIsGradeDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Grade
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Mid Point</TableHead>
                    <TableHead>Components</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{grade.name}</div>
                          <div className="text-sm text-gray-600">{grade.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {grade.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatKES(grade.minSalary)} - {formatKES(grade.maxSalary)}</div>
                          <div className="text-gray-600">Range: {formatKES(grade.maxSalary - grade.minSalary)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatKES(grade.midSalary)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {grade.components.length} components
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={grade.isActive ? 'default' : 'secondary'}>
                          {grade.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditGrade(grade)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteGrade(grade.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Scales Tab */}
        <TabsContent value="scales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Salary Scales
              </CardTitle>
              <Button onClick={() => setIsScaleDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Scale
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scale Name</TableHead>
                    <TableHead>Grades</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryScales.map((scale) => {
                    const scaleGrades = salaryGrades.filter(g => scale.grades.includes(g.id));
                    const minSalary = Math.min(...scaleGrades.map(g => g.minSalary));
                    const maxSalary = Math.max(...scaleGrades.map(g => g.maxSalary));
                    
                    return (
                      <TableRow key={scale.id}>
                        <TableCell className="font-medium">{scale.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {scale.grades.length} grades
                            <div className="text-gray-600">
                              {scaleGrades.map(g => g.name).join(', ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(scale.effectiveDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatKES(minSalary)} - {formatKES(maxSalary)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={scale.isActive ? 'default' : 'secondary'}>
                            {scale.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Component Dialog */}
      <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingComponent ? 'Edit Salary Component' : 'Add New Salary Component'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleComponentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="componentName">Component Name *</Label>
                <Input
                  id="componentName"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm({...componentForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="componentType">Type *</Label>
                <Select 
                  value={componentForm.type} 
                  onValueChange={(value: 'earning' | 'deduction') => setComponentForm({...componentForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Earning</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="componentCategory">Category *</Label>
                <Select 
                  value={componentForm.category} 
                  onValueChange={(value: 'fixed' | 'variable' | 'statutory') => setComponentForm({...componentForm, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                    <SelectItem value="statutory">Statutory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="calculationType">Calculation Type *</Label>
                <Select 
                  value={componentForm.calculationType} 
                  onValueChange={(value: any) => setComponentForm({...componentForm, calculationType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="percentage_of_basic">Percentage of Basic</SelectItem>
                    <SelectItem value="percentage_of_gross">Percentage of Gross</SelectItem>
                    <SelectItem value="formula">Custom Formula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {componentForm.calculationType !== 'formula' && (
                <div className="space-y-2">
                  <Label htmlFor="componentValue">
                    Value * ({componentForm.calculationType === 'fixed_amount' ? 'KES' : '%'})
                  </Label>
                  <Input
                    id="componentValue"
                    type="number"
                    value={componentForm.value}
                    onChange={(e) => setComponentForm({...componentForm, value: Number(e.target.value)})}
                    required
                  />
                </div>
              )}
              
              {componentForm.calculationType === 'formula' && (
                <div className="space-y-2">
                  <Label htmlFor="componentFormula">Formula *</Label>
                  <Input
                    id="componentFormula"
                    value={componentForm.formula}
                    onChange={(e) => setComponentForm({...componentForm, formula: e.target.value})}
                    placeholder="e.g., calculatePAYE(grossSalary)"
                    required
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="componentDescription">Description</Label>
              <Textarea
                id="componentDescription"
                value={componentForm.description}
                onChange={(e) => setComponentForm({...componentForm, description: e.target.value})}
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTaxable"
                  checked={componentForm.isTaxable}
                  onCheckedChange={(checked) => setComponentForm({...componentForm, isTaxable: checked})}
                />
                <Label htmlFor="isTaxable">Taxable</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={componentForm.isActive}
                  onCheckedChange={(checked) => setComponentForm({...componentForm, isActive: checked})}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsComponentDialogOpen(false);
                  resetComponentForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingComponent ? 'Update Component' : 'Create Component'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Grade Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? 'Edit Salary Grade' : 'Add New Salary Grade'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradeName">Grade Name *</Label>
                <Input
                  id="gradeName"
                  value={gradeForm.name}
                  onChange={(e) => setGradeForm({...gradeForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gradeCode">Grade Code *</Label>
                <Input
                  id="gradeCode"
                  value={gradeForm.code}
                  onChange={(e) => setGradeForm({...gradeForm, code: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Level *</Label>
                <Input
                  id="gradeLevel"
                  type="number"
                  value={gradeForm.level}
                  onChange={(e) => setGradeForm({...gradeForm, level: Number(e.target.value)})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gradeDepartment">Department</Label>
                <Select 
                  value={gradeForm.department} 
                  onValueChange={(value) => setGradeForm({...gradeForm, department: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minSalary">Minimum Salary (KES) *</Label>
                <Input
                  id="minSalary"
                  type="number"
                  value={gradeForm.minSalary}
                  onChange={(e) => setGradeForm({...gradeForm, minSalary: Number(e.target.value)})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxSalary">Maximum Salary (KES) *</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  value={gradeForm.maxSalary}
                  onChange={(e) => setGradeForm({...gradeForm, maxSalary: Number(e.target.value)})}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Salary Components</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {salaryComponents.map((component) => (
                  <div key={component.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`component-${component.id}`}
                      checked={gradeForm.components.includes(component.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGradeForm({
                            ...gradeForm,
                            components: [...gradeForm.components, component.id]
                          });
                        } else {
                          setGradeForm({
                            ...gradeForm,
                            components: gradeForm.components.filter(id => id !== component.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label 
                      htmlFor={`component-${component.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {component.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gradeDescription">Description</Label>
              <Textarea
                id="gradeDescription"
                value={gradeForm.description}
                onChange={(e) => setGradeForm({...gradeForm, description: e.target.value})}
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="gradeActive"
                checked={gradeForm.isActive}
                onCheckedChange={(checked) => setGradeForm({...gradeForm, isActive: checked})}
              />
              <Label htmlFor="gradeActive">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsGradeDialogOpen(false);
                  resetGradeForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingGrade ? 'Update Grade' : 'Create Grade'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
