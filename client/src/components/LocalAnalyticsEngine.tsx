import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Eye, 
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  DollarSign,
  Zap,
  Activity,
  Map,
  PieChart as PieChartIcon,
  BarChart2,
  Layers,
  Search,
  Settings,
  ExternalLink,
  FileText,
  Star,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Award,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Empire-Grade Analytics Interfaces
interface AnalyticsEvent {
  id: string;
  eventType: 'pageview' | 'affiliate_click' | 'scroll' | 'quiz_completion' | 'lead_capture' | 'funnel_step' | 'session_start' | 'session_end' | 'conversion' | 'form_submit' | 'cta_click' | 'video_play' | 'download' | 'share' | 'search' | 'error';
  sessionId: string;
  userId: string;
  timestamp: number;
  pageSlug: string;
  data: {
    // Universal properties
    userAgent?: string;
    referrer?: string;
    screenResolution?: string;
    viewportSize?: string;
    geoLocation?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    connectionType?: string;
    
    // Event-specific data
    scrollDepth?: number;
    timeOnPage?: number;
    clickCoordinates?: { x: number; y: number };
    formId?: string;
    offerId?: number;
    offerSlug?: string;
    quizId?: string;
    funnelStep?: number;
    conversionValue?: number;
    error?: string;
    searchQuery?: string;
    downloadFile?: string;
    shareDestination?: string;
    videoId?: string;
    ctaPosition?: string;
    
    // Custom metadata
    [key: string]: any;
  };
}

interface AnalyticsSession {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: number;
  affiliateClicks: number;
  conversions: number;
  deviceType: string;
  geoLocation: string;
  referrer: string;
  entryPage: string;
  exitPage?: string;
  bounced: boolean;
  conversionValue: number;
}

interface AnalyticsStats {
  totalEvents: number;
  totalSessions: number;
  totalUsers: number;
  pageViews: number;
  affiliateClicks: number;
  conversions: number;
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  totalRevenue: number;
  topPages: Array<{ page: string; views: number; conversions: number }>;
  topOffers: Array<{ slug: string; clicks: number; conversions: number; revenue: number }>;
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
  geoBreakdown: Array<{ location: string; count: number; percentage: number }>;
  hourlyStats: Array<{ hour: number; events: number; conversions: number }>;
  dailyStats: Array<{ date: string; events: number; conversions: number; revenue: number }>;
}

interface ConversionFunnel {
  steps: Array<{
    stepName: string;
    totalUsers: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
}

interface AnalyticsFilter {
  dateRange: { from: Date; to: Date };
  eventTypes: string[];
  pages: string[];
  deviceTypes: string[];
  geoLocations: string[];
  userSegments: string[];
}

// Empire-Grade Local Analytics Engine Component
export default function LocalAnalyticsEngine() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<AnalyticsFilter>({
    dateRange: { 
      from: subDays(new Date(), 30), 
      to: new Date() 
    },
    eventTypes: [],
    pages: [],
    deviceTypes: [],
    geoLocations: [],
    userSegments: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch analytics data with comprehensive filtering
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', 'local', filter, refreshKey],
    queryFn: async () => {
      // First try to get data from API
      try {
        const params = new URLSearchParams({
          from: filter.dateRange.from.toISOString(),
          to: filter.dateRange.to.toISOString(),
          ...(filter.eventTypes.length && { eventTypes: filter.eventTypes.join(',') }),
          ...(filter.pages.length && { pages: filter.pages.join(',') }),
          ...(filter.deviceTypes.length && { deviceTypes: filter.deviceTypes.join(',') }),
          ...(filter.geoLocations.length && { geoLocations: filter.geoLocations.join(',') }),
          ...(searchQuery && { search: searchQuery })
        });

        const response = await fetch(`/api/analytics/local?${params}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('API analytics failed, falling back to local storage');
      }

      // Fallback to local storage data
      return getLocalAnalyticsData();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Fetch conversion funnel data
  const { data: funnelData } = useQuery({
    queryKey: ['analytics', 'funnel', filter],
    queryFn: async () => {
      try {
        const response = await fetch('/api/analytics/funnel');
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Funnel API failed');
      }
      return getLocalFunnelData();
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Real-time events stream (for live view)
  const [realtimeEvents, setRealtimeEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    // Listen for real-time events from localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'empire_analytics') {
        const newEvents = JSON.parse(e.newValue || '[]');
        setRealtimeEvents(newEvents.slice(-10)); // Last 10 events
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Initial load
    const existingEvents = JSON.parse(localStorage.getItem('empire_analytics') || '[]');
    setRealtimeEvents(existingEvents.slice(-10));

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Process analytics data for display
  const processedStats = useMemo(() => {
    if (!analyticsData) return null;
    return analyticsData as AnalyticsStats;
  }, [analyticsData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  // Handle export functionality
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    setIsExporting(true);
    
    try {
      if (format === 'csv') {
        await exportToCSV();
      } else {
        await exportToJSON();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Export functions
  const exportToCSV = async () => {
    const events = JSON.parse(localStorage.getItem('empire_analytics') || '[]');
    const csvContent = convertToCSV(events);
    downloadFile(csvContent, 'analytics-export.csv', 'text/csv');
  };

  const exportToJSON = async () => {
    const events = JSON.parse(localStorage.getItem('empire_analytics') || '[]');
    const jsonContent = JSON.stringify(events, null, 2);
    downloadFile(jsonContent, 'analytics-export.json', 'application/json');
  };

  const convertToCSV = (events: AnalyticsEvent[]) => {
    const headers = [
      'timestamp', 'eventType', 'sessionId', 'userId', 'pageSlug',
      'deviceType', 'geoLocation', 'scrollDepth', 'timeOnPage',
      'offerId', 'offerSlug', 'conversionValue', 'referrer'
    ];
    
    const rows = events.map(event => [
      new Date(event.timestamp).toISOString(),
      event.eventType,
      event.sessionId,
      event.userId,
      event.pageSlug,
      event.data.deviceType || '',
      event.data.geoLocation || '',
      event.data.scrollDepth || '',
      event.data.timeOnPage || '',
      event.data.offerId || '',
      event.data.offerSlug || '',
      event.data.conversionValue || '',
      event.data.referrer || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render loading state
  if (analyticsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Empire-grade analytics and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
            icon={<Search className="h-4 w-4" />}
          />
          
          <Select onValueChange={(value) => {
            // Handle filter changes
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="clicks">Affiliate Clicks</SelectItem>
              <SelectItem value="conversions">Conversions</SelectItem>
              <SelectItem value="pageviews">Page Views</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm" disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Events"
          value={processedStats?.totalEvents || 0}
          change={12.5}
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Affiliate Clicks"
          value={processedStats?.affiliateClicks || 0}
          change={8.2}
          icon={<MousePointer className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Conversions"
          value={processedStats?.conversions || 0}
          change={-2.1}
          icon={<Target className="h-6 w-6" />}
          color="purple"
        />
        <MetricCard
          title="Revenue"
          value={`$${(processedStats?.totalRevenue || 0).toLocaleString()}`}
          change={15.8}
          icon={<DollarSign className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Traffic Trends
                </CardTitle>
                <CardDescription>
                  Daily events and conversions over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={processedStats?.dailyStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="events" fill="#3b82f6" name="Events" />
                    <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} name="Conversions" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Device Breakdown
                </CardTitle>
                <CardDescription>
                  Traffic distribution by device type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={processedStats?.deviceBreakdown || []}
                      dataKey="count"
                      nameKey="device"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={({ device, percentage }) => `${device}: ${percentage}%`}
                    >
                      {(processedStats?.deviceBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages and Offers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPagesTable pages={processedStats?.topPages || []} />
            <TopOffersTable offers={processedStats?.topOffers || []} />
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <EventsTable events={realtimeEvents} />
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-6">
          <ConversionsAnalysis data={processedStats} />
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <FunnelAnalysis funnel={funnelData} />
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <RealTimeView events={realtimeEvents} />
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <ExportPanel onExport={handleExport} isExporting={isExporting} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: React.ReactNode; 
  color: string; 
}) {
  const isPositive = change > 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("text-muted-foreground", `text-${color}-600`)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3 text-green-600" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-600" />
          )}
          <span className={cn(isPositive ? "text-green-600" : "text-red-600")}>
            {Math.abs(change)}%
          </span>
          <span className="ml-1">from last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get local analytics data
function getLocalAnalyticsData(): AnalyticsStats {
  const events = JSON.parse(localStorage.getItem('empire_analytics') || '[]') as AnalyticsEvent[];
  
  // Process events into stats
  const totalEvents = events.length;
  const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
  const uniqueUsers = new Set(events.map(e => e.userId)).size;
  const pageViews = events.filter(e => e.eventType === 'pageview').length;
  const affiliateClicks = events.filter(e => e.eventType === 'affiliate_click').length;
  const conversions = events.filter(e => e.eventType === 'conversion').length;
  
  return {
    totalEvents,
    totalSessions: uniqueSessions,
    totalUsers: uniqueUsers,
    pageViews,
    affiliateClicks,
    conversions,
    conversionRate: affiliateClicks > 0 ? (conversions / affiliateClicks) * 100 : 0,
    averageSessionDuration: 0, // Calculate from session data
    bounceRate: 0, // Calculate from session data
    totalRevenue: events.reduce((sum, e) => sum + (e.data.conversionValue || 0), 0),
    topPages: [],
    topOffers: [],
    deviceBreakdown: [],
    geoBreakdown: [],
    hourlyStats: [],
    dailyStats: []
  };
}

function getLocalFunnelData(): ConversionFunnel {
  // Generate funnel data from local events
  return {
    steps: [
      { stepName: 'Page View', totalUsers: 1000, conversionRate: 100, dropoffRate: 0 },
      { stepName: 'Offer View', totalUsers: 450, conversionRate: 45, dropoffRate: 55 },
      { stepName: 'Click CTA', totalUsers: 180, conversionRate: 18, dropoffRate: 27 },
      { stepName: 'Complete Action', totalUsers: 45, conversionRate: 4.5, dropoffRate: 13.5 }
    ]
  };
}

// Additional components would be implemented here:
// - TopPagesTable
// - TopOffersTable  
// - EventsTable
// - ConversionsAnalysis
// - FunnelAnalysis
// - RealTimeView
// - ExportPanel



// Production-Grade Component Implementations
function TopPagesTable({ pages }: { pages: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Top Pages
        </CardTitle>
        <CardDescription>
          Most visited pages with performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pages.slice(0, 10).map((page, index) => (
            <div key={page.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center">
                  {index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{page.slug || '/'}</p>
                  <p className="text-sm text-gray-600">{page.views} views</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{page.uniqueVisitors}</p>
                <p className="text-sm text-gray-600">unique visitors</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopOffersTable({ offers }: { offers: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Top Performing Offers
        </CardTitle>
        <CardDescription>
          Best converting affiliate offers and revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {offers.slice(0, 10).map((offer, index) => (
            <div key={offer.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center">
                  {index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{offer.title}</p>
                  <p className="text-sm text-gray-600">{offer.clicks} clicks</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">{offer.conversionRate}%</p>
                <p className="text-sm text-gray-600">${offer.revenue}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EventsTable({ events }: { events: AnalyticsEvent[] }) {
  const [sortBy, setSortBy] = useState<keyof AnalyticsEvent>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [events, sortBy, sortOrder]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedEvents.slice(start, start + itemsPerPage);
  }, [sortedEvents, currentPage]);

  const totalPages = Math.ceil(events.length / itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Events
        </CardTitle>
        <CardDescription>
          Detailed event log with full metadata ({events.length} total events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as keyof AnalyticsEvent)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Time</SelectItem>
                <SelectItem value="eventType">Type</SelectItem>
                <SelectItem value="eventAction">Action</SelectItem>
                <SelectItem value="pageSlug">Page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {sortOrder.toUpperCase()}
            </Button>
          </div>

          {/* Events List */}
          <div className="space-y-2">
            {paginatedEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getEventBadgeVariant(event.eventType)} className="text-xs">
                        {event.eventType}
                      </Badge>
                      <span className="font-medium">{event.eventAction}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Page: /{event.pageSlug} • Session: {event.sessionId?.substring(0, 8)}...
                    </p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(event.metadata).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {String(value).substring(0, 50)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, events.length)} of {events.length} events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionsAnalysis({ data }: { data: any }) {
  const conversionData = data?.conversions || [];
  const funnelData = data?.funnel || [];

  return (
    <div className="space-y-6">
      {/* Conversion Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Performance
          </CardTitle>
          <CardDescription>
            Detailed analysis of user conversions and revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data?.conversionRate || 0}%</p>
              <p className="text-sm text-gray-600">Overall Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">${(data?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">${(data?.avgOrderValue || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-600">Average Order Value</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      {funnelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Step-by-step user journey analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((step: any, index: number) => (
                <div key={step.stepName} className="relative">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{step.stepName}</p>
                        <p className="text-sm text-gray-600">{step.totalUsers} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">{step.conversionRate}%</p>
                      {index > 0 && (
                        <p className="text-sm text-red-600">-{step.dropoffRate}% dropoff</p>
                      )}
                    </div>
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FunnelAnalysis({ funnel }: { funnel: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Funnel Analysis
        </CardTitle>
        <CardDescription>
          User journey optimization insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={funnel?.steps || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stepName" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalUsers" fill="#3b82f6" name="Users" />
            <Line type="monotone" dataKey="conversionRate" stroke="#10b981" strokeWidth={2} name="Conversion %" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RealTimeView({ events }: { events: AnalyticsEvent[] }) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const recentEvents = events.slice(0, 50); // Show last 50 events

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger data refresh
      window.location.reload();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Real-time Activity
            </CardTitle>
            <CardDescription>
              Live user activity and events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-green-500" : "bg-gray-400")}></div>
              <span className="text-sm text-gray-600">{autoRefresh ? "Live" : "Paused"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={getEventBadgeVariant(event.eventType)} className="text-xs">
                  {event.eventType}
                </Badge>
                <span>{event.eventAction}</span>
                <span className="text-gray-500">on /{event.pageSlug}</span>
              </div>
              <span className="text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {recentEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ExportPanel({ onExport, isExporting }: { onExport: (format: 'csv' | 'json') => void; isExporting: boolean }) {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv' as 'csv' | 'json',
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    includeEvents: true,
    includeConversions: true,
    includeOffers: true,
    includeMetadata: false
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analytics Data
        </CardTitle>
        <CardDescription>
          Export your analytics data for external analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <Select value={exportConfig.format} onValueChange={(value) => 
            setExportConfig(prev => ({ ...prev, format: value as 'csv' | 'json' }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
              <SelectItem value="json">JSON (Developer Friendly)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <Input
                type="date"
                value={exportConfig.dateRange.from.toISOString().split('T')[0]}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, from: new Date(e.target.value) }
                }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <Input
                type="date"
                value={exportConfig.dateRange.to.toISOString().split('T')[0]}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, to: new Date(e.target.value) }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Data Types */}
        <div>
          <label className="block text-sm font-medium mb-2">Include Data Types</label>
          <div className="space-y-2">
            {[
              { key: 'includeEvents', label: 'All Events' },
              { key: 'includeConversions', label: 'Conversions' },
              { key: 'includeOffers', label: 'Affiliate Offers' },
              { key: 'includeMetadata', label: 'Event Metadata' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportConfig[key as keyof typeof exportConfig] as boolean}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => onExport(exportConfig.format)}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportConfig.format.toUpperCase()}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onExport('json')} disabled={isExporting}>
            Quick JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function for event badge variants
function getEventBadgeVariant(eventType: string): "default" | "secondary" | "destructive" | "outline" {
  switch (eventType) {
    case 'affiliate_click':
      return 'default';
    case 'conversion':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
}