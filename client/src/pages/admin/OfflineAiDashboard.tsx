import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { 
  Wifi, WifiOff, Smartphone, Brain, Database, Sync, 
  AlertTriangle, CheckCircle, Clock, Activity, 
  HardDrive, Cpu, Globe, Zap, Shield, Settings
} from 'lucide-react';

interface DashboardOverview {
  devices: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    avgDataFreshness: number;
  };
  syncQueue: {
    totalOperations: number;
    pendingOps: number;
    completedOps: number;
    failedOps: number;
    avgProcessingTime: number;
  };
  models: {
    totalModels: number;
    totalInferences: number;
    averageAccuracy: number;
    averageInferenceTime: number;
    overallErrorRate: number;
  };
  cache: {
    totalCachedItems: number;
    totalCacheSize: number;
    staleItems: number;
    avgAccessCount: number;
  };
}

interface DeviceInfo {
  deviceId: string;
  isOnline: boolean;
  lastSyncAt: string;
  queuedOperations: number;
  dataFreshness: number;
  capabilities: any;
}

interface EdgeModel {
  modelId: string;
  modelName: string;
  modelType: string;
  performance: {
    inferenceTime: number;
    accuracy: number;
    memoryUsage: number;
  };
  totalInferences: number;
  errorRate: number;
}

