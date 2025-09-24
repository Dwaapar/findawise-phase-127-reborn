import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Cpu, 
  Zap, 
  Network, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Workflow,
  Bot,
  MessageSquare,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Cloud,
  Link
} from 'lucide-react';

interface Agent {
  id: string;
  agentId: string;
  name: string;
  provider: string;
  model: string;
  status: string;
  capabilities: string[];
  successRate: number;
  costPerToken: number;
  latencyMs: number;
  quotaUsed: number;
  quotaDaily: number;
  lastUsed: string;
}

interface Workflow {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  status: string;
  category: string;
  executionCount: number;
  successCount: number;
  averageDuration: number;
  averageCost: number;
  lastExecuted: string;
}

interface Execution {
  id: string;
  executionId: string;
  workflowId: string;
  status: string;
  progress: number;
  currentStep: string;
  totalCost: number;
  startedAt: string;
  completedAt?: string;
}

interface SystemStatus {
  agents: { total: number; active: number };
  workflows: { total: number; active: number };
  executions: { running: number };
  federation: { pendingTasks: number };
  system: { status: string; version: string };
}

export function AINativeDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Agent Form State
  const [newAgent, setNewAgent] = useState({
    name: '',
    provider: 'openai',
    model: '',
    apiEndpoint: '',
    apiKey: '',
    capabilities: '',
    costPerToken: 0,
    rateLimit: 0,
    maxTokens: 4096
  });

  // New Workflow Form State
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    category: 'general',
    steps: []
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statusRes, agentsRes, workflowsRes, executionsRes, analyticsRes] = await Promise.all([
        fetch('/api/ai-native/status'),
        fetch('/api/ai-native/agents'),
        fetch('/api/ai-native/workflows?limit=20'),
        fetch('/api/ai-native/workflows/executions?status=running&limit=10'),
        fetch('/api/ai-native/analytics/routing?timeframe=24h')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData.data);
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.data);
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData.data);
      }

      if (executionsRes.ok) {
        const executionsData = await executionsRes.json();
        setExecutions(executionsData.data);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const registerAgent = async () => {
    try {
      const response = await fetch('/api/ai-native/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAgent,
          capabilities: newAgent.capabilities.split(',').map(c => c.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        setNewAgent({
          name: '',
          provider: 'openai',
          model: '',
          apiEndpoint: '',
          apiKey: '',
          capabilities: '',
          costPerToken: 0,
          rateLimit: 0,
          maxTokens: 4096
        });
        await loadDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register agent');
    }
  };

  const executeWorkflow = async (workflowId: string, input: any = {}) => {
    try {
      const response = await fetch(`/api/ai-native/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });

      if (response.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute workflow');
    }
  };

  const toggleWorkflowStatus = async (workflowId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'active' ? 'deactivate' : 'activate';
      const response = await fetch(`/api/ai-native/workflows/${workflowId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle workflow status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'completed':
        return 'bg-green-500';
      case 'paused':
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
      case 'error':
      case 'degraded':
        return 'bg-red-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading && !systemStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading AI-Native Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            AI-Native Operating System
          </h1>
          <p className="text-gray-600">
            LLM Brain Router • Agentic Workflow Engine • Federation Intelligence
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status Cards */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">LLM Agents</p>
                  <p className="text-2xl font-bold">{systemStatus.agents.active}/{systemStatus.agents.total}</p>
                </div>
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Workflows</p>
                  <p className="text-2xl font-bold">{systemStatus.workflows.active}/{systemStatus.workflows.total}</p>
                </div>
                <Workflow className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Running Executions</p>
                  <p className="text-2xl font-bold">{systemStatus.executions.running}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Federation Tasks</p>
                  <p className="text-2xl font-bold">{systemStatus.federation.pendingTasks}</p>
                </div>
                <Network className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              24-Hour Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.totalTasks || 0}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {((analytics.successRate || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  ${(analytics.totalCost || 0).toFixed(4)}
                </p>
                <p className="text-sm text-gray-600">Total Cost</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {(analytics.averageLatency || 0).toFixed(0)}ms
                </p>
                <p className="text-sm text-gray-600">Avg Latency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">LLM Agents</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="federation">Federation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Agent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Recent Agent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.slice(0, 5).map(agent => (
                    <div key={agent.agentId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-600">{agent.provider} • {agent.model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{(agent.successRate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">{agent.latencyMs}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  Active Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows.filter(w => w.status === 'active').slice(0, 5).map(workflow => (
                    <div key={workflow.workflowId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{workflow.name}</p>
                        <p className="text-sm text-gray-600">{workflow.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{workflow.executionCount} runs</p>
                        <p className="text-xs text-gray-600">
                          {workflow.successCount > 0 ? 
                            ((workflow.successCount / workflow.executionCount) * 100).toFixed(1) + '%' : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LLM Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">LLM Agent Registry</h2>
            <Button onClick={() => setActiveTab('register-agent')}>
              <Plus className="w-4 h-4 mr-2" />
              Register Agent
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map(agent => (
              <Card key={agent.agentId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{agent.provider} • {agent.model}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate:</span>
                      <span className="text-sm font-medium">{(agent.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Latency:</span>
                      <span className="text-sm font-medium">{agent.latencyMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cost/Token:</span>
                      <span className="text-sm font-medium">${agent.costPerToken.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Quota Used:</span>
                      <span className="text-sm font-medium">
                        {agent.quotaUsed}/{agent.quotaDaily === 0 ? '∞' : agent.quotaDaily}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.capabilities.slice(0, 3).map(capability => (
                        <Badge key={capability} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{agent.capabilities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Agentic Workflows</h2>
            <Button onClick={() => setActiveTab('create-workflow')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          <div className="space-y-4">
            {workflows.map(workflow => (
              <Card key={workflow.workflowId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium">{workflow.name}</h3>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                        <Badge variant="outline">{workflow.category}</Badge>
                      </div>
                      <p className="text-gray-600 mt-1">{workflow.description}</p>
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <span>Executions: {workflow.executionCount}</span>
                        <span>
                          Success Rate: {workflow.executionCount > 0 ? 
                            ((workflow.successCount / workflow.executionCount) * 100).toFixed(1) + '%' : 
                            'N/A'
                          }
                        </span>
                        <span>Avg Duration: {(workflow.averageDuration / 1000).toFixed(1)}s</span>
                        <span>Avg Cost: ${workflow.averageCost.toFixed(4)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeWorkflow(workflow.workflowId)}
                        disabled={workflow.status !== 'active'}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWorkflowStatus(workflow.workflowId, workflow.status)}
                      >
                        {workflow.status === 'active' ? 
                          <Pause className="w-4 h-4" /> : 
                          <Play className="w-4 h-4" />
                        }
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-6">
          <h2 className="text-xl font-semibold">Workflow Executions</h2>
          
          <div className="space-y-4">
            {executions.map(execution => (
              <Card key={execution.executionId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">Execution {execution.executionId.substring(0, 8)}</p>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Current Step: {execution.currentStep}
                      </p>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{execution.progress}%</span>
                        </div>
                        <Progress value={execution.progress} className="w-full" />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${execution.totalCost.toFixed(4)}</p>
                      <p className="text-xs text-gray-600">
                        Started: {new Date(execution.startedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Federation Tab */}
        <TabsContent value="federation" className="space-y-6">
          <h2 className="text-xl font-semibold">Federation Network</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Connected Neurons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-600">Active Connections</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Task Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{systemStatus?.federation.pendingTasks || 0}</p>
                  <p className="text-sm text-gray-600">Pending Tasks</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Load Balancing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">Optimal</p>
                  <p className="text-sm text-gray-600">System Status</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-xl font-semibold">System Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Cost (24h):</span>
                    <span className="font-bold">${(analytics?.totalCost || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Cost per Task:</span>
                    <span className="font-bold">${(analytics?.averageCost || 0).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token Usage:</span>
                    <span className="font-bold">{(analytics?.totalTokens || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-bold text-green-600">
                      {((analytics?.successRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Latency:</span>
                    <span className="font-bold">{(analytics?.averageLatency || 0).toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tasks:</span>
                    <span className="font-bold">{analytics?.totalTasks || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}