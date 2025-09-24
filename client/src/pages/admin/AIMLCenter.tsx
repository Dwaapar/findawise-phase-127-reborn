import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Activity, 
  Settings, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  lastCycle: string | null;
  modelsActive: number;
  rulesActive: number;
  neuronsConnected: number;
}

interface DataHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  pipelines: number;
  activePipelines: number;
  avgDataQuality: number;
  issues: string[];
}

interface LearningCycle {
  id: string;
  cycleId: string;
  type: 'daily' | 'realtime' | 'manual';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  dataProcessed: {
    events: number;
    sessions: number;
    conversions: number;
    neurons: string[];
  };
  discoveries: {
    newPatterns: number;
    improvementOpportunities: number;
    archetypeInsights: number;
    contentOptimizations: number;
  };
  rulesGenerated: number;
  performance: {
    accuracyImprovement: number;
    expectedRevenueLift: number;
    confidenceScore: number;
  };
}

interface AIMLConfig {
  isEnabled: boolean;
  learningCycles: {
    daily: { enabled: boolean; time: string; };
    realtime: { enabled: boolean; threshold: number; };
    manual: { requireApproval: boolean; };
  };
  safety: {
    silentMode: boolean;
    requireHumanApproval: boolean;
    maxChangesPerCycle: number;
    rollbackEnabled: boolean;
  };
  personalization: {
    enabled: boolean;
    maxRulesPerVertical: number;
    minConfidence: number;
    rolloutPercentage: number;
  };
}

