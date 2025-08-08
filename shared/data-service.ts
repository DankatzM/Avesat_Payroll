/**
 * Centralized Data Management Service
 * Production-ready data layer with caching, validation, and error handling
 */

import { Employee, PayrollPeriod, PayrollEntry, LeaveRequest, TaxBracket, UserRole } from './api';

// Base API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8080/api';

// Cache Management
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  invalidate(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

const cache = new CacheManager();

// API Error Handler
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Base API Service
class BaseAPIService {
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Network error or server unavailable', 0);
    }
  }

  protected getCached<T>(key: string): T | null {
    return cache.get(key);
  }

  protected setCached<T>(key: string, data: T, ttl?: number): void {
    cache.set(key, data, ttl);
  }

  protected invalidateCache(pattern?: string): void {
    cache.invalidate(pattern);
  }
}

// Employee Service
export class EmployeeService extends BaseAPIService {
  async getEmployees(): Promise<Employee[]> {
    const cacheKey = 'employees:all';
    const cached = this.getCached<Employee[]>(cacheKey);
    if (cached) return cached;

    const employees = await this.request<Employee[]>('/employees');
    this.setCached(cacheKey, employees);
    return employees;
  }

  async getEmployee(id: string): Promise<Employee> {
    const cacheKey = `employee:${id}`;
    const cached = this.getCached<Employee>(cacheKey);
    if (cached) return cached;

    const employee = await this.request<Employee>(`/employees/${id}`);
    this.setCached(cacheKey, employee);
    return employee;
  }

  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const newEmployee = await this.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
    
    this.invalidateCache('employees');
    return newEmployee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const updatedEmployee = await this.request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    this.invalidateCache('employee');
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.request(`/employees/${id}`, { method: 'DELETE' });
    this.invalidateCache('employee');
  }

  async bulkImport(employees: any[]): Promise<{ success: number; errors: any[] }> {
    return await this.request('/employees/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ employees }),
    });
  }

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    const cacheKey = `employees:department:${department}`;
    const cached = this.getCached<Employee[]>(cacheKey);
    if (cached) return cached;

    const employees = await this.request<Employee[]>(`/employees?department=${department}`);
    this.setCached(cacheKey, employees, 60000); // 1 minute cache
    return employees;
  }
}

// Payroll Service
export class PayrollService extends BaseAPIService {
  async getPayrollPeriods(): Promise<PayrollPeriod[]> {
    const cacheKey = 'payroll:periods';
    const cached = this.getCached<PayrollPeriod[]>(cacheKey);
    if (cached) return cached;

    const periods = await this.request<PayrollPeriod[]>('/payroll/periods');
    this.setCached(cacheKey, periods);
    return periods;
  }

  async processPayroll(periodId: string, employeeIds?: string[]): Promise<PayrollEntry[]> {
    const result = await this.request<PayrollEntry[]>('/payroll/process', {
      method: 'POST',
      body: JSON.stringify({ periodId, employeeIds }),
    });
    
    this.invalidateCache('payroll');
    return result;
  }

  async getPayrollEntries(periodId: string): Promise<PayrollEntry[]> {
    const cacheKey = `payroll:entries:${periodId}`;
    const cached = this.getCached<PayrollEntry[]>(cacheKey);
    if (cached) return cached;

    const entries = await this.request<PayrollEntry[]>(`/payroll/entries/${periodId}`);
    this.setCached(cacheKey, entries);
    return entries;
  }

  async approvePayroll(periodId: string): Promise<void> {
    await this.request(`/payroll/approve/${periodId}`, { method: 'POST' });
    this.invalidateCache('payroll');
  }

  async generatePayslips(periodId: string): Promise<void> {
    await this.request(`/payroll/payslips/${periodId}`, { method: 'POST' });
    this.invalidateCache('payslips');
  }
}

// Leave Service
export class LeaveService extends BaseAPIService {
  async getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
    const cacheKey = employeeId ? `leave:employee:${employeeId}` : 'leave:all';
    const cached = this.getCached<LeaveRequest[]>(cacheKey);
    if (cached) return cached;

