import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { DashboardStats, RecentActivity, UserRole } from '@shared/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, hasAnyRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for demonstration
      setStats({
        totalEmployees: 247,
        activeEmployees: 238,
        totalPayroll: 1250000,
        pendingPayrolls: 3,
        pendingLeaveRequests: 12,
        upcomingPayments: 8,
        monthlyTaxLiability: 275000,
        pensionContributions: 95000,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'payroll',
          description: 'Payroll for March 2024 has been processed',
          timestamp: '2024-03-15T10:30:00Z',
          user: 'Sarah Johnson',
        },
        {
          id: '2',
          type: 'employee',
          description: 'New employee John Doe has been registered',
          timestamp: '2024-03-15T09:15:00Z',
          user: 'Mike Chen',
        },
        {
          id: '3',
          type: 'leave',
          description: 'Leave request approved for Emily Davis',
          timestamp: '2024-03-15T08:45:00Z',
          user: 'Sarah Johnson',
        },
        {
          id: '4',
          type: 'tax',
          description: 'PAYE tax calculation completed for Q1 2024',
          timestamp: '2024-03-14T16:20:00Z',
          user: 'David Wilson',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payroll':
        return <DollarSign className="h-4 w-4" />;
      case 'employee':
        return <Users className="h-4 w-4" />;
      case 'leave':
        return <Calendar className="h-4 w-4" />;
      case 'tax':
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's an overview of your payroll system
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Calendar className="mr-2 h-4 w-4" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.totalEmployees - stats?.activeEmployees}</span> inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalPayroll || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">
              Leave requests awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Liability</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyTaxLiability || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly PAYE obligation
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]) && (
              <Link to="/employees" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Employees
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            )}
            
            {hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]) && (
              <Link to="/payroll" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Process Payroll
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            )}

            <Link to="/leave" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Leave Management
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>

            <Link to="/payslips" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View Payslips
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>

            {hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER]) && (
              <Link to="/reports" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Reports
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.user} • {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link to="/audit" className="text-sm text-indigo-600 hover:text-indigo-800">
                View all activity →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Status Overview */}
      {hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER]) && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Period</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Processed
                  </Badge>
                </div>
                <Progress value={100} className="h-2" />
                <p className="text-xs text-gray-600">March 1-15, 2024</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Period</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                </div>
                <Progress value={65} className="h-2" />
                <p className="text-xs text-gray-600">March 16-31, 2024</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tax Compliance</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Building2 className="mr-1 h-3 w-3" />
                    Up to date
                  </Badge>
                </div>
                <Progress value={100} className="h-2" />
                <p className="text-xs text-gray-600">All submissions current</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
