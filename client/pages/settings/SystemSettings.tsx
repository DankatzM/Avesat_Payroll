import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
  Server,
  Database,
  Mail,
  Shield,
  Clock,
  Globe,
  HardDrive,
  Monitor,
  AlertTriangle,
  Save,
  RefreshCw,
  Info,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  History,
  FileText,
  Download,
  Upload,
  Key,
  Bell,
  Lock,
  Users,
  Activity,
} from "lucide-react";
import { UserRole } from "@shared/api";

interface SystemConfiguration {
  applicationName: string;
  applicationUrl: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  fiscalYearStart: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordResetExpiry: number;
  backupRetention: number;
  logRetention: number;
}

interface DatabaseSettings {
  host: string;
  port: number;
  name: string;
  username: string;
  connectionPool: number;
  queryTimeout: number;
  backupSchedule: string;
  encryptionEnabled: boolean;
  auditingEnabled: boolean;
  performanceMonitoring: boolean;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: "none" | "tls" | "ssl";
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  enableNotifications: boolean;
  enableAlerts: boolean;
  enableReports: boolean;
}

interface SecuritySettings {
  enforceHttps: boolean;
  enableTwoFactor: boolean;
  allowRememberMe: boolean;
  ipWhitelist: string[];
  failedLoginLockout: boolean;
  passwordComplexity: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
  };
  apiRateLimit: number;
  enableAuditLog: boolean;
  dataEncryption: boolean;
}

interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  dbConnections: number;
  uptime: string;
  lastBackup: string;
  errorRate: number;
  responseTime: number;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  category: string;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  notifyUsers: boolean;
  createdBy: string;
  createdAt: string;
}

