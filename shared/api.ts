/**
 * Shared code between client and server
 * Payroll System API Types and Interfaces
 */

export interface DemoResponse {
  message: string;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  HR_MANAGER = 'hr_manager',
  PAYROLL_OFFICER = 'payroll_officer',
  EMPLOYEE = 'employee',
  MANAGER = 'manager'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Employee Types
export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  position: string;
  department: string;
  salary: number;
  payrollCategory: PayrollCategory;
  bankDetails: BankDetails;
  taxInformation: TaxInformation;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  sortCode: string;
  accountHolderName: string;
}

export interface TaxInformation {
  kraPin: string; // Kenya Revenue Authority PIN
  taxCode: string;
  nhifNumber?: string; // National Hospital Insurance Fund
  nssfNumber?: string; // National Social Security Fund
  pensionContribution: number;
}

export enum PayrollCategory {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  HOURLY = 'hourly'
}

// Payroll Types
export interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: PayrollStatus;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalTax: number;
  employeeCount: number;
  createdAt: string;
}

export enum PayrollStatus {
  DRAFT = 'draft',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  payrollPeriodId: string;
  basicSalary: number;
  overtime: number;
  allowances: number;
  grossPay: number;
  taxDeduction: number;
  pensionDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  hoursWorked: number;
  status: PayrollEntryStatus;
  createdAt: string;
}

export enum PayrollEntryStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  PAID = 'paid'
}

// Kenya PAYE Tax Types
export interface TaxBracket {
  id: string;
  name: string;
  minIncome: number; // Annual income in KES
  maxIncome: number; // Annual income in KES
  rate: number; // Tax rate percentage
  fixedAmount: number; // Fixed amount in KES
  personalRelief: number; // Personal relief in KES
  isActive: boolean;
}

export interface TaxCalculation {
  grossPay: number; // In KES
  taxableIncome: number; // In KES
  payeTax: number; // In KES
  personalRelief: number; // In KES
  netTax: number; // In KES after personal relief
  nhifDeduction: number; // In KES
  nssfDeduction: number; // In KES
  pensionContribution: number; // In KES
  effectiveRate: number;
  marginalRate: number;
  taxBracket: string;
}

// Leave Management Types
export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  COMPASSIONATE = 'compassionate',
  STUDY = 'study',
  UNPAID = 'unpaid',
  PUBLIC_HOLIDAY = 'public_holiday'
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: LeaveType;
  entitlement: number;
  used: number;
  remaining: number;
  carryForward: number;
}

// Payslip Types
export interface Payslip {
  id: string;
  employeeId: string;
  payrollPeriodId: string;
  employee: Pick<Employee, 'firstName' | 'lastName' | 'employeeNumber' | 'position' | 'department'>;
  payPeriod: {
    startDate: string;
    endDate: string;
    payDate: string;
  };
  earnings: PayslipEarnings;
  deductions: PayslipDeductions;
  totals: PayslipTotals;
  ytdTotals: PayslipYTDTotals;
  generatedAt: string;
}

export interface PayslipEarnings {
  basicSalary: number;
  overtime: number;
  allowances: number;
  bonus: number;
  commission: number;
  gross: number;
}

export interface PayslipDeductions {
  payeTax: number; // PAYE tax
  pension: number; // Pension contribution
  nhif: number; // National Hospital Insurance Fund
  nssf: number; // National Social Security Fund
  housing: number; // Housing levy (1.5% of gross salary)
  other: number;
  total: number;
}

export interface PayslipTotals {
  gross: number;
  deductions: number;
  net: number;
}

export interface PayslipYTDTotals {
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  payeTaxPaid: number;
  nhifPaid: number;
  nssfPaid: number;
  housingLevyPaid: number;
}

// Reporting Types
export interface PayrollReport {
  id: string;
  name: string;
  type: ReportType;
  parameters: Record<string, any>;
  generatedBy: string;
  generatedAt: string;
  data: any;
}

export enum ReportType {
  PAYROLL_SUMMARY = 'payroll_summary',
  PAYE_REPORT = 'paye_report', // For KRA submissions
  NHIF_REPORT = 'nhif_report',
  NSSF_REPORT = 'nssf_report',
  HOUSING_LEVY_REPORT = 'housing_levy_report',
  PENSION_REPORT = 'pension_report',
  LEAVE_REPORT = 'leave_report',
  EMPLOYEE_COST = 'employee_cost',
  DEPARTMENT_ANALYSIS = 'department_analysis',
  P9_FORM = 'p9_form', // Kenya tax deduction card
  P10_FORM = 'p10_form' // Kenya employer's return
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  CALCULATE = 'calculate',
  EXPORT = 'export'
}

// Dashboard Types
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  pendingPayrolls: number;
  pendingLeaveRequests: number;
  upcomingPayments: number;
  monthlyTaxLiability: number;
  pensionContributions: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
