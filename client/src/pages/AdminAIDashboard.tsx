import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Brain, Settings, TrendingUp, Zap, Clock, CheckCircle, XCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AdminSidebar from '@/components/AdminSidebar';

interface OrchestrationRun {
  id: string;
  runId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending_approval';
  triggerType: string;
  triggeredBy: string;
  modelsUsed: any[];
  changesProposed: any[];
  changesApplied: any[];
  mlConfidence: number;
  executionTime: number;
  startedAt: string;
  completedAt?: string;
}

interface MLModel {
  id: number;
  name: string;
  version: string;
  type: string;
  algorithm: string;
  isActive: boolean;
  isProduction: boolean;
  performance: any;
  trainedAt: string;
  usageCount: number;
}

interface LLMInsight {
  id: string;
  insightId: string;
  llmProvider: string;
  llmModel: string;
  insightType: string;
  insights: any;
  suggestions: any[];
  confidence: number;
  status: string;
  createdAt: string;
}

export default function AdminAIDashboard() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedRun, setSelectedRun] = useState<OrchestrationRun | null>(null);

  // Fetch orchestration runs
  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ['/api/admin/orchestration/runs'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch ML models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/admin/ml/models']
  });

  // Fetch LLM insights
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/admin/llm/insights']
  });

  // Fetch orchestration config
  const { data: config = {}, isLoading: configLoading } = useQuery({
    queryKey: ['/api/admin/orchestration/config']
  });

  // Run orchestration mutation
  const runOrchestration = useMutation({
    mutationFn: () => apiRequest('/api/admin/orchestration/run', 'POST', { manual: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orchestration/runs'] });
    }
  });

  // Train model mutation
  const trainModel = useMutation({
    mutationFn: (modelType: string) => 
      apiRequest('/api/admin/ml/train', 'POST', { modelType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ml/models'] });
    }
  });

  // Toggle orchestration mutation
  const toggleOrchestration = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest('/api/admin/orchestration/config', 'PUT', { isEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orchestration/config'] });
    }
  });

  // Approve changes mutation
  const approveChanges = useMutation({
    mutationFn: (runId: string) => 
      apiRequest(`/api/admin/orchestration/runs/${runId}/approve`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orchestration/runs'] });
    }
  });

  // Rollback changes mutation
  const rollbackChanges = useMutation({
    mutationFn: (runId: string) => 
      apiRequest(`/api/admin/orchestration/runs/${runId}/rollback`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orchestration/runs'] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending_approval':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending_approval':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AdminSidebar />
      <div className="ml-64 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-600" />
              AI Orchestrator Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor and control AI-powered content optimization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => toggleOrchestration.mutate(!config.isEnabled)}
              variant={config.isEnabled ? "outline" : "default"}
              disabled={toggleOrchestration.isPending}
            >
              {config.isEnabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {config.isEnabled ? 'Disable' : 'Enable'} Orchestration
            </Button>
            <Button
              onClick={() => runOrchestration.mutate()}
              disabled={runOrchestration.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              Run Manual Optimization
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Models</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {models.filter((m: MLModel) => m.isActive).length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Runs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {runs.filter((r: OrchestrationRun) => 
                      new Date(r.startedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                    ).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Confidence</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {runs.length > 0 
                      ? Math.round(runs.reduce((sum: number, r: OrchestrationRun) => sum + (r.mlConfidence || 0), 0) / runs.length)
                      : 0
                    }%
                  </p>
                </div>
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">LLM Insights</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {insights.filter((i: LLMInsight) => 
                      new Date(i.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="runs">Orchestration Runs</TabsTrigger>
            <TabsTrigger value="models">ML Models</TabsTrigger>
            <TabsTrigger value="insights">LLM Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest orchestration runs and changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {runs.slice(0, 5).map((run: OrchestrationRun) => (
                      <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(run.status)}
                          <div>
                            <p className="font-medium text-sm">{run.runId}</p>
                            <p className="text-xs text-gray-500">
                              {run.changesProposed?.length || 0} changes proposed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(run.status)}`}>
                            {run.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(run.startedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Model Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance</CardTitle>
                  <CardDescription>AI model accuracy and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models.filter((m: MLModel) => m.isProduction).slice(0, 4).map((model: MLModel) => (
                      <div key={model.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{model.name}</p>
                            <p className="text-xs text-gray-500">{model.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {model.performance?.accuracy ? (model.performance.accuracy * 100).toFixed(1) : 'N/A'}%
                            </p>
                            <p className="text-xs text-gray-500">{model.usageCount} uses</p>
                          </div>
                        </div>
                        <Progress 
                          value={model.performance?.accuracy ? model.performance.accuracy * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Orchestration configuration and health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-lg font-bold text-green-600">
                      {config.isEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence Threshold</p>
                    <p className="text-lg font-bold">
                      {config.confidenceThreshold?.minConfidence || 70}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto-Approval</p>
                    <p className="text-lg font-bold">
                      {config.safety?.requireManualApproval ? 'Disabled' : 'Enabled'}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Changes</p>
                    <p className="text-lg font-bold">
                      {config.safety?.maxChangesPerRun || 20}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="runs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Orchestration Runs</CardTitle>
                <CardDescription>View and manage optimization runs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {runs.map((run: OrchestrationRun) => (
                    <div 
                      key={run.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setSelectedRun(run)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(run.status)}
                          <div>
                            <p className="font-medium">{run.runId}</p>
                            <p className="text-sm text-gray-500">
                              {run.triggerType} • {run.triggeredBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {run.status === 'pending_approval' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveChanges.mutate(run.runId);
                                }}
                                disabled={approveChanges.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rollbackChanges.mutate(run.runId);
                                }}
                                disabled={rollbackChanges.isPending}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <Badge variant="outline" className={getStatusColor(run.status)}>
                            {run.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Changes Proposed</p>
                          <p className="font-medium">{run.changesProposed?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Changes Applied</p>
                          <p className="font-medium">{run.changesApplied?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">ML Confidence</p>
                          <p className="font-medium">{run.mlConfidence || 0}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Execution Time</p>
                          <p className="font-medium">{run.executionTime ? `${run.executionTime}ms` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">ML Models</h3>
                <p className="text-sm text-gray-500">Manage and train AI models</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => trainModel.mutate('content_optimizer')}
                  disabled={trainModel.isPending}
                  size="sm"
                >
                  Train Content Model
                </Button>
                <Button
                  onClick={() => trainModel.mutate('cta_predictor')}
                  disabled={trainModel.isPending}
                  size="sm"
                >
                  Train CTA Model
                </Button>
                <Button
                  onClick={() => trainModel.mutate('emotion_classifier')}
                  disabled={trainModel.isPending}
                  size="sm"
                >
                  Train Emotion Model
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4">Model</th>
                        <th className="text-left p-4">Type</th>
                        <th className="text-left p-4">Algorithm</th>
                        <th className="text-left p-4">Accuracy</th>
                        <th className="text-left p-4">Usage</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Trained</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((model: MLModel) => (
                        <tr key={model.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{model.name}</p>
                              <p className="text-sm text-gray-500">v{model.version}</p>
                            </div>
                          </td>
                          <td className="p-4">{model.type}</td>
                          <td className="p-4">{model.algorithm}</td>
                          <td className="p-4">
                            {model.performance?.accuracy 
                              ? `${(model.performance.accuracy * 100).toFixed(1)}%`
                              : 'N/A'
                            }
                          </td>
                          <td className="p-4">{model.usageCount}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {model.isProduction && (
                                <Badge variant="default">Production</Badge>
                              )}
                              {model.isActive && (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(model.trainedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>LLM Insights</CardTitle>
                <CardDescription>AI-generated insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight: LLMInsight) => (
                    <div key={insight.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{insight.insightType}</Badge>
                            <Badge variant="outline">{insight.llmProvider}</Badge>
                            <span className="text-sm text-gray-500">
                              {insight.confidence}% confidence
                            </span>
                          </div>
                          <p className="font-medium mb-2">{insight.insights?.summary}</p>
                          <div className="space-y-2">
                            {insight.insights?.keyFindings?.slice(0, 3).map((finding: string, index: number) => (
                              <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                • {finding}
                              </p>
                            ))}
                          </div>
                          {insight.suggestions && insight.suggestions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1">Suggestions:</p>
                              <div className="flex flex-wrap gap-2">
                                {insight.suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {suggestion.title || suggestion.type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={insight.status === 'implemented' ? 'default' : 'outline'}>
                            {insight.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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