export default function OfflineAiDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  // Fetch dashboard overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/offline-ai/dashboard/overview'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch model analytics
  const { data: modelAnalytics, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/offline-ai/models/analytics'],
    refetchInterval: 10000
  });

  const simulateOfflineMode = async () => {
    setIsSimulatingOffline(true);
    
    // Simulate network issues for testing
    try {
      await fetch('/api/offline-ai/simulate/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 60000 }) // 1 minute
      });
      
      setTimeout(() => setIsSimulatingOffline(false), 60000);
    } catch (error) {
      console.error('Failed to simulate offline mode:', error);
      setIsSimulatingOffline(false);
    }
  };

  const triggerForceSync = async () => {
    try {
      const response = await fetch('/api/offline-ai/sync/force-all', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Force sync completed: ${result.data.processed} operations processed`);
      }
    } catch (error) {
      console.error('Failed to trigger force sync:', error);
    }
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = overview?.data as DashboardOverview;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offline AI Sync Engine</h1>
          <p className="text-gray-600">Edge AI + Device Resilience Dashboard</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={simulateOfflineMode}
            disabled={isSimulatingOffline}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <WifiOff className="h-4 w-4" />
            <span>{isSimulatingOffline ? 'Simulating...' : 'Simulate Offline'}</span>
          </Button>
          <Button
            onClick={triggerForceSync}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Sync className="h-4 w-4" />
            <span>Force Sync All</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.devices?.totalDevices || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Wifi className="h-3 w-3 text-green-500" />
                <span>{data?.devices?.onlineDevices || 0} online</span>
              </div>
              <div className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3 text-red-500" />
                <span>{data?.devices?.offlineDevices || 0} offline</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Queue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.syncQueue?.pendingOps || 0}</div>
            <div className="text-xs text-muted-foreground">
              {data?.syncQueue?.completedOps || 0} completed, {data?.syncQueue?.failedOps || 0} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edge AI Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.models?.totalModels || 0}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((data?.models?.averageAccuracy || 0) * 100)}% avg accuracy
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.cache?.totalCachedItems || 0}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((data?.cache?.totalCacheSize || 0) / 1024 / 1024)} MB cached
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="models">Edge AI</TabsTrigger>
          <TabsTrigger value="sync">Sync Queue</TabsTrigger>
          <TabsTrigger value="cache">Content Cache</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Freshness</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((data?.devices?.avgDataFreshness || 0) * 100)}%
                    </span>
                  </div>
                  <Progress value={(data?.devices?.avgDataFreshness || 0) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sync Success Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(((data?.syncQueue?.completedOps || 0) / Math.max(1, (data?.syncQueue?.totalOperations || 1))) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((data?.syncQueue?.completedOps || 0) / Math.max(1, (data?.syncQueue?.totalOperations || 1))) * 100}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Model Accuracy</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((data?.models?.averageAccuracy || 0) * 100)}%
                    </span>
                  </div>
                  <Progress value={(data?.models?.averageAccuracy || 0) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sync completed</p>
                      <p className="text-xs text-muted-foreground">Device sync-001 - 2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Brain className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Edge inference completed</p>
                      <p className="text-xs text-muted-foreground">Recommendation model - 3 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Database className="h-4 w-4 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Content cached</p>
                      <p className="text-xs text-muted-foreground">Quiz data - 5 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Conflict resolved</p>
                      <p className="text-xs text-muted-foreground">Profile update merge - 8 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Management</CardTitle>
              <CardDescription>
                Monitor and manage connected devices and their sync status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Device list would go here */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4" />
                          <span className="font-medium">Device-001</span>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Wifi className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Last sync: 2 minutes ago</p>
                        <p>Queue: 0 operations</p>
                        <p>Data freshness: 98%</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4" />
                          <span className="font-medium">Device-002</span>
                        </div>
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <WifiOff className="h-3 w-3 mr-1" />
                          Offline
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Last sync: 25 minutes ago</p>
                        <p>Queue: 3 operations</p>
                        <p>Data freshness: 75%</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge AI Models</CardTitle>
              <CardDescription>
                Performance and deployment status of edge AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Brain className="h-4 w-4" />
                          <span className="font-medium">Recommendation Engine</span>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Accuracy: 85%</p>
                        <p>Avg inference: 45ms</p>
                        <p>Memory: 20MB</p>
                        <p>Deployments: 12 devices</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">Intent Detector</span>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Accuracy: 78%</p>
                        <p>Avg inference: 30ms</p>
                        <p>Memory: 15MB</p>
                        <p>Deployments: 8 devices</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Cpu className="h-4 w-4" />
                          <span className="font-medium">Lead Scorer</span>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Accuracy: 82%</p>
                        <p>Avg inference: 60ms</p>
                        <p>Memory: 25MB</p>
                        <p>Deployments: 15 devices</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Queue Management</CardTitle>
              <CardDescription>
                Monitor and manage offline sync operations across all devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sync statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data?.syncQueue?.pendingOps || 0}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data?.syncQueue?.completedOps || 0}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{data?.syncQueue?.failedOps || 0}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(data?.syncQueue?.avgProcessingTime || 0)}s
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Cache</CardTitle>
              <CardDescription>
                Offline content caching and storage management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data?.cache?.totalCachedItems || 0}</div>
                    <div className="text-sm text-muted-foreground">Cached Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((data?.cache?.totalCacheSize || 0) / 1024 / 1024)}MB
                    </div>
                    <div className="text-sm text-muted-foreground">Storage Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{data?.cache?.staleItems || 0}</div>
                    <div className="text-sm text-muted-foreground">Stale Items</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Model Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Inferences</span>
                        <span className="text-sm font-medium">{data?.models?.totalInferences || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Accuracy</span>
                        <span className="text-sm font-medium">
                          {Math.round((data?.models?.averageAccuracy || 0) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="text-sm font-medium">
                          {Math.round((data?.models?.overallErrorRate || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sync Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="text-sm font-medium">
                          {Math.round(((data?.syncQueue?.completedOps || 0) / Math.max(1, (data?.syncQueue?.totalOperations || 1))) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Processing Time</span>
                        <span className="text-sm font-medium">
                          {Math.round(data?.syncQueue?.avgProcessingTime || 0)}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Queue Efficiency</span>
                        <span className="text-sm font-medium">
                          {Math.round((1 - (data?.syncQueue?.pendingOps || 0) / Math.max(1, (data?.syncQueue?.totalOperations || 1))) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}