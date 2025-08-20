import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Download,
  Upload,
  Archive,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Info,
  Trash2,
  Calendar,
} from 'lucide-react';
import { UserRole } from '@shared/api';
import { formatKES } from '@shared/kenya-tax';

interface BackupFile {
  id: string;
  name: string;
  size: number;
  type: 'manual' | 'automatic';
  createdAt: string;
  description: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export default function BackupRestore() {
  const { user, hasAnyRole } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const [settings, setSettings] = useState({
    autoBackupEnabled: true,
    backupFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    backupTime: '02:00',
    retentionDays: 30,
    compressionEnabled: true,
    encryptionEnabled: true,
    backupLocation: 'cloud',
    maxBackupSize: 1000, // MB
  });

  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([
    {
      id: '1',
      name: 'payrollke_backup_2024-03-25_daily.sql',
      size: 45.6,
      type: 'automatic',
      createdAt: '2024-03-25T02:00:00Z',
      description: 'Daily automatic backup',
      status: 'completed',
    },
    {
      id: '2',
      name: 'payrollke_backup_2024-03-24_daily.sql',
      size: 44.2,
      type: 'automatic',
      createdAt: '2024-03-24T02:00:00Z',
      description: 'Daily automatic backup',
      status: 'completed',
    },
    {
      id: '3',
      name: 'payrollke_backup_2024-03-20_manual.sql',
      size: 43.8,
      type: 'manual',
      createdAt: '2024-03-20T14:30:00Z',
      description: 'Manual backup before system update',
      status: 'completed',
    },
    {
      id: '4',
      name: 'payrollke_backup_2024-03-15_weekly.sql',
      size: 42.1,
      type: 'automatic',
      createdAt: '2024-03-15T02:00:00Z',
      description: 'Weekly automatic backup',
      status: 'completed',
    },
  ]);

  const canManageBackup = hasAnyRole([UserRole.ADMIN]);

  if (!canManageBackup) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to manage backups.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Backup settings saved successfully!');
    } catch (error) {
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const createManualBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          
          // Add new backup to list
          const newBackup: BackupFile = {
            id: Date.now().toString(),
            name: `payrollke_backup_${new Date().toISOString().split('T')[0]}_manual.sql`,
            size: 45.8,
            type: 'manual',
            createdAt: new Date().toISOString(),
            description: 'Manual backup created by user',
            status: 'completed',
          };
          setBackupFiles(prev => [newBackup, ...prev]);
          alert('Manual backup created successfully!');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const downloadBackup = (backupId: string) => {
    const backup = backupFiles.find(b => b.id === backupId);
    if (backup) {
      alert(`Downloading ${backup.name}...`);
    }
  };

  const deleteBackup = (backupId: string) => {
    if (confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      setBackupFiles(prev => prev.filter(b => b.id !== backupId));
      alert('Backup deleted successfully!');
    }
  };

  const restoreBackup = async (backupId: string) => {
    const backup = backupFiles.find(b => b.id === backupId);
    if (!backup) return;

    if (confirm(`Are you sure you want to restore from ${backup.name}? This will overwrite all current data and cannot be undone.`)) {
      setIsRestoring(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        alert('System restored successfully! The application will restart.');
      } catch (error) {
        alert('Error during restore process. Please try again.');
      } finally {
        setIsRestoring(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-purple-100 text-purple-800';
      case 'automatic': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const totalBackupSize = backupFiles.reduce((total, backup) => total + backup.size, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
          <p className="text-gray-600">Manage data backups and system restore operations</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800">
            <Database className="w-4 h-4 mr-1" />
            {backupFiles.length} Backups
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            {formatFileSize(totalBackupSize)} Total
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Backup Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Automatic Backup</Label>
                <p className="text-sm text-gray-600">Enable scheduled backups</p>
              </div>
              <Switch 
                checked={settings.autoBackupEnabled}
                onCheckedChange={(checked) => setSettings({...settings, autoBackupEnabled: checked})}
              />
            </div>

            {settings.autoBackupEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                <div>
                  <Label>Backup Frequency</Label>
                  <Select 
                    value={settings.backupFrequency} 
                    onValueChange={(value) => setSettings({...settings, backupFrequency: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Backup Time</Label>
                  <Input 
                    type="time"
                    value={settings.backupTime}
                    onChange={(e) => setSettings({...settings, backupTime: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Retention Period (days)</Label>
                  <Input 
                    type="number"
                    value={settings.retentionDays}
                    onChange={(e) => setSettings({...settings, retentionDays: Number(e.target.value)})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable Compression</Label>
                <Switch 
                  checked={settings.compressionEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, compressionEnabled: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Encryption</Label>
                <Switch 
                  checked={settings.encryptionEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, encryptionEnabled: checked})}
                />
              </div>
            </div>

            <Button onClick={saveSettings} disabled={isSaving} className="w-full">
              {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Manual Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Manual Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Create an immediate backup of your current data. This is recommended before making major changes to the system.
              </AlertDescription>
            </Alert>

            {isBackingUp && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} />
              </div>
            )}

            <Button 
              onClick={createManualBackup} 
              disabled={isBackingUp}
              className="w-full"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Create Manual Backup
                </>
              )}
            </Button>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last automatic backup:</span>
                <span>{new Date(backupFiles.find(b => b.type === 'automatic')?.createdAt || '').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last manual backup:</span>
                <span>{new Date(backupFiles.find(b => b.type === 'manual')?.createdAt || '').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage used:</span>
                <span>{formatFileSize(totalBackupSize)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Available Backups ({backupFiles.length})
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import Backup
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backupFiles.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{backup.name}</div>
                      <div className="text-sm text-gray-500">{backup.description}</div>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge className={getTypeColor(backup.type)}>
                          {backup.type}
                        </Badge>
                        <Badge className={getStatusColor(backup.status)}>
                          {backup.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {backup.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                          {backup.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {backup.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(backup.size)}
                        </span>
                        <span className="text-xs text-gray-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(backup.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadBackup(backup.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreBackup(backup.id)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBackup(backup.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Restore operations will overwrite all current data. 
          Always create a backup before restoring from another backup file. This action cannot be undone.
        </AlertDescription>
      </Alert>
    </div>
  );
}
