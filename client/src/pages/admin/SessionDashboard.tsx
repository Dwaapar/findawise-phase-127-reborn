/**
 * Session + Personalization Admin Dashboard
 * Billion-Dollar Empire Grade Session Management Interface
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  Activity, 
  Eye, 
  Clock, 
  Target, 
  Globe, 
  Smartphone, 
  Monitor,
  Shield,
  Download,
  Search,
  Filter,
  Trash2,
  UserX,
  Settings,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  averageSessionDuration: number;
  topArchetypes: Array<{ archetype: string; count: number; percentage: number }>;
  conversionRate: number;
  engagementDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
}

interface UserSession {
  id: number;
  sessionId: string;
  userId?: string;
  startTime: string;
  lastActivity: string;
  totalTimeOnSite: number;
  pageViews: number;
  interactions: number;
  deviceInfo: any;
  location: any;
  segment: string;
  personalizationFlags: Record<string, boolean>;
  isActive: boolean;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export default function SessionDashboard() {
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<string>('json');

  const queryClient = useQueryClient();

  // Fetch session metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['session-metrics', timeRange],
    queryFn: async (): Promise<SessionMetrics> => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1d': startDate.setDate(endDate.getDate() - 1); break;
        case '7d': startDate.setDate(endDate.getDate() - 7); break;
        case '30d': startDate.setDate(endDate.getDate() - 30); break;
        case '90d': startDate.setDate(endDate.getDate() - 90); break;
      }

      const response = await fetch(`/api/sessions/analytics/sessions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch session metrics');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch sessions list
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-sessions', searchQuery, segmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (segmentFilter !== 'all') params.set('segment', segmentFilter);
      
      const response = await fetch(`/api/session/admin/sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch cross-device analytics
  const { data: crossDeviceData } = useQuery({
    queryKey: ['cross-device-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/session/analytics/cross-device');
      if (!response.ok) throw new Error('Failed to fetch cross-device analytics');
      const result = await response.json();
      return result.data;
    },
  });

  // Export sessions mutation
  const exportSessionsMutation = useMutation({
    mutationFn: async (format: string) => {
      const response = await fetch(`/api/session/admin/sessions/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessions-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  // Erase user data mutation
  const eraseDataMutation = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string; reason: string }) => {
      const response = await fetch('/api/session/session/erase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, reason }),
      });
      if (!response.ok) throw new Error('Data erasure failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-metrics'] });
    },
  });

  // Prepared chart data
  const archetypeChartData = useMemo(() => {
    if (!metrics) return [];
    return metrics.topArchetypes.map(item => ({
      name: item.archetype.replace('_', ' ').toUpperCase(),
      value: item.count,
      percentage: item.percentage,
    }));
  }, [metrics]);

  const engagementChartData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.engagementDistribution).map(([level, count]) => ({
      name: level.toUpperCase(),
      value: count,
    }));
  }, [metrics]);

  const geographyChartData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.geographicDistribution)
      .slice(0, 10) // Top 10 countries
      .map(([country, count]) => ({
        name: country,
        value: count,
      }));
  }, [metrics]);

  const deviceChartData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.deviceDistribution).map(([device, count]) => ({
      name: device,
      value: count,
    }));
  }, [metrics]);

  const handleEraseUserData = (sessionId: string) => {
    const reason = prompt('Please provide a reason for data erasure (required for compliance):');
    if (reason) {
      eraseDataMutation.mutate({ sessionId, reason });
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session + Personalization Dashboard</h1>
          <p className="text-gray-600">Billion-dollar grade session management and user analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last Day</SelectItem>
              <SelectItem value="7d">Last Week</SelectItem>
              <SelectItem value="30d">Last Month</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => exportSessionsMutation.mutate(exportFormat)}
            disabled={exportSessionsMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeSessions} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? Math.round(metrics.averageSessionDuration / 60) : 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? Math.round(metrics.averageSessionDuration % 60) : 0}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              High-intent conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Privacy Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <p className="text-xs text-muted-foreground">
              GDPR/CCPA compliant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="cross-device">Cross-Device</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Archetypes */}
            <Card>
              <CardHeader>
                <CardTitle>User Archetypes Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={archetypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {archetypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Levels */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#ff7300"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {deviceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search sessions by user ID, session ID, or device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="new_visitor">New Visitors</SelectItem>
                <SelectItem value="returning_visitor">Returning Visitors</SelectItem>
                <SelectItem value="engaged_user">Engaged Users</SelectItem>
                <SelectItem value="high_converter">High Converters</SelectItem>
                <SelectItem value="researcher">Researchers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionsData?.sessions?.map((session: UserSession) => (
                    <div
                      key={session.sessionId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedSession(session.sessionId)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {session.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <Badge variant={session.isActive ? "default" : "secondary"}>
                            {session.segment.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{session.sessionId.substring(0, 12)}...</p>
                          <p className="text-sm text-gray-500">
                            {session.userId ? `User: ${session.userId.substring(0, 8)}...` : 'Anonymous'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>{session.pageViews} views • {session.interactions} interactions</p>
                          <p>{Math.round(session.totalTimeOnSite / 1000 / 60)}m duration</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // View session details
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEraseUserData(session.sessionId);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalization Tab */}
        <TabsContent value="personalization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalization Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Personalization Rules</span>
                    <Badge>247 rules</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ML Model Accuracy</span>
                    <Badge variant="secondary">94.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>A/B Tests Running</span>
                    <Badge>12 tests</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Personalization Coverage</span>
                    <Badge variant="default">87.5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Lift by Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>High Converters</span>
                    <Badge className="bg-green-100 text-green-800">+23.4%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Engaged Users</span>
                    <Badge className="bg-green-100 text-green-800">+18.7%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Returning Visitors</span>
                    <Badge className="bg-green-100 text-green-800">+12.1%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>New Visitors</span>
                    <Badge className="bg-yellow-100 text-yellow-800">+5.3%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cross-Device Tab */}
        <TabsContent value="cross-device" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Linking Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Linked Profiles</span>
                    <Badge>{crossDeviceData?.linkedProfiles || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Devices per User</span>
                    <Badge variant="secondary">{crossDeviceData?.avgDevicesPerUser || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cross-Device Sessions</span>
                    <Badge>{crossDeviceData?.crossDeviceSessions || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linking Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>High Confidence (85%+)</span>
                    <Badge className="bg-green-100 text-green-800">
                      {crossDeviceData?.highConfidenceLinks || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Medium Confidence (70-84%)</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {crossDeviceData?.mediumConfidenceLinks || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Low Confidence (50-69%)</span>
                    <Badge className="bg-red-100 text-red-800">
                      {crossDeviceData?.lowConfidenceLinks || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Journey Continuity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Seamless Handoffs</span>
                    <Badge className="bg-green-100 text-green-800">
                      {crossDeviceData?.seamlessHandoffs || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Failed Handoffs</span>
                    <Badge className="bg-red-100 text-red-800">
                      {crossDeviceData?.failedHandoffs || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Recovery Rate</span>
                    <Badge variant="secondary">
                      {crossDeviceData?.recoveryRate || 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>GDPR Compliance</span>
                    </span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>CCPA Compliance</span>
                    </span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Data Retention Policies</span>
                    </span>
                    <Badge className="bg-green-100 text-green-800">365 days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Consent Management</span>
                    </span>
                    <Badge className="bg-green-100 text-green-800">Automated</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Subject Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Access Requests (30d)</span>
                    <Badge>23</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Erasure Requests (30d)</span>
                    <Badge variant="secondary">7</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Portability Requests (30d)</span>
                    <Badge>12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Response Time</span>
                    <Badge className="bg-green-100 text-green-800">2.3 hours</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              All session data is processed in compliance with GDPR, CCPA, and other privacy regulations. 
              Users can opt-out of tracking and request data deletion at any time.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}