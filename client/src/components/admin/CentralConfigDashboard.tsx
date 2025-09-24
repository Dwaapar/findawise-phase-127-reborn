import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, Shield, Activity, Settings, Database, Users, Lock, Zap, Brain, Globe, Monitor, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, Search, Filter, Edit, Trash2, Plus, Save, RefreshCw, Eye, EyeOff, Download, Upload, Copy, BarChart3, PieChart, LineChart, Server, Cpu, HardDrive, Network, Gauge } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface ConfigItem {
  configId: string;
  version: string;
  title: string;
  description: string;
  category: 'page' | 'emotion' | 'module' | 'global' | 'ai';
  vertical: string;
  locale: string;
  isActive: boolean;
  isLocked: boolean;
  deprecated: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
  securityLevel?: 'public' | 'restricted' | 'confidential';
  aiEnhanced?: boolean;
}

interface HealthMetrics {
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  cacheHitRate: number;
  averageResponseTime: number;
  activeConnections: number;
  cacheSize: number;
  maxCacheSize: number;
  validationCacheSize: number;
}

interface SystemMetrics {
  totalConfigurations: number;
  activeConfigurations: number;
  averageLoadTime: number;
  topPerformingConfigs: Array<{
    configId: string;
    averageLoadTime: number;
    accessCount: number;
  }>;
  federationStatus: {
    totalSyncs: number;
    pendingSyncs: number;
    syncQueueSize: number;
  };
  aiEnhancedConfigs: number;
}

export default function CentralConfigDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [configurations, setConfigurations] = useState<ConfigItem[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load configurations and metrics
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load configurations
      const configResponse = await fetch('/api/central-config/configurations');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfigurations(configData);
      }

      // Load health metrics
      const healthResponse = await fetch('/api/central-config/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthMetrics(healthData);
      }

      // Load system metrics
      const metricsResponse = await fetch('/api/central-config/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setSystemMetrics(metricsData);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigAction = async (action: string, configId?: string, data?: any) => {
    try {
      let response;
      
      switch (action) {
        case 'create':
          response = await fetch('/api/central-config/configurations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
        case 'update':
          response = await fetch(`/api/central-config/configurations/${configId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
        case 'delete':
          response = await fetch(`/api/central-config/configurations/${configId}`, {
            method: 'DELETE'
          });
          break;
        case 'validate':
          response = await fetch(`/api/central-config/configurations/${configId}/validate`);
          break;
        default:
          return;
      }

      if (response && response.ok) {
        await loadData();
        setShowConfigModal(false);
        setSelectedConfig(null);
        setIsEditing(false);
      } else {
        throw new Error(`Failed to ${action} configuration`);
      }
    } catch (err) {
      setError(`Failed to ${action} configuration`);
      console.error(`Config ${action} error:`, err);
    }
  };

  const filteredConfigurations = configurations.filter(config => {
    const matchesSearch = config.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.configId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || config.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';  
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h ${Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  if (loading && !healthMetrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading Empire Config Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Central Config Engine
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Empire Grade Configuration Management System
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowConfigModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Config
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Health Status Bar */}
      {healthMetrics && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${getStatusColor(healthMetrics.status)}`}>
                  <Activity className="h-5 w-5" />
                  <span className="font-semibold capitalize">{healthMetrics.status}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Uptime: {formatUptime(healthMetrics.uptime)}
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{healthMetrics.requestCount}</div>
                  <div className="text-gray-500">Requests</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{(healthMetrics.errorRate * 100).toFixed(2)}%</div>
                  <div className="text-gray-500">Error Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{(healthMetrics.cacheHitRate * 100).toFixed(1)}%</div>
                  <div className="text-gray-500">Cache Hit</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{healthMetrics.averageResponseTime}ms</div>
                  <div className="text-gray-500">Avg Response</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Configs</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Validation</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Engine</span>
          </TabsTrigger>
          <TabsTrigger value="federation" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Federation</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemMetrics && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Configurations</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemMetrics.totalConfigurations}</div>
                    <p className="text-xs text-muted-foreground">
                      {systemMetrics.activeConfigurations} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Load Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemMetrics.averageLoadTime}ms</div>
                    <p className="text-xs text-muted-foreground">
                      System performance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Enhanced</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemMetrics.aiEnhancedConfigs}</div>
                    <p className="text-xs text-muted-foreground">
                      AI-powered configs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Federation Sync</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemMetrics.federationStatus.totalSyncs}</div>
                    <p className="text-xs text-muted-foreground">
                      {systemMetrics.federationStatus.pendingSyncs} pending
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* System Health Cards */}
          {healthMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>System Resources</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Usage</span>
                    <span className="text-sm font-semibold">
                      {healthMetrics.cacheSize} / {healthMetrics.maxCacheSize}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Connections</span>
                    <span className="text-sm font-semibold">{healthMetrics.activeConnections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Validation Cache</span>
                    <span className="text-sm font-semibold">{healthMetrics.validationCacheSize}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Request Count</span>
                    <span className="text-sm font-semibold">{healthMetrics.requestCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Count</span>
                    <span className="text-sm font-semibold text-red-500">{healthMetrics.errorCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="text-sm font-semibold text-green-500">
                      {(healthMetrics.cacheHitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Real-time Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {healthMetrics.status === 'operational' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : healthMetrics.status === 'degraded' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-semibold capitalize">{healthMetrics.status}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    System is running {healthMetrics.status === 'operational' ? 'smoothly' : 'with issues'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Configurations Tab */}
        <TabsContent value="configurations" className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search configurations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="page">Page Config</SelectItem>
                <SelectItem value="emotion">Emotion Config</SelectItem>
                <SelectItem value="module">Module Config</SelectItem>
                <SelectItem value="global">Global Config</SelectItem>
                <SelectItem value="ai">AI Config</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configurations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConfigurations.map((config) => (
              <Card key={config.configId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{config.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {config.configId} • v{config.version}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      {config.isActive && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                      {config.isLocked && (
                        <Lock className="h-4 w-4 text-yellow-500" />
                      )}
                      {config.aiEnhanced && (
                        <Brain className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {config.description}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Category: {config.category}</span>
                    <span>Vertical: {config.vertical}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span>By: {config.author}</span>
                    <span>{new Date(config.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConfig(config);
                        setShowConfigModal(true);
                        setIsEditing(false);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConfig(config);
                        setShowConfigModal(true);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigAction('validate', config.configId)}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredConfigurations.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No configurations found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filterCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Create your first configuration to get started.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Additional tabs would be implemented here with similar structure */}
        {/* ... Validation, Security, AI Engine, Federation, Analytics tabs ... */}
      </Tabs>
    </div>
  );
}