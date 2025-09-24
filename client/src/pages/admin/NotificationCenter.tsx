import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Send, 
  Settings, 
  BarChart3, 
  Users, 
  Mail, 
  MessageSquare, 
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  Eye,
  MousePointer,
  Target,
  AlertTriangle,
  PlusCircle,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface NotificationTemplate {
  id: number;
  slug: string;
  name: string;
  description?: string;
  channel: string;
  type: string;
  subject?: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  isActive: boolean;
  priority: string;
  createdAt: string;
}

interface NotificationTrigger {
  id: number;
  slug: string;
  name: string;
  eventName?: string;
  triggerType: string;
  conditions: any;
  channelPriority: string[];
  delay: number;
  isActive: boolean;
  createdAt: string;
}

interface NotificationCampaign {
  id: number;
  slug: string;
  name: string;
  type: string;
  status: string;
  estimatedReach: number;
  createdAt: string;
}

interface NotificationQueue {
  id: number;
  channel: string;
  subject?: string;
  status: string;
  scheduledFor: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  createdAt: string;
}

interface AnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  avgDeliveryTime: number;
  totalCost: number;
}

export default function NotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);

  // Queries
  const { data: templates } = useQuery({
    queryKey: ['/api/notifications/templates'],
    queryFn: () => apiRequest('/api/notifications/templates'),
  });

  const { data: triggers } = useQuery({
    queryKey: ['/api/notifications/triggers'],
    queryFn: () => apiRequest('/api/notifications/triggers'),
  });

  const { data: campaigns } = useQuery({
    queryKey: ['/api/notifications/campaigns'],
    queryFn: () => apiRequest('/api/notifications/campaigns'),
  });

  const { data: queue } = useQuery({
    queryKey: ['/api/notifications/queue'],
    queryFn: () => apiRequest('/api/notifications/queue'),
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/notifications/analytics/summary'],
    queryFn: () => apiRequest('/api/notifications/analytics/summary'),
  });

  const { data: channels } = useQuery({
    queryKey: ['/api/notifications/channels'],
    queryFn: () => apiRequest('/api/notifications/channels'),
  });

  // Mutations
  const sendNotificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/notifications/send', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Notification Sent",
        description: "Notification has been queued for delivery",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/queue'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/notifications/templates', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Notification template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/templates'] });
      setShowTemplateForm(false);
    },
  });

  const createTriggerMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/notifications/triggers', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Trigger Created",
        description: "Notification trigger created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/triggers'] });
      setShowTriggerForm(false);
    },
  });

  const triggerEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/notifications/trigger-event', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Event Triggered",
        description: "Event has been processed successfully",
      });
    },
  });

  // Helper functions
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'queued': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notification + Email Lifecycle Engine
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Billion-dollar grade cross-channel notification system with AI-driven personalization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowTemplateForm(true)} className="flex items-center space-x-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Template</span>
          </Button>
          <Button onClick={() => setShowTriggerForm(true)} variant="outline" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>New Trigger</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.data?.summary?.totalSent?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">Across all channels</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.data?.summary?.totalSent > 0 
                    ? ((analytics.data.summary.totalDelivered / analytics.data.summary.totalSent) * 100).toFixed(1)
                    : '0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.data?.summary?.totalDelivered > 0 
                    ? ((analytics.data.summary.totalOpened / analytics.data.summary.totalDelivered) * 100).toFixed(1)
                    : '0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Opened notifications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.data?.summary?.totalOpened > 0 
                    ? ((analytics.data.summary.totalClicked / analytics.data.summary.totalOpened) * 100).toFixed(1)
                    : '0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Clicked through</p>
              </CardContent>
            </Card>
          </div>

          {/* Channel Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Channel Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {channels?.data?.channels?.map((channel: any) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getChannelIcon(channel.channel)}
                      <div>
                        <p className="font-medium capitalize">{channel.channel}</p>
                        <p className="text-sm text-gray-500">{channel.provider}</p>
                      </div>
                    </div>
                    <Badge variant={channel.isActive ? "default" : "secondary"}>
                      {channel.healthStatus || 'Unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => sendNotificationMutation.mutate({
                    templateSlug: 'test_template',
                    recipientId: 'test@example.com',
                    channel: 'email',
                    data: { testMessage: true }
                  })}
                  disabled={sendNotificationMutation.isPending}
                  className="h-20"
                >
                  <div className="text-center">
                    <Send className="h-6 w-6 mx-auto mb-2" />
                    <div>Send Test</div>
                  </div>
                </Button>

                <Button 
                  onClick={() => triggerEventMutation.mutate({
                    eventName: 'test_event',
                    userId: 'test_user',
                    data: { source: 'admin_panel' }
                  })}
                  disabled={triggerEventMutation.isPending}
                  variant="outline"
                  className="h-20"
                >
                  <div className="text-center">
                    <Zap className="h-6 w-6 mx-auto mb-2" />
                    <div>Trigger Event</div>
                  </div>
                </Button>

                <Button 
                  onClick={() => queryClient.invalidateQueries()}
                  variant="outline"
                  className="h-20"
                >
                  <div className="text-center">
                    <RefreshCw className="h-6 w-6 mx-auto mb-2" />
                    <div>Refresh Data</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates?.data?.templates?.map((template: NotificationTemplate) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getChannelIcon(template.channel)}
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-500">{template.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{template.type}</Badge>
                          <Badge className={getPriorityColor(template.priority)}>
                            {template.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={template.isActive} />
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggers?.data?.triggers?.map((trigger: NotificationTrigger) => (
                  <div key={trigger.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Zap className={`h-5 w-5 ${trigger.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="font-medium">{trigger.name}</h3>
                        <p className="text-sm text-gray-500">Event: {trigger.eventName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{trigger.triggerType}</Badge>
                          {trigger.delay > 0 && (
                            <Badge variant="secondary">
                              Delay: {trigger.delay}m
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={trigger.isActive} />
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queue?.data?.notifications?.map((notification: NotificationQueue) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getChannelIcon(notification.channel)}
                      {getStatusIcon(notification.status)}
                      <div>
                        <h3 className="font-medium">{notification.subject || 'No Subject'}</h3>
                        <p className="text-sm text-gray-500">
                          Scheduled: {new Date(notification.scheduledFor).toLocaleString()}
                        </p>
                        <Badge variant="outline">{notification.status}</Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Created: {new Date(notification.createdAt).toLocaleString()}</p>
                      {notification.sentAt && (
                        <p>Sent: {new Date(notification.sentAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.data?.channelBreakdown?.map((channel: any) => (
                    <div key={channel.channel} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getChannelIcon(channel.channel)}
                        <span className="capitalize">{channel.channel}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{channel.sent?.toLocaleString() || '0'} sent</p>
                        <p className="text-sm text-gray-500">
                          {channel.openRate ? (channel.openRate * 100).toFixed(1) : '0'}% open rate
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Delivery Time</span>
                    <span>{analytics?.data?.summary?.avgDeliveryTime?.toFixed(0) || '0'}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost</span>
                    <span>${analytics?.data?.summary?.totalCost?.toFixed(4) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span>
                      {analytics?.data?.summary?.totalOpened > 0 
                        ? ((analytics.data.summary.totalConverted / analytics.data.summary.totalOpened) * 100).toFixed(1)
                        : '0'
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Notification Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input id="name" placeholder="Enter template name" />
                </div>
                <div>
                  <Label htmlFor="channel">Channel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="in_app">In-App</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input id="subject" placeholder="Enter subject (for email/push)" />
              </div>

              <div>
                <Label htmlFor="body">Message Body</Label>
                <Textarea 
                  id="body" 
                  placeholder="Enter message body with {{variables}}"
                  rows={6}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowTemplateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowTemplateForm(false)}>
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}