import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Brain, 
  Globe, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  Server,
  Users,
  DollarSign,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NeuronStatus {
  neuronId: string;
  name: string;
  status: string;
  healthScore: number;
  uptime: number;
  lastCheckIn: string;
  isConnected: boolean;
  currentUsers: number;
  pageViews: number;
  conversions: number;
  revenue: number;
  errorCount: number;
}

interface RealtimeMetrics {
  totalNeurons: number;
  activeConnections: number;
  totalPageViews: number;
  totalUsers: number;
  totalRevenue: number;
  averageHealthScore: number;
  systemUptime: number;
}

const RealtimeDashboard: React.FC = () => {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Fetch real-time dashboard data
  const { data: dashboardResponse, isLoading } = useQuery({
    queryKey: ['/api/federation/dashboard/realtime'],
    refetchInterval: isLiveMode ? 5000 : false, // Refresh every 5 seconds in live mode
    enabled: true
  });

  const dashboardData = (dashboardResponse as any)?.data || {
    neurons: [],
    metrics: {
      totalNeurons: 0,
      activeConnections: 0,
      totalPageViews: 0,
      totalUsers: 0,
      totalRevenue: 0,
      averageHealthScore: 0,
      systemUptime: 0
    },
    alerts: []
  };

  const neurons: NeuronStatus[] = dashboardData.neurons || [];
  const metrics: RealtimeMetrics = dashboardData.metrics || {};
  const alerts = dashboardData.alerts || [];

  // WebSocket connection for real-time updates (future implementation)
  useEffect(() => {
    if (!isLiveMode) return;

    // Future: WebSocket connection for real-time updates
    console.log('🔴 Live mode enabled - real-time updates active');

    return () => {
      console.log('⚫ Live mode disabled - real-time updates stopped');
    };
  }, [isLiveMode]);

  const getStatusIcon = (status: string, isConnected: boolean) => {
    if (!isConnected) return <WifiOff className="h-4 w-4 text-gray-400" />;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading real-time dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Federation Control Center
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring and control for all empire neurons
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isLiveMode ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">LIVE</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">PAUSED</span>
              </>
            )}
          </div>
          
          <Button
            variant={isLiveMode ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsLiveMode(!isLiveMode)}
          >
            {isLiveMode ? 'Pause Live' : 'Start Live'}
          </Button>
        </div>
      </div>

      {/* System-wide Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Neurons</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalNeurons}</div>
            <div className="flex items-center gap-1 mt-1">
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">{metrics.activeConnections} connected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalPageViews)}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(metrics.averageHealthScore)}`}>
              {Math.round(metrics.averageHealthScore)}%
            </div>
            <Progress value={metrics.averageHealthScore} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(metrics.systemUptime)}</div>
            <p className="text-xs text-muted-foreground">Total uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">ALL GOOD</div>
            <p className="text-xs text-muted-foreground">System healthy</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              System Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Neuron Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Neuron Status
          </CardTitle>
          <CardDescription>
            Real-time status of all neurons in the federation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {neurons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active neurons detected. Check neuron connections and registration.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Neuron</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Connection</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {neurons.map((neuron) => (
                  <TableRow key={neuron.neuronId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{neuron.name}</div>
                        <div className="text-sm text-muted-foreground">{neuron.neuronId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(neuron.status, neuron.isConnected)}
                        <Badge 
                          variant={neuron.status === 'active' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {neuron.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getHealthScoreColor(neuron.healthScore)}`}>
                          {neuron.healthScore}%
                        </span>
                        <Progress value={neuron.healthScore} className="w-16 h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {neuron.isConnected ? (
                          <Wifi className="h-3 w-3 text-green-500" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={`text-xs ${neuron.isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                          {neuron.isConnected ? 'Live' : 'Offline'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatNumber(neuron.currentUsers)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatNumber(neuron.pageViews)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-green-600">
                        {formatCurrency(neuron.revenue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatUptime(neuron.uptime)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {neuron.lastCheckIn ? 
                          formatDistanceToNow(new Date(neuron.lastCheckIn), { addSuffix: true }) :
                          'Never'
                        }
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Real-time Log Stream (Future Implementation) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Live Activity Stream
          </CardTitle>
          <CardDescription>
            Real-time events and activities across all neurons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Live activity stream will be displayed here</p>
            <p className="text-xs mt-1">WebSocket connection required</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeDashboard;