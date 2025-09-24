import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  Plus, 
  Copy, 
  Trash2, 
  Activity, 
  Settings, 
  Terminal, 
  Globe, 
  Server, 
  BarChart3, 
  Zap,
  CloudLightning,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Database,
  Network,
  Monitor
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow, format } from 'date-fns';

interface NeuronTemplate {
  id: string;
  name: string;
  niche: string;
  description: string;
  features: string[];
  estimatedSetupTime: string;
  complexity: 'Simple' | 'Moderate' | 'Advanced';
  defaultConfig: any;
}

interface BulkDeployment {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  neurons: number;
  successful: number;
  failed: number;
  startedAt: string;
  completedAt?: string;
  logs: string[];
}

const NEURON_TEMPLATES: NeuronTemplate[] = [
  {
    id: 'finance-calculator',
    name: 'Finance Calculator',
    niche: 'finance',
    description: 'Comprehensive financial calculation tools with ROI, mortgage, and investment calculators',
    features: ['ROI Calculator', 'Mortgage Calculator', 'Investment Planner', 'Quiz Engine', 'Lead Capture'],
    estimatedSetupTime: '2-3 minutes',
    complexity: 'Simple',
    defaultConfig: {
      features: ['calculator', 'quiz', 'recommendations'],
      endpoints: ['/calculator', '/quiz', '/recommendations']
    }
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    niche: 'health',
    description: 'AI-powered health assessment and wellness tracking platform',
    features: ['Health Assessment', 'Symptom Tracker', 'Wellness Tips', 'BMI Calculator', 'Gamification'],
    estimatedSetupTime: '3-4 minutes',
    complexity: 'Moderate',
    defaultConfig: {
      features: ['assessment', 'tracking', 'tips', 'gamification'],
      endpoints: ['/assessment', '/tracker', '/tips', '/dashboard']
    }
  },
  {
    id: 'saas-directory',
    name: 'SaaS Tool Directory',
    niche: 'saas',
    description: 'Complete SaaS tool recommendation and comparison platform',
    features: ['Tool Directory', 'Comparisons', 'Reviews', 'Recommendations', 'Affiliate Tracking'],
    estimatedSetupTime: '4-5 minutes',
    complexity: 'Advanced',
    defaultConfig: {
      features: ['directory', 'comparisons', 'reviews', 'affiliate'],
      endpoints: ['/tools', '/compare', '/reviews', '/recommend']
    }
  },
  {
    id: 'education-platform',
    name: 'Education Platform',
    niche: 'education',
    description: 'Interactive learning platform with courses, quizzes, and progress tracking',
    features: ['Course Catalog', 'Interactive Quizzes', 'Progress Tracking', 'AI Tutor', 'Gamification'],
    estimatedSetupTime: '5-6 minutes',
    complexity: 'Advanced',
    defaultConfig: {
      features: ['courses', 'quizzes', 'progress', 'ai-tutor'],
      endpoints: ['/courses', '/quiz', '/progress', '/tutor']
    }
  },
  {
    id: 'api-data-processor',
    name: 'API Data Processor',
    niche: 'data',
    description: 'Headless API neuron for data processing, ETL, and analytics',
    features: ['Data ETL', 'API Gateway', 'Real-time Processing', 'Analytics', 'Monitoring'],
    estimatedSetupTime: '3-4 minutes',
    complexity: 'Moderate',
    defaultConfig: {
      features: ['etl', 'api', 'analytics', 'monitoring'],
      endpoints: ['/process', '/status', '/analytics']
    }
  }
];

