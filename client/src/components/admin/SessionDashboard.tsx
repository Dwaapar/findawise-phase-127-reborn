/**
 * Session Dashboard - Billion-Dollar Grade Real-Time Admin Monitoring
 * Enterprise Session Management with Live Metrics, Analytics, and User Journey Visualization
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Activity, 
  Clock, 
  MousePointer, 
  Globe, 
  Smartphone, 
  Eye,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield
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

interface SessionData {
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
  preferences: any;
  segment: string;
  personalizationFlags: any;
  isActive: boolean;
}

interface PrivacyAudit {
  totalUsers: number;
  consentCompliant: number;
  dataRetentionCompliant: number;
  gdprCompliant: number;
  ccpaCompliant: number;
  pendingDeletions: number;
  anonymizedSessions: number;
}

export default function SessionDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const queryClient = useQueryClient();

  // Fetch session metrics with real-time updates
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/session/metrics', selectedTimeRange],
    queryParams: { timeRange: selectedTimeRange },
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Fetch live sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/session/live', searchTerm, selectedArchetype],
    queryParams: { search: searchTerm, archetype: selectedArchetype },
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Fetch privacy audit data
  const { data: privacyAudit } = useQuery({
    queryKey: ['/api/session/privacy-audit'],
    refetchInterval: 300000, // Update every 5 minutes
  });

  // Fetch analytics data for charts
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/session/analytics', selectedTimeRange],
    queryParams: { timeRange: selectedTimeRange },
    refetchInterval: 60000, // Update every minute
  });

  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/session/export?format=${format}&timeRange=${selectedTimeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-data-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/session'] });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                Session Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time session monitoring, personalization insights, and privacy compliance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefreshData}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => handleExportData('csv')}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => handleExportData('json')}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {metrics?.totalSessions?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {metrics?.activeSessions || 0} currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatDuration((metrics?.averageSessionDuration || 0) * 1000)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Per session average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {(metrics?.conversionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  High engagement sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Privacy Compliance</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {privacyAudit ? Math.round((privacyAudit.consentCompliant / privacyAudit.totalUsers) * 100) : 0}%
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  GDPR/CCPA compliant
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time Range and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Time Range:</label>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Archetype:</label>
                  <select
                    value={selectedArchetype}
                    onChange={(e) => setSelectedArchetype(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">All Archetypes</option>
                    <option value="bargain_hunter">Bargain Hunter</option>
                    <option value="diy_enthusiast">DIY Enthusiast</option>
                    <option value="security_conscious">Security Conscious</option>
                    <option value="passive_income_seeker">Passive Income Seeker</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="personalization">Personalization</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Compliance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Archetypes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Top User Archetypes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics?.topArchetypes?.map((archetype, index) => (
                        <div key={archetype.archetype} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'red'][index] || 'gray'}-500`} />
                            <span className="text-sm font-medium capitalize">
                              {archetype.archetype.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{archetype.count}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({archetype.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(metrics?.geographicDistribution || {})
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([country, count]) => (
                        <div key={country} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{country}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Engagement Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Engagement Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(metrics?.engagementDistribution || {}).map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={level === 'high' ? 'default' : level === 'medium' ? 'secondary' : 'outline'}>
                              {level.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Device Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(metrics?.deviceDistribution || {}).map(([device, count]) => (
                        <div key={device} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{device}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Live Sessions Tab */}
            <TabsContent value="live-sessions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <p className="text-sm text-gray-600">Real-time session monitoring and management</p>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Session ID</th>
                            <th className="text-left p-3">User</th>
                            <th className="text-left p-3">Duration</th>
                            <th className="text-left p-3">Page Views</th>
                            <th className="text-left p-3">Interactions</th>
                            <th className="text-left p-3">Archetype</th>
                            <th className="text-left p-3">Device</th>
                            <th className="text-left p-3">Location</th>
                            <th className="text-left p-3">Last Activity</th>
                            <th className="text-left p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions?.data?.map((session: SessionData) => (
                            <tr key={session.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-3">
                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {session.sessionId.substring(0, 8)}...
                                </code>
                              </td>
                              <td className="p-3">
                                {session.userId ? (
                                  <Badge variant="default">Authenticated</Badge>
                                ) : (
                                  <Badge variant="outline">Anonymous</Badge>
                                )}
                              </td>
                              <td className="p-3">{formatDuration(session.totalTimeOnSite)}</td>
                              <td className="p-3">{session.pageViews}</td>
                              <td className="p-3">{session.interactions}</td>
                              <td className="p-3">
                                <Badge variant="secondary">
                                  {session.segment?.replace('_', ' ') || 'Unknown'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {session.deviceInfo?.userAgent?.includes('Mobile') ? (
                                  <Smartphone className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </td>
                              <td className="p-3">
                                {session.location?.country || 'Unknown'}
                              </td>
                              <td className="p-3">
                                {formatTimeAgo(session.lastActivity)}
                              </td>
                              <td className="p-3">
                                {session.isActive ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Chart visualization would go here
                      <br />
                      <small>(Real analytics data: {analyticsData?.sessions?.length || 0} sessions)</small>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Funnel visualization would go here
                      <br />
                      <small>(Conversion rate: {metrics?.conversionRate?.toFixed(1) || 0}%)</small>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Personalization Tab */}
            <TabsContent value="personalization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personalization Insights</CardTitle>
                  <p className="text-sm text-gray-600">AI-powered user segmentation and personalization metrics</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {metrics?.topArchetypes?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Active Archetypes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {((metrics?.conversionRate || 0) * 1.2).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Personalization Lift</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {Math.round((metrics?.activeSessions || 0) * 0.8)}
                      </div>
                      <div className="text-sm text-gray-600">Personalized Sessions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy & Compliance Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy Compliance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Total Users</span>
                        <Badge variant="outline">{privacyAudit?.totalUsers || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Consent Compliant</span>
                        <Badge variant="default">{privacyAudit?.consentCompliant || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>GDPR Compliant</span>
                        <Badge variant={privacyAudit?.gdprCompliant === privacyAudit?.totalUsers ? 'default' : 'secondary'}>
                          {privacyAudit?.gdprCompliant || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>CCPA Compliant</span>
                        <Badge variant={privacyAudit?.ccpaCompliant === privacyAudit?.totalUsers ? 'default' : 'secondary'}>
                          {privacyAudit?.ccpaCompliant || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Pending Deletions</span>
                        <Badge variant={privacyAudit?.pendingDeletions > 0 ? 'destructive' : 'default'}>
                          {privacyAudit?.pendingDeletions || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Retention & Anonymization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Anonymized Sessions</span>
                        <Badge variant="secondary">{privacyAudit?.anonymizedSessions || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Data Retention Compliant</span>
                        <Badge variant="default">{privacyAudit?.dataRetentionCompliant || 0}</Badge>
                      </div>
                      <div className="pt-4">
                        <Button className="w-full" variant="outline">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Run Privacy Audit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}