import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calculator,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  Home,
  Shield,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Building2,
  UserPlus,
  UserCheck,
  Edit,
  Eye,
  Trash2,
  CreditCard,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  Database,
  Bell,
  Lock,
  Key,
  Percent,
  Coins,
  PiggyBank,
  Plane,
  Heart,
  Baby,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Download,
  Upload,
  Mail,
  Printer,
  Share,
  Filter,
  Search,
  RefreshCw,
  Zap,
  Globe,
  Plug,
  Archive,
  BookOpen,
  HelpCircle,
  Info
} from 'lucide-react';
import { UserRole } from '@shared/api';

interface SubModule {
  name: string;
  href: string;
  icon: any;
  description?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: UserRole[];
  subModules?: SubModule[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    roles: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER, UserRole.EMPLOYEE],
    subModules: [
      { name: 'Overview', href: '/', icon: TrendingUp, description: 'System overview and KPIs' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, description: 'Advanced analytics and insights' },
      { name: 'Quick Actions', href: '/dashboard/actions', icon: Zap, description: 'Common payroll actions' },
      { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, description: 'System notifications and alerts' }
    ]
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER],
    subModules: [
      { name: 'Employee List', href: '/employees', icon: Users, description: 'View and manage all employees' },
      { name: 'Add Employee', href: '/employees/add', icon: UserPlus, description: 'Register new employee' },
      { name: 'Employee Profile', href: '/employees/profile', icon: UserCheck, description: 'Detailed employee information' },
      { name: 'Bulk Import', href: '/employees/import', icon: Upload, description: 'Import employees from file' },
      { name: 'Employee Reports', href: '/employees/reports', icon: FileText, description: 'Employee-related reports' }
    ]
  },
  {
    name: 'Payroll',
    href: '/payroll',
    icon: DollarSign,
    roles: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER],
    subModules: [
      { name: 'Payroll Processing', href: '/payroll', icon: Calculator, description: 'Process monthly payroll' },
      { name: 'Salary Structure', href: '/payroll/structure', icon: Building2, description: 'Define salary components' },
      { name: 'Payroll Calendar', href: '/payroll/calendar', icon: Calendar, description: 'Payroll schedule and dates' },
      { name: 'Attendance Integration', href: '/payroll/attendance', icon: Clock, description: 'Link attendance to payroll' },
      { name: 'Payroll History', href: '/payroll/history', icon: History, description: 'Previous payroll runs' },
      { name: 'Bulk Processing', href: '/payroll/bulk', icon: RefreshCw, description: 'Process multiple employees' }
    ]
  },
  {
    name: 'Tax Management',
    href: '/tax',
    icon: Calculator,
    roles: [UserRole.ADMIN, UserRole.PAYROLL_OFFICER],
    subModules: [
      { name: 'PAYE Calculation', href: '/tax', icon: Percent, description: 'Calculate PAYE tax' },
      { name: 'Tax Brackets', href: '/tax/brackets', icon: Calculator, description: 'Manage KRA tax brackets' },
      { name: 'SHIF Management', href: '/tax/shif', icon: Heart, description: 'SHIF contributions and bands' },
      { name: 'NSSF Management', href: '/tax/nssf', icon: PiggyBank, description: 'NSSF pension contributions' },
      { name: 'Housing Levy', href: '/tax/housing', icon: Building2, description: 'Housing development levy' },
      { name: 'Tax Returns', href: '/tax/returns', icon: FileText, description: 'Generate tax return forms' },
      { name: 'KRA Integration', href: '/tax/kra', icon: Globe, description: 'KRA iTax integration' }
    ]
  },
  {
    name: 'Employee Deductions',
    href: '/deductions',
    icon: ClipboardList,
    roles: [UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.HR_MANAGER],
    subModules: [
      { name: 'Deduction Management', href: '/deductions', icon: ClipboardList, description: 'Manage employee deductions' },
      { name: 'Loan Management', href: '/deductions/loans', icon: CreditCard, description: 'Staff loans and recovery' },
      { name: 'SACCO Deductions', href: '/deductions/sacco', icon: Coins, description: 'SACCO savings and loans' },
      { name: 'Court Orders', href: '/deductions/court', icon: Shield, description: 'Court-ordered deductions' },
      { name: 'Welfare Funds', href: '/deductions/welfare', icon: Heart, description: 'Employee welfare contributions' },
      { name: 'Deduction History', href: '/deductions/history', icon: History, description: 'Historical deduction records' }
    ]
  },
  {
    name: 'Leave Management',
    href: '/leave',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.EMPLOYEE],
    subModules: [
      { name: 'Leave Requests', href: '/leave', icon: Calendar, description: 'Submit and manage leave requests' },
      { name: 'Leave Approval', href: '/leave/approval', icon: CheckCircle, description: 'Approve/reject leave requests' },
      { name: 'Leave Balance', href: '/leave/balance', icon: Clock, description: 'View leave balances' },
      { name: 'Leave Calendar', href: '/leave/calendar', icon: Calendar, description: 'Organization leave calendar' },
      { name: 'Leave Types', href: '/leave/types', icon: ClipboardList, description: 'Configure leave types' },
      { name: 'Public Holidays', href: '/leave/holidays', icon: Plane, description: 'Manage public holidays' },
      { name: 'Leave Reports', href: '/leave/reports', icon: FileText, description: 'Leave analytics and reports' }
    ]
  },
  {
    name: 'Payslips',
    href: '/payslips',
    icon: FileText,
    roles: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.EMPLOYEE],
    subModules: [
      { name: 'Generate Payslips', href: '/payslips', icon: FileText, description: 'Create monthly payslips' },
      { name: 'Payslip Templates', href: '/payslips/templates', icon: Edit, description: 'Customize payslip design' },
      { name: 'Bulk Generation', href: '/payslips/bulk', icon: RefreshCw, description: 'Generate multiple payslips' },
      { name: 'Email Distribution', href: '/payslips/email', icon: Mail, description: 'Send payslips via email' },
      { name: 'Print Payslips', href: '/payslips/print', icon: Printer, description: 'Print physical payslips' },
      { name: 'Payslip History', href: '/payslips/history', icon: Archive, description: 'View previous payslips' }
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_OFFICER, UserRole.MANAGER],
    subModules: [
      { name: 'Payroll Reports', href: '/reports', icon: BarChart3, description: 'Comprehensive payroll reports' },
      { name: 'Statutory Reports', href: '/reports/statutory', icon: Shield, description: 'KRA, NHIF, NSSF reports' },
      { name: 'Financial Reports', href: '/reports/financial', icon: DollarSign, description: 'Financial analysis reports' },
      { name: 'Employee Reports', href: '/reports/employees', icon: Users, description: 'Employee-centric reports' },
      { name: 'Custom Reports', href: '/reports/custom', icon: Filter, description: 'Build custom reports' },
      { name: 'Report Scheduler', href: '/reports/scheduler', icon: Clock, description: 'Schedule automated reports' },
      { name: 'Export Center', href: '/reports/export', icon: Download, description: 'Export reports in various formats' }
    ]
  },
  {
    name: 'Audit Logs',
    href: '/audit',
    icon: Shield,
    roles: [UserRole.ADMIN],
    subModules: [
      { name: 'System Audit', href: '/audit', icon: Shield, description: 'System-wide audit trail' },
      { name: 'User Activities', href: '/audit/users', icon: Users, description: 'User action logs' },
      { name: 'Data Changes', href: '/audit/data', icon: Database, description: 'Data modification logs' },
      { name: 'Security Events', href: '/audit/security', icon: Lock, description: 'Security-related events' },
      { name: 'Login History', href: '/audit/logins', icon: Key, description: 'User login/logout history' },
      { name: 'Compliance Reports', href: '/audit/compliance', icon: FileText, description: 'Compliance audit reports' }
    ]
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.HR_MANAGER],
    subModules: [
      { name: 'Organization', href: '/settings', icon: Building2, description: 'Company profile and details' },
      { name: 'Payroll Rules', href: '/settings/payroll', icon: Calculator, description: 'Payroll processing rules' },
      { name: 'Statutory Rates', href: '/settings/statutory', icon: Shield, description: 'Tax and statutory rates' },
      { name: 'User Management', href: '/settings/users', icon: Users, description: 'Manage user accounts' },
      { name: 'System Settings', href: '/settings/system', icon: Settings, description: 'System configuration' },
      { name: 'Integrations', href: '/settings/integrations', icon: Plug, description: 'Third-party integrations' },
      { name: 'Backup & Restore', href: '/settings/backup', icon: Archive, description: 'Data backup and recovery' },
      { name: 'Help & Support', href: '/settings/help', icon: HelpCircle, description: 'Documentation and support' }
    ]
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, hasAnyRole } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const filteredNavigation = navigationItems.filter(item =>
    hasAnyRole(item.roles)
  );

  const handleLogout = () => {
    logout();
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isModuleExpanded = (moduleName: string) => {
    return expandedModules.includes(moduleName);
  };

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleName) 
        ? prev.filter(name => name !== moduleName)
        : [...prev, moduleName]
    );
  };

  // Auto-expand module if current route is in its sub-modules
  useEffect(() => {
    filteredNavigation.forEach(item => {
      if (item.subModules) {
        const hasActiveSubModule = item.subModules.some(sub => 
          sub.href !== '/' && location.pathname.startsWith(sub.href)
        );
        if (hasActiveSubModule && !expandedModules.includes(item.name)) {
          setExpandedModules(prev => [...prev, item.name]);
        }
      }
    });
  }, [location.pathname, filteredNavigation]);

  const NavigationItems = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="space-y-1">
      {filteredNavigation.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveRoute(item.href);
        const isExpanded = isModuleExpanded(item.name);
        const hasSubModules = item.subModules && item.subModules.length > 0;
        
        return (
          <div key={item.name}>
            {/* Main Module */}
            <div className="flex items-center">
              <Link
                to={item.href}
                onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
                className={`flex items-center flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
              
              {/* Expand/Collapse Button */}
              {hasSubModules && (
                <button
                  onClick={() => toggleModule(item.name)}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                    isActive ? 'text-indigo-700' : 'text-gray-400'
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {/* Sub-modules */}
            {hasSubModules && isExpanded && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                {item.subModules!.map((subModule) => {
                  const SubIcon = subModule.icon;
                  const isSubActive = location.pathname === subModule.href || 
                    (subModule.href !== '/' && location.pathname.startsWith(subModule.href));
                  
                  return (
                    <Link
                      key={subModule.name}
                      to={subModule.href}
                      onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors group ${
                        isSubActive
                          ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                      title={subModule.description}
                    >
                      <SubIcon className="mr-3 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{subModule.name}</div>
                        {subModule.description && (
                          <div className="text-xs text-gray-400 group-hover:text-gray-500">
                            {subModule.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0 z-50">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">PayrollKE</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex-1 px-4 pb-4">
            <NavigationItems />
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">PayrollKE</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <Menu className="h-6 w-6 text-white" />
                </button>
              </div>
              
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="px-4">
                  <NavigationItems mobile />
                </nav>
              </div>
              
              {/* Mobile User Profile */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-auto p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="md:pl-80">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
