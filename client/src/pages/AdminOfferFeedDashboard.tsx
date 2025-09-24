import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  MousePointer,
  DollarSign
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FeedSource {
  id: number;
  name: string;
  sourceType: string;
  isActive: boolean;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  refreshInterval: number;
}

interface SyncLog {
  id: number;
  sourceId: number;
  syncType: string;
  status: string;
  itemsProcessed: number;
  itemsAdded: number;
  itemsUpdated: number;
  itemsRemoved: number;
  duration: number;
  startedAt: string;
  completedAt: string | null;
  errors: any[];
}

interface ContentItem {
  id: number;
  title: string;
  contentType: string;
  category: string;
  status: string;
  qualityScore: number;
  views: number;
  clicks: number;
  conversions: number;
  price: number | null;
  merchantName: string | null;
  publishedAt: string;
  createdAt: string;
}

export default function AdminOfferFeedDashboard() {
  const queryClient = useQueryClient();
  
  // Fetch feed sources
  const { data: sourcesResponse } = useQuery({
    queryKey: ['/api/content-feed/sources'],
    refetchInterval: 30000
  });
  const sources = sourcesResponse?.data || [];

  // Fetch sync logs
  const { data: logsResponse } = useQuery({
    queryKey: ['/api/content-feed/sync/logs'],
    refetchInterval: 10000
  });
  const logs = logsResponse?.data || [];

  // Fetch content items
  const { data: contentResponse } = useQuery({
    queryKey: ['/api/content-feed/content'],
    refetchInterval: 30000
  });
  const content = contentResponse?.data || [];

  // Fetch engine status
  const { data: statusResponse } = useQuery({
    queryKey: ['/api/content-feed/status'],
    refetchInterval: 5000
  });
  const engineStatus = statusResponse?.data || {};

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async ({ sourceId, syncType = 'manual' }: { sourceId: number; syncType?: string }) => {
      return apiRequest(`/api/content-feed/sync/${sourceId}`, {
        method: 'POST',
        body: { syncType }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-feed/sync/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content-feed/content'] });
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'offer': return '🎯';
      case 'product': return '📦';
      case 'article': return '📝';
      case 'deal': return '💰';
      default: return '📄';
    }
  };

  // Calculate stats
  const totalContent = content.length;
  const activeContent = content.filter((item: ContentItem) => item.status === 'active').length;
  const totalViews = content.reduce((sum: number, item: ContentItem) => sum + item.views, 0);
  const totalClicks = content.reduce((sum: number, item: ContentItem) => sum + item.clicks, 0);
  const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content & Offer Feed Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your content feed sources and sync operations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold">{totalContent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold">{activeContent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MousePointer className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold">{avgCTR}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Feed Sources</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="content">Content Items</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feed Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Next Sync</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source: FeedSource) => (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div className="font-medium">{source.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {source.sourceType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={source.isActive ? "default" : "secondary"}
                          className={source.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {source.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(source.lastSyncAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(source.nextSyncAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => syncMutation.mutate({ sourceId: source.id })}
                            disabled={syncMutation.isPending}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: SyncLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">Source {log.sourceId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.syncType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">+{log.itemsAdded}</div>
                          <div className="text-blue-600">~{log.itemsUpdated}</div>
                          <div className="text-red-600">-{log.itemsRemoved}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(log.startedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.slice(0, 20).map((item: ContentItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm truncate max-w-xs">
                            {getContentTypeIcon(item.contentType)} {item.title}
                          </div>
                          {item.merchantName && (
                            <div className="text-xs text-gray-500">{item.merchantName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.contentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${item.qualityScore || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{item.qualityScore || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{item.views} views</div>
                          <div>{item.clicks} clicks</div>
                          {item.conversions > 0 && (
                            <div className="text-green-600">{item.conversions} conv</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engine Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700">Active Connectors</h4>
                  <div className="mt-2">
                    {engineStatus.connectors?.map((connector: string) => (
                      <Badge key={connector} className="mr-2 mb-1" variant="outline">
                        {connector}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700">Active Syncs</h4>
                  <p className="text-2xl font-bold mt-2">{engineStatus.activeSyncs?.length || 0}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700">Scheduled Jobs</h4>
                  <p className="text-2xl font-bold mt-2">{engineStatus.scheduledJobs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}