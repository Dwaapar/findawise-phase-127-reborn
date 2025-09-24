/**
 * BILLION-DOLLAR FEDERATION DASHBOARD - ENTERPRISE ADMIN UI
 * Real-time monitoring and management of the neuron federation
 * Features: Visual network map, health monitoring, config management, hot reload, audit trails
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, CheckCircle, Circle, RefreshCw, Zap, Settings, Activity, Database } from 'lucide-react';

interface FederationStatus {
  isActive: boolean;
  totalNeurons: number;
  activeNeurons: number;
  healthyNeurons: number;
  activeSyncJobs: number;
  lastHealthCheck: string;
  systemLoad: any;
}

interface NeuronHealth {
  neuronId: string;
  name: string;
  type: string;
  status: string;
  healthScore: number;
  lastCheck: string;
  responseTime: number;
}

interface FederationEvent {
  id: string;
  eventId: string;
  neuronId?: string;
  eventType: string;
  eventData: any;
  initiatedBy: string;
  success: boolean;
  timestamp: string;
}

interface SyncJob {
  id: string;
  jobId: string;
  syncType: string;
  targetNeurons: string[];
  status: string;
  progress: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  completedAt?: string;
}

const FederationDashboard: React.FC = () => {
  const [federationStatus, setFederationStatus] = useState<FederationStatus | null>(null);
  const [neuronHealth, setNeuronHealth] = useState<NeuronHealth[]>([]);
  const [events, setEvents] = useState<FederationEvent[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNeuron, setSelectedNeuron] = useState<string>('');

  // Form states
  const [configForm, setConfigForm] = useState({
    key: '',
    value: '',
    version: '',
    targetNeurons: [] as string[],
    environment: 'production'
  });

  const [hotReloadForm, setHotReloadForm] = useState({
    neuronId: '',
    reloadType: 'config',
    payload: '{}',
    rollbackAvailable: false
  });

  // Fetch federation data
  const fetchFederationData = async () => {
    try {
      setIsLoading(true);

      // Fetch status, health, events, and sync jobs in parallel
      const [statusRes, healthRes, eventsRes, syncJobsRes] = await Promise.all([
        fetch('/api/federation/status'),
        fetch('/api/federation/health'),
        fetch('/api/federation/events?limit=20'),
        fetch('/api/federation/sync-jobs?limit=10')
      ]);

      const [status, health, eventsData, syncJobsData] = await Promise.all([
        statusRes.json(),
        healthRes.json(),
        eventsRes.json(),
        syncJobsRes.json()
      ]);

      if (status.success) setFederationStatus(status.data);
      if (health.success) setNeuronHealth(health.data.neurons || []);
      if (eventsData.success) setEvents(eventsData.data || []);
      if (syncJobsData.success) setSyncJobs(syncJobsData.data || []);

    } catch (error) {
      console.error('Failed to fetch federation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Push configuration
  const handlePushConfig = async () => {
    try {
      const response = await fetch('/api/federation/push-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configForm,
          value: JSON.parse(configForm.value)
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Configuration pushed successfully to ${result.data.results.length} neurons`);
        setConfigForm({ key: '', value: '', version: '', targetNeurons: [], environment: 'production' });
        fetchFederationData();
      } else {
        alert(`Failed to push configuration: ${result.error}`);
      }
    } catch (error) {
      alert(`Error pushing configuration: ${error.message}`);
    }
  };

  // Execute hot reload
  const handleHotReload = async () => {
    try {
      const response = await fetch('/api/federation/hot-reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...hotReloadForm,
          payload: JSON.parse(hotReloadForm.payload)
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Hot reload executed successfully on ${hotReloadForm.neuronId}`);
        setHotReloadForm({ neuronId: '', reloadType: 'config', payload: '{}', rollbackAvailable: false });
        fetchFederationData();
      } else {
        alert(`Failed to execute hot reload: ${result.error}`);
      }
    } catch (error) {
      alert(`Error executing hot reload: ${error.message}`);
    }
  };

  // Register new neuron
  const handleRegisterNeuron = async (registration: any) => {
    try {
      const response = await fetch('/api/federation/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration)
      });

      const result = await response.json();
      if (result.success) {
        alert(`Neuron ${registration.neuronId} registered successfully`);
        fetchFederationData();
      } else {
        alert(`Failed to register neuron: ${result.error}`);
      }
    } catch (error) {
      alert(`Error registering neuron: ${error.message}`);
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status: string, healthScore: number) => {
    if (status === 'healthy' && healthScore > 80) {
      return { color: 'bg-green-500', icon: CheckCircle, text: 'Healthy' };
    } else if (status === 'warning' || healthScore > 50) {
      return { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Warning' };
    } else {
      return { color: 'bg-red-500', icon: AlertTriangle, text: 'Critical' };
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchFederationData();
    const interval = setInterval(fetchFederationData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading Federation Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Federation Control Center</h1>
          <p className="text-muted-foreground">Real-time neuron management and monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={federationStatus?.isActive ? "default" : "destructive"}>
            {federationStatus?.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button onClick={fetchFederationData} size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Neurons</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federationStatus?.totalNeurons || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Neurons</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{federationStatus?.activeNeurons || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Neurons</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{federationStatus?.healthyNeurons || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sync Jobs</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{federationStatus?.activeSyncJobs || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="hot-reload">Hot Reload</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="sync-jobs">Sync Jobs</TabsTrigger>
        </TabsList>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Neuron Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {neuronHealth.map((neuron) => {
                  const statusDisplay = getStatusDisplay(neuron.status, neuron.healthScore);
                  const StatusIcon = statusDisplay.icon;

                  return (
                    <div key={neuron.neuronId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${statusDisplay.color}`} />
                        <div>
                          <div className="font-medium">{neuron.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {neuron.neuronId} • {neuron.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <div className="font-medium">Health Score</div>
                          <div className="text-center">{neuron.healthScore}%</div>
                        </div>
                        <div>
                          <div className="font-medium">Response Time</div>
                          <div className="text-center">{neuron.responseTime || 0}ms</div>
                        </div>
                        <div>
                          <div className="font-medium">Last Check</div>
                          <div className="text-center">
                            {neuron.lastCheck ? new Date(neuron.lastCheck).toLocaleTimeString() : 'Never'}
                          </div>
                        </div>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Push Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Config Key</label>
                  <Input
                    placeholder="e.g., theme.primaryColor"
                    value={configForm.key}
                    onChange={(e) => setConfigForm({ ...configForm, key: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <Input
                    placeholder="e.g., 1.0.0"
                    value={configForm.version}
                    onChange={(e) => setConfigForm({ ...configForm, version: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Config Value (JSON)</label>
                <Textarea
                  placeholder='{"color": "#007bff", "enabled": true}'
                  value={configForm.value}
                  onChange={(e) => setConfigForm({ ...configForm, value: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Environment</label>
                <Select value={configForm.environment} onValueChange={(value) => setConfigForm({ ...configForm, environment: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handlePushConfig} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Push Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hot Reload Tab */}
        <TabsContent value="hot-reload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execute Hot Reload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Target Neuron</label>
                  <Select value={hotReloadForm.neuronId} onValueChange={(value) => setHotReloadForm({ ...hotReloadForm, neuronId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select neuron" />
                    </SelectTrigger>
                    <SelectContent>
                      {neuronHealth.map((neuron) => (
                        <SelectItem key={neuron.neuronId} value={neuron.neuronId}>
                          {neuron.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Reload Type</label>
                  <Select value={hotReloadForm.reloadType} onValueChange={(value) => setHotReloadForm({ ...hotReloadForm, reloadType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="config">Configuration</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="assets">Assets</SelectItem>
                      <SelectItem value="full">Full Reload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reload Payload (JSON)</label>
                <Textarea
                  placeholder='{"target": "specific-module", "settings": {}}'
                  value={hotReloadForm.payload}
                  onChange={(e) => setHotReloadForm({ ...hotReloadForm, payload: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={hotReloadForm.rollbackAvailable}
                  onCheckedChange={(checked) => setHotReloadForm({ ...hotReloadForm, rollbackAvailable: checked })}
                />
                <label className="text-sm font-medium">Enable Rollback</label>
              </div>
              <Button onClick={handleHotReload} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Execute Hot Reload
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Federation Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border-l-4 border-l-blue-500 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">{event.eventType.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.neuronId && `Neuron: ${event.neuronId} • `}
                        Initiated by: {event.initiatedBy}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={event.success ? "default" : "destructive"}>
                        {event.success ? "Success" : "Failed"}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Jobs Tab */}
        <TabsContent value="sync-jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncJobs.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{job.syncType.toUpperCase()} Sync</div>
                      <Badge variant={
                        job.status === 'completed' ? 'default' :
                        job.status === 'running' ? 'secondary' :
                        job.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Targets: {job.targetNeurons.length} neurons • 
                      Success: {job.successCount} • 
                      Failed: {job.failureCount}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Started: {new Date(job.createdAt).toLocaleString()}
                      {job.completedAt && ` • Completed: ${new Date(job.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FederationDashboard;