    const url = employeeId ? `/leave/requests?employeeId=${employeeId}` : '/leave/requests';
    const requests = await this.request<LeaveRequest[]>(url);
    this.setCached(cacheKey, requests);
    return requests;
  }

  async submitLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>): Promise<LeaveRequest> {
    const newRequest = await this.request<LeaveRequest>('/leave/requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    this.invalidateCache('leave');
    return newRequest;
  }

  async approveLeave(requestId: string): Promise<void> {
    await this.request(`/leave/approve/${requestId}`, { method: 'POST' });
    this.invalidateCache('leave');
  }

  async rejectLeave(requestId: string, reason: string): Promise<void> {
    await this.request(`/leave/reject/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    this.invalidateCache('leave');
  }

  async getLeaveBalance(employeeId: string): Promise<any> {
    const cacheKey = `leave:balance:${employeeId}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const balance = await this.request<any>(`/leave/balance/${employeeId}`);
    this.setCached(cacheKey, balance, 300000); // 5 minutes
    return balance;
  }
}

// Tax Service
export class TaxService extends BaseAPIService {
  async getTaxBrackets(): Promise<TaxBracket[]> {
    const cacheKey = 'tax:brackets';
    const cached = this.getCached<TaxBracket[]>(cacheKey);
    if (cached) return cached;

    const brackets = await this.request<TaxBracket[]>('/tax/brackets');
    this.setCached(cacheKey, brackets, 3600000); // 1 hour
    return brackets;
  }

  async calculateTax(grossSalary: number, reliefs: any): Promise<any> {
    return await this.request('/tax/calculate', {
      method: 'POST',
      body: JSON.stringify({ grossSalary, reliefs }),
    });
  }

  async generateTaxReports(year: number, month?: number): Promise<any> {
    const params = month ? `?year=${year}&month=${month}` : `?year=${year}`;
    return await this.request(`/tax/reports${params}`);
  }

  async submitToKRA(data: any): Promise<any> {
    return await this.request('/tax/kra-submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Reports Service
export class ReportsService extends BaseAPIService {
  async getReports(type?: string): Promise<any[]> {
    const cacheKey = type ? `reports:${type}` : 'reports:all';
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    const url = type ? `/reports?type=${type}` : '/reports';
    const reports = await this.request<any[]>(url);
    this.setCached(cacheKey, reports, 600000); // 10 minutes
    return reports;
  }

  async generateReport(config: any): Promise<any> {
    return await this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/export?format=${format}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new APIError('Export failed', response.status);
    }
    
    return await response.blob();
  }
}

// Settings Service
export class SettingsService extends BaseAPIService {
  async getSettings(category?: string): Promise<any> {
    const cacheKey = category ? `settings:${category}` : 'settings:all';
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const url = category ? `/settings/${category}` : '/settings';
    const settings = await this.request<any>(url);
    this.setCached(cacheKey, settings, 3600000); // 1 hour
    return settings;
  }

  async updateSettings(category: string, settings: any): Promise<any> {
    const updatedSettings = await this.request(`/settings/${category}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    
    this.invalidateCache('settings');
    return updatedSettings;
  }

  async testIntegration(system: string, config: any): Promise<any> {
    return await this.request('/settings/test-integration', {
      method: 'POST',
      body: JSON.stringify({ system, config }),
    });
  }

  async backup(): Promise<any> {
    return await this.request('/settings/backup', { method: 'POST' });
  }

  async restore(backupData: any): Promise<any> {
    return await this.request('/settings/restore', {
      method: 'POST',
      body: JSON.stringify(backupData),
    });
  }
}

// Audit Service
export class AuditService extends BaseAPIService {
  async getAuditLogs(filters?: any): Promise<any[]> {
    const cacheKey = `audit:logs:${JSON.stringify(filters || {})}`;
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams(filters || {});
    const logs = await this.request<any[]>(`/audit/logs?${params}`);
    this.setCached(cacheKey, logs, 300000); // 5 minutes
    return logs;
  }

  async exportAuditLogs(filters?: any): Promise<Blob> {
    const params = new URLSearchParams(filters || {});
    const response = await fetch(`${API_BASE_URL}/audit/export?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new APIError('Export failed', response.status);
    }
    
    return await response.blob();
  }
}

// Export service instances
export const employeeService = new EmployeeService();
export const payrollService = new PayrollService();
export const leaveService = new LeaveService();
export const taxService = new TaxService();
export const reportsService = new ReportsService();
export const settingsService = new SettingsService();
export const auditService = new AuditService();

// Error handling utility
export const handleAPIError = (error: unknown): string => {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return error.details?.message || 'Validation error occurred.';
      case 500:
        return 'Server error occurred. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred.';
};

// Loading state manager
export class LoadingManager {
  private static loading = new Set<string>();
  
  static start(key: string) {
    this.loading.add(key);
  }
  
  static stop(key: string) {
    this.loading.delete(key);
  }
  
  static isLoading(key: string): boolean {
    return this.loading.has(key);
  }
  
  static getAll(): string[] {
    return Array.from(this.loading);
  }
}
