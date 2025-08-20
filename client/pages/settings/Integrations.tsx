import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plug,
  Database,
  CreditCard,
  Building,
  Users,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { UserRole } from '@shared/api';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
  isConnected: boolean;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  lastSync?: string;
  status: 'active' | 'inactive' | 'error';
}

export default function Integrations() {
  const { user, hasAnyRole } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync payroll data with QuickBooks accounting software',
      category: 'accounting',
      isEnabled: true,
      isConnected: true,
      apiKey: 'QB_***************',
      lastSync: '2024-03-25T10:30:00Z',
      status: 'active',
    },
    {
      id: 'equity_bank',
      name: 'Equity Bank',
      description: 'Direct bank transfers and account validation',
      category: 'banking',
      isEnabled: true,
      isConnected: false,
      apiKey: '',
      status: 'inactive',
    },
    {
      id: 'biometric',
      name: 'Biometric Attendance',
      description: 'Import attendance data from biometric systems',
      category: 'attendance',
      isEnabled: true,
      isConnected: true,
      webhookUrl: 'https://api.payrollke.com/webhook/attendance',
      lastSync: '2024-03-25T08:00:00Z',
      status: 'active',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send payroll notifications to Slack channels',
      category: 'communication',
      isEnabled: false,
      isConnected: false,
      apiKey: '',
      status: 'inactive',
    },
    {
      id: 'sms_gateway',
      name: 'SMS Gateway',
      description: 'Send SMS notifications to employees',
      category: 'communication',
      isEnabled: true,
      isConnected: true,
      apiKey: 'SMS_***************',
      lastSync: '2024-03-25T12:00:00Z',
      status: 'active',
    },
    {
      id: 'kra_itax',
      name: 'KRA iTax',
      description: 'Submit tax returns directly to KRA iTax system',
      category: 'compliance',
      isEnabled: true,
      isConnected: false,
      apiKey: '',
      status: 'error',
    },
  ]);

  const canManageIntegrations = hasAnyRole([UserRole.ADMIN]);

  if (!canManageIntegrations) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view integrations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const toggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, isEnabled: !integration.isEnabled }
          : integration
      )
    );
  };

  const testConnection = async (id: string) => {
    alert(`Testing connection for ${integrations.find(i => i.id === id)?.name}...`);
    // Simulate API test
    setTimeout(() => {
      alert('Connection test successful!');
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id
            ? { ...integration, isConnected: true, status: 'active' }
            : integration
        )
      );
    }, 2000);
  };

  const saveIntegration = async (id: string) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Integration settings saved successfully!');
    } catch (error) {
      alert('Error saving integration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accounting': return Building;
      case 'banking': return CreditCard;
      case 'attendance': return Clock;
      case 'communication': return MessageSquare;
      case 'compliance': return Database;
      default: return Plug;
    }
  };

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Connect with third-party services and systems</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Plug className="w-4 h-4 mr-1" />
          {integrations.filter(i => i.isConnected).length} Connected
        </Badge>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Integrations</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => {
              const Icon = getCategoryIcon(integration.category);
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {integration.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.isConnected ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {integration.status}
                        </Badge>
                        <Switch
                          checked={integration.isEnabled}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{integration.description}</p>
                    
                    {integration.isEnabled && (
                      <div className="space-y-3">
                        {integration.apiKey !== undefined && (
                          <div>
                            <Label>API Key</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showApiKeys[integration.id] ? 'text' : 'password'}
                                value={integration.apiKey}
                                onChange={(e) => setIntegrations(prev =>
                                  prev.map(i =>
                                    i.id === integration.id
                                      ? { ...i, apiKey: e.target.value }
                                      : i
                                  )
                                )}
                                placeholder="Enter API key"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowApiKeys(prev => ({
                                  ...prev,
                                  [integration.id]: !prev[integration.id]
                                }))}
                              >
                                {showApiKeys[integration.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {integration.webhookUrl !== undefined && (
                          <div>
                            <Label>Webhook URL</Label>
                            <Input
                              value={integration.webhookUrl}
                              onChange={(e) => setIntegrations(prev =>
                                prev.map(i =>
                                  i.id === integration.id
                                    ? { ...i, webhookUrl: e.target.value }
                                    : i
                                )
                              )}
                              placeholder="Enter webhook URL"
                            />
                          </div>
                        )}
                        
                        {integration.lastSync && (
                          <div className="text-sm text-gray-500">
                            Last sync: {new Date(integration.lastSync).toLocaleString()}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(integration.id)}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Test Connection
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveIntegration(integration.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations
                .filter(integration => integration.category === category)
                .map((integration) => {
                  const Icon = getCategoryIcon(integration.category);
                  return (
                    <Card key={integration.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            {integration.name}
                          </div>
                          <Badge className={getStatusColor(integration.status)}>
                            {integration.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <Switch
                            checked={integration.isEnabled}
                            onCheckedChange={() => toggleIntegration(integration.id)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(integration.id)}
                          >
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Alert>
        <Plug className="h-4 w-4" />
        <AlertDescription>
          Integrations allow you to connect PayrollKE with external systems. 
          Ensure you have the necessary API credentials and permissions before enabling integrations.
        </AlertDescription>
      </Alert>
    </div>
  );
}
