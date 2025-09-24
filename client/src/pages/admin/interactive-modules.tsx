import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Zap, Settings, TrendingUp, Play, Edit, Eye, BarChart3, Calculator, HelpCircle, Clock, Layers } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AdminSidebar from '@/components/AdminSidebar';
import QuizModule from '@/components/InteractiveModules/QuizModule';
import CalculatorModule from '@/components/InteractiveModules/CalculatorModule';
import ComparisonModule from '@/components/InteractiveModules/ComparisonModule';
import TimerModule from '@/components/InteractiveModules/TimerModule';

interface ModuleConfig {
  id: string;
  type: 'quiz' | 'calculator' | 'comparison' | 'timer';
  name: string;
  description: string;
  emotion: string;
  isActive: boolean;
  usageCount: number;
  conversionRate: number;
  lastUsed: string;
  config: any;
}

export default function InteractiveModulesPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedModule, setSelectedModule] = useState<ModuleConfig | null>(null);
  const [previewModule, setPreviewModule] = useState<string | null>(null);

  // Fetch modules from config
  const { data: pagesConfig } = useQuery({
    queryKey: ['/api/config/pages'],
    queryFn: async () => {
      const response = await fetch('/src/config/pages.json');
      return response.json();
    }
  });

  // Fetch analytics for modules
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/analytics/modules'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/overview');
      return response.json();
    }
  });

  const moduleTypes = [
    { 
      type: 'quiz', 
      name: 'Quiz & Gamification', 
      icon: HelpCircle, 
      description: 'Interactive quizzes with personalized results and gamification elements',
      features: ['Multiple choice questions', 'Scoring system', 'Personalized results', 'Progress tracking']
    },
    { 
      type: 'calculator', 
      name: 'Smart Calculators', 
      icon: Calculator, 
      description: 'Advanced calculators for financial, fitness, and business calculations',
      features: ['Custom formulas', 'Real-time calculations', 'Visual charts', 'Export results']
    },
    { 
      type: 'comparison', 
      name: 'Comparison Tools', 
      icon: Layers, 
      description: 'Side-by-side comparison tools for products, services, and strategies',
      features: ['Feature comparison', 'Pros/cons analysis', 'Visual comparisons', 'Decision matrices']
    },
    { 
      type: 'timer', 
      name: 'Interactive Timers', 
      icon: Clock, 
      description: 'Meditation timers, workout timers, and productivity tools',
      features: ['Custom durations', 'Sound alerts', 'Progress visualization', 'Session tracking']
    }
  ];

  const moduleInstances = pagesConfig?.pages?.filter((page: any) => 
    ['quiz', 'calculator', 'comparison', 'timer'].includes(page.interactiveModule)
  ) || [];

  const renderModulePreview = (moduleType: string, emotion: string = 'trust') => {
    const moduleProps = { 
      emotion, 
      pageConfig: { 
        title: 'Preview Module',
        cta: { text: 'Get Started', link: '#' }
      }
    };

    switch (moduleType) {
      case 'quiz':
        return <QuizModule {...moduleProps} />;
      case 'calculator':
        return <CalculatorModule {...moduleProps} />;
      case 'comparison':
        return <ComparisonModule {...moduleProps} />;
      case 'timer':
        return <TimerModule {...moduleProps} />;
      default:
        return <div className="p-4 text-center text-gray-500">Select a module to preview</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Interactive Modules</h1>
            <p className="text-gray-600">Manage and optimize your interactive content modules</p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">All Modules</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Module Types Overview */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {moduleTypes.map((moduleType) => {
                  const Icon = moduleType.icon;
                  const instanceCount = moduleInstances.filter((p: any) => p.interactiveModule === moduleType.type).length;
                  
                  return (
                    <Card key={moduleType.type} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{moduleType.name}</CardTitle>
                              <Badge variant="secondary">{instanceCount} active</Badge>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPreviewModule(moduleType.type)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{moduleType.description}</p>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Key Features:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {moduleType.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Live Module Instances */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Module Instances</CardTitle>
                  <CardDescription>Currently deployed interactive modules across your pages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {moduleInstances.map((page: any) => (
                      <div key={page.slug} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded">
                            {page.interactiveModule === 'quiz' && <HelpCircle className="w-5 h-5" />}
                            {page.interactiveModule === 'calculator' && <Calculator className="w-5 h-5" />}
                            {page.interactiveModule === 'comparison' && <Layers className="w-5 h-5" />}
                            {page.interactiveModule === 'timer' && <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-semibold">{page.title}</h4>
                            <p className="text-sm text-gray-600">{page.slug} • {page.emotion} emotion • {page.niche}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{page.interactiveModule}</Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                    {moduleInstances.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No active module instances found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="space-y-6">
              <div className="grid gap-6">
                {moduleTypes.map((moduleType) => {
                  const Icon = moduleType.icon;
                  const instances = moduleInstances.filter((p: any) => p.interactiveModule === moduleType.type);
                  
                  return (
                    <Card key={moduleType.type}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="w-6 h-6 text-blue-600" />
                            <div>
                              <CardTitle>{moduleType.name}</CardTitle>
                              <CardDescription>{instances.length} instances</CardDescription>
                            </div>
                          </div>
                          <Button onClick={() => setPreviewModule(moduleType.type)}>
                            <Play className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {instances.length > 0 ? (
                          <div className="space-y-3">
                            {instances.map((instance: any) => (
                              <div key={instance.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <h4 className="font-medium">{instance.title}</h4>
                                  <p className="text-sm text-gray-600">/{instance.slug}</p>
                                </div>
                                <Badge variant={instance.emotion === 'trust' ? 'default' : 'secondary'}>
                                  {instance.emotion}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">No instances of this module type</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Interactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {analyticsData?.totalClicks || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Across all modules</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {((analyticsData?.conversionRate || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Module to conversion</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {moduleInstances.length}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Currently deployed</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Module Performance</CardTitle>
                  <CardDescription>Performance breakdown by module type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {moduleTypes.map((moduleType) => {
                      const instances = moduleInstances.filter((p: any) => p.interactiveModule === moduleType.type);
                      const performance = Math.random() * 100; // Mock performance data
                      
                      return (
                        <div key={moduleType.type} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{moduleType.name}</span>
                            <span className="text-sm text-gray-600">{performance.toFixed(1)}%</span>
                          </div>
                          <Progress value={performance} className="h-2" />
                          <p className="text-xs text-gray-500">{instances.length} active instances</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Module Configuration</CardTitle>
                  <CardDescription>Global settings for interactive modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Animation Duration</label>
                      <Input type="number" placeholder="300" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Module Timeout (seconds)</label>
                      <Input type="number" placeholder="30" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Global CSS Overrides</label>
                    <Textarea 
                      placeholder="Add custom CSS for all modules..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <Button>Save Configuration</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Preview Modal */}
          {previewModule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">
                      {moduleTypes.find(t => t.type === previewModule)?.name} Preview
                    </h3>
                    <Button variant="outline" onClick={() => setPreviewModule(null)}>
                      Close
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  {renderModulePreview(previewModule)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}