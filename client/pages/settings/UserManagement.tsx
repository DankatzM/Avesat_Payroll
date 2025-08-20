import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  UserX,
  Shield,
  Key,
  Lock,
  Mail,
  Calendar,
  AlertTriangle,
  Save,
  RefreshCw,
  Info,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  History,
  Eye,
  EyeOff,
  Settings,
  Clock,
  Building,
} from "lucide-react";
import { UserRole } from "@shared/api";

interface UserAccount {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  lastPasswordChange: string;
  passwordExpiry: string;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockoutExpiry?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

interface RolePermission {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
}

interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays: number;
  maxFailedLogins: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  require2FA: boolean;
  allowPasswordReuse: boolean;
  passwordHistoryCount: number;
}

interface SessionLog {
  id: string;
  userId: string;
  username: string;
  action: "login" | "logout" | "timeout" | "force_logout";
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  failureReason?: string;
}

export default function UserManagement() {
  const { user, hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // User accounts state
  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: "1",
      username: "admin",
      email: "admin@avesat.co.ke",
      firstName: "James",
      lastName: "Mwangi",
      role: UserRole.ADMIN,
      department: "IT",
      isActive: true,
      twoFactorEnabled: true,
      lastLogin: "2024-03-25T14:30:00Z",
      lastPasswordChange: "2024-01-15T00:00:00Z",
      passwordExpiry: "2024-04-15T00:00:00Z",
      failedLoginAttempts: 0,
      accountLocked: false,
      createdBy: "system",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-03-15T00:00:00Z",
    },
    {
      id: "2",
      username: "hr_manager",
      email: "hr@avesat.co.ke",
      firstName: "Grace",
      lastName: "Wanjiku",
      role: UserRole.HR_MANAGER,
      department: "Human Resources",
      isActive: true,
      twoFactorEnabled: false,
      lastLogin: "2024-03-25T09:15:00Z",
      lastPasswordChange: "2024-02-01T00:00:00Z",
      passwordExpiry: "2024-05-01T00:00:00Z",
      failedLoginAttempts: 0,
      accountLocked: false,
      createdBy: "admin",
      createdAt: "2024-01-15T00:00:00Z",
      lastModified: "2024-02-01T00:00:00Z",
    },
    {
      id: "3",
      username: "payroll_officer",
      email: "payroll@avesat.co.ke",
      firstName: "Peter",
      lastName: "Kiprotich",
      role: UserRole.PAYROLL_OFFICER,
      department: "Finance",
      isActive: true,
      twoFactorEnabled: true,
      lastLogin: "2024-03-25T08:45:00Z",
      lastPasswordChange: "2024-01-20T00:00:00Z",
      passwordExpiry: "2024-04-20T00:00:00Z",
      failedLoginAttempts: 0,
      accountLocked: false,
      createdBy: "admin",
      createdAt: "2024-01-20T00:00:00Z",
      lastModified: "2024-01-20T00:00:00Z",
    },
    {
      id: "4",
      username: "manager1",
      email: "manager@avesat.co.ke",
      firstName: "Sarah",
      lastName: "Kimani",
      role: UserRole.MANAGER,
      department: "Engineering",
      isActive: true,
      twoFactorEnabled: false,
      lastLogin: "2024-03-24T16:20:00Z",
      lastPasswordChange: "2024-03-01T00:00:00Z",
      passwordExpiry: "2024-06-01T00:00:00Z",
      failedLoginAttempts: 1,
      accountLocked: false,
      createdBy: "hr_manager",
      createdAt: "2024-02-01T00:00:00Z",
      lastModified: "2024-03-01T00:00:00Z",
    },
    {
      id: "5",
      username: "employee1",
      email: "john.doe@avesat.co.ke",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.EMPLOYEE,
      department: "Engineering",
      isActive: false,
      twoFactorEnabled: false,
      lastPasswordChange: "2024-01-10T00:00:00Z",
      passwordExpiry: "2024-04-10T00:00:00Z",
      failedLoginAttempts: 5,
      accountLocked: true,
      lockoutExpiry: "2024-03-26T10:00:00Z",
      createdBy: "hr_manager",
      createdAt: "2024-01-10T00:00:00Z",
      lastModified: "2024-03-25T00:00:00Z",
    },
  ]);

  // Role permissions state
  const [rolePermissions, setRolePermissions] = useState<
    Record<UserRole, RolePermission[]>
  >({
    [UserRole.ADMIN]: [
      {
        id: "1",
        name: "system_admin",
        description: "Full system administration",
        category: "System",
        isEnabled: true,
      },
      {
        id: "2",
        name: "user_management",
        description: "Manage user accounts",
        category: "Users",
        isEnabled: true,
      },
      {
        id: "3",
        name: "settings_manage",
        description: "Manage system settings",
        category: "Settings",
        isEnabled: true,
      },
    ],
    [UserRole.HR_MANAGER]: [
      {
        id: "4",
        name: "employee_management",
        description: "Manage employee records",
        category: "Employees",
        isEnabled: true,
      },
      {
        id: "5",
        name: "leave_management",
        description: "Manage leave requests",
        category: "Leave",
        isEnabled: true,
      },
      {
        id: "6",
        name: "payroll_view",
        description: "View payroll information",
        category: "Payroll",
        isEnabled: true,
      },
    ],
    [UserRole.PAYROLL_OFFICER]: [
      {
        id: "7",
        name: "payroll_process",
        description: "Process payroll",
        category: "Payroll",
        isEnabled: true,
      },
      {
        id: "8",
        name: "payroll_reports",
        description: "Generate payroll reports",
        category: "Reports",
        isEnabled: true,
      },
      {
        id: "9",
        name: "employee_view",
        description: "View employee information",
        category: "Employees",
        isEnabled: true,
      },
    ],
    [UserRole.MANAGER]: [
      {
        id: "10",
        name: "team_management",
        description: "Manage team members",
        category: "Team",
        isEnabled: true,
      },
      {
        id: "11",
        name: "leave_approval",
        description: "Approve leave requests",
        category: "Leave",
        isEnabled: true,
      },
      {
        id: "12",
        name: "team_reports",
        description: "View team reports",
        category: "Reports",
        isEnabled: true,
      },
    ],
    [UserRole.EMPLOYEE]: [
      {
        id: "13",
        name: "profile_view",
        description: "View own profile",
        category: "Profile",
        isEnabled: true,
      },
      {
        id: "14",
        name: "leave_request",
        description: "Request leave",
        category: "Leave",
        isEnabled: true,
      },
      {
        id: "15",
        name: "payslip_view",
        description: "View own payslips",
        category: "Payroll",
        isEnabled: true,
      },
    ],
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordExpiryDays: 90,
    maxFailedLogins: 5,
    lockoutDurationMinutes: 30,
    sessionTimeoutMinutes: 60,
    require2FA: false,
    allowPasswordReuse: false,
    passwordHistoryCount: 5,
  });

  // Session logs state
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([
    {
      id: "1",
      userId: "1",
      username: "admin",
      action: "login",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 Chrome/91.0",
      timestamp: "2024-03-25T14:30:00Z",
      success: true,
    },
    {
      id: "2",
      userId: "2",
      username: "hr_manager",
      action: "login",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 Firefox/89.0",
      timestamp: "2024-03-25T09:15:00Z",
      success: true,
    },
    {
      id: "3",
      userId: "5",
      username: "employee1",
      action: "login",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 Safari/14.1",
      timestamp: "2024-03-25T07:45:00Z",
      success: false,
      failureReason: "Account locked due to multiple failed attempts",
    },
  ]);

  // Form state for user creation/editing
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: UserRole.EMPLOYEE,
    department: "",
    password: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    isActive: true,
  });

  const canManageUsers = hasAnyRole([UserRole.ADMIN]);
  const canViewUsers = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER]);

  if (!canViewUsers) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view user management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleCreateUser = async () => {
    if (!canManageUsers) {
      alert("You do not have permission to create users.");
      return;
    }

    if (!formData.username || !formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const newUser: UserAccount = {
      id: Date.now().toString(),
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      department: formData.department,
      isActive: formData.isActive,
      twoFactorEnabled: formData.twoFactorEnabled,
      lastPasswordChange: new Date().toISOString(),
      passwordExpiry: new Date(
        Date.now() + securitySettings.passwordExpiryDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      failedLoginAttempts: 0,
      accountLocked: false,
      createdBy: user?.email || "unknown",
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsCreateDialogOpen(false);
    resetForm();
    alert("User created successfully!");
  };

  const handleUpdateUser = async () => {
    if (!canManageUsers || !selectedUser) return;

    const updatedUser: UserAccount = {
      ...selectedUser,
      ...formData,
      lastModified: new Date().toISOString(),
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)),
    );
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    resetForm();
    alert("User updated successfully!");
  };

  const handleToggleUserStatus = async (userId: string) => {
    if (!canManageUsers) {
      alert("You do not have permission to modify user status.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              isActive: !u.isActive,
              lastModified: new Date().toISOString(),
            }
          : u,
      ),
    );
  };

  const handleUnlockUser = async (userId: string) => {
    if (!canManageUsers) {
      alert("You do not have permission to unlock users.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              accountLocked: false,
              failedLoginAttempts: 0,
              lockoutExpiry: undefined,
              lastModified: new Date().toISOString(),
            }
          : u,
      ),
    );
    alert("User account unlocked successfully!");
  };

  const handleResetPassword = async (userId: string) => {
    if (!canManageUsers) {
      alert("You do not have permission to reset passwords.");
      return;
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    alert(
      `Temporary password generated: ${tempPassword}\nUser will be required to change password on next login.`,
    );
  };

  const saveSecuritySettings = async () => {
    if (!canManageUsers) {
      alert("You do not have permission to modify security settings.");
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Security settings saved successfully!");
    } catch (error) {
      alert("Error saving security settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: UserRole.EMPLOYEE,
      department: "",
      password: "",
      confirmPassword: "",
      twoFactorEnabled: false,
      isActive: true,
    });
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800";
      case UserRole.HR_MANAGER:
        return "bg-blue-100 text-blue-800";
      case UserRole.PAYROLL_OFFICER:
        return "bg-green-100 text-green-800";
      case UserRole.MANAGER:
        return "bg-purple-100 text-purple-800";
      case UserRole.EMPLOYEE:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDepartments = () => {
    return [...new Set(users.map((user) => user.department))];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage user accounts, roles, and security settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            className={
              canManageUsers
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            <Users className="w-4 h-4 mr-1" />
            {canManageUsers ? "Full Access" : "Read Only"}
          </Badge>
        </div>
      </div>

      {/* Main Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">User Accounts</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="sessions">Session Logs</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* User Accounts */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Accounts ({users.length})
                </div>
                {canManageUsers && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {user.department}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.twoFactorEnabled ? "default" : "secondary"
                          }
                        >
                          {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {user.accountLocked && (
                            <Badge variant="destructive" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {canManageUsers && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setFormData({
                                  username: user.username,
                                  email: user.email,
                                  firstName: user.firstName,
                                  lastName: user.lastName,
                                  role: user.role,
                                  department: user.department,
                                  password: "",
                                  confirmPassword: "",
                                  twoFactorEnabled: user.twoFactorEnabled,
                                  isActive: user.isActive,
                                });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.isActive ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                            {user.accountLocked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnlockUser(user.id)}
                              >
                                <Lock className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(user.id)}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <Badge className={getRoleColor(role as UserRole)}>
                      {role.replace("_", " ")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {permission.name.replace("_", " ")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {permission.description}
                          </div>
                        </div>
                        <Switch
                          checked={permission.isEnabled}
                          disabled={!canManageUsers}
                          onCheckedChange={(checked) => {
                            setRolePermissions((prev) => ({
                              ...prev,
                              [role]: prev[role as UserRole].map((p) =>
                                p.id === permission.id
                                  ? { ...p, isEnabled: checked }
                                  : p,
                              ),
                            }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="passwordMinLength">
                    Minimum Password Length
                  </Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: Number(e.target.value),
                      })
                    }
                    disabled={!canManageUsers}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings.passwordRequireUppercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordRequireUppercase: checked,
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Lowercase Letters</Label>
                    <Switch
                      checked={securitySettings.passwordRequireLowercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordRequireLowercase: checked,
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.passwordRequireNumbers}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordRequireNumbers: checked,
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordRequireSpecialChars: checked,
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="passwordExpiryDays">
                    Password Expiry (days)
                  </Label>
                  <Input
                    id="passwordExpiryDays"
                    type="number"
                    value={securitySettings.passwordExpiryDays}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordExpiryDays: Number(e.target.value),
                      })
                    }
                    disabled={!canManageUsers}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxFailedLogins">Max Failed Logins</Label>
                    <Input
                      id="maxFailedLogins"
                      type="number"
                      value={securitySettings.maxFailedLogins}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          maxFailedLogins: Number(e.target.value),
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lockoutDurationMinutes">
                      Lockout Duration (minutes)
                    </Label>
                    <Input
                      id="lockoutDurationMinutes"
                      type="number"
                      value={securitySettings.lockoutDurationMinutes}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          lockoutDurationMinutes: Number(e.target.value),
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sessionTimeoutMinutes">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeoutMinutes"
                    type="number"
                    value={securitySettings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeoutMinutes: Number(e.target.value),
                      })
                    }
                    disabled={!canManageUsers}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Two-Factor Authentication</Label>
                    <Switch
                      checked={securitySettings.require2FA}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          require2FA: checked,
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Password Reuse</Label>
                    <Switch
                      checked={securitySettings.allowPasswordReuse}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          allowPasswordReuse: checked,
                        })
                      }
                      disabled={!canManageUsers}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="passwordHistoryCount">
                    Password History Count
                  </Label>
                  <Input
                    id="passwordHistoryCount"
                    type="number"
                    value={securitySettings.passwordHistoryCount}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordHistoryCount: Number(e.target.value),
                      })
                    }
                    disabled={!canManageUsers}
                  />
                </div>

                {canManageUsers && (
                  <Button
                    onClick={saveSecuritySettings}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Security Settings
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Session Logs */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Session Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell className="max-w-48 truncate text-sm">
                        {log.userAgent}
                      </TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.success ? "default" : "destructive"}
                        >
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                        {log.failureReason && (
                          <div className="text-xs text-red-600 mt-1">
                            {log.failureReason}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                User Management Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No audit logs available
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  User management activities will be logged here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {getDepartments().map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm password"
              />
            </div>
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable Two-Factor Authentication</Label>
                <Switch
                  checked={formData.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, twoFactorEnabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active Account</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit User: {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getDepartments().map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable Two-Factor Authentication</Label>
                <Switch
                  checked={formData.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, twoFactorEnabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active Account</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
