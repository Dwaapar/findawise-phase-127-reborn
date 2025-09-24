import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Activity, 
  Terminal, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Pause,
  Play,
  Trash2,
  Settings,
  Eye,
  Command,
  BarChart3,
  Zap,
  Globe,
  Database
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow, format } from 'date-fns';

interface ApiNeuron {
  id: number;
  neuronId: string;
  name: string;
  type: string;
  language: string;
  version: string;
  baseUrl?: string;
  healthcheckEndpoint: string;
  apiEndpoints: string[];
  capabilities: string[];
  status: 'inactive' | 'active' | 'maintenance' | 'error' | 'starting';
  lastHeartbeat?: string;
  healthScore: number;
  uptime: number;
  errorCount: number;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  lastError?: string;
  isOnline?: boolean;
  analytics?: any;
  registeredAt: string;
  metadata?: any;
}

interface ApiNeuronCommand {
  id: number;
  commandId: string;
  commandType: string;
  commandData: any;
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed' | 'timeout';
  issuedBy: string;
  issuedAt: string;
  completedAt?: string;
  response?: any;
  errorMessage?: string;
}

const ApiNeuronDashboard: React.FC = () => {
  const [selectedNeuron, setSelectedNeuron] = useState<ApiNeuron | null>(null);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCommandType, setSelectedCommandType] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch API neurons
  const { data: neuronsResponse, isLoading: neuronsLoading, error: neuronsError } = useQuery({
    queryKey: ['/api/api-neurons/all'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  const apiNeurons = (neuronsResponse as any)?.data || [];

  // Fetch health overview
  const { data: healthResponse, error: healthError } = useQuery({
    queryKey: ['/api/api-neurons/health/overview'],
    refetchInterval: 30000
  });
  const healthOverview = (healthResponse as any)?.data || {
    total: 0,
    online: 0,
    offline: 0,
    warning: 0,
    critical: 0,
    averageHealthScore: 0,
    averageUptime: 0
  };

  // Fetch analytics overview
  const { data: analyticsResponse } = useQuery({
    queryKey: ['/api/api-neurons/analytics/overview'],
    refetchInterval: 60000 // Refresh every minute
  });
  const analyticsOverview = (analyticsResponse as any)?.data || {};

  // Issue command mutation
  const issueCommandMutation = useMutation({
    mutationFn: async ({ neuronId, commandData }: { neuronId: string; commandData: any }) => {
      return await apiRequest(`/api/api-neurons/${neuronId}/commands`, {
        method: 'POST',
        body: JSON.stringify(commandData),
        headers: {
          'x-admin-key': 'admin-secret-key' // In production, use proper admin authentication
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-neurons/all'] });
      setShowCommandDialog(false);
    }
  });

  // Update neuron mutation
  const updateNeuronMutation = useMutation({
    mutationFn: async ({ neuronId, updates }: { neuronId: string; updates: any }) => {
      return await apiRequest(`/api/api-neurons/${neuronId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'x-admin-key': 'admin-secret-key'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-neurons/all'] });
    }
  });

  // Deactivate neuron mutation
  const deactivateNeuronMutation = useMutation({
    mutationFn: async ({ neuronId, reason }: { neuronId: string; reason: string }) => {
      return await apiRequest(`/api/api-neurons/${neuronId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
        headers: {
          'x-admin-key': 'admin-secret-key'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-neurons/all'] });
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'outline';
      case 'error': return 'destructive';
      case 'starting': return 'default';
      default: return 'secondary';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOnlineStatus = (neuron: ApiNeuron) => {
    if (!neuron.lastHeartbeat) return false;
    const lastHeartbeat = new Date(neuron.lastHeartbeat);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60);
    return diffMinutes < 2; // Consider online if heartbeat within 2 minutes
  };

  const calculateSuccessRate = (neuron: ApiNeuron) => {
    if (neuron.totalRequests === 0) return 100;
    return Math.round((neuron.successfulRequests / neuron.totalRequests) * 100);
  };

  const handleIssueCommand = (commandType: string, commandData: any) => {
    if (!selectedNeuron) return;
    
    issueCommandMutation.mutate({
      neuronId: selectedNeuron.neuronId,
      commandData: {
        commandType,
        commandData,
        priority: commandType === 'stop' ? 10 : 1
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6 text-purple-600" />
            API-Only Neurons Control Center
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage headless neurons, backend services, and API integrations
          </p>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Neurons</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthOverview.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthOverview.online}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{healthOverview.offline}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{healthOverview.warning}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(healthOverview.averageHealthScore)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Uptime</CardTitle>
            <Clock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {Math.round(healthOverview.averageUptime / 3600)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Neurons Table */}
      <Card>
        <CardHeader>
          <CardTitle>API-Only Neurons</CardTitle>
          <CardDescription>
            Manage backend services, data processors, and headless integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {neuronsLoading ? (
            <div className="text-center py-8">Loading API neurons...</div>
          ) : apiNeurons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No API neurons registered yet.</p>
              <p className="text-sm">Deploy a Python, Go, or Node.js neuron to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Neuron Info</TableHead>
                  <TableHead>Language/Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Last Heartbeat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiNeurons.map((neuron: ApiNeuron) => {
                  const isOnline = getOnlineStatus(neuron);
                  const successRate = calculateSuccessRate(neuron);
                  
                  return (
                    <TableRow key={neuron.neuronId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{neuron.name}</span>
                            {isOnline && (
                              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{neuron.neuronId}</span>
                          <div className="flex gap-1 mt-1">
                            {neuron.capabilities.slice(0, 2).map((cap) => (
                              <Badge key={cap} variant="outline" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                            {neuron.capabilities.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{neuron.capabilities.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant="secondary">{neuron.language}</Badge>
                          <span className="text-sm text-muted-foreground mt-1">{neuron.type}</span>
                          <span className="text-xs text-muted-foreground">v{neuron.version}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={getStatusBadgeVariant(neuron.status)}>
                            {neuron.status}
                          </Badge>
                          {neuron.lastError && (
                            <span className="text-xs text-red-600 truncate max-w-32" title={neuron.lastError}>
                              {neuron.lastError}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getHealthColor(neuron.healthScore)}`}>
                              {neuron.healthScore}%
                            </span>
                          </div>
                          <Progress value={neuron.healthScore} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            <span>{successRate}% success</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            <span>{neuron.averageResponseTime}ms avg</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" />
                            <span>{neuron.totalRequests.toLocaleString()} requests</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {neuron.lastHeartbeat ? (
                            <>
                              <span className="text-sm">
                                {formatDistanceToNow(new Date(neuron.lastHeartbeat), { addSuffix: true })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(neuron.lastHeartbeat), 'MMM d, HH:mm')}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedNeuron(neuron);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedNeuron(neuron);
                              setShowCommandDialog(true);
                            }}
                          >
                            <Command className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => 
                              deactivateNeuronMutation.mutate({
                                neuronId: neuron.neuronId,
                                reason: 'Deactivated from admin dashboard'
                              })
                            }
                            disabled={deactivateNeuronMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Command Dialog */}
      <Dialog open={showCommandDialog} onOpenChange={setShowCommandDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Command to {selectedNeuron?.name}</DialogTitle>
            <DialogDescription>
              Send commands to control the API neuron remotely
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="commandType">Command Type</Label>
              <Select value={selectedCommandType} onValueChange={setSelectedCommandType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select command type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health_check">Health Check</SelectItem>
                  <SelectItem value="config_update">Update Configuration</SelectItem>
                  <SelectItem value="restart">Restart Service</SelectItem>
                  <SelectItem value="run_task">Execute Task</SelectItem>
                  <SelectItem value="stop">Stop Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedCommandType === 'run_task' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data_processing">Data Processing</SelectItem>
                      <SelectItem value="report_generation">Report Generation</SelectItem>
                      <SelectItem value="batch_processing">Batch Processing</SelectItem>
                      <SelectItem value="cleanup">System Cleanup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taskParams">Task Parameters (JSON)</Label>
                  <Textarea
                    placeholder='{"input": "example", "output": "result"}'
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {selectedCommandType === 'config_update' && (
              <div>
                <Label htmlFor="configData">Configuration (JSON)</Label>
                <Textarea
                  placeholder='{"heartbeat_interval": 60, "log_level": "INFO"}'
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCommandDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedCommandType) {
                    handleIssueCommand(selectedCommandType, {});
                  }
                }}
                disabled={!selectedCommandType || issueCommandMutation.isPending}
              >
                {issueCommandMutation.isPending ? 'Sending...' : 'Send Command'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNeuron?.name} - Detailed Information</DialogTitle>
            <DialogDescription>
              Comprehensive neuron status, metrics, and configuration
            </DialogDescription>
          </DialogHeader>
          {selectedNeuron && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="logs">Recent Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">System Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Neuron ID:</span>
                          <span className="font-mono text-sm">{selectedNeuron.neuronId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Language:</span>
                          <Badge variant="secondary">{selectedNeuron.language}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{selectedNeuron.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span>{selectedNeuron.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Registered:</span>
                          <span>{format(new Date(selectedNeuron.registeredAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Health Score:</span>
                          <span className={getHealthColor(selectedNeuron.healthScore)}>
                            {selectedNeuron.healthScore}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uptime:</span>
                          <span>{Math.round(selectedNeuron.uptime / 3600)}h {Math.round((selectedNeuron.uptime % 3600) / 60)}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Requests:</span>
                          <span>{selectedNeuron.totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span>{calculateSuccessRate(selectedNeuron)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Response:</span>
                          <span>{selectedNeuron.averageResponseTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Errors:</span>
                          <span className="text-red-600">{selectedNeuron.errorCount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedNeuron.capabilities.map((capability) => (
                          <Badge key={capability} variant="outline">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="endpoints" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Available API Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedNeuron.apiEndpoints.map((endpoint, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <code className="text-sm">{endpoint}</code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Detailed analytics charts would be displayed here</p>
                    <p className="text-sm">Performance trends, request patterns, and error analysis</p>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4" />
                    <p>Recent activity logs and events would be displayed here</p>
                    <p className="text-sm">Command executions, errors, and status changes</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiNeuronDashboard;