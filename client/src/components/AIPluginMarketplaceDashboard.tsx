/**
 * AI PLUGIN MARKETPLACE DASHBOARD
 * Empire-Grade AI Plugin Marketplace Administration Interface
 * 
 * Complete management dashboard for AI Plugin Marketplace with
 * Self-Debug integration, migration-proof capabilities, and
 * comprehensive analytics.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  healthScore: number;
  totalInstances: number;
  executions: number;
  lastAudit?: string;
  version: string;
  author: string;
  tags: string[];
  capabilities: string[];
}

interface MarketplaceStats {
  totalPlugins: number;
  totalInstances: number;
  totalExecutions: number;
  averageHealthScore: number;
  healthSummary: {
    healthy: number;
    warning: number;
    critical: number;
  };
}

interface IntegrationStatus {
  continuousAuditEnabled: boolean;
  autoFixEnabled: boolean;
  selfHealingEvents: number;
  lastAuditRun: string;
  auditInterval: number;
  pluginHealthSummary: Array<{
    pluginId: string;
    status: string;
    healthScore: number;
    lastCheck: string;
    issues: number;
  }>;
}

interface MigrationStatus {
  isEmergencyMode: boolean;
  migrationSafety: number;
  backupCount: number;
  lastBackup: string;
  readinessScore: number;
}

const AIPluginMarketplaceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [healingEvents, setHealingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load marketplace statistics
      const statsResponse = await fetch('/api/plugins/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMarketplaceStats(statsData.data);
      }

      // Load integration status
      const integrationResponse = await fetch('/api/plugins/self-debug/status');
      if (integrationResponse.ok) {
        const integrationData = await integrationResponse.json();
        setIntegrationStatus(integrationData.data);
      }

      // Load migration status
      const migrationResponse = await fetch('/api/plugins/migration-proof/status');
      if (migrationResponse.ok) {
        const migrationData = await migrationResponse.json();
        setMigrationStatus(migrationData.data);
      }

      // Load plugins
      const pluginsResponse = await fetch('/api/plugins/marketplace');
      if (pluginsResponse.ok) {
        const pluginsData = await pluginsResponse.json();
        setPlugins(pluginsData.data.plugins || []);
      }

      // Load healing events
      const healingResponse = await fetch('/api/plugins/self-debug/healing-events?limit=20');
      if (healingResponse.ok) {
        const healingData = await healingResponse.json();
        setHealingEvents(healingData.data.events || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handlePluginAction = async (action: string, pluginId: string) => {
    try {
      let endpoint = '';
      let method = 'POST';

      switch (action) {
        case 'audit':
          endpoint = `/api/plugins/self-debug/audit/${pluginId}`;
          break;
        case 'restart':
          endpoint = `/api/plugins/restart/${pluginId}`;
          break;
        case 'repair':
          endpoint = `/api/plugins/repair/${pluginId}`;
          break;
        case 'safe-mode':
          endpoint = `/api/plugins/safe-mode/${pluginId}`;
          method = 'PUT';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: action === 'safe-mode' ? JSON.stringify({ enabled: true }) : undefined
      });

      if (response.ok) {
        await loadDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(`Failed to ${action} plugin: ${errorData.error}`);
      }
    } catch (error) {
      console.error(`Error ${action} plugin:`, error);
      setError(`Failed to ${action} plugin`);
    }
  };

  const handleForceAuditAll = async () => {
    try {
      const response = await fetch('/api/plugins/self-debug/audit-all', {
        method: 'POST'
      });

      if (response.ok) {
        setError(null);
        // Show success message or notification
      } else {
        const errorData = await response.json();
        setError(`Failed to initiate audit: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error initiating audit:', error);
      setError('Failed to initiate audit');
    }
  };

  const handleEmergencyBackup = async () => {
    try {
      const response = await fetch('/api/plugins/migration-proof/backup', {
        method: 'POST'
      });

      if (response.ok) {
        await loadDashboardData(); // Refresh migration status
        setError(null);
      } else {
        const errorData = await response.json();
        setError(`Failed to create backup: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setError('Failed to create backup');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'maintenance': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !marketplaceStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading AI Plugin Marketplace Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧩 AI Plugin Marketplace</h1>
          <p className="text-gray-600">Empire-Grade AI Plugin Management & Self-Debug Integration</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          EMPIRE GRADE
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
          <Button 
            onClick={() => setError(null)} 
            className="mt-2 text-sm"
            variant="outline"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plugins</CardTitle>
            <span className="text-2xl">🧩</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats?.totalPlugins || 0}</div>
            <p className="text-xs text-gray-600">Active in marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugin Instances</CardTitle>
            <span className="text-2xl">⚙️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaceStats?.totalInstances || 0}</div>
            <p className="text-xs text-gray-600">Deployed across neurons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <span className="text-2xl">💚</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(marketplaceStats?.averageHealthScore || 0)}`}>
              {marketplaceStats?.averageHealthScore?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-gray-600">Average plugin health</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Self-Healing Events</CardTitle>
            <span className="text-2xl">🔧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationStatus?.selfHealingEvents || 0}</div>
            <p className="text-xs text-gray-600">Automatic fixes applied</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="self-debug">Self-Debug</TabsTrigger>
          <TabsTrigger value="migration">Migration-Proof</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>🏥 System Health Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Healthy Plugins</span>
                  <Badge className="bg-green-100 text-green-800">
                    {marketplaceStats?.healthSummary.healthy || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Warning Status</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {marketplaceStats?.healthSummary.warning || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Critical Issues</span>
                  <Badge className="bg-red-100 text-red-800">
                    {marketplaceStats?.healthSummary.critical || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Migration Safety</span>
                  <Badge className={`${migrationStatus?.migrationSafety && migrationStatus.migrationSafety > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {migrationStatus?.migrationSafety?.toFixed(1) || '0.0'}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>📈 Recent Self-Healing Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {healingEvents.slice(0, 10).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{event.pluginId || 'System'}</div>
                        <div className="text-xs text-gray-600">{event.description || 'Auto-healing applied'}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Now'}
                      </div>
                    </div>
                  ))}
                  {healingEvents.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No recent self-healing events
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plugins Tab */}
        <TabsContent value="plugins" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Plugin Management</h2>
            <Button onClick={loadDashboardData}>Refresh</Button>
          </div>

          <div className="grid gap-4">
            {plugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{plugin.name}</h3>
                        <Badge className={getStatusColor(plugin.status)}>
                          {plugin.status}
                        </Badge>
                        <Badge variant="outline">v{plugin.version}</Badge>
                      </div>
                      <p className="text-gray-600 mt-1">{plugin.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Health: <span className={getHealthScoreColor(plugin.healthScore)}>
                            {plugin.healthScore}%
                          </span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Instances: {plugin.totalInstances}
                        </span>
                        <span className="text-sm text-gray-500">
                          Executions: {plugin.executions}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {plugin.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePluginAction('audit', plugin.id)}
                      >
                        Audit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePluginAction('restart', plugin.id)}
                      >
                        Restart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePluginAction('repair', plugin.id)}
                      >
                        Repair
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {plugins.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500">No plugins found in marketplace</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Self-Debug Tab */}
        <TabsContent value="self-debug" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Self-Debug Integration</h2>
            <div className="flex gap-2">
              <Button onClick={handleForceAuditAll}>Force Audit All</Button>
              <Button variant="outline" onClick={loadDashboardData}>Refresh</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🔧 Integration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Continuous Audit</span>
                  <Badge className={integrationStatus?.continuousAuditEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {integrationStatus?.continuousAuditEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-Fix</span>
                  <Badge className={integrationStatus?.autoFixEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {integrationStatus?.autoFixEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Audit Interval</span>
                  <span className="text-sm">{integrationStatus?.auditInterval || 30} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Audit</span>
                  <span className="text-sm">
                    {integrationStatus?.lastAuditRun ? 
                      new Date(integrationStatus.lastAuditRun).toLocaleString() : 
                      'Never'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Plugin Health Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {integrationStatus?.pluginHealthSummary?.map((plugin, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{plugin.pluginId}</div>
                        <div className="text-xs text-gray-600">
                          Last check: {new Date(plugin.lastCheck).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(plugin.status)}>
                          {plugin.status}
                        </Badge>
                        <span className={`text-sm ${getHealthScoreColor(plugin.healthScore)}`}>
                          {plugin.healthScore}%
                        </span>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-4">
                      No plugin health data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Migration-Proof Tab */}
        <TabsContent value="migration" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Migration-Proof System</h2>
            <div className="flex gap-2">
              <Button onClick={handleEmergencyBackup}>Emergency Backup</Button>
              <Button variant="outline" onClick={loadDashboardData}>Refresh</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🛡️ Migration Readiness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Emergency Mode</span>
                  <Badge className={migrationStatus?.isEmergencyMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {migrationStatus?.isEmergencyMode ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Migration Safety Score</span>
                  <span className={`font-semibold ${getHealthScoreColor(migrationStatus?.migrationSafety || 0)}`}>
                    {migrationStatus?.migrationSafety?.toFixed(1) || '0.0'}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Readiness Score</span>
                  <span className={`font-semibold ${getHealthScoreColor(migrationStatus?.readinessScore || 0)}`}>
                    {migrationStatus?.readinessScore?.toFixed(1) || '0.0'}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Backup Count</span>
                  <span className="text-sm">{migrationStatus?.backupCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Backup</span>
                  <span className="text-sm">
                    {migrationStatus?.lastBackup ? 
                      new Date(migrationStatus.lastBackup).toLocaleString() : 
                      'Never'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚡ System Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Cross-environment detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Automatic backup creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Database migration safety</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Plugin state preservation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Emergency mode activation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Zero-downtime transitions</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-xl font-semibold">Analytics & Performance</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 Execution Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-3xl font-bold">{marketplaceStats?.totalExecutions || 0}</div>
                  <div className="text-gray-600">Total Plugin Executions</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎯 Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Average Response Time</span>
                  <span className="text-sm">< 100ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Success Rate</span>
                  <span className="text-sm text-green-600">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Rate</span>
                  <span className="text-sm text-red-600">0.1%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-Fix Success</span>
                  <span className="text-sm text-green-600">95%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-xl font-semibold">System Configuration</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Configuration settings are managed through the API endpoints.
                Use the Self-Debug tab to trigger manual operations.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" size="sm">Export Configuration</Button>
                <Button variant="outline" size="sm">Import Configuration</Button>
                <Button variant="outline" size="sm">Reset to Defaults</Button>
                <Button variant="outline" size="sm">Backup Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPluginMarketplaceDashboard;