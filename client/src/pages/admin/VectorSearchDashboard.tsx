import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Brain, 
  Database, 
  BarChart3, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";

interface VectorEngineStatus {
  initialized: boolean;
  activeModel: string | null;
  totalModels: number;
  queueSize: number;
  isProcessing: boolean;
  adapters: Array<{
    name: string;
    type: string;
    status: string;
    isPrimary: boolean;
    lastCheck?: Date;
  }>;
}

interface SearchResult {
  contentId: string;
  similarity: number;
  metadata?: any;
}

interface VectorStats {
  totalVectors: number;
  avgDimensions: number;
  uniqueContentTypes: number;
  localFallbackVectors: number;
  adaptersConfigured: number;
}

interface SearchAnalytics {
  totalQueries: number;
  uniqueUsers: number;
  avgResponseTime: number;
  avgResultCount: number;
  date: string;
  hour: number;
}

/**
 * Billion-Dollar Empire Grade Vector Search Admin Dashboard
 * Production-ready monitoring and control interface for Vector Engine
 */
export default function VectorSearchDashboard() {
  const [engineStatus, setEngineStatus] = useState<VectorEngineStatus | null>(null);
  const [vectorStats, setVectorStats] = useState<VectorStats | null>(null);
  const [analytics, setAnalytics] = useState<SearchAnalytics[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [testText, setTestText] = useState('');
  const [testEmbedding, setTestEmbedding] = useState<number[]>([]);
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load data on component mount
  useEffect(() => {
    loadEngineStatus();
    loadVectorStats();
    loadAnalytics();
  }, []);

  const loadEngineStatus = async () => {
    try {
      const response = await fetch('/api/vector-search/engine/status');
      if (response.ok) {
        const data = await response.json();
        setEngineStatus(data.data);
      }
    } catch (error) {
      console.error('Error loading engine status:', error);
    }
  };

  const loadVectorStats = async () => {
    try {
      const response = await fetch('/api/vector-search/storage/stats');
      if (response.ok) {
        const data = await response.json();
        setVectorStats(data.data);
      }
    } catch (error) {
      console.error('Error loading vector stats:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/vector-search/analytics/search?groupBy=hour');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch('/api/vector-search/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryText: searchQuery,
          topK: 10,
          threshold: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data.results || []);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGenerateEmbedding = async () => {
    if (!testText.trim()) return;
    
    setEmbeddingLoading(true);
    try {
      const response = await fetch('/api/vector-search/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          modelName: 'universal-sentence-encoder',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestEmbedding(data.data.embedding || []);
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
      setTestEmbedding([]);
    } finally {
      setEmbeddingLoading(false);
    }
  };

  const handleInitializeEngine = async () => {
    try {
      const response = await fetch('/api/vector-search/engine/initialize', {
        method: 'POST',
      });
      
      if (response.ok) {
        loadEngineStatus();
      }
    } catch (error) {
      console.error('Error initializing engine:', error);
    }
  };

  const handleReindexContent = async () => {
    try {
      const response = await fetch('/api/vector-search/indexing/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSize: 100,
          priority: 5,
        }),
      });
      
      if (response.ok) {
        loadEngineStatus();
      }
    } catch (error) {
      console.error('Error starting reindex:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1) + '%';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              Vector Search Engine
            </h1>
            <p className="text-gray-600 mt-1">Billion-Dollar Empire Grade Semantic Search & Embeddings</p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={loadEngineStatus}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button 
              onClick={handleInitializeEngine}
              variant="default"
              size="sm"
              disabled={engineStatus?.initialized}
            >
              <Play className="h-4 w-4 mr-2" />
              Initialize
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engine Status</p>
                  <p className="text-2xl font-bold">
                    {engineStatus?.initialized ? 'Ready' : 'Offline'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  engineStatus?.initialized ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Model</p>
                  <p className="text-lg font-semibold">
                    {engineStatus?.activeModel || 'None'}
                  </p>
                </div>
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Queue Size</p>
                  <p className="text-2xl font-bold">
                    {engineStatus?.queueSize || 0}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vectors</p>
                  <p className="text-2xl font-bold">
                    {vectorStats?.totalVectors || 0}
                  </p>
                </div>
                <Database className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="search">Search Test</TabsTrigger>
            <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vector Database Adapters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Adapters
                  </CardTitle>
                  <CardDescription>
                    Status of vector database connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {engineStatus?.adapters.map((adapter, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(adapter.status)}`} />
                          <div>
                            <p className="font-medium">{adapter.name}</p>
                            <p className="text-sm text-gray-600">{adapter.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {adapter.isPrimary && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                          <Badge variant={adapter.status === 'healthy' ? 'default' : 'destructive'}>
                            {adapter.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Storage Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Storage Statistics
                  </CardTitle>
                  <CardDescription>
                    Vector storage metrics and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Vectors</span>
                      <span className="font-semibold">{vectorStats?.totalVectors || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Dimensions</span>
                      <span className="font-semibold">{vectorStats?.avgDimensions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Content Types</span>
                      <span className="font-semibold">{vectorStats?.uniqueContentTypes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Local Fallback</span>
                      <span className="font-semibold">{vectorStats?.localFallbackVectors || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adapters Configured</span>
                      <span className="font-semibold">{vectorStats?.adaptersConfigured || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Search Test Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Semantic Search Test
                </CardTitle>
                <CardDescription>
                  Test the vector search functionality with sample queries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter search query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={searchLoading}>
                    {searchLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <ScrollArea className="h-96 w-full border rounded-lg p-4">
                    <div className="space-y-3">
                      {searchResults.map((result, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{result.contentId}</h4>
                            <Badge variant="outline">
                              {formatSimilarity(result.similarity)}
                            </Badge>
                          </div>
                          {result.metadata && (
                            <p className="text-sm text-gray-600">
                              {JSON.stringify(result.metadata, null, 2)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Embeddings Tab */}
          <TabsContent value="embeddings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Embedding Generator
                </CardTitle>
                <CardDescription>
                  Generate and visualize text embeddings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter text to generate embeddings..."
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={3}
                />
                
                <Button onClick={handleGenerateEmbedding} disabled={embeddingLoading}>
                  {embeddingLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Generate Embedding
                </Button>

                {testEmbedding.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Generated Embedding</h4>
                      <Badge variant="outline">{testEmbedding.length} dimensions</Badge>
                    </div>
                    
                    <ScrollArea className="h-32 w-full border rounded-lg p-3 bg-gray-50">
                      <code className="text-xs">
                        [{testEmbedding.slice(0, 20).map(n => n.toFixed(4)).join(', ')}
                        {testEmbedding.length > 20 ? '...' : ''}]
                      </code>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Search Analytics
                </CardTitle>
                <CardDescription>
                  Vector search usage metrics and performance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.slice(0, 10).map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{metric.date} - Hour {metric.hour}</p>
                          <p className="text-sm text-gray-600">
                            {metric.totalQueries} queries, {metric.uniqueUsers} unique users
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{metric.avgResponseTime.toFixed(0)}ms avg</p>
                          <p className="text-sm text-gray-600">
                            {metric.avgResultCount.toFixed(1)} results avg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No analytics data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Engine Management
                </CardTitle>
                <CardDescription>
                  Control and configure the vector search engine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleReindexContent}
                    variant="outline"
                    className="justify-start"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reindex All Content
                  </Button>
                  
                  <Button 
                    onClick={loadEngineStatus}
                    variant="outline"
                    className="justify-start"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Health Check
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Production Ready</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This Vector Search Engine is configured for billion-dollar scale with 
                        enterprise-grade security, migration-proof architecture, and real-time monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}