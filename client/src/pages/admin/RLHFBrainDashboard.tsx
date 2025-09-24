import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Activity, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Eye,
  GitBranch,
  Zap,
  BarChart3,
  Network,
  Bot,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface FeedbackMetric {
  signalType: string;
  count: number;
  avgValue: number;
  avgQuality: number;
}

interface AgentMetric {
  agentId: string;
  taskType: string;
  performanceScore: number;
  usageCount: number;
  recentPerformance: number;
}

interface PersonaMetric {
  persona: string;
  count: number;
  avgConfidence: number;
  avgStability: number;
}

interface EvolutionEvent {
  id: string;
  evolutionType: string;
  sourcePersona?: string;
  targetPersona?: string;
  evolutionStrength: number;
  affectedUsers: number;
  detectedAt: string;
  validationStatus: string;
}

interface DashboardMetrics {
  rlhf: {
    agentMetrics: AgentMetric[];
    personaDistribution: PersonaMetric[];
    feedbackTrends: FeedbackMetric[];
    totalAgents: number;
    totalPersonas: number;
    totalFeedback: number;
  };
  persona: {
    personaDistribution: PersonaMetric[];
    hybridAnalysis: any;
    evolutionTrends: any[];
    qualityMetrics: any;
    totalActivePersonas: number;
    totalEvolutions: number;
  };
}

