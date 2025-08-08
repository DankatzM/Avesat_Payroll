import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  PieChart,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { reportsService, employeeService, payrollService, handleAPIError, LoadingManager } from '@shared/data-service';
import { formatKES } from '@shared/kenya-tax';

interface AnalyticsData {
  totalPayrollCost: number;
  payrollGrowth: number;
  activeEmployees: number;
  newHires: number;
  averageSalary: number;
  salaryGrowth: number;
  totalTaxDeductions: number;
  taxPercentage: number;
  departmentDistribution: { name: string; count: number; cost: number }[];
  payrollTrends: { month: string; amount: number; employees: number }[];
  topExpenses: { category: string; amount: number; percentage: number }[];
}

const Analytics: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      LoadingManager.start('analytics');
      setLoading(true);
      setError(null);

      // Fetch analytics data from multiple sources
      const [employees, payrollData, reports] = await Promise.all([
        employeeService.getEmployees(),
        payrollService.getPayrollPeriods(),
        reportsService.getReports('analytics')
      ]);

      // Calculate analytics metrics
      const activeEmployees = employees.filter(emp => emp.isActive).length;
      const totalSalaries = employees.reduce((sum, emp) => sum + emp.salary, 0);
      const averageSalary = totalSalaries / activeEmployees;

      // Mock data for demonstration (in production, this would come from the backend)
      const analyticsData: AnalyticsData = {
        totalPayrollCost: totalSalaries,
        payrollGrowth: 5.2,
        activeEmployees,
        newHires: 12,
        averageSalary,
        salaryGrowth: 3.1,
        totalTaxDeductions: totalSalaries * 0.225,
        taxPercentage: 22.5,
        departmentDistribution: [
          { name: 'IT', count: 45, cost: 6750000 },
          { name: 'Finance', count: 30, cost: 4200000 },
          { name: 'HR', count: 25, cost: 3125000 },
          { name: 'Sales', count: 50, cost: 5000000 },
          { name: 'Operations', count: 35, cost: 3500000 }
        ],
        payrollTrends: [
          { month: 'Oct 2023', amount: 11800000, employees: 180 },
          { month: 'Nov 2023', amount: 12100000, employees: 185 },
          { month: 'Dec 2023', amount: 12300000, employees: 190 },
          { month: 'Jan 2024', amount: 12400000, employees: 195 },
          { month: 'Feb 2024', amount: 12600000, employees: 200 },
          { month: 'Mar 2024', amount: 12800000, employees: 205 }
        ],
        topExpenses: [
          { category: 'Basic Salaries', amount: 18500000, percentage: 72.8 },
          { category: 'PAYE Tax', amount: 2800000, percentage: 11.0 },
          { category: 'Allowances', amount: 2200000, percentage: 8.7 },
          { category: 'NHIF', amount: 980000, percentage: 3.9 },
          { category: 'NSSF', amount: 520000, percentage: 2.0 },
          { category: 'Other Deductions', amount: 400000, percentage: 1.6 }
        ]
      };

      setData(analyticsData);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
      LoadingManager.stop('analytics');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportAnalytics = async () => {
    try {
      const blob = await reportsService.exportReport('analytics', 'excel');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(handleAPIError(err));
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button onClick={refreshData} variant="outline" size="sm" className="ml-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Analytics</h1>
          <p className="text-gray-600">Advanced insights and analytics for your payroll system</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payroll Cost</p>
                <p className="text-2xl font-bold text-green-600">{formatKES(data.totalPayrollCost)}</p>
                <div className="flex items-center mt-2">
                  {data.payrollGrowth > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${data.payrollGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(data.payrollGrowth)}% from last period
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-blue-600">{data.activeEmployees}</p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+{data.newHires} new hires</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Salary</p>
                <p className="text-2xl font-bold text-purple-600">{formatKES(data.averageSalary)}</p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+{data.salaryGrowth}% growth</span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tax Deductions</p>
                <p className="text-2xl font-bold text-red-600">{formatKES(data.totalTaxDeductions)}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-600">{data.taxPercentage}% of total payroll</span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Payroll Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.payrollTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{trend.month}</p>
                    <p className="text-sm text-gray-600">{trend.employees} employees</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatKES(trend.amount)}</p>
                    {index > 0 && (
                      <div className="flex items-center justify-end">
                        {trend.amount > data.payrollTrends[index - 1].amount ? (
                          <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <span className="text-xs text-gray-500">
                          {((trend.amount / data.payrollTrends[index - 1].amount - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.departmentDistribution.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dept.name}</span>
                    <div className="text-right">
                      <p className="font-bold">{formatKES(dept.cost)}</p>
                      <p className="text-sm text-gray-600">{dept.count} employees</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(dept.cost / Math.max(...data.departmentDistribution.map(d => d.cost))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Expenses Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topExpenses.map((expense, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{expense.category}</h4>
                  <Badge variant="outline">{expense.percentage}%</Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatKES(expense.amount)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${expense.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <CheckCircle className="w-5 h-5 mb-1" />
              Process Payroll
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <FileText className="w-5 h-5 mb-1" />
              Generate Reports
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <Clock className="w-5 h-5 mb-1" />
              Review Pending
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <Download className="w-5 h-5 mb-1" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
