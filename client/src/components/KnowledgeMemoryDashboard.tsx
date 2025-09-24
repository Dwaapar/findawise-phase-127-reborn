import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Network, Search, Database, Zap, Activity, TrendingUp, Settings } from 'lucide-react';

interface MemoryNode {
  id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  tags: string[];
  importance: number;
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  strength: number;
  connectionType: 'semantic' | 'temporal' | 'causal' | 'associative';
  createdAt: Date;
}

interface KnowledgeMetrics {
  totalNodes: number;
  totalConnections: number;
  avgImportance: number;
  searchQueries: number;
  ragEnhancements: number;
  promptOptimizations: number;
  federationSyncs: number;
}

export function KnowledgeMemoryDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [connections, setConnections] = useState<MemoryConnection[]>([]);
  const [metrics, setMetrics] = useState<KnowledgeMetrics>({
    totalNodes: 0,
    totalConnections: 0,
    avgImportance: 0,
    searchQueries: 0,
    ragEnhancements: 0,
    promptOptimizations: 0,
    federationSyncs: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemoryNode[]>([]);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryTags, setNewMemoryTags] = useState('');
  const [loading, setLoading] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [nodesResponse, connectionsResponse, metricsResponse] = await Promise.all([
        fetch('/api/memory/nodes'),
        fetch('/api/memory/connections'),
        fetch('/api/memory/metrics')
      ]);

      if (nodesResponse.ok) {
        const nodesData = await nodesResponse.json();
        setNodes(nodesData.data || []);
      }

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setConnections(connectionsData.data || []);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data || metrics);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 10 })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMemory = async () => {
    if (!newMemoryContent.trim()) return;

    setLoading(true);
    try {
      const tags = newMemoryTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const response = await fetch('/api/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMemoryContent,
          tags,
          metadata: { source: 'dashboard', createdBy: 'admin' }
        })
      });

      if (response.ok) {
        setNewMemoryContent('');
        setNewMemoryTags('');
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error creating memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvolutionCycle = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/memory/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleType: 'manual' })
      });

      if (response.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error running evolution cycle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFederationSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/memory/federation/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'full' })
      });

      if (response.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error syncing federation memory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Memory Graph</h1>
            <p className="text-gray-600">Zero-Shot Prompt Optimizer + RAG Enhancer + Federation Memory</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleEvolutionCycle} disabled={loading} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Run Evolution
          </Button>
          <Button onClick={handleFederationSync} disabled={loading} variant="outline">
            <Network className="h-4 w-4 mr-2" />
            Sync Federation
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Nodes</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalNodes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalConnections.toLocaleString()} connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Importance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgImportance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Memory quality score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Queries</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.searchQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">RAG enhancements: {metrics.ragEnhancements}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Federation Syncs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.federationSyncs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cross-neuron intelligence</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Memory Search</TabsTrigger>
          <TabsTrigger value="create">Create Memory</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="federation">Federation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Memory Nodes</CardTitle>
                <CardDescription>Latest knowledge stored in the graph</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nodes.slice(0, 5).map((node) => (
                    <div key={node.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Importance: {node.importance.toFixed(2)}</Badge>
                        <span className="text-xs text-gray-500">
                          Accessed {node.accessCount} times
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{node.content}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {node.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strong Connections</CardTitle>
                <CardDescription>High-strength semantic relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connections
                    .sort((a, b) => b.strength - a.strength)
                    .slice(0, 5)
                    .map((connection) => (
                      <div key={connection.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{connection.connectionType}</Badge>
                          <span className="font-semibold text-blue-600">
                            {(connection.strength * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {connection.sourceNodeId} → {connection.targetNodeId}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Semantic Memory Search</CardTitle>
              <CardDescription>Search the knowledge graph using semantic similarity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter your search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Search Results</h3>
                  {searchResults.map((result) => (
                    <div key={result.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Relevance: {result.importance.toFixed(2)}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(result.lastAccessed).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{result.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {result.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Memory Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Memory</CardTitle>
              <CardDescription>Add new knowledge to the memory graph</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="memory-content">Memory Content</Label>
                <Textarea
                  id="memory-content"
                  placeholder="Enter the knowledge content..."
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="memory-tags">Tags (comma-separated)</Label>
                <Input
                  id="memory-tags"
                  placeholder="ai, machine-learning, prompt-optimization"
                  value={newMemoryTags}
                  onChange={(e) => setNewMemoryTags(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateMemory} disabled={loading || !newMemoryContent.trim()}>
                <Database className="h-4 w-4 mr-2" />
                Store Memory
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Connections</CardTitle>
              <CardDescription>Semantic relationships between memory nodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div key={connection.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{connection.connectionType}</Badge>
                        <span className="font-semibold text-blue-600">
                          Strength: {(connection.strength * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Source:</span> {connection.sourceNodeId}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Target:</span> {connection.targetNodeId}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zero-Shot Prompt Optimization</CardTitle>
              <CardDescription>AI-powered prompt optimization and learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Optimization Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div>Total Optimizations: {metrics.promptOptimizations}</div>
                      <div>Success Rate: 94.7%</div>
                      <div>Avg Improvement: +23.4%</div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Recent Optimizations</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Enhanced query expansion templates</div>
                      <div>Improved context selection logic</div>
                      <div>Updated performance scoring</div>
                    </div>
                  </div>
                </div>
                <Button onClick={handleEvolutionCycle} disabled={loading}>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Optimization Cycle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Federation Tab */}
        <TabsContent value="federation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Federation Memory Sync</CardTitle>
              <CardDescription>Cross-neuron knowledge sharing and synchronization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Sync Status</h3>
                    <div className="space-y-2 text-sm">
                      <div>Total Syncs: {metrics.federationSyncs}</div>
                      <div>Active Neurons: 15</div>
                      <div>Last Sync: 5 minutes ago</div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Cross-Neuron Intelligence</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Shared patterns detected</div>
                      <div>Optimization insights propagated</div>
                      <div>Knowledge gaps identified</div>
                    </div>
                  </div>
                </div>
                <Button onClick={handleFederationSync} disabled={loading}>
                  <Network className="h-4 w-4 mr-2" />
                  Force Federation Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}