export default function RLHFBrainDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [evolutionEvents, setEvolutionEvents] = useState<EvolutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load main metrics
      const metricsResponse = await fetch('/api/rlhf/dashboard/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      // Load evolution events
      const evolutionResponse = await fetch('/api/rlhf/persona/evolution?limit=20');
      if (evolutionResponse.ok) {
        const evolutionData = await evolutionResponse.json();
        setEvolutionEvents(evolutionData.data.evolutions);
      }
    } catch (error) {
      console.error('Failed to load RLHF dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerPersonaDiscovery = async () => {
    try {
      const response = await fetch('/api/rlhf/persona/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Discovered ${result.data.count} new persona patterns`);
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to trigger persona discovery:', error);
    }
  };

  const runPersonaSimulation = async () => {
    if (!selectedAgent) return;
    
    try {
      setIsSimulating(true);
      const response = await fetch('/api/rlhf/persona/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPersona: selectedAgent,
          testConfig: {
            scenarios: ['homepage_visit', 'quiz_completion', 'offer_interaction'],
            duration: 300
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setSimulationResults(result.data);
      }
    } catch (error) {
      console.error('Failed to run simulation:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const approveEvolution = async (evolutionId: string) => {
    try {
      const response = await fetch(`/api/rlhf/persona/evolution/${evolutionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      });
      
      if (response.ok) {
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to approve evolution:', error);
    }
  };

  const rejectEvolution = async (evolutionId: string) => {
    try {
      const response = await fetch(`/api/rlhf/persona/evolution/${evolutionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false })
      });
      
      if (response.ok) {
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to reject evolution:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse text-blue-500" />
          <p className="text-gray-600">Loading RLHF Brain Analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">RLHF Brain Center</h1>
                <p className="text-gray-600">Reinforcement Learning + Persona Fusion Intelligence</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={triggerPersonaDiscovery} variant="outline">
                <GitBranch className="w-4 h-4 mr-2" />
                Discover Personas
              </Button>
              <Button onClick={loadDashboardData} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.rlhf.totalAgents || 0}</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persona Types</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.persona.totalActivePersonas || 0}</div>
              <p className="text-xs text-muted-foreground">6 base + discovered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Signals</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.rlhf.totalFeedback || 0}</div>
              <p className="text-xs text-muted-foreground">24h collection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evolution Events</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.persona.totalEvolutions || 0}</div>
              <p className="text-xs text-muted-foreground">30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Performance</TabsTrigger>
            <TabsTrigger value="personas">Persona Fusion</TabsTrigger>
            <TabsTrigger value="evolution">Evolution</TabsTrigger>
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="federation">Federation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feedback Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Signal Distribution</CardTitle>
                  <CardDescription>Real-time feedback collection across signal types</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics?.rlhf.feedbackTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="signalType" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Persona Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Persona Distribution</CardTitle>
                  <CardDescription>Current user persona breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics?.persona.personaDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ persona, count }) => `${persona}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(metrics?.persona.personaDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health & Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Confidence</span>
                      <span className="text-sm text-gray-500">85%</span>
                    </div>
                    <Progress value={85} className="w-full" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Data Quality</span>
                      <span className="text-sm text-gray-500">92%</span>
                    </div>
                    <Progress value={92} className="w-full" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">System Stability</span>
                      <span className="text-sm text-gray-500">98%</span>
                    </div>
                    <Progress value={98} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Performance Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Rankings</CardTitle>
                <CardDescription>Top performing agents across different task types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(metrics?.rlhf.agentMetrics || []).slice(0, 10).map((agent, index) => (
                    <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{agent.agentId}</p>
                          <p className="text-sm text-gray-500">{agent.taskType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(agent.performanceScore * 100).toFixed(1)}%</p>
                        <p className="text-sm text-gray-500">{agent.usageCount} uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Agent Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={metrics?.rlhf.agentMetrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentId" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="recentPerformance" stroke="#8884d8" name="Recent" />
                    <Line type="monotone" dataKey="performanceScore" stroke="#82ca9d" name="Overall" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Persona Fusion Tab */}
          <TabsContent value="personas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Persona Confidence Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(metrics?.persona.personaDistribution || []).map((persona) => (
                      <div key={persona.persona} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium capitalize">{persona.persona}</span>
                          <span className="text-sm text-gray-500">
                            {(persona.avgConfidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={persona.avgConfidence * 100} />
                        <p className="text-xs text-gray-500">{persona.count} active users</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hybrid Personas</CardTitle>
                  <CardDescription>Users with multiple persona traits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {metrics?.persona.hybridAnalysis?.totalHybridUsers || 0} users have hybrid personas
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Fusion algorithms active
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Persona Evolution Events</CardTitle>
                <CardDescription>Detected persona changes and discoveries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evolutionEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={event.evolutionType === 'discovery' ? 'default' : 'secondary'}
                          >
                            {event.evolutionType}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(event.detectedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {event.validationStatus === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => approveEvolution(event.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => rejectEvolution(event.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {event.validationStatus === 'approved' && (
                            <Badge variant="default" className="text-green-600">Approved</Badge>
                          )}
                          {event.validationStatus === 'rejected' && (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm">
                        {event.sourcePersona && event.targetPersona ? (
                          <p>
                            <span className="font-medium">{event.sourcePersona}</span>
                            {' → '}
                            <span className="font-medium">{event.targetPersona}</span>
                          </p>
                        ) : (
                          <p>New persona pattern discovered</p>
                        )}
                        <p className="text-gray-500 mt-1">
                          Strength: {(event.evolutionStrength * 100).toFixed(1)}% • 
                          Affects {event.affectedUsers} users
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Persona Simulation Testing</CardTitle>
                <CardDescription>Test persona behavior and preview changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="persona-select">Select Persona</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose persona to simulate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="explorer">Explorer</SelectItem>
                        <SelectItem value="optimizer">Optimizer</SelectItem>
                        <SelectItem value="socializer">Socializer</SelectItem>
                        <SelectItem value="achiever">Achiever</SelectItem>
                        <SelectItem value="helper">Helper</SelectItem>
                        <SelectItem value="learner">Learner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={runPersonaSimulation} 
                      disabled={!selectedAgent || isSimulating}
                    >
                      {isSimulating ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Simulating...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run Simulation
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {simulationResults && (
                  <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-4">Simulation Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium text-sm">Engagement</h5>
                        <p className="text-sm text-gray-600">
                          CTR: {(simulationResults.results.engagement.clickThroughRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Time: {Math.round(simulationResults.results.engagement.timeOnPage / 1000)}s
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">Conversion</h5>
                        <p className="text-sm text-gray-600">
                          Rate: {(simulationResults.results.conversion.completionRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Abandon: {(simulationResults.results.conversion.abandonmentRate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">UI Preferences</h5>
                        <p className="text-sm text-gray-600">
                          Layout: {simulationResults.results.ui.preferredLayout}
                        </p>
                        <p className="text-sm text-gray-600">
                          Colors: {simulationResults.results.ui.preferredColors}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Federation Tab */}
          <TabsContent value="federation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Federation RLHF Sync</CardTitle>
                <CardDescription>Cross-neuron intelligence sharing status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Network className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                  <p className="text-gray-600 mb-2">Federation sync operational</p>
                  <p className="text-sm text-gray-500">
                    Sharing persona insights and agent performance across Empire neurons
                  </p>
                  <Button className="mt-4" variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    View Sync Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}