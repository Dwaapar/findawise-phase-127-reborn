import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit3, 
  Copy, 
  Trash2, 
  Play, 
  Pause, 
  BarChart3, 
  Settings, 
  Zap, 
  Target,
  Users,
  TrendingUp,
  Brain,
  Layers,
  GitBranch,
  Activity,
  Download,
  Upload
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface FunnelTemplate {
  id: number;
  name: string;
  description: string;
  slug: string;
  category: string;
  isPublic: boolean;
  isActive: boolean;
  blocks: any[];
  flowLogic: any;
  conversionGoals: any;
  createdAt: string;
  updatedAt: string;
}

interface FunnelBlock {
  id: number;
  name: string;
  type: string;
  category: string;
  config: any;
  content: any;
  isReusable: boolean;
  isActive: boolean;
}

interface FunnelAnalytics {
  totalViews: number;
  totalInteractions: number;
  totalCompletions: number;
  totalConversions: number;
  avgConversionRate: number;
  avgEngagementScore: number;
  totalRevenue: number;
}

export default function FunnelDashboard() {
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelTemplate | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch funnel templates
  const { data: funnels = [] } = useQuery({
    queryKey: ['/api/funnel/templates'],
    queryFn: async () => {
      const response = await fetch('/api/funnel/templates');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  // Fetch funnel blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ['/api/funnel/blocks'],
    queryFn: async () => {
      const response = await fetch('/api/funnel/blocks');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  // Fetch analytics for selected funnel
  const { data: analytics } = useQuery({
    queryKey: ['/api/funnel/analytics', selectedFunnel?.id, 'summary'],
    queryFn: async () => {
      if (!selectedFunnel) return null;
      const response = await fetch(`/api/funnel/analytics/${selectedFunnel.id}/summary`);
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!selectedFunnel
  });

  // Create funnel mutation
  const createFunnelMutation = useMutation({
    mutationFn: async (funnelData: any) => {
      const response = await fetch('/api/funnel/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funnelData)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnel/templates'] });
      setShowCreateDialog(false);
    }
  });

  // Create block mutation
  const createBlockMutation = useMutation({
    mutationFn: async (blockData: any) => {
      const response = await fetch('/api/funnel/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnel/blocks'] });
      setShowBlockDialog(false);
    }
  });

  // Clone funnel mutation
  const cloneFunnelMutation = useMutation({
    mutationFn: async (funnelId: number) => {
      const response = await fetch(`/api/funnel/templates/${funnelId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnel/templates'] });
    }
  });

  const blockTypes = [
    { value: 'quiz', label: 'Quiz', icon: '❓' },
    { value: 'calculator', label: 'Calculator', icon: '🧮' },
    { value: 'content', label: 'Content', icon: '📄' },
    { value: 'cta', label: 'Call to Action', icon: '🎯' },
    { value: 'game', label: 'Mini Game', icon: '🎮' },
    { value: 'form', label: 'Lead Form', icon: '📝' },
    { value: 'video', label: 'Video', icon: '🎥' },
    { value: 'poll', label: 'Poll', icon: '📊' },
    { value: 'survey', label: 'Survey', icon: '📋' },
    { value: 'offer', label: 'Offer Stack', icon: '💰' },
    { value: 'social', label: 'Social Share', icon: '📱' },
    { value: 'milestone', label: 'Milestone', icon: '🏆' }
  ];

  const categories = [
    { value: 'lead-gen', label: 'Lead Generation' },
    { value: 'upsell', label: 'Upsell' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'retention', label: 'Retention' },
    { value: 'conversion', label: 'Conversion' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Funnel Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Build and manage intelligent, AI-powered conversion funnels
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Create Block
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Funnel Block</DialogTitle>
              </DialogHeader>
              <CreateBlockForm 
                onSubmit={createBlockMutation.mutate}
                isLoading={createBlockMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Funnel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Funnel</DialogTitle>
              </DialogHeader>
              <CreateFunnelForm 
                onSubmit={createFunnelMutation.mutate}
                isLoading={createFunnelMutation.isPending}
                blocks={blocks}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Funnel List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funnels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnels.map((funnel: FunnelTemplate) => (
                <div
                  key={funnel.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFunnel?.id === funnel.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFunnel(funnel)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{funnel.name}</h3>
                    <div className="flex gap-1">
                      {funnel.isActive && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                      {funnel.isPublic && (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {funnel.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{funnel.category}</Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          cloneFunnelMutation.mutate(funnel.id);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-3">
          {selectedFunnel ? (
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="builder">Builder</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="testing">A/B Tests</TabsTrigger>
                <TabsTrigger value="ai">AI Insights</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <FunnelOverview funnel={selectedFunnel} analytics={analytics} />
              </TabsContent>

              <TabsContent value="builder" className="space-y-4">
                <FunnelBuilder funnel={selectedFunnel} blocks={blocks} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <FunnelAnalytics funnel={selectedFunnel} />
              </TabsContent>

              <TabsContent value="testing" className="space-y-4">
                <ABTestingPanel funnel={selectedFunnel} />
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <AIInsightsPanel funnel={selectedFunnel} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <FunnelSettings funnel={selectedFunnel} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a Funnel
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a funnel from the list to view details and analytics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Funnel Form Component
function CreateFunnelForm({ onSubmit, isLoading, blocks }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    category: 'lead-gen',
    isPublic: false,
    blocks: [],
    flowLogic: { type: 'sequential', rules: [] },
    conversionGoals: { primary: 'completion', secondary: [] }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Funnel Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Conversion Funnel"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead-gen">Lead Generation</SelectItem>
              <SelectItem value="upsell">Upsell</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="retention">Retention</SelectItem>
              <SelectItem value="conversion">Conversion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your funnel's purpose and target audience"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="slug">URL Slug</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="my-conversion-funnel"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublic"
          checked={formData.isPublic}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
        />
        <Label htmlFor="isPublic">Make this funnel public</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Funnel'}
        </Button>
      </div>
    </form>
  );
}

// Create Block Form Component
function CreateBlockForm({ onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'quiz',
    category: 'engagement',
    config: {},
    content: {},
    isReusable: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-')
    });
  };

  const blockTypes = [
    { value: 'quiz', label: 'Quiz' },
    { value: 'calculator', label: 'Calculator' },
    { value: 'content', label: 'Content' },
    { value: 'cta', label: 'Call to Action' },
    { value: 'game', label: 'Mini Game' },
    { value: 'form', label: 'Lead Form' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="blockName">Block Name</Label>
        <Input
          id="blockName"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="My Quiz Block"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="blockType">Block Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {blockTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="blockCategory">Category</Label>
        <Input
          id="blockCategory"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="engagement"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isReusable"
          checked={formData.isReusable}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isReusable: checked }))}
        />
        <Label htmlFor="isReusable">Make this block reusable</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Block'}
        </Button>
      </div>
    </form>
  );
}

// Funnel Overview Component
function FunnelOverview({ funnel, analytics }: { funnel: FunnelTemplate; analytics: FunnelAnalytics | null }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold">{analytics?.totalViews || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold">{((analytics?.avgConversionRate || 0) * 100).toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">${(analytics?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement</p>
                <p className="text-2xl font-bold">{((analytics?.avgEngagementScore || 0) * 100).toFixed(0)}%</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Funnel Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-4 p-8">
            {funnel.blocks.slice(0, 5).map((block: any, index: number) => (
              <React.Fragment key={index}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">{index + 1}</span>
                  </div>
                  <p className="text-sm font-medium">{block.name || `Block ${index + 1}`}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{block.type}</p>
                </div>
                {index < funnel.blocks.length - 1 && index < 4 && (
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div>
                <p className="font-medium">Funnel created</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(funnel.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary">System</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div>
                <p className="font-medium">Last updated</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(funnel.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary">Auto</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder components for other tabs
function FunnelBuilder({ funnel, blocks }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Funnel Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Drag & Drop Builder</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Visual funnel builder coming soon with drag-and-drop interface
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelAnalytics({ funnel }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analytics dashboard with conversion tracking
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ABTestingPanel({ funnel }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>A/B Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Split Testing</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage A/B tests for funnel optimization
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AIInsightsPanel({ funnel }: { funnel: FunnelTemplate }) {
  const [insights, setInsights] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load AI insights on mount
  useEffect(() => {
    if (funnel?.id) {
      loadAIInsights();
    }
  }, [funnel?.id]);

  const loadAIInsights = async () => {
    try {
      const response = await fetch(`/api/funnel/insights/${funnel.id}`);
      const result = await response.json();
      if (result.success) {
        setInsights(result.data);
      }
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  };

  const handleOptimizeFunnel = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch(`/api/funnel/optimize/${funnel.id}`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        alert(`Optimization completed: ${result.data.applied} optimizations applied with ${(result.data.estimatedImprovement * 100).toFixed(1)}% estimated improvement`);
        loadAIInsights(); // Reload insights
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSimulateJourneys = async () => {
    setIsSimulating(true);
    try {
      const scenarios = [
        { name: 'High Intent Mobile', dropoffProbability: 0.2 },
        { name: 'Casual Desktop Browser', dropoffProbability: 0.4 },
        { name: 'Price Sensitive User', dropoffProbability: 0.6 },
        { name: 'Tech Professional', dropoffProbability: 0.3 }
      ];

      const response = await fetch(`/api/funnel/simulate/${funnel.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios })
      });
      const result = await response.json();
      if (result.success) {
        setSimulationResults(result.data);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Actions */}
      <div className="flex gap-3">
        <Button onClick={handleOptimizeFunnel} disabled={isOptimizing} className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          {isOptimizing ? 'Optimizing...' : 'AI Optimize Funnel'}
        </Button>
        <Button onClick={handleSimulateJourneys} disabled={isSimulating} variant="outline" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {isSimulating ? 'Simulating...' : 'Simulate Journeys'}
        </Button>
      </div>

      {/* Performance Summary */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(insights.performanceSummary?.averageConversionRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {insights.performanceSummary?.totalSessions?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ${insights.performanceSummary?.totalRevenue?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(insights.performanceSummary?.averageEngagement * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Engagement</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Blocks */}
      {insights?.topPerformingBlocks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Performing Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.topPerformingBlocks.slice(0, 5).map((block: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">Block {block.blockId}</div>
                    <div className="text-sm text-gray-600">{(block.conversionRate * 100).toFixed(1)}% conversion rate</div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drop-off Analysis */}
      {insights?.dropoffAnalysis && insights.dropoffAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.dropoffAnalysis.map((analysis: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Block {analysis.blockId}</h4>
                    <Badge variant="destructive">
                      {(analysis.bounceRate * 100).toFixed(1)}% bounce rate
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulation Results */}
      {simulationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Journey Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {simulationResults.successfulSimulations}/{simulationResults.totalScenarios}
                  </div>
                  <div className="text-sm text-gray-600">Successful Simulations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(simulationResults.averageConversionRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Conversion Rate</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {simulationResults.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium">{result.scenario}</div>
                      {result.success ? (
                        <div className="text-sm text-green-600">
                          {(result.conversionRate * 100).toFixed(1)}% conversion, {result.journey?.length} steps
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">Failed: {result.error}</div>
                      )}
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Trends Chart */}
      {insights?.conversionTrends && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={insights.conversionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="conversionRate" stroke="#8884d8" />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FunnelSettings({ funnel }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Configuration</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced funnel configuration and settings
          </p>
        </div>
      </CardContent>
    </Card>
  );
}