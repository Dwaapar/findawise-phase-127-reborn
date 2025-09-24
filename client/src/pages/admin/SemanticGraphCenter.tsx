import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Brain, GitBranch, Zap, TrendingUp, AlertTriangle, RefreshCw, Eye, Network, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SemanticNode {
  id: number;
  slug: string;
  nodeType: string;
  title: string;
  description?: string;
  content?: string;
  verticalId?: string;
  neuronId?: string;
  clickThroughRate?: number;
  conversionRate?: number;
  engagement?: number;
  status: string;
  createdAt: string;
  similarity?: number;
}

interface SemanticEdge {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  edgeType: string;
  weight: number;
  confidence: number;
  clickCount: number;
  conversionCount: number;
  isActive: boolean;
  createdAt: string;
}

interface GraphStats {
  nodes: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  edges: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  vectors: {
    total: number;
    avgStrength: number;
  };
  recommendations: {
    total: number;
    active: number;
    clicked: number;
    converted: number;
  };
}

interface AuditResult {
  id: number;
  auditType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  recommendation: string;
  autoFixAvailable: boolean;
  isResolved: boolean;
  nodeId?: number;
  edgeId?: number;
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SemanticGraphCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchNodeTypes, setSearchNodeTypes] = useState<string[]>([]);
  const [searchVerticals, setSearchVerticals] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  // Node creation state
  const [newNodeType, setNewNodeType] = useState('');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeDescription, setNewNodeDescription] = useState('');
  const [newNodeContent, setNewNodeContent] = useState('');
  const [newNodeVertical, setNewNodeVertical] = useState('');

  // Fetch graph statistics
  const { data: graphStats, isLoading: statsLoading } = useQuery<GraphStats>({
    queryKey: ['/api/semantic/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch audit results
  const { data: auditResults, isLoading: auditLoading } = useQuery<AuditResult[]>({
    queryKey: ['/api/semantic/audit'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Semantic search
  const { data: searchResults, isLoading: searchLoading } = useQuery<SemanticNode[]>({
    queryKey: ['/api/semantic/search', searchQuery, searchNodeTypes.join(','), searchVerticals.join(',')],
    enabled: searchQuery.length > 2,
  });

  // Get selected node with relationships
  const { data: nodeDetails, isLoading: nodeLoading } = useQuery({
    queryKey: ['/api/semantic/nodes', selectedNode],
    enabled: selectedNode !== null,
  });

  // Create node mutation
  const createNodeMutation = useMutation({
    mutationFn: async (nodeData: any) => {
      return apiRequest('/api/semantic/nodes', 'POST', nodeData);
    },
    onSuccess: () => {
      toast({
        title: "Node Created",
        description: "Semantic node created successfully with auto-generated relationships",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/semantic/stats'] });
      setNewNodeTitle('');
      setNewNodeDescription('');
      setNewNodeContent('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create semantic node",
        variant: "destructive",
      });
    },
  });

  // Auto-fix audit issues mutation
  const autoFixMutation = useMutation({
    mutationFn: async (auditIds: number[]) => {
      return apiRequest('/api/semantic/audit/auto-fix', 'POST', { auditIds });
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-Fix Complete",
        description: `Auto-fix operation completed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/semantic/audit'] });
    },
  });

  // Prepare chart data
  const nodeTypeChartData = useMemo(() => {
    if (!graphStats?.nodes.byType) return [];
    return Object.entries(graphStats.nodes.byType).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [graphStats]);

  const edgeTypeChartData = useMemo(() => {
    if (!graphStats?.edges.byType) return [];
    return Object.entries(graphStats.edges.byType).map(([type, count]) => ({
      name: type,
      count,
    }));
  }, [graphStats]);

  const severityCount = useMemo(() => {
    if (!auditResults) return {};
    return auditResults.reduce((acc, result) => {
      acc[result.severity] = (acc[result.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [auditResults]);

  const handleCreateNode = () => {
    if (!newNodeType || !newNodeTitle) {
      toast({
        title: "Missing Fields",
        description: "Node type and title are required",
        variant: "destructive",
      });
      return;
    }

    createNodeMutation.mutate({
      slug: newNodeTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      nodeType: newNodeType,
      title: newNodeTitle,
      description: newNodeDescription,
      content: newNodeContent,
      verticalId: newNodeVertical || undefined,
      status: 'active',
    });
  };

  const handleAutoFix = () => {
    if (!auditResults) return;
    
    const autoFixableIds = auditResults
      .filter(result => result.autoFixAvailable && !result.isResolved)
      .map(result => result.id);
    
    if (autoFixableIds.length === 0) {
      toast({
        title: "No Auto-Fix Available",
        description: "No issues can be automatically fixed at this time",
      });
      return;
    }

    autoFixMutation.mutate(autoFixableIds);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Semantic Graph Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Billion-dollar AI-powered semantic intelligence and personalization engine
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => queryClient.invalidateQueries()}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAutoFix} size="sm" disabled={autoFixMutation.isPending}>
            {autoFixMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Auto-Fix Issues
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search & Browse</TabsTrigger>
          <TabsTrigger value="create">Create Node</TabsTrigger>
          <TabsTrigger value="audit">Health Audit</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '-' : graphStats?.nodes.total?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? '-' : graphStats?.nodes.active} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '-' : graphStats?.edges.total?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? '-' : graphStats?.edges.active} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Vectors</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '-' : graphStats?.vectors.total?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Avg strength: {statsLoading ? '-' : (graphStats?.vectors.avgStrength || 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '-' : graphStats?.recommendations.active?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? '-' : graphStats?.recommendations.clicked} clicked
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Node Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={nodeTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {nodeTypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relationship Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={edgeTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Health Status
              </CardTitle>
              <CardDescription>
                System health and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(severityCount).map(([severity, count]) => (
                  <Badge
                    key={severity}
                    variant={severity === 'critical' ? 'destructive' : severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}
                    className="px-3 py-1"
                  >
                    {severity}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Semantic Search
              </CardTitle>
              <CardDescription>
                AI-powered semantic search across all nodes and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search nodes by content, title, or semantic similarity..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Node Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="blog_post">Blog Post</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="cta_block">CTA Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {searchLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Searching...</span>
                </div>
              )}

              {searchResults && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.length} results
                  </p>
                  
                  <div className="space-y-4">
                    {searchResults.map((node) => (
                      <Card
                        key={node.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedNode(node.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{node.nodeType}</Badge>
                                {node.verticalId && (
                                  <Badge variant="secondary">{node.verticalId}</Badge>
                                )}
                                {node.similarity && (
                                  <Badge variant="default">
                                    {(node.similarity * 100).toFixed(1)}% match
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold">{node.title}</h3>
                              {node.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {node.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>CTR: {((node.clickThroughRate || 0) * 100).toFixed(1)}%</span>
                                <span>Engagement: {((node.engagement || 0) * 100).toFixed(1)}%</span>
                                <span>Conversion: {((node.conversionRate || 0) * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedNode && nodeDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Node Details & Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Node details would be displayed here */}
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(nodeDetails, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Semantic Node</CardTitle>
              <CardDescription>
                Create nodes with auto-generated embeddings, keywords, and relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nodeType">Node Type</Label>
                  <Select value={newNodeType} onValueChange={setNewNodeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select node type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="blog_post">Blog Post</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="cta_block">CTA Block</SelectItem>
                      <SelectItem value="user_archetype">User Archetype</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vertical">Vertical (Optional)</Label>
                  <Input
                    id="vertical"
                    value={newNodeVertical}
                    onChange={(e) => setNewNodeVertical(e.target.value)}
                    placeholder="e.g., ai-tools, finance, health"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  placeholder="Node title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newNodeDescription}
                  onChange={(e) => setNewNodeDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newNodeContent}
                  onChange={(e) => setNewNodeContent(e.target.value)}
                  placeholder="Full content (used for AI embedding generation)"
                  rows={6}
                />
              </div>

              <Button
                onClick={handleCreateNode}
                disabled={createNodeMutation.isPending}
                className="w-full"
              >
                {createNodeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Create Semantic Node
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Graph Health Audit
              </CardTitle>
              <CardDescription>
                Automated system health monitoring and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading audit results...</span>
                </div>
              ) : auditResults && auditResults.length > 0 ? (
                <div className="space-y-4">
                  {auditResults.map((result) => (
                    <Card key={result.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  result.severity === 'critical' ? 'destructive' :
                                  result.severity === 'high' ? 'destructive' :
                                  result.severity === 'medium' ? 'secondary' : 'outline'
                                }
                              >
                                {result.severity}
                              </Badge>
                              <Badge variant="outline">{result.auditType}</Badge>
                              {result.autoFixAvailable && (
                                <Badge variant="default">Auto-fixable</Badge>
                              )}
                              {result.isResolved && (
                                <Badge variant="outline">Resolved</Badge>
                              )}
                            </div>
                            <h4 className="font-semibold">{result.issue}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.recommendation}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Created: {new Date(result.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No issues detected. Graph is healthy!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="searches" stroke="#8884d8" />
                    <Line type="monotone" dataKey="recommendations" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Recommendation CTR</span>
                    <span className="font-semibold">
                      {graphStats?.recommendations.total ? 
                        ((graphStats.recommendations.clicked / graphStats.recommendations.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-semibold">
                      {graphStats?.recommendations.total ? 
                        ((graphStats.recommendations.converted / graphStats.recommendations.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Personalization</CardTitle>
              <CardDescription>
                User intent vectors and recommendation engine performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Personalization dashboard coming soon...</p>
                <p className="text-sm mt-2">Track user vectors, intent analysis, and recommendation performance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}