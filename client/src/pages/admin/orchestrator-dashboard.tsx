import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AdminSidebar from '@/components/AdminSidebar';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Zap,
  Shield,
  BookOpen,
  Download,
  Upload,
  Lock,
  Unlock,
  Brain,
  Target,
  Layers
} from 'lucide-react';

interface OrchestrationRun {
  id: string;
  timestamp: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  changes: any[];
  analytics: {
    pagesAnalyzed: number;
    offersAnalyzed: number;
    changesProposed: number;
    changesApplied: number;
  };
  duration: number;
  error?: string;
}

interface OrchestrationConfig {
  isEnabled: boolean;
  confidenceThreshold: {
    minImpressions: number;
    minCTR: number;
    minEngagement: number;
  };
  archetype: {
    enabled: boolean;
    segments: string[];
  };
  safety: {
    backupEnabled: boolean;
    maxChangesPerRun: number;
    requireManualApproval: boolean;
  };
  scheduling: {
    frequency: 'manual' | 'daily' | 'weekly';
    time?: string;
  };
}

export default function OrchestratorDashboard() {
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [configUpdates, setConfigUpdates] = useState<Partial<OrchestrationConfig>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch orchestration status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/orchestrator/status'],
    refetchInterval: 30000 // Refresh every 30 seconds (optimized)
  });

  // Fetch orchestration history
  const { data: history } = useQuery({
    queryKey: ['/api/orchestrator/history'],
    refetchInterval: 60000 // Refresh every 60 seconds (optimized)
  });

  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/orchestrator/analytics'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch element rankings
  const { data: rankings } = useQuery({
    queryKey: ['/api/orchestrator/rankings'],
    refetchInterval: 30000
  });

  // Fetch configuration backups
  const { data: backups } = useQuery({
    queryKey: ['/api/orchestrator/backups']
  });

  // Fetch changelog
  const { data: changelog } = useQuery({
    queryKey: ['/api/orchestrator/changelog'],
    refetchInterval: 30000
  });

  // Run orchestration mutation
  const runOrchestration = useMutation({
    mutationFn: () => apiRequest('/api/orchestrator/run', {
      method: 'POST',
      body: { manual: true }
    }),
    onSuccess: (data) => {
      toast({
        title: "Orchestration Started",
        description: `Run ${data.data.id} completed with ${data.data.changes.length} changes`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestrator/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestrator/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Orchestration Failed",
        description: error.message || "Failed to start orchestration",
        variant: "destructive",
      });
    }
  });

  // Cancel orchestration mutation
  const cancelOrchestration = useMutation({
    mutationFn: () => apiRequest('/api/orchestrator/cancel', {
      method: 'POST'
    }),
    onSuccess: () => {
      toast({
        title: "Orchestration Cancelled",
        description: "Current orchestration run has been cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestrator/status'] });
    }
  });

  // Update configuration mutation
  const updateConfig = useMutation({
    mutationFn: (updates: Partial<OrchestrationConfig>) => 
      apiRequest('/api/orchestrator/config', {
        method: 'PUT',
        body: updates
      }),
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Orchestration configuration has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestrator/status'] });
      setConfigUpdates({});
    }
  });

  // Rollback mutation
  const rollback = useMutation({
    mutationFn: (runId: string) => 
      apiRequest('/api/orchestrator/rollback', {
        method: 'POST',
        body: { runId }
      }),
    onSuccess: () => {
      toast({
        title: "Rollback Successful",
        description: "Configuration has been rolled back successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestrator/status'] });
    }
  });

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: (description: string) => 
      apiRequest('/api/orchestrator/backup', {
        method: 'POST',
        body: { description }
      }),
    onSuccess: () => {
      toast({
        title: "Backup Created",
        description: "Configuration backup has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orchestrator/backups'] });
    }
  });

  const currentRun = status?.data?.currentRun;
  const config = status?.data?.config;
  const isRunning = status?.data?.isRunning;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orchestration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      <div className="ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Orchestrator Dashboard</h1>
          <p className="text-gray-600 mt-2">Central intelligence system for continuous optimization</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={config?.isEnabled ? "default" : "secondary"}>
            {config?.isEnabled ? "Enabled" : "Disabled"}
          </Badge>
          {isRunning && (
            <Badge variant="outline" className="animate-pulse">
              Running
            </Badge>
          )}
        </div>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => runOrchestration.mutate()} 
              disabled={isRunning || runOrchestration.isPending}
              className="w-full"
            >
              {runOrchestration.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Orchestration
                </>
              )}
            </Button>
            
            {isRunning && (
              <Button 
                onClick={() => cancelOrchestration.mutate()} 
                variant="destructive"
                disabled={cancelOrchestration.isPending}
                className="w-full"
              >
                <Pause className="h-4 w-4 mr-2" />
                Cancel Run
              </Button>
            )}
            
            <Button 
              onClick={() => createBackup.mutate('Manual backup')} 
              variant="outline"
              disabled={createBackup.isPending}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentRun ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Run ID:</span>
                  <span className="text-sm text-gray-600">{currentRun.id.substring(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(currentRun.status)}>
                    {getStatusIcon(currentRun.status)}
                    <span className="ml-1">{currentRun.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Changes:</span>
                  <span className="text-sm text-gray-600">{currentRun.changes.length}</span>
                </div>
                {currentRun.status === 'running' && (
                  <Progress value={30} className="w-full" />
                )}
              </div>
            ) : (
              <p className="text-gray-500">No active orchestration runs</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData?.data?.summary ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Impressions:</span>
                  <span className="text-sm text-gray-600">
                    {analyticsData.data.summary.totalImpressions.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average CTR:</span>
                  <span className="text-sm text-gray-600">
                    {(analyticsData.data.summary.averageCTR * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Quality:</span>
                  <Badge variant={analyticsData.data.summary.dataQuality > 0.7 ? "default" : "secondary"}>
                    {(analyticsData.data.summary.dataQuality * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading performance data...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orchestration History</CardTitle>
              <CardDescription>Recent orchestration runs and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history?.data?.map((run: OrchestrationRun) => (
                  <div key={run.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(run.status)}
                        <span className="font-medium">{run.id.substring(0, 8)}</span>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(run.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Pages Analyzed:</span>
                        <span className="ml-2">{run.analytics.pagesAnalyzed}</span>
                      </div>
                      <div>
                        <span className="font-medium">Changes Proposed:</span>
                        <span className="ml-2">{run.analytics.changesProposed}</span>
                      </div>
                      <div>
                        <span className="font-medium">Changes Applied:</span>
                        <span className="ml-2">{run.analytics.changesApplied}</span>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-2">{Math.round(run.duration / 1000)}s</span>
                      </div>
                    </div>
                    {run.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t">
                        <Button 
                          onClick={() => rollback.mutate(run.id)}
                          variant="outline"
                          size="sm"
                          disabled={rollback.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rollback
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.data?.pages?.slice(0, 5).map((page: any) => (
                    <div key={page.slug} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{page.title}</span>
                        <div className="text-sm text-gray-500">
                          {page.emotion} • {page.niche}
                        </div>
                      </div>
                      <Badge variant={page.trend === 'up' ? "default" : page.trend === 'down' ? "destructive" : "secondary"}>
                        {(page.metrics.ctr * 100).toFixed(1)}% CTR
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emotion Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.data?.emotions?.map((emotion: any) => (
                    <div key={emotion.name} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium capitalize">{emotion.name}</span>
                        <div className="text-sm text-gray-500">
                          {emotion.pages.length} pages
                        </div>
                      </div>
                      <Badge variant={emotion.trend === 'up' ? "default" : emotion.trend === 'down' ? "destructive" : "secondary"}>
                        {(emotion.metrics.averageCTR * 100).toFixed(1)}% CTR
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Element Rankings</CardTitle>
              <CardDescription>Performance rankings based on confidence and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankings?.data?.slice(0, 10).map((ranking: any, index: number) => (
                  <div key={ranking.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">#{index + 1}</span>
                        <span className="font-medium">{ranking.id}</span>
                        <Badge variant="outline">{ranking.type}</Badge>
                      </div>
                      <Badge variant={ranking.trend === 'improving' ? "default" : ranking.trend === 'declining' ? "destructive" : "secondary"}>
                        {ranking.trend}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Score:</span>
                        <span className="ml-2">{(ranking.score * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span>
                        <span className="ml-2">{(ranking.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="font-medium">CTR:</span>
                        <span className="ml-2">{(ranking.metrics.ctr * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Impressions:</span>
                        <span className="ml-2">{ranking.metrics.impressions.toLocaleString()}</span>
                      </div>
                    </div>
                    {ranking.recommendations && ranking.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="font-medium text-sm">Recommendations:</span>
                        <ul className="text-sm text-gray-600 mt-1">
                          {ranking.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orchestration Configuration</CardTitle>
              <CardDescription>Control orchestration behavior and safety settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">General Settings</h3>
                  <div className="flex items-center justify-between">
                    <span>Enable Orchestration</span>
                    <Switch
                      checked={config?.isEnabled}
                      onCheckedChange={(checked) => 
                        setConfigUpdates(prev => ({ ...prev, isEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Enable Archetype Engine</span>
                    <Switch
                      checked={config?.archetype?.enabled}
                      onCheckedChange={(checked) => 
                        setConfigUpdates(prev => ({ 
                          ...prev, 
                          archetype: { ...config?.archetype, enabled: checked }
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Safety Settings</h3>
                  <div className="flex items-center justify-between">
                    <span>Backup Enabled</span>
                    <Switch
                      checked={config?.safety?.backupEnabled}
                      onCheckedChange={(checked) => 
                        setConfigUpdates(prev => ({ 
                          ...prev, 
                          safety: { ...config?.safety, backupEnabled: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Require Manual Approval</span>
                    <Switch
                      checked={config?.safety?.requireManualApproval}
                      onCheckedChange={(checked) => 
                        setConfigUpdates(prev => ({ 
                          ...prev, 
                          safety: { ...config?.safety, requireManualApproval: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => updateConfig.mutate(configUpdates)}
                  disabled={Object.keys(configUpdates).length === 0 || updateConfig.isPending}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Update Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Backups</CardTitle>
              <CardDescription>Manage configuration backups and rollbacks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups?.data?.map((backup: any) => (
                  <div key={backup.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{backup.id}</span>
                        <p className="text-sm text-gray-500">{backup.description}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(backup.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {Object.keys(backup.files).length} files backed up
                      </div>
                      <Button 
                        onClick={() => rollback.mutate(backup.id)}
                        variant="outline"
                        size="sm"
                        disabled={rollback.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orchestration Changelog</CardTitle>
              <CardDescription>Complete history of all optimization changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {changelog?.data ? (
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: changelog.data }}
                  />
                ) : (
                  <p className="text-gray-500">No changelog entries found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}