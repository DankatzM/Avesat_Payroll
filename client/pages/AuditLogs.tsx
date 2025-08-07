import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Calendar, Filter, Search, Eye, Download, CheckCircle } from 'lucide-react';
import { AuditLog, AuditAction } from '@shared/api';
import { getAuditLogs } from '@shared/audit-service';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface AuditFilters {
  userId: string;
  entityType: string;
  action: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
}

interface AlgorithmStep {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}

const AuditLogs: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [algorithmProgress, setAlgorithmProgress] = useState(0);

  const [filters, setFilters] = useState<AuditFilters>({
    userId: 'all',
    entityType: 'all',
    action: 'all',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  const algorithmSteps: AlgorithmStep[] = [
    {
      step: 1,
      title: "Capture User ID and Module",
      description: "On every create/update/delete action, capture user ID and module",
      status: 'completed'
    },
    {
      step: 2,
      title: "Record Action Details",
      description: "Record action type, timestamp, record ID affected",
      status: 'completed'
    },
    {
      step: 3,
      title: "Save Audit Entry",
      description: "Save audit entry in audit_log table for traceability",
      status: 'completed'
    }
  ];

  const itemsPerPage = 20;

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Filter logs when filters change
  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setAlgorithmProgress(0);
    
    try {
      // Simulate algorithm steps
      setAlgorithmProgress(33);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAlgorithmProgress(66);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const logs = getAuditLogs();
      setAuditLogs(logs);
      setAlgorithmProgress(100);
      
      console.log(`[AUDIT LOGS] Loaded ${logs.length} audit entries`);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    // Apply filters
    if (filters.userId !== 'all') {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }
    if (filters.entityType !== 'all') {
      filtered = filtered.filter(log => log.entityType === filters.entityType);
    }
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }
    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.entityType.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.entityId.toLowerCase().includes(term) ||
        log.userId.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      userId: 'all',
      entityType: 'all',
      action: 'all',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userId,
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE: return 'bg-green-500';
      case AuditAction.UPDATE: return 'bg-blue-500';
      case AuditAction.DELETE: return 'bg-red-500';
      case AuditAction.LOGIN: return 'bg-purple-500';
      case AuditAction.LOGOUT: return 'bg-gray-500';
      case AuditAction.APPROVE: return 'bg-emerald-500';
      case AuditAction.REJECT: return 'bg-orange-500';
      case AuditAction.CALCULATE: return 'bg-indigo-500';
      case AuditAction.EXPORT: return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const uniqueUsers = [...new Set(auditLogs.map(log => log.userId))];
  const uniqueEntityTypes = [...new Set(auditLogs.map(log => log.entityType))];
  const uniqueActions = Object.values(AuditAction);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  if (!hasRole(['admin', 'hr_manager'])) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Access denied. You don't have permission to view audit logs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">System activity tracking and audit trail</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAlgorithm(true)}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            View Algorithm
          </Button>
          <Button
            onClick={exportAuditLogs}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Algorithm Steps Dialog */}
      <Dialog open={showAlgorithm} onOpenChange={setShowAlgorithm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Logging Algorithm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={algorithmProgress} className="w-full" />
            <div className="space-y-3">
              {algorithmSteps.map((step) => (
                <div key={step.step} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                    step.status === 'completed' ? 'bg-green-500' : 
                    step.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  {step.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <div className="text-sm text-gray-600">Total Audit Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{uniqueUsers.length}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{uniqueEntityTypes.length}</div>
            <div className="text-sm text-gray-600">Modules Tracked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{auditLogs.filter(log => 
              new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length}</div>
            <div className="text-sm text-gray-600">Last 24 Hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="user">User</Label>
              <Select value={filters.userId} onValueChange={(value) => setFilters({...filters, userId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((userId) => (
                    <SelectItem key={userId} value={userId}>{userId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity">Module</Label>
              <Select value={filters.entityType} onValueChange={(value) => setFilters({...filters, entityType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {uniqueEntityTypes.map((entityType) => (
                    <SelectItem key={entityType} value={entityType}>{entityType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={filters.action} onValueChange={(value) => setFilters({...filters, action: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>{action.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {auditLogs.length} audit entries
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Complete system activity log</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Progress value={algorithmProgress} className="w-48 mx-auto mb-4" />
                <p>Processing audit logs...</p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell>
                        <Badge className={`${getActionBadgeColor(log.action)} text-white`}>
                          {log.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Audit ID</Label>
                                    <div className="font-mono text-sm">{selectedLog.id}</div>
                                  </div>
                                  <div>
                                    <Label>Timestamp</Label>
                                    <div>{format(new Date(selectedLog.timestamp), 'PPpp')}</div>
                                  </div>
                                  <div>
                                    <Label>User ID</Label>
                                    <div>{selectedLog.userId}</div>
                                  </div>
                                  <div>
                                    <Label>Action</Label>
                                    <Badge className={`${getActionBadgeColor(selectedLog.action)} text-white`}>
                                      {selectedLog.action.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Entity Type</Label>
                                    <div>{selectedLog.entityType}</div>
                                  </div>
                                  <div>
                                    <Label>Entity ID</Label>
                                    <div className="font-mono text-sm">{selectedLog.entityId}</div>
                                  </div>
                                  <div>
                                    <Label>IP Address</Label>
                                    <div className="font-mono text-sm">{selectedLog.ipAddress}</div>
                                  </div>
                                  <div>
                                    <Label>User Agent</Label>
                                    <div className="text-sm break-all">{selectedLog.userAgent}</div>
                                  </div>
                                </div>
                                {selectedLog.oldValues && (
                                  <div>
                                    <Label>Old Values</Label>
                                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {selectedLog.newValues && (
                                  <div>
                                    <Label>New Values</Label>
                                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                                      {JSON.stringify(selectedLog.newValues, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
