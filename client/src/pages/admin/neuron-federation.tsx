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
import { Brain, Plus, Play, Pause, Settings, Trash2, RefreshCw, Activity, Server, Globe, Clock, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import RealtimeDashboard from '@/components/federation/RealtimeDashboard';
import AuditAndHistory from '@/components/federation/AuditAndHistory';
import GlobalControls from '@/components/federation/GlobalControls';
import NeuronControls from '@/components/federation/NeuronControls';
import ApiNeuronDashboard from '@/components/federation/ApiNeuronDashboard';

interface Neuron {
  id: number;
  neuronId: string;
  name: string;
  type: string;
  url: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  version: string;
  supportedFeatures: string[];
  healthScore: number;
  uptime: number;
  lastCheckIn: string;
  createdAt: string;
  metadata: any;
}

interface NeuronConfig {
  id: number;
  neuronId: string;
  configVersion: string;
  configData: any;
  isActive: boolean;
  deployedBy?: string;
  deployedAt?: string;
  notes?: string;
}

interface NeuronAnalytics {
  neuronId: string;
  pageViews: number;
  uniqueVisitors: number;
  conversions: number;
  revenue: string;
  uptime: number;
  errorCount: number;
  averageResponseTime: number;
}

const NeuronFederationDashboard: React.FC = () => {
  const [selectedNeuron, setSelectedNeuron] = useState<Neuron | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch neurons using default queryFn
  const { data: neuronsResponse, isLoading: neuronsLoading, error: neuronsError } = useQuery({
    queryKey: ['/api/federation/neurons']
  });
  const neurons = (neuronsResponse as any)?.data || [];

  // Fetch federation dashboard data
  const { data: dashboardResponse, error: dashboardError } = useQuery({
    queryKey: ['/api/federation/dashboard']
  });
  const dashboardData = (dashboardResponse as any)?.data || { 
    neurons: [], 
    healthStatus: { total: 0, healthy: 0, warning: 0, critical: 0, offline: 0 }, 
    recentEvents: [] 
  };

  // Fetch health overview
  const { data: healthResponse, error: healthError } = useQuery({
    queryKey: ['/api/federation/health/overview']
  });
  const healthOverview = (healthResponse as any)?.data || { total: 0, healthy: 0, warning: 0, critical: 0 };

  // Mutations with proper error handling
  const registerNeuronMutation = useMutation({
    mutationFn: async (neuronData: any) => {
      try {
        return await apiRequest('/api/federation/neurons/register', {
          method: 'POST',
          body: JSON.stringify(neuronData)
        });
      } catch (error) {
        console.error('Failed to register neuron:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/federation/neurons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/federation/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/federation/health/overview'] });
      setShowAddDialog(false);
    },
    onError: (error) => {
      console.error('Neuron registration failed:', error);
    }
  });

  const deactivateNeuronMutation = useMutation({
    mutationFn: (neuronId: string) => apiRequest(`/api/federation/neurons/${neuronId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/federation/neurons'] });
    }
  });

  const deployConfigMutation = useMutation({
    mutationFn: ({ configId, deployedBy }: { configId: number; deployedBy: string }) => 
      apiRequest(`/api/federation/configs/${configId}/deploy`, {
        method: 'POST',
        body: JSON.stringify({ deployedBy })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/federation/neurons'] });
      setShowConfigDialog(false);
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Show error alert if there are API errors
  const hasErrors = neuronsError || dashboardError || healthError;

  return (
    <div className="space-y-8">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Real-time Dashboard</TabsTrigger>
          <TabsTrigger value="management">Neuron Management</TabsTrigger>
          <TabsTrigger value="api-neurons">API-Only Neurons</TabsTrigger>
          <TabsTrigger value="audit">Audit & History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <RealtimeDashboard />
        </TabsContent>

        <TabsContent value="management" className="space-y-6 p-8">
          {/* Global Controls Section */}
          <GlobalControls neurons={neurons} />
          
          {/* Error Alert */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertDescription>
                Some federation data could not be loaded. The system is working, but some features may be limited.
                {neuronsError && " • Neuron data unavailable"}
                {dashboardError && " • Dashboard data unavailable"}
                {healthError && " • Health monitoring unavailable"}
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-8 w-8 text-blue-600" />
                Empire Brain - Neuron Management
              </h1>
              <p className="text-muted-foreground">
                Master control center for managing all neurons across the digital empire
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Neuron
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Register New Neuron</DialogTitle>
                  <DialogDescription>
                    Add a new micro-app to the federation network
                  </DialogDescription>
                </DialogHeader>
                <AddNeuronForm 
                  onSubmit={(data) => registerNeuronMutation.mutate(data)}
                  isLoading={registerNeuronMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Health Overview */}
          {healthOverview && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Neurons</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthOverview.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Healthy</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{healthOverview.healthy}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Warning</CardTitle>
                  <Activity className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{healthOverview.warning}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical</CardTitle>
                  <Activity className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{healthOverview.critical}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Neurons Table */}
          <Card>
            <CardHeader>
              <CardTitle>Registered Neurons</CardTitle>
              <CardDescription>
                Manage and monitor all neurons in the federation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {neuronsLoading ? (
                <div className="text-center py-8">Loading neurons...</div>
              ) : neurons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No neurons registered yet. Click "Add Neuron" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Neuron Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Last Check-in</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {neurons.map((neuron: Neuron) => (
                      <TableRow key={neuron.neuronId}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{neuron.name}</span>
                            <span className="text-sm text-muted-foreground">{neuron.neuronId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{neuron.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(neuron.status)}>
                            {neuron.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={getHealthColor(neuron.healthScore)}>
                            {neuron.healthScore}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {neuron.lastCheckIn ? 
                            formatDistanceToNow(new Date(neuron.lastCheckIn), { addSuffix: true }) :
                            'Never'
                          }
                        </TableCell>
                        <TableCell>{neuron.version}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <NeuronControls neuron={neuron} />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deactivateNeuronMutation.mutate(neuron.neuronId)}
                              disabled={deactivateNeuronMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Config Management Dialog */}
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Manage Neuron: {selectedNeuron?.name}</DialogTitle>
                <DialogDescription>
                  Configure and deploy updates to this neuron
                </DialogDescription>
              </DialogHeader>
              {selectedNeuron && (
                <NeuronConfigManager 
                  neuron={selectedNeuron}
                  onDeploy={(configId, deployedBy) => deployConfigMutation.mutate({ configId, deployedBy })}
                  isDeploying={deployConfigMutation.isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="api-neurons" className="space-y-6 p-8">
          <ApiNeuronDashboard />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6 p-8">
          <AuditAndHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AddNeuronForm: React.FC<{
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    neuronId: '',
    name: '',
    type: '',
    url: '',
    version: '1.0.0',
    supportedFeatures: [],
    metadata: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: 'active',
      healthScore: 100,
      uptime: 0,
      isActive: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="neuronId">Neuron ID</Label>
          <Input
            id="neuronId"
            value={formData.neuronId}
            onChange={(e) => setFormData(prev => ({ ...prev, neuronId: e.target.value }))}
            placeholder="e.g., content-manager"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Content Management System"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Neuron Type</Label>
          <Select onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page-generator">Page Generator</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="affiliate">Affiliate Management</SelectItem>
              <SelectItem value="localization">Localization</SelectItem>
              <SelectItem value="experimentation">A/B Testing</SelectItem>
              <SelectItem value="content">Content Management</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="marketing">Marketing Automation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="url">Neuron URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://neuron.example.com"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="features">Supported Features (comma-separated)</Label>
        <Input
          id="features"
          value={formData.supportedFeatures.join(', ')}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            supportedFeatures: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
          }))}
          placeholder="e.g., dynamic-pages, seo-optimization, analytics"
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register Neuron'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const NeuronConfigManager: React.FC<{
  neuron: Neuron;
  onDeploy: (configId: number, deployedBy: string) => void;
  isDeploying: boolean;
}> = ({ neuron, onDeploy, isDeploying }) => {
  const { data: configs = [] } = useQuery({
    queryKey: ['/api/federation/neurons', neuron.neuronId, 'configs'],
    queryFn: () => apiRequest(`/api/federation/neurons/${neuron.neuronId}/configs`).then(res => res.data)
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/federation/neurons', neuron.neuronId, 'analytics'],
    queryFn: () => apiRequest(`/api/federation/neurons/${neuron.neuronId}/analytics`).then(res => res.data)
  });

  return (
    <Tabs defaultValue="configs" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="configs">Configurations</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="status">Status</TabsTrigger>
      </TabsList>
      
      <TabsContent value="configs" className="space-y-4">
        <div className="space-y-4">
          {configs.map((config: NeuronConfig) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Version {config.configVersion}</CardTitle>
                    <CardDescription>
                      {config.deployedBy && config.deployedAt ? 
                        `Deployed by ${config.deployedBy} on ${new Date(config.deployedAt).toLocaleString()}` :
                        'Not deployed'
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.isActive && <Badge>Active</Badge>}
                    <Button
                      size="sm"
                      onClick={() => onDeploy(config.id, 'admin')}
                      disabled={isDeploying || config.isActive}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Deploy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(config.configData, null, 2)}
                </pre>
                {config.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{config.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics && analytics.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.reduce((sum: number, a: NeuronAnalytics) => sum + (a.pageViews || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.reduce((sum: number, a: NeuronAnalytics) => sum + (a.conversions || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${analytics.reduce((sum: number, a: NeuronAnalytics) => sum + parseFloat(a.revenue || '0'), 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(analytics.reduce((sum: number, a: NeuronAnalytics) => sum + (a.averageResponseTime || 0), 0) / analytics.length)}ms
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No analytics data available</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="status">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Health Score</Label>
                  <div className={`text-2xl font-bold ${getHealthColor(neuron.healthScore)}`}>
                    {neuron.healthScore}%
                  </div>
                </div>
                <div>
                  <Label>Uptime</Label>
                  <div className="text-2xl font-bold">
                    {Math.floor(neuron.uptime / 3600)}h {Math.floor((neuron.uptime % 3600) / 60)}m
                  </div>
                </div>
              </div>
              <div>
                <Label>Supported Features</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {neuron.supportedFeatures.map((feature, index) => (
                    <Badge key={index} variant="outline">{feature}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export default NeuronFederationDashboard;