export default function SystemSettings() {
  const { user, hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // State for system configuration
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration>({
    applicationName: "Avesat Payroll System",
    applicationUrl: "https://payroll.avesat.co.ke",
    companyName: "Avesat Systems Ltd",
    companyAddress: "Nairobi, Kenya",
    companyPhone: "+254-700-000-000",
    companyEmail: "info@avesat.co.ke",
    timezone: "Africa/Nairobi",
    language: "en",
    currency: "KES",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    fiscalYearStart: "01-01",
    maintenanceMode: false,
    allowRegistration: false,
    requireEmailVerification: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordResetExpiry: 24,
    backupRetention: 30,
    logRetention: 90,
  });

  // State for database settings
  const [dbSettings, setDbSettings] = useState<DatabaseSettings>({
    host: "localhost",
    port: 3306,
    name: "avesat_payroll",
    username: "payroll_user",
    connectionPool: 20,
    queryTimeout: 30,
    backupSchedule: "daily",
    encryptionEnabled: true,
    auditingEnabled: true,
    performanceMonitoring: true,
  });

  // State for email settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: "mail.avesat.co.ke",
    smtpPort: 587,
    smtpUsername: "noreply@avesat.co.ke",
    smtpPassword: "",
    smtpEncryption: "tls",
    fromName: "Avesat Payroll System",
    fromEmail: "noreply@avesat.co.ke",
    replyToEmail: "support@avesat.co.ke",
    enableNotifications: true,
    enableAlerts: true,
    enableReports: true,
  });

  // State for security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enforceHttps: true,
    enableTwoFactor: true,
    allowRememberMe: true,
    ipWhitelist: [],
    failedLoginLockout: true,
    passwordComplexity: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
    },
    apiRateLimit: 100,
    enableAuditLog: true,
    dataEncryption: true,
  });

  // State for system health
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpuUsage: 35,
    memoryUsage: 62,
    diskUsage: 45,
    dbConnections: 12,
    uptime: "15 days, 6 hours",
    lastBackup: "2024-03-15 02:00:00",
    errorRate: 0.02,
    responseTime: 250,
  });

  // State for maintenance windows
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([
    {
      id: "1",
      title: "Monthly System Update",
      description: "Regular system maintenance and security updates",
      startTime: "2024-04-01T02:00:00",
      endTime: "2024-04-01T04:00:00",
      isActive: false,
      notifyUsers: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-03-15T10:00:00Z",
    },
    {
      id: "2",
      title: "Database Optimization",
      description: "Database performance optimization and cleanup",
      startTime: "2024-03-20T01:00:00",
      endTime: "2024-03-20T03:00:00",
      isActive: false,
      notifyUsers: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-03-10T15:30:00Z",
    },
  ]);

  // State for audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "1",
      action: "UPDATE_SYSTEM_CONFIG",
      description: "Updated application timezone from UTC to Africa/Nairobi",
      performedBy: "admin@avesat.co.ke",
      timestamp: "2024-03-15T14:30:00Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      category: "Configuration",
    },
    {
      id: "2",
      action: "ENABLE_MAINTENANCE_MODE",
      description: "Enabled maintenance mode for system updates",
      performedBy: "admin@avesat.co.ke",
      timestamp: "2024-03-10T02:00:00Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      category: "Maintenance",
    },
    {
      id: "3",
      action: "UPDATE_SECURITY_SETTINGS",
      description: "Updated password complexity requirements",
      performedBy: "admin@avesat.co.ke",
      timestamp: "2024-03-05T16:45:00Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      category: "Security",
    },
  ]);

  const canManageSystem = hasAnyRole([UserRole.ADMIN]);
  const canViewSystem = hasAnyRole([UserRole.ADMIN, UserRole.HR_MANAGER]);

  if (!canViewSystem) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view system settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const saveConfiguration = async (configType: string) => {
    if (!canManageSystem) {
      alert("You do not have permission to modify system settings.");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastSaved(new Date().toISOString());

      // Add to audit log
      const newLog: AuditLog = {
        id: Date.now().toString(),
        action: "UPDATE_SYSTEM_CONFIG",
        description: `Updated ${configType} configuration`,
        performedBy: user?.email || "unknown",
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: navigator.userAgent.substring(0, 50) + "...",
        category: "Configuration",
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      alert(`${configType} configuration saved successfully!`);
    } catch (error) {
      alert("Error saving configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConnection = async () => {
    if (!canManageSystem) {
      alert("You do not have permission to test email connection.");
      return;
    }

    try {
      // Simulate email test
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Email connection test successful!");
    } catch (error) {
      alert("Email connection test failed. Please check your settings.");
    }
  };

  const createBackup = async () => {
    if (!canManageSystem) {
      alert("You do not have permission to create backups.");
      return;
    }

    try {
      // Simulate backup creation
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // Update system health
      setSystemHealth(prev => ({
        ...prev,
        lastBackup: new Date().toISOString()
      }));

      alert("System backup created successfully!");
    } catch (error) {
      alert("Backup creation failed. Please try again.");
    }
  };

  const toggleMaintenanceMode = async () => {
    if (!canManageSystem) {
      alert("You do not have permission to toggle maintenance mode.");
      return;
    }

    const newMode = !systemConfig.maintenanceMode;
    setSystemConfig(prev => ({ ...prev, maintenanceMode: newMode }));

    // Add to audit log
    const newLog: AuditLog = {
      id: Date.now().toString(),
      action: newMode ? "ENABLE_MAINTENANCE_MODE" : "DISABLE_MAINTENANCE_MODE",
      description: `${newMode ? "Enabled" : "Disabled"} maintenance mode`,
      performedBy: user?.email || "unknown",
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1.100",
      userAgent: navigator.userAgent.substring(0, 50) + "...",
      category: "Maintenance",
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    alert(`Maintenance mode ${newMode ? "enabled" : "disabled"} successfully!`);
  };

  const getHealthColor = (value: number, isReverse = false) => {
    if (isReverse) {
      if (value < 30) return "text-green-600";
      if (value < 70) return "text-yellow-600";
      return "text-red-600";
    } else {
      if (value < 50) return "text-red-600";
      if (value < 80) return "text-yellow-600";
      return "text-green-600";
    }
  };

  const exportConfiguration = () => {
    const config = {
      systemConfig,
      dbSettings: { ...dbSettings, password: "***" }, // Don't export passwords
      emailSettings: { ...emailSettings, smtpPassword: "***" },
      securitySettings,
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system-config-${new Date().toISOString().split("T")[0]}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.systemConfig) {
          setSystemConfig(importedData.systemConfig);
        }
        if (importedData.emailSettings) {
          setEmailSettings(importedData.emailSettings);
        }
        if (importedData.securitySettings) {
          setSecuritySettings(importedData.securitySettings);
        }
        alert("Configuration imported successfully!");
      } catch (error) {
        alert("Error importing configuration. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            System Settings
          </h1>
          <p className="text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="text-sm text-gray-500">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </div>
          )}
          <Badge
            className={
              canManageSystem
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            <Settings className="w-4 h-4 mr-1" />
            {canManageSystem ? "Full Access" : "Read Only"}
          </Badge>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {systemConfig.maintenanceMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System is currently in maintenance mode. Users cannot access the application.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Application Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="applicationName">Application Name</Label>
                  <Input
                    id="applicationName"
                    value={systemConfig.applicationName}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, applicationName: e.target.value })
                    }
                    disabled={!canManageSystem}
                  />
                </div>

                <div>
                  <Label htmlFor="applicationUrl">Application URL</Label>
                  <Input
                    id="applicationUrl"
                    value={systemConfig.applicationUrl}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, applicationUrl: e.target.value })
                    }
                    disabled={!canManageSystem}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={systemConfig.timezone}
                      onValueChange={(value) =>
                        setSystemConfig({ ...systemConfig, timezone: value })
                      }
                      disabled={!canManageSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={systemConfig.language}
                      onValueChange={(value) =>
                        setSystemConfig({ ...systemConfig, language: value })
                      }
                      disabled={!canManageSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={systemConfig.currency}
                      onValueChange={(value) =>
                        setSystemConfig({ ...systemConfig, currency: value })
                      }
                      disabled={!canManageSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={systemConfig.dateFormat}
                      onValueChange={(value) =>
                        setSystemConfig({ ...systemConfig, dateFormat: value })
                      }
                      disabled={!canManageSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">
                        Disable user access for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={systemConfig.maintenanceMode}
                      onCheckedChange={toggleMaintenanceMode}
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Registration</Label>
                      <p className="text-sm text-gray-600">
                        Allow new user registrations
                      </p>
                    </div>
                    <Switch
                      checked={systemConfig.allowRegistration}
                      onCheckedChange={(checked) =>
                        setSystemConfig({ ...systemConfig, allowRegistration: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-gray-600">
                        Require email verification for new users
                      </p>
                    </div>
                    <Switch
                      checked={systemConfig.requireEmailVerification}
                      onCheckedChange={(checked) =>
                        setSystemConfig({ ...systemConfig, requireEmailVerification: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={systemConfig.companyName}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, companyName: e.target.value })
                    }
                    disabled={!canManageSystem}
                  />
                </div>

                <div>
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={systemConfig.companyAddress}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, companyAddress: e.target.value })
                    }
                    disabled={!canManageSystem}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input
                      id="companyPhone"
                      value={systemConfig.companyPhone}
                      onChange={(e) =>
                        setSystemConfig({ ...systemConfig, companyPhone: e.target.value })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={systemConfig.companyEmail}
                      onChange={(e) =>
                        setSystemConfig({ ...systemConfig, companyEmail: e.target.value })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
                  <Input
                    id="fiscalYearStart"
                    placeholder="MM-DD"
                    value={systemConfig.fiscalYearStart}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, fiscalYearStart: e.target.value })
                    }
                    disabled={!canManageSystem}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session & Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Session & Timeout Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemConfig.sessionTimeout}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, sessionTimeout: Number(e.target.value) })
                    }
                    disabled={!canManageSystem}
                  />
                </div>

                <div>
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={systemConfig.maxLoginAttempts}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, maxLoginAttempts: Number(e.target.value) })
                    }
                    disabled={!canManageSystem}
                  />
                </div>

                <div>
                  <Label htmlFor="passwordResetExpiry">Password Reset Expiry (hours)</Label>
                  <Input
                    id="passwordResetExpiry"
                    type="number"
                    value={systemConfig.passwordResetExpiry}
                    onChange={(e) =>
                      setSystemConfig({ ...systemConfig, passwordResetExpiry: Number(e.target.value) })
                    }
                    disabled={!canManageSystem}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                    <Input
                      id="backupRetention"
                      type="number"
                      value={systemConfig.backupRetention}
                      onChange={(e) =>
                        setSystemConfig({ ...systemConfig, backupRetention: Number(e.target.value) })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logRetention">Log Retention (days)</Label>
                    <Input
                      id="logRetention"
                      type="number"
                      value={systemConfig.logRetention}
                      onChange={(e) =>
                        setSystemConfig({ ...systemConfig, logRetention: Number(e.target.value) })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {canManageSystem && (
            <div className="flex justify-end">
              <Button onClick={() => saveConfiguration("General")} disabled={isSaving}>
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save General Settings
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dbHost">Host</Label>
                      <Input
                        id="dbHost"
                        value={dbSettings.host}
                        onChange={(e) =>
                          setDbSettings({ ...dbSettings, host: e.target.value })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dbPort">Port</Label>
                      <Input
                        id="dbPort"
                        type="number"
                        value={dbSettings.port}
                        onChange={(e) =>
                          setDbSettings({ ...dbSettings, port: Number(e.target.value) })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dbName">Database Name</Label>
                      <Input
                        id="dbName"
                        value={dbSettings.name}
                        onChange={(e) =>
                          setDbSettings({ ...dbSettings, name: e.target.value })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dbUsername">Username</Label>
                      <Input
                        id="dbUsername"
                        value={dbSettings.username}
                        onChange={(e) =>
                          setDbSettings({ ...dbSettings, username: e.target.value })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="connectionPool">Connection Pool Size</Label>
                      <Input
                        id="connectionPool"
                        type="number"
                        value={dbSettings.connectionPool}
                        onChange={(e) =>
                          setDbSettings({ ...dbSettings, connectionPool: Number(e.target.value) })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div>
                      <Label htmlFor="queryTimeout">Query Timeout (seconds)</Label>
                      <Input
                        id="queryTimeout"
                        type="number"
                        value={dbSettings.queryTimeout}
                        onChange={(e) =>
                          setDbSettings({ ...dbSettings, queryTimeout: Number(e.target.value) })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="backupSchedule">Backup Schedule</Label>
                    <Select
                      value={dbSettings.backupSchedule}
                      onValueChange={(value) =>
                        setDbSettings({ ...dbSettings, backupSchedule: value })
                      }
                      disabled={!canManageSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Encryption Enabled</Label>
                        <p className="text-sm text-gray-600">
                          Enable database encryption at rest
                        </p>
                      </div>
                      <Switch
                        checked={dbSettings.encryptionEnabled}
                        onCheckedChange={(checked) =>
                          setDbSettings({ ...dbSettings, encryptionEnabled: checked })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auditing Enabled</Label>
                        <p className="text-sm text-gray-600">
                          Enable database audit logging
                        </p>
                      </div>
                      <Switch
                        checked={dbSettings.auditingEnabled}
                        onCheckedChange={(checked) =>
                          setDbSettings({ ...dbSettings, auditingEnabled: checked })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Performance Monitoring</Label>
                        <p className="text-sm text-gray-600">
                          Enable performance monitoring
                        </p>
                      </div>
                      <Switch
                        checked={dbSettings.performanceMonitoring}
                        onCheckedChange={(checked) =>
                          setDbSettings({ ...dbSettings, performanceMonitoring: checked })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled={!canManageSystem}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={createBackup}
                      disabled={!canManageSystem}
                    >
                      <HardDrive className="w-4 h-4 mr-2" />
                      Create Backup Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {canManageSystem && (
            <div className="flex justify-end">
              <Button onClick={() => saveConfiguration("Database")} disabled={isSaving}>
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Database Settings
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpPort: Number(e.target.value) })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input
                      id="smtpUsername"
                      value={emailSettings.smtpUsername}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpEncryption">Encryption</Label>
                    <Select
                      value={emailSettings.smtpEncryption}
                      onValueChange={(value) =>
                        setEmailSettings({ ...emailSettings, smtpEncryption: value as any })
                      }
                      disabled={!canManageSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromName: e.target.value })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>

                  <div>
                    <Label htmlFor="replyToEmail">Reply-To Email</Label>
                    <Input
                      id="replyToEmail"
                      type="email"
                      value={emailSettings.replyToEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, replyToEmail: e.target.value })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Send system notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={emailSettings.enableNotifications}
                        onCheckedChange={(checked) =>
                          setEmailSettings({ ...emailSettings, enableNotifications: checked })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Alerts</Label>
                        <p className="text-sm text-gray-600">
                          Send system alerts via email
                        </p>
                      </div>
                      <Switch
                        checked={emailSettings.enableAlerts}
                        onCheckedChange={(checked) =>
                          setEmailSettings({ ...emailSettings, enableAlerts: checked })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Reports</Label>
                        <p className="text-sm text-gray-600">
                          Send scheduled reports via email
                        </p>
                      </div>
                      <Switch
                        checked={emailSettings.enableReports}
                        onCheckedChange={(checked) =>
                          setEmailSettings({ ...emailSettings, enableReports: checked })
                        }
                        disabled={!canManageSystem}
                      />
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={testEmailConnection}
                    disabled={!canManageSystem}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Test Email Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {canManageSystem && (
            <div className="flex justify-end">
              <Button onClick={() => saveConfiguration("Email")} disabled={isSaving}>
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Email Settings
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication & Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentication & Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enforce HTTPS</Label>
                      <p className="text-sm text-gray-600">
                        Redirect all HTTP traffic to HTTPS
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enforceHttps}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, enforceHttps: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">
                        Require 2FA for all users
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableTwoFactor}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, enableTwoFactor: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Remember Me</Label>
                      <p className="text-sm text-gray-600">
                        Allow users to stay logged in
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.allowRememberMe}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, allowRememberMe: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Failed Login Lockout</Label>
                      <p className="text-sm text-gray-600">
                        Lock accounts after failed attempts
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.failedLoginLockout}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, failedLoginLockout: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="apiRateLimit">API Rate Limit (requests/minute)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={securitySettings.apiRateLimit}
                    onChange={(e) =>
                      setSecuritySettings({ ...securitySettings, apiRateLimit: Number(e.target.value) })
                    }
                    disabled={!canManageSystem}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={securitySettings.passwordComplexity.minLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordComplexity: {
                          ...securitySettings.passwordComplexity,
                          minLength: Number(e.target.value)
                        }
                      })
                    }
                    disabled={!canManageSystem}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase</Label>
                    <Switch
                      checked={securitySettings.passwordComplexity.requireUppercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordComplexity: {
                            ...securitySettings.passwordComplexity,
                            requireUppercase: checked
                          }
                        })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Lowercase</Label>
                    <Switch
                      checked={securitySettings.passwordComplexity.requireLowercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordComplexity: {
                            ...securitySettings.passwordComplexity,
                            requireLowercase: checked
                          }
                        })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.passwordComplexity.requireNumbers}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordComplexity: {
                            ...securitySettings.passwordComplexity,
                            requireNumbers: checked
                          }
                        })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings.passwordComplexity.requireSpecialChars}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordComplexity: {
                            ...securitySettings.passwordComplexity,
                            requireSpecialChars: checked
                          }
                        })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="preventReuse">Prevent Password Reuse (last N passwords)</Label>
                  <Input
                    id="preventReuse"
                    type="number"
                    value={securitySettings.passwordComplexity.preventReuse}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordComplexity: {
                          ...securitySettings.passwordComplexity,
                          preventReuse: Number(e.target.value)
                        }
                      })
                    }
                    disabled={!canManageSystem}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Audit Log</Label>
                      <p className="text-sm text-gray-600">
                        Log all system activities
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableAuditLog}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, enableAuditLog: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Data Encryption</Label>
                      <p className="text-sm text-gray-600">
                        Encrypt sensitive data at rest
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.dataEncryption}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, dataEncryption: checked })
                      }
                      disabled={!canManageSystem}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="Enter IP addresses, one per line"
                    value={securitySettings.ipWhitelist.join('\n')}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim())
                      })
                    }
                    disabled={!canManageSystem}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {canManageSystem && (
            <div className="flex justify-end">
              <Button onClick={() => saveConfiguration("Security")} disabled={isSaving}>
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Security Settings
              </Button>
            </div>
          )}
        </TabsContent>

        {/* System Health */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">
                  <span className={getHealthColor(systemHealth.cpuUsage, true)}>
                    {systemHealth.cpuUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${systemHealth.cpuUsage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">
                  <span className={getHealthColor(systemHealth.memoryUsage, true)}>
                    {systemHealth.memoryUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${systemHealth.memoryUsage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Disk Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">
                  <span className={getHealthColor(systemHealth.diskUsage, true)}>
                    {systemHealth.diskUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${systemHealth.diskUsage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  DB Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">
                  <span className="text-blue-600">
                    {systemHealth.dbConnections}
                  </span>
                </div>
                <div className="text-sm text-gray-600 text-center mt-2">
                  Active connections
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Health Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>System Uptime:</span>
                  <Badge variant="outline">{systemHealth.uptime}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup:</span>
                  <Badge variant="outline">
                    {new Date(systemHealth.lastBackup).toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate:</span>
                  <Badge 
                    className={
                      systemHealth.errorRate < 0.01 
                        ? "bg-green-100 text-green-800" 
                        : systemHealth.errorRate < 0.05 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {(systemHealth.errorRate * 100).toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response Time:</span>
                  <Badge 
                    className={
                      systemHealth.responseTime < 200 
                        ? "bg-green-100 text-green-800" 
                        : systemHealth.responseTime < 500 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {systemHealth.responseTime}ms
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  System Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled={!canManageSystem}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Health Status
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={createBackup}
                  disabled={!canManageSystem}
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  Create System Backup
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled={!canManageSystem}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled={!canManageSystem}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Scheduled Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Maintenance Windows</h3>
                {canManageSystem && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                )}
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceWindows.map((window) => (
                    <TableRow key={window.id}>
                      <TableCell className="font-medium">{window.title}</TableCell>
                      <TableCell>{window.description}</TableCell>
                      <TableCell>
                        {new Date(window.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(window.endTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={window.isActive ? "destructive" : "secondary"}>
                          {window.isActive ? "Active" : "Scheduled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageSystem && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
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

          {/* Import/Export Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Export System Configuration</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Export all system settings as a JSON file
                  </p>
                  <Button onClick={exportConfiguration} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Import System Configuration</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Import system settings from a JSON file
                  </p>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={importConfiguration}
                    disabled={!canManageSystem}
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Importing will overwrite existing configuration. Make sure
                    to backup current settings first.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                System Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>{log.performedBy}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.category}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
