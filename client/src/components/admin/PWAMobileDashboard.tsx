import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Bell, 
  TrendingUp, 
  Users, 
  Download, 
  Link,
  Settings,
  BarChart3,
  Globe,
  Battery,
  Wifi,
  Cpu,
  HardDrive,
  Zap,
  Target,
  Gauge,
  Activity,
  Eye,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// API request helper
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

interface PWAAnalytics {
  period: string;
  installStats: Record<string, number>;
  performanceStats: Record<string, { average: number; samples: number }>;
  deviceBreakdown: Array<{ deviceType: string; os: string; count: number }>;
  deepLinkPerformance: Array<{ linkType: string; successRate: number; totalClicks: number }>;
  pushEngagement: {
    totalCampaigns: number;
    totalDelivered: number;
    totalClicked: number;
  };
}

interface PWAConfig {
  vapidPublicKey: string;
  notificationTopics: string[];
  cacheStrategy: string;
  offlinePages: string[];
  installPromptConfig: {
    minEngagementScore: number;
    delayMs: number;
    maxAttempts: number;
    cooldownDays: number;
  };
  features: {
    backgroundSync: boolean;
    pushNotifications: boolean;
    offlineMode: boolean;
    installPrompt: boolean;
    periodicSync: boolean;
  };
}

interface MobileAppConfig {
  id: number;
  platform: string;
  appVersion: string;
  buildNumber: number;
  manifestConfig: any;
  nativePlugins: string[];
  permissions: string[];
  storeListingData: any;
  securityConfig: any;
  performanceConfig: any;
  complianceSettings: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PWAMobileDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [configForm, setConfigForm] = useState<Partial<PWAConfig>>({});
  const queryClient = useQueryClient();

