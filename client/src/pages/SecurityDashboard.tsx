import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, TrendingUp, AlertTriangle, Users, DollarSign, Activity, Eye, MousePointer, Target, Clock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SecurityMetrics {
  totalAssessments: number;
  averageSecurityScore: number;
  highRiskUsers: number;
  conversionRate: number;
  topPersonas: Array<{
    persona: string;
    count: number;
    avgScore: number;
  }>;
  vulnerabilityTrends: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  productRecommendations: Array<{
    product: string;
    recommendations: number;
    conversions: number;
    revenue: number;
  }>;
  quizMetrics: {
    completionRate: number;
    averageTime: number;
    dropoffPoints: Array<{
      step: string;
      dropoffRate: number;
    }>;
  };
}

export default function SecurityDashboard() {
  const { data: metrics, isLoading } = useQuery<SecurityMetrics>({
    queryKey: ['/api/security/metrics'],
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const { data: realtimeData } = useQuery({
    queryKey: ['/api/security/realtime'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Security Neuron Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time insights into home security assessments and recommendations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
            <Button variant="outline" size="sm">
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalAssessments || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.averageSecurityScore || 0}/100</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">+3.2</span> improvement this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Users</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics?.highRiskUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5.1%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="personas">User Personas</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Vulnerability Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Vulnerability Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics?.vulnerabilityTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" />
                      <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" />
                      <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fill="#eab308" />
                      <Area type="monotone" dataKey="low" stackId="1" stroke="#22c55e" fill="#22c55e" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Security Personas */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Personas Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics?.topPersonas || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ persona, percent }) => `${persona} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {(metrics?.topPersonas || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quiz Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {metrics?.quizMetrics?.completionRate || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {metrics?.quizMetrics?.averageTime || 0}m
                    </div>
                    <div className="text-sm text-muted-foreground">Average Time</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Drop-off Points</div>
                    {(metrics?.quizMetrics?.dropoffPoints || []).map((point, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{point.step}</span>
                        <span className="text-red-600">{point.dropoffRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <div className="grid gap-6">
              {/* Security Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={[
                      { range: '0-20', count: 5, risk: 'Critical' },
                      { range: '21-40', count: 12, risk: 'High' },
                      { range: '41-60', count: 28, risk: 'Medium' },
                      { range: '61-80', count: 45, risk: 'Low' },
                      { range: '81-100', count: 23, risk: 'Very Low' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Assessments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Anonymous User #{1000 + i}</div>
                            <div className="text-sm text-muted-foreground">
                              Anxious Renter • 2 bedroom apartment
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={i % 2 === 0 ? 'destructive' : 'default'}>
                            Score: {60 + i * 5}
                          </Badge>
                          <Badge variant="outline">
                            {i % 2 === 0 ? 'High Risk' : 'Medium Risk'}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {i + 1}h ago
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Recommendation Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={metrics?.productRecommendations || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="recommendations" fill="#3b82f6" name="Recommendations" />
                    <Bar yAxisId="left" dataKey="conversions" fill="#10b981" name="Conversions" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Products */}
            <div className="grid gap-6 md:grid-cols-3">
              {(metrics?.productRecommendations || []).slice(0, 3).map((product, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.product}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Recommendations:</span>
                        <span className="font-medium">{product.recommendations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversions:</span>
                        <span className="font-medium text-green-600">{product.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue:</span>
                        <span className="font-medium text-blue-600">${product.revenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversion Rate:</span>
                        <span className="font-medium">
                          {((product.conversions / product.recommendations) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="personas" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {(metrics?.topPersonas || []).map((persona, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {persona.persona}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Users:</span>
                        <Badge>{persona.count}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Security Score:</span>
                        <span className="font-medium">{persona.avgScore}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${persona.avgScore}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Most common concerns: break-ins, package theft, monitoring
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtimeData?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quiz Starts</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtimeData?.quizStarts || 0}</div>
                  <p className="text-xs text-muted-foreground">In the last hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtimeData?.completions || 0}</div>
                  <p className="text-xs text-muted-foreground">Assessments completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtimeData?.avgResponseTime || 0}ms</div>
                  <p className="text-xs text-muted-foreground">API performance</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(realtimeData?.activities || []).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </div>
                      <div className="text-xs text-muted-foreground ml-auto">
                        {activity.timestamp}
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
  );
}