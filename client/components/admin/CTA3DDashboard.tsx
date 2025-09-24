/**
 * AR/VR/3D CTA Renderer Admin Dashboard
 * Empire-Grade Management Interface for 3D/AR/VR CTAs
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Play, 
  Pause, 
  BarChart3, 
  Settings, 
  Upload,
  Download,
  Copy,
  Cube,
  Zap,
  Target,
  Smartphone,
  Monitor,
  Headphones
} from 'lucide-react';
import { CTARenderer } from '../cta-renderer/CTARenderer';

interface CTATemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  type: string;
  config: Record<string, any>;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CTAInstance {
  instanceId: string;
  templateId: string;
  name: string;
  status: string;
  targetingRules: Record<string, any>;
  customConfig: Record<string, any>;
  performanceScore: number;
  createdAt: string;
}

interface CTAAnalytics {
  instanceId: string;
  impressions: number;
  interactions: number;
  conversions: number;
  conversionRate: number;
  interactionRate: number;
  averageDwellTime: number;
}

export const CTA3DDashboard: React.FC = () => {
  const [templates, setTemplates] = useState<CTATemplate[]>([]);
  const [instances, setInstances] = useState<CTAInstance[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, CTAAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CTATemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<CTAInstance | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showInstanceDialog, setShowInstanceDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [templatesRes, instancesRes] = await Promise.all([
        fetch('/api/cta-renderer/templates'),
        fetch('/api/cta-renderer/instances')
      ]);

      const templatesData = await templatesRes.json();
      const instancesData = await instancesRes.json();

      setTemplates(templatesData.templates || []);
      setInstances(instancesData.instances || []);

      // Load analytics for each instance
      const analyticsPromises = instancesData.instances?.map(async (instance: CTAInstance) => {
        const res = await fetch(`/api/cta-renderer/analytics/${instance.instanceId}/summary`);
        const data = await res.json();
        return { instanceId: instance.instanceId, ...data };
      }) || [];

      const analyticsData = await Promise.all(analyticsPromises);
      const analyticsMap = analyticsData.reduce((acc, item) => {
        acc[item.instanceId] = item;
        return acc;
      }, {} as Record<string, CTAAnalytics>);

      setAnalytics(analyticsMap);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<CTATemplate>) => {
    try {
      const response = await fetch('/api/cta-renderer/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        await loadDashboardData();
        setShowTemplateDialog(false);
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleCreateInstance = async (instanceData: Partial<CTAInstance>) => {
    try {
      const response = await fetch('/api/cta-renderer/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instanceData)
      });

      if (response.ok) {
        await loadDashboardData();
        setShowInstanceDialog(false);
      }
    } catch (error) {
      console.error('Failed to create instance:', error);
    }
  };

  const toggleInstanceStatus = async (instanceId: string, newStatus: string) => {
    try {
      await fetch(`/api/cta-renderer/instances/${instanceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to update instance status:', error);
    }
  };

  const renderOverviewCards = () => {
    const totalTemplates = templates.length;
    const activeInstances = instances.filter(i => i.status === 'active').length;
    const totalImpressions = Object.values(analytics).reduce((sum, a) => sum + (a.impressions || 0), 0);
    const totalConversions = Object.values(analytics).reduce((sum, a) => sum + (a.conversions || 0), 0);
    const avgConversionRate = totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Cube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              3D/AR/VR templates ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active CTAs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInstances}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all CTAs
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">3D/AR/VR Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your CTA templates and configurations
          </p>
        </div>
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create 3D/AR/VR Template</DialogTitle>
              <DialogDescription>
                Design a new immersive CTA experience template
              </DialogDescription>
            </DialogHeader>
            <TemplateForm onSubmit={handleCreateTemplate} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.templateId} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="outline">{template.type}</Badge>
                {template.config.webxr && <Badge variant="outline">VR Ready</Badge>}
                {template.config.ar && <Badge variant="outline">AR Ready</Badge>}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-1" />
                  Clone
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderInstancesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">CTA Instances</h3>
          <p className="text-sm text-muted-foreground">
            Manage active CTA deployments and campaigns
          </p>
        </div>
        <Dialog open={showInstanceDialog} onOpenChange={setShowInstanceDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Instance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Deploy CTA Instance</DialogTitle>
              <DialogDescription>
                Create a new CTA deployment from a template
              </DialogDescription>
            </DialogHeader>
            <InstanceForm templates={templates} onSubmit={handleCreateInstance} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance) => {
                const templateName = templates.find(t => t.templateId === instance.templateId)?.name || 'Unknown';
                const instanceAnalytics = analytics[instance.instanceId];
                
                return (
                  <TableRow key={instance.instanceId}>
                    <TableCell className="font-medium">{instance.name}</TableCell>
                    <TableCell>{templateName}</TableCell>
                    <TableCell>
                      <Badge variant={instance.status === 'active' ? 'default' : 'secondary'}>
                        {instance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {instance.performanceScore || 0}/100
                      </div>
                    </TableCell>
                    <TableCell>{instanceAnalytics?.impressions?.toLocaleString() || 0}</TableCell>
                    <TableCell>{instanceAnalytics?.conversions?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleInstanceStatus(
                            instance.instanceId, 
                            instance.status === 'active' ? 'paused' : 'active'
                          )}
                        >
                          {instance.status === 'active' ? 
                            <Pause className="h-4 w-4" /> : 
                            <Play className="h-4 w-4" />
                          }
                        </Button>
                        <Button size="sm" variant="ghost">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Performance Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Track engagement, conversions, and optimization metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing CTAs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {instances
                .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
                .slice(0, 10)
                .map((instance) => {
                  const instanceAnalytics = analytics[instance.instanceId];
                  return (
                    <div key={instance.instanceId} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{instance.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {instanceAnalytics?.conversions || 0} conversions
                        </p>
                      </div>
                      <Badge variant="outline">
                        {instance.performanceScore || 0}/100
                      </Badge>
                    </div>
                  );
                })}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>Desktop</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">85.2%</p>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">72.8%</p>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  <span>VR Headsets</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">94.1%</p>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading 3D CTA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AR/VR/3D CTA Dashboard</h1>
          <p className="text-muted-foreground">
            Manage immersive call-to-action experiences across all platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="instances">Instances</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {renderTemplatesTab()}
        </TabsContent>

        <TabsContent value="instances">
          {renderInstancesTab()}
        </TabsContent>

        <TabsContent value="analytics">
          {renderAnalyticsTab()}
        </TabsContent>

        <TabsContent value="assets">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Asset management coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      {showPreview && selectedTemplate && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl h-96">
            <DialogHeader>
              <DialogTitle>Template Preview: {selectedTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="h-full">
              <CTARenderer
                instanceId="preview"
                templateType={selectedTemplate.type as any}
                config={selectedTemplate.config}
                className="h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Template Form Component
const TemplateForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '3d_product',
    type: 'three_js',
    config: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      templateId: `template_${Date.now()}`,
      isActive: true,
      isPublic: false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My 3D Product Viewer"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3d_product">3D Product Viewer</SelectItem>
              <SelectItem value="ar_tryOn">AR Try-On</SelectItem>
              <SelectItem value="gamified_cta">Gamified CTA</SelectItem>
              <SelectItem value="vr_walkthrough">VR Walkthrough</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your 3D CTA template..."
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Render Engine</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="three_js">Three.js</SelectItem>
            <SelectItem value="babylonjs">Babylon.js</SelectItem>
            <SelectItem value="aframe">A-Frame</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Create Template</Button>
      </div>
    </form>
  );
};

// Instance Form Component
const InstanceForm: React.FC<{ templates: CTATemplate[], onSubmit: (data: any) => void }> = ({ 
  templates, onSubmit 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    targetingRules: {},
    customConfig: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      instanceId: `instance_${Date.now()}`,
      status: 'active'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="instanceName">Instance Name</Label>
          <Input
            id="instanceName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Homepage 3D CTA"
            required
          />
        </div>
        <div>
          <Label htmlFor="template">Template</Label>
          <Select
            value={formData.templateId}
            onValueChange={(value) => setFormData({ ...formData, templateId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.templateId} value={template.templateId}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Deploy Instance</Button>
      </div>
    </form>
  );
};

export default CTA3DDashboard;