const EmpireLaunchpad: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<NeuronTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [bulkConfig, setBulkConfig] = useState('');
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<BulkDeployment | null>(null);
  const queryClient = useQueryClient();

  // Fetch empire overview
  const { data: empireOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/federation/empire/overview'],
    refetchInterval: 10000 // Update every 10 seconds
  });

  // Fetch active deployments
  const { data: deployments } = useQuery({
    queryKey: ['/api/federation/deployments'],
    refetchInterval: 5000 // Update every 5 seconds
  });

  // Fetch available neurons for cloning
  const { data: availableNeurons } = useQuery({
    queryKey: ['/api/federation/neurons'],
    refetchInterval: 30000
  });

  // Create neuron mutation
  const createNeuronMutation = useMutation({
    mutationFn: async (neuronData: any) => {
      return await apiRequest('/api/federation/neurons/create', {
        method: 'POST',
        body: JSON.stringify(neuronData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/federation'] });
      setShowCreateDialog(false);
      setSelectedTemplate(null);
    }
  });

  // Clone neuron mutation
  const cloneNeuronMutation = useMutation({
    mutationFn: async ({ sourceId, targetConfig }: { sourceId: string; targetConfig: any }) => {
      return await apiRequest(`/api/federation/neurons/${sourceId}/clone`, {
        method: 'POST',
        body: JSON.stringify(targetConfig)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/federation'] });
      setShowCloneDialog(false);
    }
  });

  // Bulk deployment mutation
  const bulkDeployMutation = useMutation({
    mutationFn: async (config: any) => {
      return await apiRequest('/api/federation/bulk-deploy', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },
    onSuccess: (data) => {
      setActiveDeployment(data.data);
      setShowBulkDialog(false);
      // Start polling for deployment status
      startDeploymentPolling(data.data.id);
    }
  });

  const startDeploymentPolling = (deploymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiRequest(`/api/federation/deployments/${deploymentId}`);
        const deployment = response.data;
        
        setActiveDeployment(deployment);
        setDeploymentLogs(deployment.logs || []);
        
        if (deployment.status === 'completed' || deployment.status === 'failed') {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ['/api/federation'] });
        }
      } catch (error) {
        console.error('Failed to poll deployment status:', error);
      }
    }, 2000);
  };

  const handleCreateNeuron = (formData: FormData) => {
    if (!selectedTemplate) return;

    const neuronData = {
      template: selectedTemplate.id,
      name: formData.get('name'),
      niche: selectedTemplate.niche,
      subdomain: formData.get('subdomain'),
      customization: {
        primaryColor: formData.get('primaryColor'),
        features: selectedTemplate.features,
        ...selectedTemplate.defaultConfig
      },
      metadata: {
        createdFrom: 'empire-launchpad',
        template: selectedTemplate.id,
        estimatedSetupTime: selectedTemplate.estimatedSetupTime
      }
    };

    createNeuronMutation.mutate(neuronData);
  };

  const handleBulkDeploy = () => {
    try {
      const config = JSON.parse(bulkConfig);
      bulkDeployMutation.mutate(config);
    } catch (error) {
      alert('Invalid JSON configuration');
    }
  };

  const generateSampleBulkConfig = () => {
    const sampleConfig = {
      deployment: {
        name: "Q1 2025 Expansion",
        concurrent: 5,
        timeout: 300
      },
      neurons: [
        {
          template: "finance-calculator",
          name: "Personal Finance Hub",
          niche: "finance",
          subdomain: "finance-hub",
          customization: {
            primaryColor: "#10B981",
            features: ["calculator", "quiz", "recommendations"]
          }
        },
        {
          template: "health-wellness", 
          name: "Wellness Central",
          niche: "health",
          subdomain: "wellness",
          customization: {
            primaryColor: "#8B5CF6",
            features: ["assessment", "tracking", "tips"]
          }
        },
        {
          template: "saas-directory",
          name: "SaaS Explorer",
          niche: "saas",
          subdomain: "saas-tools",
          customization: {
            primaryColor: "#3B82F6",
            features: ["directory", "comparisons", "reviews"]
          }
        }
      ]
    };
    setBulkConfig(JSON.stringify(sampleConfig, null, 2));
  };

  const overview = empireOverview?.data || {
    totalNeurons: 0,
    activeNeurons: 0,
    healthyNeurons: 0,
    totalTraffic: 0,
    totalRevenue: 0,
    avgHealthScore: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🚀 Empire Launchpad</h1>
          <p className="text-muted-foreground mt-2">
            One-click neuron deployment and infinite scaling automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkDialog(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Deploy
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Neuron
          </Button>
        </div>
      </div>

      {/* Empire Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Neurons</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalNeurons}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeNeurons} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.avgHealthScore}%</div>
            <Progress value={overview.avgHealthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traffic Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTraffic.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              visits across all neurons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Deployment Status */}
      {activeDeployment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudLightning className="w-5 h-5" />
              Active Deployment: {activeDeployment.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Progress</span>
                <Badge variant={activeDeployment.status === 'completed' ? 'default' : 'secondary'}>
                  {activeDeployment.status}
                </Badge>
              </div>
              <Progress value={activeDeployment.progress} />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>Total: {activeDeployment.neurons}</div>
                <div className="text-green-600">Success: {activeDeployment.successful}</div>
                <div className="text-red-600">Failed: {activeDeployment.failed}</div>
              </div>
              {deploymentLogs.length > 0 && (
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-40 overflow-y-auto">
                  {deploymentLogs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Neuron Templates</CardTitle>
              <CardDescription>
                Choose from pre-built templates for instant neuron deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {NEURON_TEMPLATES.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant={template.complexity === 'Simple' ? 'default' : 
                                     template.complexity === 'Moderate' ? 'secondary' : 'destructive'}>
                          {template.complexity}
                        </Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {template.estimatedSetupTime}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.features.slice(0, 3).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {template.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowCreateDialog(true);
                          }}
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          Deploy Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                Track and manage all neuron deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deployment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Neurons</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(deployments?.data || []).map((deployment: any) => (
                    <TableRow key={deployment.id}>
                      <TableCell className="font-medium">{deployment.name}</TableCell>
                      <TableCell>
                        <Badge variant={deployment.status === 'completed' ? 'default' :
                                      deployment.status === 'failed' ? 'destructive' : 'secondary'}>
                          {deployment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{deployment.neurons}</TableCell>
                      <TableCell>
                        {deployment.neurons > 0 ? 
                          `${Math.round((deployment.successful / deployment.neurons) * 100)}%` : 
                          '0%'
                        }
                      </TableCell>
                      <TableCell>{format(new Date(deployment.startedAt), 'MMM dd, HH:mm')}</TableCell>
                      <TableCell>
                        {deployment.completedAt ? 
                          formatDistanceToNow(new Date(deployment.startedAt), { addSuffix: false }) :
                          'Running...'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Monitor className="w-4 h-4 mr-1" />
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Active Neurons</span>
                    <Badge variant="default">{overview.activeNeurons}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Healthy</span>
                    <Badge variant="default">{overview.healthyNeurons}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Warning</span>
                    <Badge variant="secondary">{overview.totalNeurons - overview.healthyNeurons}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Response Time</span>
                    <span className="text-sm">245ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      3 neurons require configuration updates
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      All critical systems operational
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Auto-scaling Rules</CardTitle>
                <CardDescription>
                  Configure automatic neuron scaling based on traffic and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Traffic-based scaling</Label>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Health-based recovery</Label>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Load balancing</Label>
                    <Badge variant="secondary">Disabled</Badge>
                  </div>
                  <Button className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Tasks</CardTitle>
                <CardDescription>
                  Manage automated empire maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily health checks</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly config sync</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly reports</span>
                    <Badge variant="secondary">Paused</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Manage Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Neuron Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Neuron</DialogTitle>
            <DialogDescription>
              Deploy a new neuron using the {selectedTemplate?.name} template
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateNeuron(new FormData(e.currentTarget));
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Neuron Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder={`My ${selectedTemplate.name}`}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input 
                    id="subdomain" 
                    name="subdomain" 
                    placeholder="my-neuron"
                    required 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Will be available at: https://my-neuron.findawise.com
                  </p>
                </div>

                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input 
                    id="primaryColor" 
                    name="primaryColor" 
                    type="color"
                    defaultValue="#3B82F6"
                  />
                </div>

                <div>
                  <Label>Included Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.features.map((feature) => (
                      <Badge key={feature} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createNeuronMutation.isPending}>
                  {createNeuronMutation.isPending ? 'Creating...' : 'Create Neuron'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Deploy Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Deployment</DialogTitle>
            <DialogDescription>
              Deploy multiple neurons from a JSON configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateSampleBulkConfig}>
                <Download className="w-4 h-4 mr-2" />
                Load Sample Config
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>

            <div>
              <Label htmlFor="bulkConfig">Configuration (JSON)</Label>
              <Textarea
                id="bulkConfig"
                value={bulkConfig}
                onChange={(e) => setBulkConfig(e.target.value)}
                placeholder="Paste your JSON configuration here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkDeploy} disabled={bulkDeployMutation.isPending}>
              {bulkDeployMutation.isPending ? 'Deploying...' : 'Deploy All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmpireLaunchpad;