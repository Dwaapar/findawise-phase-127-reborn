import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Target, TrendingUp, AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AIDashboard() {
  const [activeModel, setActiveModel] = useState('recommendation');

  // Fetch AI orchestrator status
  const { data: orchestratorStatus } = useQuery({
    queryKey: ['/api/ai/orchestrator/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent insights
  const { data: recentInsights } = useQuery({
    queryKey: ['/api/ai/insights/recent'],
    refetchInterval: 60000, // Refresh every minute
  });

  const aiModels = [
    {
      id: 'recommendation',
      name: 'Content Recommendation Engine',
      status: 'active',
      description: 'AI-powered content recommendations based on user behavior',
      accuracy: '94.2%',
      lastTrained: '2 hours ago'
    },
    {
      id: 'personalization',
      name: 'User Personalization Model',
      status: 'active',
      description: 'Personalizes user experience based on demographics and behavior',
      accuracy: '89.7%',
      lastTrained: '6 hours ago'
    },
    {
      id: 'conversion',
      name: 'Conversion Optimization',
      status: 'training',
      description: 'Optimizes affiliate offers for maximum conversion rates',
      accuracy: '91.5%',
      lastTrained: '1 day ago'
    }
  ];

  const recentActions = [
    {
      id: 1,
      type: 'optimization',
      title: 'Affiliate Offer Ranking Updated',
      description: 'AI adjusted offer rankings based on conversion data',
      timestamp: '5 minutes ago',
      impact: '+12% CTR'
    },
    {
      id: 2,
      type: 'insight',
      title: 'New Audience Segment Identified',
      description: 'AI discovered high-value segment in health niche',
      timestamp: '1 hour ago',
      impact: '24.7% conversion rate'
    },
    {
      id: 3,
      type: 'prediction',
      title: 'Revenue Forecast Updated',
      description: 'Q1 revenue projected to increase by 18%',
      timestamp: '3 hours ago',
      impact: '+$4,200 projected'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Orchestrator Dashboard</h1>
                <p className="text-gray-600 mt-2">Monitor and manage your AI-powered optimization systems</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Train Models
                </Button>
                <Button size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Models Active</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3/3</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Model Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">91.8%</div>
                <p className="text-xs text-muted-foreground">+2.3% this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimizations Today</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">+12 from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+$2,847</div>
                <p className="text-xs text-muted-foreground">AI-driven improvements</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="models" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="models">AI Models</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-6">
              <div className="grid gap-6">
                {aiModels.map((model) => (
                  <Card key={model.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {model.name}
                            <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                              {model.status === 'active' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                              ) : (
                                <><Clock className="w-3 h-3 mr-1" /> Training</>
                              )}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{model.description}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Accuracy</p>
                          <p className="text-2xl font-bold text-green-600">{model.accuracy}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last Trained</p>
                          <p className="text-sm text-gray-600">{model.lastTrained}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent AI Insights</CardTitle>
                  <CardDescription>Latest discoveries and recommendations from your AI systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActions.map((action) => (
                      <div key={action.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {action.type === 'optimization' && <Zap className="w-5 h-5 text-blue-500" />}
                          {action.type === 'insight' && <Brain className="w-5 h-5 text-purple-500" />}
                          {action.type === 'prediction' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{action.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{action.timestamp}</span>
                            <Badge variant="outline">{action.impact}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Automated Processes</CardTitle>
                    <CardDescription>AI-driven automation rules and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Offer Ranking Optimization</h4>
                          <p className="text-sm text-gray-600">Automatically adjusts offer rankings based on performance</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">A/B Test Creation</h4>
                          <p className="text-sm text-gray-600">Creates new experiments when opportunities are detected</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Content Personalization</h4>
                          <p className="text-sm text-gray-600">Personalizes content based on user segment and behavior</p>
                        </div>
                        <Badge variant="secondary">Paused</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Prediction Accuracy</span>
                        <span className="font-bold">94.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Response Time</span>
                        <span className="font-bold">85ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Model Uptime</span>
                        <span className="font-bold">99.8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Business Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Revenue Increase</span>
                        <span className="font-bold text-green-600">+18.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion Rate Lift</span>
                        <span className="font-bold text-green-600">+4.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost Reduction</span>
                        <span className="font-bold text-green-600">-12.3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}