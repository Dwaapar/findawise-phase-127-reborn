import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Filter, 
  History, 
  Shield, 
  User,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditEvent {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface ConfigHistory {
  id: number;
  neuronId: string;
  configVersion: string;
  deployedBy: string;
  deployedAt: string;
  notes: string;
  isActive: boolean;
}

const AuditAndHistory: React.FC = () => {
  const [auditFilters, setAuditFilters] = useState({
    entityType: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: ''
  });

  // Fetch audit trail
  const { data: auditResponse = { data: [] }, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/federation/audit', auditFilters],
    enabled: true
  });
  const auditEvents = (auditResponse as any)?.data || [];

  // Fetch federation events
  const { data: eventsResponse = { data: [] }, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/federation/events'],
    enabled: true
  });
  const federationEvents = (eventsResponse as any)?.data || [];

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'register_neuron':
      case 'activate_neuron':
        return 'text-green-600';
      case 'deactivate_neuron':
      case 'delete_neuron':
        return 'text-red-600';
      case 'config_deploy':
      case 'config_update':
        return 'text-blue-600';
      case 'config_rollback':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'register_neuron':
      case 'activate_neuron':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deactivate_neuron':
      case 'delete_neuron':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'config_deploy':
      case 'config_update':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'config_rollback':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleExportAudit = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/federation/audit/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: auditFilters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: auditFilters.endDate || new Date().toISOString(),
          format
        }),
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export audit report:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Audit Trail & History
          </h2>
          <p className="text-muted-foreground">
            Complete audit trail of all federation activities and configuration changes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportAudit('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportAudit('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
          <TabsTrigger value="events">Federation Events</TabsTrigger>
          <TabsTrigger value="configs">Config History</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Security Audit Trail
              </CardTitle>
              <CardDescription>
                Comprehensive log of all user actions and system operations
              </CardDescription>
              
              {/* Filters */}
              <div className="flex items-center gap-4 pt-4">
                <Select
                  value={auditFilters.entityType}
                  onValueChange={(value) => 
                    setAuditFilters(prev => ({ ...prev, entityType: value }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="neuron">Neuron</SelectItem>
                    <SelectItem value="config">Configuration</SelectItem>
                    <SelectItem value="experiment">Experiment</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={auditFilters.action}
                  onValueChange={(value) => 
                    setAuditFilters(prev => ({ ...prev, action: value }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    <SelectItem value="register_neuron">Register Neuron</SelectItem>
                    <SelectItem value="config_deploy">Deploy Config</SelectItem>
                    <SelectItem value="config_rollback">Rollback Config</SelectItem>
                    <SelectItem value="deactivate_neuron">Deactivate Neuron</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="User ID"
                  value={auditFilters.userId}
                  onChange={(e) => 
                    setAuditFilters(prev => ({ ...prev, userId: e.target.value }))
                  }
                  className="w-[180px]"
                />

                <Input
                  type="date"
                  value={auditFilters.startDate}
                  onChange={(e) => 
                    setAuditFilters(prev => ({ ...prev, startDate: e.target.value }))
                  }
                  className="w-[150px]"
                />

                <Input
                  type="date"
                  value={auditFilters.endDate}
                  onChange={(e) => 
                    setAuditFilters(prev => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-[150px]"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditFilters({
                    entityType: '',
                    action: '',
                    userId: '',
                    startDate: '',
                    endDate: ''
                  })}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="text-center py-8">Loading audit trail...</div>
              ) : auditEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit events found matching the current filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEvents.map((event: AuditEvent) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(event.action)}
                            <span className={getActionColor(event.action)}>
                              {event.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.entityType}</div>
                            <div className="text-sm text-muted-foreground">{event.entityId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {event.userId || 'System'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm">
                                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {event.ipAddress || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {event.metadata && Object.keys(event.metadata).length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:underline">View Details</summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">No details</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Federation Events
              </CardTitle>
              <CardDescription>
                Real-time events from the federation system and all connected neurons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-8">Loading federation events...</div>
              ) : federationEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No federation events recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Neuron</TableHead>
                      <TableHead>Initiated By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {federationEvents.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {event.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.neuronId || 'System'}
                        </TableCell>
                        <TableCell>
                          {event.initiatedBy || 'System'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.success ? 'default' : 'destructive'}>
                            {event.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {event.eventData && Object.keys(event.eventData).length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:underline">View Data</summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(event.eventData, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">No data</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Configuration History
              </CardTitle>
              <CardDescription>
                Complete history of all configuration deployments and changes across neurons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Configuration history will be displayed here when available.
                This includes all config deployments, rollbacks, and version changes.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditAndHistory;