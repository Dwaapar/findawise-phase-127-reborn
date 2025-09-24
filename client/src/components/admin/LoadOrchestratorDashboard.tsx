/**
 * Multi-Region Load Orchestrator Dashboard
 * Billion-Dollar Empire Grade Admin Interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  Server, 
  Shield, 
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  MapPin,
  BarChart3,
  Settings,
  Play,
  RefreshCw
} from "lucide-react";

interface Region {
  id: string;
  name: string;
  location: {
    country: string;
    continent: string;
    coordinates: { lat: number; lng: number };
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';
    response_time_ms: number;
    cpu_usage: number;
    memory_usage: number;
    error_rate: number;
  };
  capacity: {
    max_concurrent_users: number;
    max_requests_per_second: number;
  };
  load_balancing: {
    weight: number;
    priority: number;
  };
}

interface TrafficData {
  timestamp: Date;
  total_requests: number;
  total_users: number;
  regions: Array<{
    region_id: string;
    requests: number;
    users: number;
    response_time: number;
    error_rate: number;
  }>;
}

interface FailoverEvent {
  id: string;
  timestamp: Date;
  from_region: string;
  to_region: string;
  reason: string;
  affected_users: number;
  recovery_time_seconds: number;
  automatic: boolean;
}

export function LoadOrchestratorDashboard() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [failoverEvents, setFailoverEvents] = useState<FailoverEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Optimized real-time updates to reduce load
    const interval = setInterval(loadDashboardData, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load regions data
      const regionsResponse = await fetch('/api/multi-region/regions');
      const regionsData = await regionsResponse.json();
      
      if (regionsData.success) {
        setRegions(regionsData.data.regions);
      }
      
      // Load traffic analytics
      const trafficResponse = await fetch('/api/multi-region/analytics/traffic');
      const trafficAnalytics = await trafficResponse.json();
      
      if (trafficAnalytics.success) {
        setTrafficData(trafficAnalytics.data.live);
      }
      
      // Load failover events
      const failoverResponse = await fetch('/api/multi-region/failover/events?limit=10');
      const failoverData = await failoverResponse.json();
      
      if (failoverData.success) {
        setFailoverEvents(failoverData.data.events);
      }
      
      // Load system health
      const healthResponse = await fetch('/api/multi-region/health/overview');
      const healthData = await healthResponse.json();
      
      if (healthData.success) {
        setSystemHealth(healthData.data);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerHealthCheck = async () => {
    try {
      await fetch('/api/multi-region/admin/health-check', { method: 'POST' });
      loadDashboardData();
    } catch (err) {
      setError('Failed to trigger health check');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      case 'maintenance': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !regions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Region Load Orchestrator</h1>
          <p className="text-muted-foreground">
            Global load balancing, failover management, and edge routing control
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={triggerHealthCheck} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status Overview */}
      {systemHealth && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemHealth.overall_status)}
                <Badge variant={systemHealth.overall_status === 'healthy' ? 'default' : 'destructive'}>
                  {systemHealth.overall_status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {systemHealth.healthy_regions}/{systemHealth.total_regions} regions healthy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.average_response_time}ms</div>
              <p className="text-xs text-muted-foreground">
                Global average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.global_error_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Across all regions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.recent_incidents}</div>
              <p className="text-xs text-muted-foreground">
                Last hour
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="failover">Failover</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* World Map Placeholder */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Global Region Map</CardTitle>
                <CardDescription>
                  Real-time status of all regions worldwide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Interactive world map would be rendered here</p>
                    <p className="text-sm text-muted-foreground">Showing {regions.length} active regions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest failover and scaling events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {failoverEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant={event.automatic ? "default" : "destructive"}>
                        {event.automatic ? "AUTO" : "MANUAL"}
                      </Badge>
                      <span className="text-sm">
                        Failover from {event.from_region} to {event.to_region}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regions Tab */}
        <TabsContent value="regions" className="space-y-4">
          <div className="grid gap-4">
            {regions.map((region) => (
              <Card key={region.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{region.name}</span>
                        <Badge variant={region.health.status === 'healthy' ? 'default' : 'destructive'}>
                          {region.health.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {region.location.country} • {region.location.continent}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Performance</h4>
                      <div className="space-y-1 text-sm">
                        <div>Response: {region.health.response_time_ms}ms</div>
                        <div>Error Rate: {region.health.error_rate}%</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Resource Usage</h4>
                      <div className="space-y-1 text-sm">
                        <div>CPU: {region.health.cpu_usage}%</div>
                        <div>Memory: {region.health.memory_usage}%</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Capacity</h4>
                      <div className="space-y-1 text-sm">
                        <div>Max Users: {region.capacity.max_concurrent_users.toLocaleString()}</div>
                        <div>Max RPS: {region.capacity.max_requests_per_second.toLocaleString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Load Balancing</h4>
                      <div className="space-y-1 text-sm">
                        <div>Weight: {region.load_balancing.weight}</div>
                        <div>Priority: {region.load_balancing.priority}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-4">
          {trafficData && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Live Traffic Distribution</CardTitle>
                  <CardDescription>Current request distribution across regions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trafficData.regions.map((regionData) => {
                      const percentage = ((regionData.requests / trafficData.total_requests) * 100).toFixed(1);
                      return (
                        <div key={regionData.region_id} className="flex items-center justify-between">
                          <span className="text-sm">{regionData.region_id}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Real-time performance across regions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Requests</span>
                      <span className="font-bold">{trafficData.total_requests.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users</span>
                      <span className="font-bold">{trafficData.total_users.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Best Region</span>
                      <span className="font-bold">
                        {trafficData.regions.reduce((best, current) => 
                          current.response_time < best.response_time ? current : best
                        ).region_id}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Failover Tab */}
        <TabsContent value="failover" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Failover Management</h2>
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Test DR Plan
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Failover Events</CardTitle>
              <CardDescription>History of automatic and manual failovers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {failoverEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={event.automatic ? "default" : "secondary"}>
                          {event.automatic ? "AUTOMATIC" : "MANUAL"}
                        </Badge>
                        <span className="font-medium">{event.reason}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">From:</span> {event.from_region}
                      </div>
                      <div>
                        <span className="font-medium">To:</span> {event.to_region}
                      </div>
                      <div>
                        <span className="font-medium">Affected Users:</span> {event.affected_users.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Recovery Time:</span> {event.recovery_time_seconds}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orchestrator Configuration</CardTitle>
              <CardDescription>Global settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Health Check Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div>Interval: 30 seconds</div>
                      <div>Timeout: 5 seconds</div>
                      <div>Failure Threshold: 3 consecutive failures</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Auto-Scaling Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div>CPU Threshold: 80%</div>
                      <div>Memory Threshold: 85%</div>
                      <div>Scale-up Delay: 5 minutes</div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button>Save Configuration</Button>
                  <Button variant="outline">Reset to Defaults</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LoadOrchestratorDashboard;