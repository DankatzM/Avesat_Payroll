import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

// Kenya PAYE Tax Brackets 2024 (Annual amounts in KES)
interface TaxBracket {
  id: string;
  name: string;
  minIncome: number;
  maxIncome: number;
  rate: number;
  fixedAmount: number;
  isActive: boolean;
}

interface TaxCalculationStep {
  step: number;
  description: string;
  income: number;
  rate: number;
  taxAmount: number;
  cumulativeTax: number;
  bracket: TaxBracket;
}

interface PAYECalculationResult {
  grossIncome: number;
  taxableIncome: number;
  totalTax: number;
  personalRelief: number;
  netTax: number;
  effectiveRate: number;
  steps: TaxCalculationStep[];
}

export default function TaxManagement() {
  const { user, hasAnyRole } = useAuth();
  const [grossIncome, setGrossIncome] = useState<string>('');
  const [calculationResult, setCalculationResult] = useState<PAYECalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentCalculationStep, setCurrentCalculationStep] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  
  // Tax bracket management
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [editingBracket, setEditingBracket] = useState<TaxBracket | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Constants
  const PERSONAL_RELIEF = 28800; // Annual personal relief in KES

  useEffect(() => {
    // Initialize Kenya PAYE tax brackets for 2024
    const kenyaTaxBrackets: TaxBracket[] = [
      {
        id: '1',
        name: 'Band 1',
        minIncome: 0,
        maxIncome: 288000,
        rate: 10,
        fixedAmount: 0,
        isActive: true,
      },
      {
        id: '2',
        name: 'Band 2',
        minIncome: 288001,
        maxIncome: 388000,
        rate: 25,
        fixedAmount: 28800,
        isActive: true,
      },
      {
        id: '3',
        name: 'Band 3',
        minIncome: 388001,
        maxIncome: 6000000,
        rate: 30,
        fixedAmount: 53800,
        isActive: true,
      },
      {
        id: '4',
        name: 'Band 4',
        minIncome: 6000001,
        maxIncome: 9600000,
        rate: 32.5,
        fixedAmount: 1737400,
        isActive: true,
      },
      {
        id: '5',
        name: 'Band 5',
        minIncome: 9600001,
        maxIncome: Infinity,
        rate: 35,
        fixedAmount: 2907400,
        isActive: true,
      },
    ];
    setTaxBrackets(kenyaTaxBrackets);
  }, []);

  // Step-by-step PAYE calculation algorithm
  const calculatePAYETax = async (grossTaxableIncome: number): Promise<PAYECalculationResult> => {
    const steps: TaxCalculationStep[] = [];
    let taxDue = 0; // Step 3: Initialize tax_due = 0
    let stepCounter = 1;

    // Step 4 & 5: For each tax bracket, calculate and accumulate tax
    for (const bracket of taxBrackets.filter(b => b.isActive)) {
      setCurrentCalculationStep(stepCounter);
      await new Promise(resolve => setTimeout(resolve, 800)); // Visual delay

      if (grossTaxableIncome > bracket.minIncome) {
        // Calculate taxable income within this bracket
        const incomeInBracket = Math.min(
          grossTaxableIncome - bracket.minIncome,
          bracket.maxIncome - bracket.minIncome
        );

        if (incomeInBracket > 0) {
          const taxForBracket = (incomeInBracket * bracket.rate) / 100;
          taxDue += taxForBracket;

          steps.push({
            step: stepCounter,
            description: `Calculate tax for income in ${bracket.name} (${bracket.rate}% rate)`,
            income: incomeInBracket,
            rate: bracket.rate,
            taxAmount: taxForBracket,
            cumulativeTax: taxDue,
            bracket,
          });

          stepCounter++;
        }

        // If income is fully within this bracket, stop
        if (grossTaxableIncome <= bracket.maxIncome) {
          break;
        }
      }
    }

    // Apply personal relief
    const netTax = Math.max(0, taxDue - PERSONAL_RELIEF);
    const effectiveRate = grossTaxableIncome > 0 ? (netTax / grossTaxableIncome) * 100 : 0;

    return {
      grossIncome: grossTaxableIncome,
      taxableIncome: grossTaxableIncome,
      totalTax: taxDue,
      personalRelief: PERSONAL_RELIEF,
      netTax,
      effectiveRate,
      steps,
    };
  };

  const handleCalculate = async () => {
    const income = parseFloat(grossIncome);
    if (isNaN(income) || income < 0) {
      alert('Please enter a valid gross income amount');
      return;
    }

    setIsCalculating(true);
    setShowSteps(true);
    setCurrentCalculationStep(0);

    try {
      // Step 1: Input gross taxable income (already done)
      // Step 2: Retrieve current PAYE tax brackets (from state)
      
      const result = await calculatePAYETax(income);
      setCalculationResult(result);
    } catch (error) {
      console.error('Tax calculation failed:', error);
    } finally {
      setIsCalculating(false);
      setCurrentCalculationStep(0);
    }
  };

  const resetCalculation = () => {
    setCalculationResult(null);
    setShowSteps(false);
    setCurrentCalculationStep(0);
    setGrossIncome('');
  };

  const handleEditBracket = (bracket: TaxBracket) => {
    setEditingBracket(bracket);
    setIsEditDialogOpen(true);
  };

  const saveBracket = () => {
    if (!editingBracket) return;
    
    setTaxBrackets(prev => 
      prev.map(bracket => 
        bracket.id === editingBracket.id ? editingBracket : bracket
      )
    );
    setIsEditDialogOpen(false);
    setEditingBracket(null);
  };

  const canManageTax = hasAnyRole([UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kenya PAYE tax calculation and bracket management system
          </p>
        </div>
        <Button onClick={resetCalculation} variant="outline" className="mt-4 sm:mt-0">
          New Calculation
        </Button>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculator">PAYE Calculator</TabsTrigger>
          <TabsTrigger value="brackets">Tax Brackets</TabsTrigger>
          <TabsTrigger value="reports">Tax Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          {/* Algorithm Steps Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                PAYE Tax Calculation Algorithm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm">
                {[
                  'Input Income',
                  'Get Tax Brackets',
                  'Initialize Tax = 0',
                  'Calculate by Bracket',
                  'Accumulate Tax',
                  'Return Total Tax'
                ].map((step, index) => (
                  <div
                    key={index}
                    className={`text-center p-3 rounded-lg border ${
                      index + 1 <= currentCalculationStep || (!isCalculating && calculationResult)
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-lg">{index + 1}</div>
                    <div className="text-xs mt-1">{step}</div>
                  </div>
                ))}
              </div>
              {isCalculating && (
                <div className="mt-4">
                  <Progress value={(currentCalculationStep / 6) * 100} className="h-2" />
                  <p className="text-sm text-gray-600 mt-2">
                    Processing step {currentCalculationStep} of 6...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Step 1: Input Gross Taxable Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="grossIncome">Annual Gross Taxable Income (KES)</Label>
                  <Input
                    id="grossIncome"
                    type="number"
                    placeholder="1200000"
                    value={grossIncome}
                    onChange={(e) => setGrossIncome(e.target.value)}
                    className="text-lg"
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the annual gross taxable income in Kenyan Shillings
                  </p>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCalculate}
                    disabled={!grossIncome || isCalculating}
                    className="w-full sm:w-auto"
                  >
                    {isCalculating ? (
                      <>
                        <Calculator className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate PAYE Tax
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Steps */}
          {showSteps && calculationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Step-by-Step Tax Calculation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Initial Values */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Initial Setup</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Gross Income:</span>
                        <span className="font-medium ml-2">{formatKES(calculationResult.grossIncome)}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Tax Due Initialized:</span>
                        <span className="font-medium ml-2">KES 0</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Personal Relief:</span>
                        <span className="font-medium ml-2">{formatKES(PERSONAL_RELIEF)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculation Steps */}
                  <div className="space-y-3">
                    {calculationResult.steps.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium flex items-center">
                            <Badge variant="outline" className="mr-2">
                              Step {step.step}
                            </Badge>
                            {step.description}
                          </h5>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded">
                          <div>
                            <span className="text-gray-600">Income in bracket:</span>
                            <div className="font-medium">{formatKES(step.income)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Tax rate:</span>
                            <div className="font-medium">{step.rate}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Tax for bracket:</span>
                            <div className="font-medium text-red-600">{formatKES(step.taxAmount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cumulative tax:</span>
                            <div className="font-medium text-red-800">{formatKES(step.cumulativeTax)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Final Result */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-3">Final PAYE Tax Calculation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-green-700">Total Tax Due</div>
                        <div className="text-xl font-bold text-green-900">
                          {formatKES(calculationResult.totalTax)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-green-700">Personal Relief</div>
                        <div className="text-xl font-bold text-green-600">
                          -{formatKES(calculationResult.personalRelief)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-green-700">Net PAYE Tax</div>
                        <div className="text-xl font-bold text-green-900">
                          {formatKES(calculationResult.netTax)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-green-700">Effective Rate</div>
                        <div className="text-xl font-bold text-green-900">
                          {calculationResult.effectiveRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="brackets" className="space-y-6">
          {/* Current Tax Brackets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Kenya PAYE Tax Brackets 2024
                </div>
                {canManageTax && (
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bracket
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Band</TableHead>
                    <TableHead>Income Range (Annual)</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Fixed Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {canManageTax && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxBrackets.map((bracket) => (
                    <TableRow key={bracket.id}>
                      <TableCell className="font-medium">{bracket.name}</TableCell>
                      <TableCell>
                        {formatKES(bracket.minIncome)} - {' '}
                        {bracket.maxIncome === Infinity 
                          ? 'Above' 
                          : formatKES(bracket.maxIncome)
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bracket.rate}%</Badge>
                      </TableCell>
                      <TableCell>{formatKES(bracket.fixedAmount)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={bracket.isActive ? "default" : "secondary"}
                          className={bracket.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {bracket.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      {canManageTax && (
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditBracket(bracket)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tax Bracket Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Brackets</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {taxBrackets.filter(b => b.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently in use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Rate</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(...taxBrackets.filter(b => b.isActive).map(b => b.rate))}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum tax rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personal Relief</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatKES(PERSONAL_RELIEF)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Annual relief amount
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Tax Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tax reports coming soon</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate comprehensive tax reports and analytics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Tax Bracket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tax Bracket</DialogTitle>
          </DialogHeader>
          {editingBracket && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bracket Name</Label>
                <Input
                  value={editingBracket.name}
                  onChange={(e) => setEditingBracket({
                    ...editingBracket,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Income</Label>
                  <Input
                    type="number"
                    value={editingBracket.minIncome}
                    onChange={(e) => setEditingBracket({
                      ...editingBracket,
                      minIncome: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Income</Label>
                  <Input
                    type="number"
                    value={editingBracket.maxIncome === Infinity ? '' : editingBracket.maxIncome}
                    onChange={(e) => setEditingBracket({
                      ...editingBracket,
                      maxIncome: e.target.value ? Number(e.target.value) : Infinity
                    })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingBracket.rate}
                  onChange={(e) => setEditingBracket({
                    ...editingBracket,
                    rate: Number(e.target.value)
                  })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveBracket}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