  // Queries
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/pwa/analytics/dashboard'],
    queryFn: () => apiRequest('/api/pwa/analytics/dashboard?days=30'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: pwaConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/pwa/config'],
    queryFn: () => apiRequest('/api/pwa/config'),
  });

  const { data: pwaStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/pwa/stats'],
    queryFn: () => apiRequest('/api/pwa/stats'),
    refetchInterval: 15000,
  });

  const { data: mobileConfigs } = useQuery({
    queryKey: ['/api/pwa/mobile-configs'],
    queryFn: () => Promise.all([
      apiRequest('/api/pwa/mobile-config/ios').catch(() => null),
      apiRequest('/api/pwa/mobile-config/android').catch(() => null),
      apiRequest('/api/pwa/mobile-config/web').catch(() => null),
    ]),
  });

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: (config: Partial<PWAConfig>) =>
      apiRequest('/api/pwa/config', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pwa/config'] });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (notification: { title: string; body: string; topics?: string[]; urgent?: boolean }) =>
      apiRequest('/api/pwa/push/send', {
        method: 'POST',
        body: JSON.stringify(notification),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pwa/stats'] });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/pwa/cache/clear', {
        method: 'POST',
      }),
  });

  // Initialize config form
  useEffect(() => {
    if (pwaConfig?.data) {
      setConfigForm(pwaConfig.data);
    }
  }, [pwaConfig]);

  const analytics: PWAAnalytics | null = analyticsData?.data || null;
  const config: PWAConfig | null = pwaConfig?.data || null;
  const stats = pwaStatsData?.data || null;

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (metric: string, value: number) => {
    switch (metric) {
      case 'fcp':
      case 'lcp':
        return value < 2500 ? 'text-green-600' : value < 4000 ? 'text-yellow-600' : 'text-red-600';
      case 'fid':
        return value < 100 ? 'text-green-600' : value < 300 ? 'text-yellow-600' : 'text-red-600';
      case 'cls':
        return value < 0.1 ? 'text-green-600' : value < 0.25 ? 'text-yellow-600' : 'text-red-600';
      case 'ttfb':
        return value < 800 ? 'text-green-600' : value < 1800 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleConfigUpdate = (updates: Partial<PWAConfig>) => {
    const newConfig = { ...configForm, ...updates };
    setConfigForm(newConfig);
    updateConfigMutation.mutate(newConfig);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    sendNotificationMutation.mutate({
      title: formData.get('title') as string,
      body: formData.get('body') as string,
      topics: (formData.get('topics') as string)?.split(',').map(t => t.trim()) || [],
      urgent: formData.get('urgent') === 'on',
    });
  };

  if (analyticsLoading || configLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading PWA Mobile Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PWA Mobile Optimization Center</h1>
          <p className="text-muted-foreground">
            Empire-grade mobile app performance, install analytics, and push notification management
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Zap className="h-4 w-4 mr-1" />
          Empire Grade
        </Badge>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PWA Installs</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInstalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentInstalls || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Push Subscribers</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.pushEngagement.totalCampaigns || 0} campaigns sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Push Engagement Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.pushEngagement.totalDelivered > 0 
                ? Math.round((analytics.pushEngagement.totalClicked / analytics.pushEngagement.totalDelivered) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.pushEngagement.totalClicked || 0} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Performance Score</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94</div>
            <p className="text-xs text-muted-foreground">Lighthouse PWA Score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Push Notifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="mobile-config">Mobile Config</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Install Sources Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Install Sources
              </CardTitle>
              <CardDescription>How users are discovering and installing your PWA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats?.installSources || {}).map(([source, count]) => (
                  <div key={source} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {source.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Device & Platform Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Type</TableHead>
                    <TableHead>Operating System</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.deviceBreakdown.map((device, index) => {
                    const total = analytics.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);
                    const percentage = ((device.count / total) * 100).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell className="flex items-center gap-2">
                          {getDeviceIcon(device.deviceType)}
                          <span className="capitalize">{device.deviceType}</span>
                        </TableCell>
                        <TableCell className="capitalize">{device.os}</TableCell>
                        <TableCell>{device.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={parseFloat(percentage)} className="w-16" />
                            <span className="text-sm">{percentage}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Deep Link Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Deep Link Performance
              </CardTitle>
              <CardDescription>Attribution and conversion tracking for deep links</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link Type</TableHead>
                    <TableHead>Total Clicks</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.deepLinkPerformance.map((link, index) => (
                    <TableRow key={index}>
                      <TableCell className="capitalize">{link.linkType}</TableCell>
                      <TableCell>{link.totalClicks}</TableCell>
                      <TableCell>{link.successRate.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={
                          link.successRate >= 90 ? "default" : 
                          link.successRate >= 75 ? "secondary" : "destructive"
                        }>
                          {link.successRate >= 90 ? "Excellent" : 
                           link.successRate >= 75 ? "Good" : "Needs Attention"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Daily Install Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Install Trends</CardTitle>
              <CardDescription>PWA installs over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center">
                {Object.entries(stats?.dailyInstalls || {}).slice(-7).map(([date, installs]) => (
                  <div key={date} className="space-y-2">
                    <div className="text-2xl font-bold">{installs}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Core Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>Real user performance metrics from PWA users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(analytics?.performanceStats || {}).map(([metric, data]) => (
                  <div key={metric} className="text-center p-4 border rounded-lg">
                    <div className={`text-2xl font-bold ${getPerformanceColor(metric, data.average)}`}>
                      {metric === 'cls' ? data.average.toFixed(3) : Math.round(data.average)}
                      {metric !== 'cls' && 'ms'}
                    </div>
                    <div className="text-sm font-medium uppercase">{metric}</div>
                    <div className="text-xs text-muted-foreground">{data.samples} samples</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {/* Send Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Send Push Notification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Notification Title</Label>
                    <Input id="title" name="title" placeholder="Your notification title" required />
                  </div>
                  <div>
                    <Label htmlFor="topics">Topics (comma-separated)</Label>
                    <Input id="topics" name="topics" placeholder="general,offers,updates" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="body">Message Body</Label>
                  <Textarea id="body" name="body" placeholder="Your notification message" required />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="urgent" name="urgent" />
                  <Label htmlFor="urgent">High Priority / Urgent</Label>
                </div>
                <Button type="submit" disabled={sendNotificationMutation.isPending}>
                  {sendNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                  <MessageSquare className="h-4 w-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Push Engagement Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Push Notification Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{analytics?.pushEngagement.totalCampaigns || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Campaigns</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{analytics?.pushEngagement.totalDelivered || 0}</div>
                  <div className="text-sm text-muted-foreground">Messages Delivered</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{analytics?.pushEngagement.totalClicked || 0}</div>
                  <div className="text-sm text-muted-foreground">Click-Throughs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile-config" className="space-y-4">
          {/* Mobile App Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['iOS', 'Android', 'Web'].map((platform) => {
              const config = mobileConfigs?.[['ios', 'android', 'web'].indexOf(platform.toLowerCase())];
              return (
                <Card key={platform}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {platform === 'iOS' && <Smartphone className="h-5 w-5" />}
                      {platform === 'Android' && <Smartphone className="h-5 w-5" />}
                      {platform === 'Web' && <Globe className="h-5 w-5" />}
                      {platform} Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {config ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Version:</span>
                          <span className="text-sm">{config.appVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Build:</span>
                          <span className="text-sm">{config.buildNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Updated:</span>
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(config.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No configuration found</p>
                        <Button size="sm" className="mt-2">
                          Create Configuration
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* PWA Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                PWA Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Cache Strategy</Label>
                      <Input 
                        value={configForm.cacheStrategy || ''} 
                        onChange={(e) => setConfigForm(prev => ({ ...prev, cacheStrategy: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Min Engagement Score for Install Prompt</Label>
                      <Input 
                        type="number"
                        value={configForm.installPromptConfig?.minEngagementScore || 0} 
                        onChange={(e) => setConfigForm(prev => ({ 
                          ...prev, 
                          installPromptConfig: { 
                            ...prev.installPromptConfig,
                            minEngagementScore: parseInt(e.target.value) 
                          } 
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>PWA Features</Label>
                    {Object.entries(config.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Switch 
                          checked={configForm.features?.[feature as keyof typeof config.features] ?? enabled}
                          onCheckedChange={(checked) => setConfigForm(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [feature]: checked
                            }
                          }))}
                        />
                        <Label className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleConfigUpdate(configForm)}
                      disabled={updateConfigMutation.isPending}
                    >
                      {updateConfigMutation.isPending ? 'Updating...' : 'Update Configuration'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => clearCacheMutation.mutate()}
                      disabled={clearCacheMutation.isPending}
                    >
                      {clearCacheMutation.isPending ? 'Clearing...' : 'Clear All Caches'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}