/**
 * Enhanced Authentication Service - Kenya Payroll System
 * Implements 5-step authentication algorithm:
 * Step 1: User enters username and password
 * Step 2: Hash input password and compare with stored hash in database
 * Step 3: If match, fetch user role and permissions
 * Step 4: Redirect user to appropriate dashboard (Admin, HR, Employee)
 * Step 5: Log login timestamp and IP address in audit trail
 */

import { User, UserRole } from './api';

// Password hashing utility (in production, use bcrypt)
export function hashPassword(password: string): string {
  // Simple hash for demo (use bcrypt in production)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

// User database with hashed passwords
const userDatabase: Array<User & { passwordHash: string }> = [
  {
    id: '1',
    email: 'admin@payrollke.co.ke',
    firstName: 'James',
    lastName: 'Mwangi',
    role: UserRole.ADMIN,
    department: 'IT',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    passwordHash: hashPassword('admin123')
  },
  {
    id: '2',
    email: 'hr@payrollke.co.ke',
    firstName: 'Grace',
    lastName: 'Wanjiku',
    role: UserRole.HR_MANAGER,
    department: 'Human Resources',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    passwordHash: hashPassword('hr123')
  },
  {
    id: '3',
    email: 'payroll@payrollke.co.ke',
    firstName: 'Peter',
    lastName: 'Kiprotich',
    role: UserRole.PAYROLL_OFFICER,
    department: 'Finance',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    passwordHash: hashPassword('payroll123')
  },
  {
    id: '4',
    email: 'employee@payrollke.co.ke',
    firstName: 'Mary',
    lastName: 'Achieng',
    role: UserRole.EMPLOYEE,
    department: 'Sales',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    passwordHash: hashPassword('emp123')
  },
  {
    id: '5',
    email: 'manager@payrollke.co.ke',
    firstName: 'Samuel',
    lastName: 'Otieno',
    role: UserRole.MANAGER,
    department: 'Marketing',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    passwordHash: hashPassword('manager123')
  }
];

// Role-based permissions
export interface UserPermissions {
  canViewEmployees: boolean;
  canEditEmployees: boolean;
  canDeleteEmployees: boolean;
  canProcessPayroll: boolean;
  canApproveLeave: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
  canManageTax: boolean;
}

export function getUserPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canViewEmployees: true,
        canEditEmployees: true,
        canDeleteEmployees: true,
        canProcessPayroll: true,
        canApproveLeave: true,
        canViewReports: true,
        canExportReports: true,
        canViewAuditLogs: true,
        canManageUsers: true,
        canManageTax: true,
      };
    case UserRole.HR_MANAGER:
      return {
        canViewEmployees: true,
        canEditEmployees: true,
        canDeleteEmployees: true,
        canProcessPayroll: false,
        canApproveLeave: true,
        canViewReports: true,
        canExportReports: true,
        canViewAuditLogs: true,
        canManageUsers: false,
        canManageTax: false,
      };
    case UserRole.PAYROLL_OFFICER:
      return {
        canViewEmployees: true,
        canEditEmployees: false,
        canDeleteEmployees: false,
        canProcessPayroll: true,
        canApproveLeave: false,
        canViewReports: true,
        canExportReports: true,
        canViewAuditLogs: false,
        canManageUsers: false,
        canManageTax: true,
      };
    case UserRole.MANAGER:
      return {
        canViewEmployees: true,
        canEditEmployees: false,
        canDeleteEmployees: false,
        canProcessPayroll: false,
        canApproveLeave: true,
        canViewReports: false,
        canExportReports: false,
        canViewAuditLogs: false,
        canManageUsers: false,
        canManageTax: false,
      };
    case UserRole.EMPLOYEE:
      return {
        canViewEmployees: false,
        canEditEmployees: false,
        canDeleteEmployees: false,
        canProcessPayroll: false,
        canApproveLeave: false,
        canViewReports: false,
        canExportReports: false,
        canViewAuditLogs: false,
        canManageUsers: false,
        canManageTax: false,
      };
    default:
      return {
        canViewEmployees: false,
        canEditEmployees: false,
        canDeleteEmployees: false,
        canProcessPayroll: false,
        canApproveLeave: false,
        canViewReports: false,
        canExportReports: false,
        canViewAuditLogs: false,
        canManageUsers: false,
        canManageTax: false,
      };
  }
}

// Dashboard routes for each role
export function getRoleDashboardRoute(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin-dashboard';
    case UserRole.HR_MANAGER:
      return '/hr-dashboard';
    case UserRole.PAYROLL_OFFICER:
      return '/payroll-dashboard';
    case UserRole.MANAGER:
      return '/manager-dashboard';
    case UserRole.EMPLOYEE:
      return '/employee-dashboard';
    default:
      return '/';
  }
}

export interface AuthenticationStep {
  step: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  permissions?: UserPermissions;
  redirectUrl?: string;
  error?: string;
  steps: AuthenticationStep[];
}

/**
 * Step 1: Capture username and password input
 */
export function captureCredentials(username: string, password: string): AuthenticationStep {
  console.log(`[AUTH STEP 1] Capturing credentials for user: ${username}`);
  
  if (!username || !password) {
    return {
      step: 1,
      title: 'User enters username and password',
      status: 'failed',
      message: 'Username and password are required'
    };
  }
  
  return {
    step: 1,
    title: 'User enters username and password',
    status: 'completed',
    message: 'Credentials captured successfully'
  };
}

