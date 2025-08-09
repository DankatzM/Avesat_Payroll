import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import TaxManagement from "./pages/TaxManagement";
import LeaveManagement from "./pages/LeaveManagement";
import Payslips from "./pages/Payslips";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import { AdminDashboard, HRDashboard, PayrollDashboard, ManagerDashboard, EmployeeDashboard } from "./pages/RoleDashboards";
import EmployeeDeductions from "./pages/EmployeeDeductions";
import Settings from "./pages/Settings";

// Dashboard Sub-modules
import Analytics from "./pages/dashboard/Analytics";

// Employee Sub-modules
import AddEmployee from "./pages/employees/AddEmployee";
import BulkImport from "./pages/employees/BulkImport";
import EmployeeList from "./pages/employees/EmployeeList";
import EmployeeProfile from "./pages/employees/EmployeeProfile";
import EmployeeReports from "./pages/employees/EmployeeReports";

// Payroll Sub-modules
import PayrollCalendar from "./pages/payroll/Calendar";
import SalaryStructure from "./pages/payroll/SalaryStructure";

// Tax Management Sub-modules
import TaxBrackets from "./pages/tax/TaxBrackets";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Layout>{children}</Layout>;
}

// Placeholder Component for unimplemented pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">
          This module is under development and will be available soon.
        </p>
        <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Main Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Dashboard Sub-modules */}
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/actions"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Quick Actions" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Notifications" />
                </ProtectedRoute>
              }
            />

            {/* Employee Management */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/add"
              element={
                <ProtectedRoute>
                  <AddEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/profile"
              element={
                <ProtectedRoute>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/import"
              element={
                <ProtectedRoute>
                  <BulkImport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/reports"
              element={
                <ProtectedRoute>
                  <EmployeeReports />
                </ProtectedRoute>
              }
            />

            {/* Payroll Management */}
            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/structure"
              element={
                <ProtectedRoute>
                  <SalaryStructure />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/calendar"
              element={
                <ProtectedRoute>
                  <PayrollCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/attendance"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Attendance Integration" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/history"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Payroll History" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/bulk"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Bulk Processing" />
                </ProtectedRoute>
              }
            />

            {/* Tax Management */}
            <Route
              path="/tax"
              element={
                <ProtectedRoute>
                  <TaxManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax/brackets"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Tax Brackets Management" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax/nhif"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="NHIF Management" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax/nssf"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="NSSF Management" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax/housing"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Housing Levy" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax/returns"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Tax Returns" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax/kra"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="KRA Integration" />
                </ProtectedRoute>
              }
            />

            {/* Employee Deductions */}
            <Route
              path="/deductions"
              element={
                <ProtectedRoute>
                  <EmployeeDeductions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/loans"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Loan Management" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/sacco"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="SACCO Deductions" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/court"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Court Orders" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/welfare"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Welfare Funds" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/history"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Deduction History" />
                </ProtectedRoute>
              }
            />

            {/* Leave Management */}
            <Route
              path="/leave"
              element={
                <ProtectedRoute>
                  <LeaveManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/approval"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Leave Approval" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/balance"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Leave Balance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/calendar"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Leave Calendar" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/types"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Leave Types" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/holidays"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Public Holidays" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/reports"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Leave Reports" />
                </ProtectedRoute>
              }
            />

            {/* Payslips */}
            <Route
              path="/payslips"
              element={
                <ProtectedRoute>
                  <Payslips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payslips/templates"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Payslip Templates" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payslips/bulk"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Bulk Generation" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payslips/email"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Email Distribution" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payslips/print"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Print Payslips" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payslips/history"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Payslip History" />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/statutory"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Statutory Reports" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financial"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Financial Reports" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/employees"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Employee Reports" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/custom"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Custom Reports" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/scheduler"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Report Scheduler" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/export"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Export Center" />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs */}
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit/users"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="User Activities" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit/data"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Data Changes" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit/security"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Security Events" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit/logins"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Login History" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit/compliance"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Compliance Reports" />
                </ProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/payroll"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Payroll Rules" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/statutory"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Statutory Rates" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/users"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="User Management" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/system"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="System Settings" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/integrations"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Integrations" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/backup"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Backup & Restore" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/help"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Help & Support" />
                </ProtectedRoute>
              }
            />

            {/* Role-based Dashboards */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr-dashboard"
              element={
                <ProtectedRoute>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll-dashboard"
              element={
                <ProtectedRoute>
                  <PayrollDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager-dashboard"
              element={
                <ProtectedRoute>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Standard React 18 root initialization
const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);
