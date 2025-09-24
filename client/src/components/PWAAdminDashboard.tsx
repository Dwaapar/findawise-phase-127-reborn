import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Bell, 
  Settings, 
  Users, 
  TrendingUp, 
  Download,
  Wifi,
  AlertCircle,
  CheckCircle,
  Send,
  BarChart3,
  Zap
} from 'lucide-react';

interface PWAAdminDashboardProps {
  className?: string;
}

interface PWAStats {
  totalInstalls: number;
  activeSubscriptions: number;
  notificationsSent: number;
  offlineUsage: number;
  installSources: Record<string, number>;
  dailyStats: {
    installs: Record<string, number>;
    notifications: Record<string, number>;
    offlineUsage: Record<string, number>;
  };
  topNotificationTopics: Record<string, number>;
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

export const PWAAdminDashboard: React.FC<PWAAdminDashboardProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<PWAStats | null>(null);
  const [config, setConfig] = useState<PWAConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    topics: [],
    urgent: false
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, configResponse] = await Promise.all([
        fetch('/api/pwa/analytics/dashboard'),
        fetch('/api/pwa/config')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.dashboard);
      }

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(configData.config);
      }
    } catch (error) {
      console.error('Failed to load PWA dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      return;
    }

    try {
      setSendingNotification(true);
      const response = await fetch('/api/pwa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notificationForm.title,
          body: notificationForm.body,
          topics: notificationForm.topics,
          urgent: notificationForm.urgent,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Notification sent to ${result.sent} subscribers`);
        setNotificationForm({ title: '', body: '', topics: [], urgent: false });
        loadDashboardData(); // Refresh stats
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const clearPWACache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.active) {
          registration.active.postMessage({ type: 'CLEAR_CACHE' });
          alert('PWA cache cleared successfully');
        }
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PWA Management Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage Progressive Web App features, notifications, and analytics
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installs</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInstalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              App installations to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Push Subscribers</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active notification subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.notificationsSent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Usage</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offlineUsage || 0}</div>
            <p className="text-xs text-muted-foreground">
              Offline sessions this week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Push Notification</CardTitle>
              <CardDescription>
                Send a test notification to all subscribed users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Input
                    id="body"
                    value={notificationForm.body}
                    onChange={(e) => setNotificationForm(prev => ({
                      ...prev,
                      body: e.target.value
                    }))}
                    placeholder="Notification message"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="urgent"
                  checked={notificationForm.urgent}
                  onCheckedChange={(checked) => setNotificationForm(prev => ({
                    ...prev,
                    urgent: checked
                  }))}
                />
                <Label htmlFor="urgent">Mark as urgent</Label>
              </div>

              <Button 
                onClick={sendTestNotification} 
                disabled={sendingNotification || !notificationForm.title || !notificationForm.body}
                className="w-full md:w-auto"
              >
                {sendingNotification ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Notification
              </Button>
            </CardContent>
          </Card>

          {/* Top Notification Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Notification Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats?.topNotificationTopics || {}).map(([topic, count]) => (
                  <Badge key={topic} variant="secondary">
                    {topic}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Install Sources</CardTitle>
              <CardDescription>How users are installing the PWA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats?.installSources || {}).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{source.replace('_', ' ')}</span>
                    <Badge>{count} installs</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PWA Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Worker</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push Notifications</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Enabled</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Offline Support</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Ready</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Background Sync</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Supported</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PWA Features</CardTitle>
              <CardDescription>Enable or disable PWA functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config && (
                <div className="space-y-3">
                  {Object.entries(config.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium capitalize">
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {getFeatureDescription(feature)}
                        </p>
                      </div>
                      <Switch checked={enabled} disabled />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Install Prompt Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.installPromptConfig && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Minimum Engagement Score</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      User must reach this score before seeing install prompt
                    </p>
                    <Input 
                      type="number" 
                      value={config.installPromptConfig.minEngagementScore} 
                      disabled 
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Prompt Delay (ms)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Delay before showing prompt after criteria met
                    </p>
                    <Input 
                      type="number" 
                      value={config.installPromptConfig.delayMs} 
                      disabled 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PWA Testing Tools</CardTitle>
              <CardDescription>
                Test PWA functionality and troubleshoot issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={clearPWACache} 
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Force Refresh
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Cached Pages</Label>
                <div className="text-xs text-muted-foreground space-y-1">
                  {config?.offlinePages?.map((page, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      {page}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    backgroundSync: 'Sync data when user comes back online',
    pushNotifications: 'Send notifications to installed app',
    offlineMode: 'App works without internet connection',
    installPrompt: 'Show smart install prompts to users',
    periodicSync: 'Sync data in background periodically'
  };
  
  return descriptions[feature] || 'PWA feature';
}