export default function AIMLCenter() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const queryClient = useQueryClient();

  // Fetch AI/ML system status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/ai-ml/status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch learning cycles
  const { data: cyclesData } = useQuery({
    queryKey: ['/api/ai-ml/learning-cycles'],
    refetchInterval: 30000,
  });

  // Fetch configuration
  const { data: configData } = useQuery({
    queryKey: ['/api/ai-ml/config'],
  });

  // Trigger learning cycle mutation
  const triggerCycleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-ml/learning-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to trigger learning cycle');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Learning Cycle Started',
        description: 'Manual learning cycle has been triggered successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-ml/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-ml/learning-cycles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to trigger learning cycle',
        variant: 'destructive',
      });
    },
  });

  // Toggle silent mode mutation
  const toggleSilentModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/ai-ml/silent-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle silent mode');
      return response.json();
    },
    onSuccess: (_, enabled) => {
      toast({
        title: 'Silent Mode Updated',
        description: `Silent mode ${enabled ? 'enabled' : 'disabled'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-ml/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-ml/status'] });
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-ml/export?format=json&days=30');
      if (!response.ok) throw new Error('Failed to export data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-ml-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Export Successful',
        description: 'AI/ML data exported successfully',
      });
    },
  });

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading AI/ML Center...</span>
      </div>
    );
  }

  const systemHealth: SystemHealth = statusData?.data?.system || {};
  const dataHealth: DataHealth = statusData?.data?.data || {};
  const currentCycle = statusData?.data?.currentCycle;
  const config: AIMLConfig = configData?.data || {};
  const cycles: LearningCycle[] = cyclesData?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'degraded': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">AI/ML Center</h1>
            <p className="text-gray-600">Empire Brain Intelligence Layer Control</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDataMutation.mutate()}
            disabled={exportDataMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          <div className="flex items-center space-x-2">
            {config.safety?.silentMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-sm">Silent Mode</span>
            <Switch
              checked={config.safety?.silentMode || false}
              onCheckedChange={(checked) => toggleSilentModeMutation.mutate(checked)}
              disabled={toggleSilentModeMutation.isPending}
            />
          </div>

          <Button
            onClick={() => triggerCycleMutation.mutate()}
            disabled={triggerCycleMutation.isPending || currentCycle?.status === 'running'}
          >
            {currentCycle?.status === 'running' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Trigger Cycle
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.status)}`}>
                  {getStatusIcon(systemHealth.status)}
                  <span className="capitalize">{systemHealth.status}</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Models</p>
                <p className="text-2xl font-bold">{systemHealth.modelsActive || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personalization Rules</p>
                <p className="text-2xl font-bold">{systemHealth.rulesActive || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected Neurons</p>
                <p className="text-2xl font-bold">{systemHealth.neuronsConnected || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Learning Cycle */}
      {currentCycle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className={`h-5 w-5 ${currentCycle.status === 'running' ? 'animate-spin' : ''}`} />
              <span>Current Learning Cycle</span>
              <Badge variant={currentCycle.status === 'running' ? 'default' : 'secondary'}>
                {currentCycle.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Data Processed</p>
                <p className="text-lg font-semibold">
                  {currentCycle.dataProcessed.events.toLocaleString()} events
                </p>
                <p className="text-sm text-gray-500">
                  {currentCycle.dataProcessed.sessions.toLocaleString()} sessions
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discoveries</p>
                <p className="text-lg font-semibold">
                  {currentCycle.discoveries.newPatterns} patterns
                </p>
                <p className="text-sm text-gray-500">
                  {currentCycle.discoveries.improvementOpportunities} opportunities
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected Impact</p>
                <p className="text-lg font-semibold text-green-600">
                  +{(currentCycle.performance.expectedRevenueLift * 100).toFixed(1)}% revenue
                </p>
                <p className="text-sm text-gray-500">
                  {(currentCycle.performance.confidenceScore * 100).toFixed(0)}% confidence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cycles">Learning Cycles</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="pipelines">Data Pipelines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Overall Health</span>
                    <Badge className={getStatusColor(dataHealth.overall)}>
                      {dataHealth.overall}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Pipelines</span>
                    <span>{dataHealth.activePipelines}/{dataHealth.pipelines}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Data Quality</span>
                      <span>{(dataHealth.avgDataQuality * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={dataHealth.avgDataQuality * 100} className="h-2" />
                  </div>
                  {dataHealth.issues && dataHealth.issues.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Issues:</span>
                      {dataHealth.issues.map((issue, index) => (
                        <p key={index} className="text-sm text-red-600">• {issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>System Enabled</span>
                    <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                      {config.isEnabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily Learning</span>
                    <Badge variant={config.learningCycles?.daily?.enabled ? 'default' : 'secondary'}>
                      {config.learningCycles?.daily?.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Real-time Learning</span>
                    <Badge variant={config.learningCycles?.realtime?.enabled ? 'default' : 'secondary'}>
                      {config.learningCycles?.realtime?.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Personalization</span>
                    <Badge variant={config.personalization?.enabled ? 'default' : 'secondary'}>
                      {config.personalization?.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cycles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Learning Cycles</CardTitle>
              <CardDescription>
                History of AI/ML learning cycles and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cycles.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No learning cycles found</p>
                ) : (
                  cycles.slice(0, 10).map((cycle) => (
                    <div key={cycle.cycleId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={
                          cycle.status === 'completed' ? 'default' :
                          cycle.status === 'running' ? 'secondary' :
                          cycle.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {cycle.status}
                        </Badge>
                        <div>
                          <p className="font-medium">{cycle.type} cycle</p>
                          <p className="text-sm text-gray-500">
                            {new Date(cycle.startTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {cycle.rulesGenerated} rules generated
                        </p>
                        <p className="text-sm text-gray-500">
                          {cycle.dataProcessed.events.toLocaleString()} events
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>ML Models</CardTitle>
              <CardDescription>
                Machine learning models and their performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Model management interface coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Personalization Rules</CardTitle>
              <CardDescription>
                Dynamic rules for content and offer personalization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Rules management interface coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines">
          <Card>
            <CardHeader>
              <CardTitle>Data Pipelines</CardTitle>
              <CardDescription>
                Neuron data collection and quality monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Pipeline monitoring interface coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}