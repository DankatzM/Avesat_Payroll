/**
 * Audit Logging Service - Kenya Payroll System
 * Implements 3-step audit logging algorithm:
 * Step 1: On every create/update/delete action, capture user ID and module
 * Step 2: Record action type, timestamp, record ID affected  
 * Step 3: Save audit entry in audit_log table for traceability
 */

import { AuditLog, AuditAction } from './api';

// Mock audit log storage (in production, this would be a database)
let auditLogs: AuditLog[] = [];

export interface AuditContext {
  userId: string;
  userAgent: string;
  ipAddress: string;
}

export interface AuditEntryData {
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

/**
 * Step 1: Capture user ID and module for audit logging
 * @param context - User context including ID, user agent, and IP
 * @param auditData - The audit entry data
 */
export function captureAuditContext(context: AuditContext, auditData: AuditEntryData): void {
  console.log(`[AUDIT STEP 1] Capturing audit context for user ${context.userId} in module ${auditData.entityType}`);
  
  // Step 2: Record action type, timestamp, record ID affected
  recordAuditAction(context, auditData);
}

/**
 * Step 2: Record action type, timestamp, record ID affected
 * @param context - User context
 * @param auditData - The audit entry data
 */
function recordAuditAction(context: AuditContext, auditData: AuditEntryData): void {
  const timestamp = new Date().toISOString();
  const auditId = generateAuditId();
  
  console.log(`[AUDIT STEP 2] Recording ${auditData.action} action on ${auditData.entityType} ID ${auditData.entityId} at ${timestamp}`);
  
  const auditEntry: AuditLog = {
    id: auditId,
    userId: context.userId,
    action: auditData.action,
    entityType: auditData.entityType,
    entityId: auditData.entityId,
    oldValues: auditData.oldValues,
    newValues: auditData.newValues,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    timestamp: timestamp
  };
  
  // Step 3: Save audit entry in audit_log table for traceability
  saveAuditEntry(auditEntry);
}

/**
 * Step 3: Save audit entry in audit_log table for traceability
 * @param auditEntry - Complete audit log entry
 */
function saveAuditEntry(auditEntry: AuditLog): void {
  console.log(`[AUDIT STEP 3] Saving audit entry ${auditEntry.id} to audit_log table`);
  
  // Save to mock storage (in production, this would be database)
  auditLogs.push(auditEntry);
  
  // Log successful save
  console.log(`[AUDIT SUCCESS] Audit entry saved: ${auditEntry.action} on ${auditEntry.entityType} by user ${auditEntry.userId}`);
}

/**
 * Convenience function to log employee actions
 */
export function logEmployeeAction(
  context: AuditContext,
  action: AuditAction,
  employeeId: string,
  oldValues?: any,
  newValues?: any
): void {
  captureAuditContext(context, {
    action,
    entityType: 'Employee',
    entityId: employeeId,
    oldValues,
    newValues
  });
}

/**
 * Convenience function to log payroll actions
 */
export function logPayrollAction(
  context: AuditContext,
  action: AuditAction,
  payrollId: string,
  oldValues?: any,
  newValues?: any
): void {
  captureAuditContext(context, {
    action,
    entityType: 'Payroll',
    entityId: payrollId,
    oldValues,
    newValues
  });
}

/**
 * Convenience function to log leave request actions
 */
export function logLeaveAction(
  context: AuditContext,
  action: AuditAction,
  leaveRequestId: string,
  oldValues?: any,
  newValues?: any
): void {
  captureAuditContext(context, {
    action,
    entityType: 'LeaveRequest',
    entityId: leaveRequestId,
    oldValues,
    newValues
  });
}

/**
 * Convenience function to log tax management actions
 */
export function logTaxAction(
  context: AuditContext,
  action: AuditAction,
  taxId: string,
  oldValues?: any,
  newValues?: any
): void {
  captureAuditContext(context, {
    action,
    entityType: 'TaxManagement',
    entityId: taxId,
    oldValues,
    newValues
  });
}

/**
 * Convenience function to log authentication actions
 */
export function logAuthAction(
  context: AuditContext,
  action: AuditAction.LOGIN | AuditAction.LOGOUT
): void {
  captureAuditContext(context, {
    action,
    entityType: 'Authentication',
    entityId: context.userId
  });
}

/**
 * Get all audit logs with optional filtering
 */
export function getAuditLogs(filters?: {
  userId?: string;
  entityType?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): AuditLog[] {
  let filteredLogs = [...auditLogs];
  
  if (filters) {
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    if (filters.entityType) {
      filteredLogs = filteredLogs.filter(log => log.entityType === filters.entityType);
    }
    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }
    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }
  }
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Apply pagination
  if (filters?.offset !== undefined || filters?.limit !== undefined) {
    const start = filters.offset || 0;
    const end = filters.limit ? start + filters.limit : undefined;
    filteredLogs = filteredLogs.slice(start, end);
  }
  
  return filteredLogs;
}

/**
 * Get audit logs count for dashboard
 */
export function getAuditLogsCount(filters?: {
  userId?: string;
  entityType?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
}): number {
  return getAuditLogs(filters).length;
}

/**
 * Generate unique audit ID
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize with some sample audit logs for demo
 */
export function initializeSampleAuditLogs(): void {
  const sampleLogs: AuditLog[] = [
    {
      id: 'audit_1702825200000_sample1',
      userId: 'user_admin',
      action: AuditAction.CREATE,
      entityType: 'Employee',
      entityId: 'emp_001',
      newValues: {
        firstName: 'John',
        lastName: 'Doe',
        position: 'Software Developer',
        department: 'IT',
        salary: 150000
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2023-12-17T10:00:00.000Z'
    },
    {
      id: 'audit_1702825260000_sample2',
      userId: 'user_hr_manager',
      action: AuditAction.APPROVE,
      entityType: 'LeaveRequest',
      entityId: 'leave_001',
      oldValues: { status: 'pending' },
      newValues: { status: 'approved', approvedBy: 'user_hr_manager' },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (macOS Intel Mac OS X 10_15_7)',
      timestamp: '2023-12-17T10:01:00.000Z'
    },
    {
      id: 'audit_1702825320000_sample3',
      userId: 'user_payroll_officer',
      action: AuditAction.CALCULATE,
      entityType: 'Payroll',
      entityId: 'payroll_202312',
      newValues: {
        totalGrossPay: 2500000,
        totalNetPay: 1950000,
        totalDeductions: 550000,
        employeeCount: 15
      },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2023-12-17T10:02:00.000Z'
    },
    {
      id: 'audit_1702825380000_sample4',
      userId: 'user_admin',
      action: AuditAction.UPDATE,
      entityType: 'Employee',
      entityId: 'emp_002',
      oldValues: { salary: 120000, position: 'Junior Developer' },
      newValues: { salary: 140000, position: 'Mid-Level Developer' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2023-12-17T10:03:00.000Z'
    },
    {
      id: 'audit_1702825440000_sample5',
      userId: 'user_hr_manager',
      action: AuditAction.EXPORT,
      entityType: 'Reports',
      entityId: 'report_payroll_summary_202312',
      newValues: {
        reportType: 'PAYROLL_SUMMARY',
        format: 'PDF',
        period: '2023-12'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (macOS Intel Mac OS X 10_15_7)',
      timestamp: '2023-12-17T10:04:00.000Z'
    }
  ];
  
  auditLogs.push(...sampleLogs);
  console.log(`[AUDIT INIT] Initialized with ${sampleLogs.length} sample audit logs`);
}

// Initialize sample data on module load
initializeSampleAuditLogs();
