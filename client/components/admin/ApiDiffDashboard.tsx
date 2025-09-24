import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database,
  TrendingUp,
  Settings,
  Refresh,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';

interface ApiDiff {
  id: string;
  endpoint_id: string;
  version_from: string;
  version_to: string;
  diff_type: 'added' | 'removed' | 'modified' | 'deprecated';
  changes: Record<string, any>;
  breaking_change: boolean;
  confidence_score: number;
  detected_at: string;
  migration_status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface MigrationEvent {
  id: string;
  event_type: string;
  description: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  auto_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

interface SystemStatus {
  monitoring_active: boolean;
  fallback_mode: boolean;
  last_health_check: string;
  cache_size: number;
  system_health: string;
}

interface Analytics {
  overview: {
    total_diffs: number;
    breaking_changes: number;
    recent_events_24h: number;
    system_health: string;
    monitoring_uptime: string;
  };
  performance: {
    cache_size: number;
    fallback_mode: boolean;
    last_health_check: string;
  };
  trends: {
    breaking_change_rate: string;
    migration_frequency: string;
    confidence_score_avg: string;
  };
}

const ApiDiffDashboard: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [diffs, setDiffs] = useState<ApiDiff[]>([]);
  const [events, setEvents] = useState<MigrationEvent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data from API endpoints
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusRes, diffsRes, eventsRes, analyticsRes] = await Promise.all([
        fetch('/api/live-diff/status'),
        fetch('/api/live-diff/diffs'),
        fetch('/api/live-diff/migration-events'),
        fetch('/api/live-diff/analytics')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData.data);
      }

      if (diffsRes.ok) {
        const diffsData = await diffsRes.json();
        setDiffs(diffsData.data.diffs || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data.events || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data);
      }

    } catch (err) {
      setError('Failed to fetch API diff data');
      console.error('API Diff Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getImpactBadge = (level: string) => {
    const variants = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[level as keyof typeof variants] || variants.low;
  };

  const getDiffTypeBadge = (type: string) => {
    const variants = {
      added: 'bg-green-100 text-green-800 border-green-200',
      modified: 'bg-blue-100 text-blue-800 border-blue-200',
      removed: 'bg-red-100 text-red-800 border-red-200',
      deprecated: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return variants[type as keyof typeof variants] || variants.modified;
  };

  const forceCheck = async () => {
    try {
      const response = await fetch('/api/live-diff/force-check', { method: 'POST' });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Force check failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-sm text-gray-600">Loading API Diff Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData} 
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live API Diff Tracker</h1>
          <p className="text-gray-600">
            Monitor and track API changes in real-time with migration-proof technology
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={forceCheck}>
            <Eye className="h-4 w-4 mr-2" />
            Force Check
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status?.system_health || 'unknown')}
              <div>
                <p className="text-sm font-medium">System Health</p>
                <p className="text-lg font-bold capitalize">
                  {status?.system_health || 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className={`h-5 w-5 ${status?.monitoring_active ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-sm font-medium">Monitoring</p>
                <p className="text-lg font-bold">
                  {status?.monitoring_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className={`h-5 w-5 ${status?.fallback_mode ? 'text-yellow-500' : 'text-green-500'}`} />
              <div>
                <p className="text-sm font-medium">Mode</p>
                <p className="text-lg font-bold">
                  {status?.fallback_mode ? 'Fallback' : 'Normal'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Cache Size</p>
                <p className="text-lg font-bold">{status?.cache_size || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diffs">API Diffs</TabsTrigger>
          <TabsTrigger value="events">Migration Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Differences</CardTitle>
                <CardDescription>
                  Latest changes detected in your APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diffs.slice(0, 5).map((diff) => (
                    <div key={diff.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getDiffTypeBadge(diff.diff_type)}>
                            {diff.diff_type}
                          </Badge>
                          {diff.breaking_change && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Breaking
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {diff.version_from} → {diff.version_to}
                        </p>
                      </div>
                      <Badge className={getImpactBadge(diff.migration_status)}>
                        {diff.migration_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Migration Events</CardTitle>
                <CardDescription>
                  Recent migration events and system changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium text-sm">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getImpactBadge(event.impact_level)}>
                        {event.impact_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diffs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Differences</CardTitle>
              <CardDescription>
                Complete list of detected API changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diffs.map((diff) => (
                  <div key={diff.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDiffTypeBadge(diff.diff_type)}>
                          {diff.diff_type}
                        </Badge>
                        {diff.breaking_change && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Breaking Change
                          </Badge>
                        )}
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {diff.confidence_score.toFixed(2)}
                        </span>
                      </div>
                      <Badge className={getImpactBadge(diff.migration_status)}>
                        {diff.migration_status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Endpoint:</strong> {diff.endpoint_id}</p>
                      <p><strong>Version:</strong> {diff.version_from} → {diff.version_to}</p>
                      <p><strong>Detected:</strong> {new Date(diff.detected_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration Events</CardTitle>
              <CardDescription>
                System migration events and their resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {event.event_type}
                        </Badge>
                        {event.auto_resolved && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Auto-resolved
                          </Badge>
                        )}
                      </div>
                      <Badge className={getImpactBadge(event.impact_level)}>
                        {event.impact_level}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{event.description}</p>
                      <p><strong>Created:</strong> {new Date(event.created_at).toLocaleString()}</p>
                      {event.resolved_at && (
                        <p><strong>Resolved:</strong> {new Date(event.resolved_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Diffs:</span>
                    <span className="font-bold">{analytics.overview.total_diffs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Breaking Changes:</span>
                    <span className="font-bold text-red-600">{analytics.overview.breaking_changes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Events (24h):</span>
                    <span className="font-bold">{analytics.overview.recent_events_24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monitoring Uptime:</span>
                    <span className="font-bold text-green-600">{analytics.overview.monitoring_uptime}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cache Size:</span>
                    <span className="font-bold">{analytics.performance.cache_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fallback Mode:</span>
                    <span className={`font-bold ${analytics.performance.fallback_mode ? 'text-yellow-600' : 'text-green-600'}`}>
                      {analytics.performance.fallback_mode ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Health Check:</span>
                    <span className="font-mono text-sm">{analytics.performance.last_health_check}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Breaking Change Rate:</span>
                    <span className="font-bold">{analytics.trends.breaking_change_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Migration Frequency:</span>
                    <span className="font-bold">{analytics.trends.migration_frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Confidence Score:</span>
                    <span className="font-bold">{analytics.trends.confidence_score_avg}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDiffDashboard;