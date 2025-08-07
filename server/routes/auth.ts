import { RequestHandler } from "express";
import { AuthResponse, LoginRequest, User, UserRole } from "@shared/api";

// Mock user database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@payrollpro.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    department: 'IT',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'hr@payrollpro.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: UserRole.HR_MANAGER,
    department: 'Human Resources',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'payroll@payrollpro.com',
    firstName: 'Mike',
    lastName: 'Chen',
    role: UserRole.PAYROLL_OFFICER,
    department: 'Finance',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'employee@payrollpro.com',
    firstName: 'Emily',
    lastName: 'Davis',
    role: UserRole.EMPLOYEE,
    department: 'Sales',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    email: 'manager@payrollpro.com',
    firstName: 'David',
    lastName: 'Wilson',
    role: UserRole.MANAGER,
    department: 'Marketing',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock password verification (in real app, use bcrypt)
const mockPasswords: Record<string, string> = {
  'admin@payrollpro.com': 'admin123',
  'hr@payrollpro.com': 'hr123',
  'payroll@payrollpro.com': 'payroll123',
  'employee@payrollpro.com': 'emp123',
  'manager@payrollpro.com': 'manager123',
};

// Generate mock JWT token (in real app, use proper JWT library)
const generateMockToken = (user: User): string => {
  return `mock-jwt-${user.id}-${Date.now()}`;
};

export const handleLogin: RequestHandler = (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user
    const user = mockUsers.find(u => u.email === email && u.isActive);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    if (mockPasswords[email] !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate tokens
    const token = generateMockToken(user);
    const refreshToken = `refresh-${token}`;

    const response: AuthResponse = {
      user,
      token,
      refreshToken,
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const handleValidateToken: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const token = authHeader.substring(7);
    
    // Mock token validation (in real app, verify JWT)
    if (!token.startsWith('mock-jwt-')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Extract user ID from mock token
    const parts = token.split('-');
    const userId = parts[2];
    
    const user = mockUsers.find(u => u.id === userId && u.isActive);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const handleLogout: RequestHandler = (req, res) => {
  // In a real app, you would invalidate the token
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};