/**
 * Step 2: Hash input password and compare with stored hash
 */
export function verifyPassword(username: string, password: string): AuthenticationStep {
  console.log(`[AUTH STEP 2] Hashing and comparing password for user: ${username}`);
  
  try {
    // Find user in database
    const user = userDatabase.find(u => u.email === username && u.isActive);
    if (!user) {
      return {
        step: 2,
        title: 'Hash input password and compare with stored hash in database',
        status: 'failed',
        message: 'User not found in database'
      };
    }
    
    // Hash input password
    const inputPasswordHash = hashPassword(password);
    
    // Compare with stored hash
    if (inputPasswordHash !== user.passwordHash) {
      return {
        step: 2,
        title: 'Hash input password and compare with stored hash in database',
        status: 'failed',
        message: 'Password hash does not match stored hash'
      };
    }
    
    return {
      step: 2,
      title: 'Hash input password and compare with stored hash in database',
      status: 'completed',
      message: 'Password verification successful'
    };
  } catch (error) {
    return {
      step: 2,
      title: 'Hash input password and compare with stored hash in database',
      status: 'failed',
      message: 'Error during password verification'
    };
  }
}

/**
 * Step 3: Fetch user role and permissions
 */
export function fetchUserRoleAndPermissions(username: string): { step: AuthenticationStep; user?: User; permissions?: UserPermissions } {
  console.log(`[AUTH STEP 3] Fetching user role and permissions for: ${username}`);
  
  try {
    const user = userDatabase.find(u => u.email === username && u.isActive);
    if (!user) {
      return {
        step: {
          step: 3,
          title: 'If match, fetch user role and permissions',
          status: 'failed',
          message: 'User not found for role fetching'
        }
      };
    }
    
    const permissions = getUserPermissions(user.role);
    
    return {
      step: {
        step: 3,
        title: 'If match, fetch user role and permissions',
        status: 'completed',
        message: `User role: ${user.role}, Permissions loaded successfully`
      },
      user,
      permissions
    };
  } catch (error) {
    return {
      step: {
        step: 3,
        title: 'If match, fetch user role and permissions',
        status: 'failed',
        message: 'Error fetching user role and permissions'
      }
    };
  }
}

/**
 * Step 4: Determine appropriate dashboard based on role
 */
export function determineUserDashboard(role: UserRole): AuthenticationStep & { redirectUrl?: string } {
  console.log(`[AUTH STEP 4] Determining dashboard for role: ${role}`);
  
  const redirectUrl = getRoleDashboardRoute(role);
  
  return {
    step: 4,
    title: 'Redirect user to appropriate dashboard (Admin, HR, Employee)',
    status: 'completed',
    message: `Dashboard determined: ${redirectUrl}`,
    redirectUrl
  };
}

/**
 * Step 5: Log login event for audit trail
 */
export function logLoginEvent(user: User, ipAddress: string): AuthenticationStep {
  console.log(`[AUTH STEP 5] Logging login event for user: ${user.email} from IP: ${ipAddress}`);
  
  try {
    const loginEvent = {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginTimestamp: new Date().toISOString(),
      ipAddress: ipAddress,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      sessionId: `session_${Date.now()}_${user.id}`
    };
    
    // In production, save to audit log database
    console.log('[AUTH AUDIT]', loginEvent);
    
    return {
      step: 5,
      title: 'Log login timestamp and IP address in audit trail',
      status: 'completed',
      message: `Login event logged successfully at ${loginEvent.loginTimestamp}`
    };
  } catch (error) {
    return {
      step: 5,
      title: 'Log login timestamp and IP address in audit trail',
      status: 'failed',
      message: 'Failed to log login event'
    };
  }
}

/**
 * Complete 5-step authentication process
 */
export async function authenticateUser(username: string, password: string, ipAddress: string = '127.0.0.1'): Promise<AuthenticationResult> {
  const steps: AuthenticationStep[] = [];
  
  try {
    // Step 1: Capture credentials
    const step1 = captureCredentials(username, password);
    steps.push(step1);
    if (step1.status === 'failed') {
      return { success: false, error: step1.message, steps };
    }
    
    // Step 2: Verify password
    const step2 = verifyPassword(username, password);
    steps.push(step2);
    if (step2.status === 'failed') {
      return { success: false, error: step2.message, steps };
    }
    
    // Step 3: Fetch user role and permissions
    const step3Result = fetchUserRoleAndPermissions(username);
    steps.push(step3Result.step);
    if (step3Result.step.status === 'failed') {
      return { success: false, error: step3Result.step.message, steps };
    }
    
    // Step 4: Determine dashboard
    const step4 = determineUserDashboard(step3Result.user!.role);
    steps.push(step4);
    
    // Step 5: Log login event
    const step5 = logLoginEvent(step3Result.user!, ipAddress);
    steps.push(step5);
    
    return {
      success: true,
      user: step3Result.user,
      permissions: step3Result.permissions,
      redirectUrl: step4.redirectUrl,
      steps
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Authentication process failed',
      steps
    };
  }
}

export { userDatabase };
