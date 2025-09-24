/**
 * RLHF Brain Dashboard - Real-time RLHF + Persona Fusion Analytics
 * Billion-Dollar Empire Grade Dashboard with Live Metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, Users, TrendingUp, Activity, Shield, AlertTriangle,
  BarChart3, PieChart, LineChart, Settings, RefreshCw, Download
} from 'lucide-react';

interface DashboardMetrics {
  agentMetrics: Array<{
    agentId: string;
    taskType: string;
    performanceScore: number;
    usageCount: number;
    recentPerformance: number;
  }>;
  personaDistribution: Array<{
    persona: string;
    count: number;
  }>;
  feedbackTrends: Array<{
    signalType: string;
    avgValue: number;
    count: number;
  }>;
  totalAgents: number;
  totalPersonas: number;
  totalFeedback: number;
  fusion?: {
    personaDistribution: any[];
    hybridAnalysis: any;
    evolutionTrends: any[];
    qualityMetrics: any;
    totalActivePersonas: number;
    totalEvolutions: number;
  };
  systemStatus: string;
  timestamp: string;
}

const RLHFBrainDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/rlhf/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('❌ Dashboard metrics fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLoading(true);
    fetchMetrics();
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/rlhf/analytics/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rlhf-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('❌ Export failed:', err);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading RLHF Brain Analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">RLHF Brain Analytics</h2>
          <Badge 
            variant={metrics.systemStatus === 'operational' ? 'default' : 'destructive'}
            className="capitalize"
          >
            {metrics.systemStatus}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-500' : 'text-gray-400'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold">{metrics.totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Persona Types</p>
                <p className="text-2xl font-bold">{metrics.totalPersonas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Feedback Signals</p>
                <p className="text-2xl font-bold">{metrics.totalFeedback.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Evolution Events</p>
                <p className="text-2xl font-bold">{metrics.fusion?.totalEvolutions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Performing Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.agentMetrics.slice(0, 8).map((agent, index) => (
                <div key={`${agent.agentId}-${agent.taskType}`} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {agent.agentId} ({agent.taskType})
                      </span>
                      <span className="text-sm text-gray-600">
                        {(agent.performanceScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={agent.performanceScore * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Usage: {agent.usageCount}</span>
                      <span>Recent: {(agent.recentPerformance * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Persona Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.personaDistribution.map((persona) => (
                <div key={persona.persona} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {persona.persona.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(Number(persona.count) / Math.max(...metrics.personaDistribution.map(p => Number(p.count)))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{persona.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="h-5 w-5 mr-2" />
            Feedback Signal Analysis (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.feedbackTrends.map((trend) => (
              <div key={trend.signalType} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm capitalize">
                    {trend.signalType.replace('_', ' ')}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {Number(trend.count)} signals
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {(Number(trend.avgValue) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600">Average value</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Persona Fusion Analytics */}
      {metrics.fusion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Persona Fusion Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.fusion.totalActivePersonas}
                </div>
                <p className="text-sm text-gray-600">Active Personas</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.fusion.totalEvolutions}
                </div>
                <p className="text-sm text-gray-600">Evolution Events</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.fusion.evolutionTrends.length}
                </div>
                <p className="text-sm text-gray-600">Evolution Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()} 
        {autoRefresh && <span className="ml-2">• Auto-refreshing every 30s</span>}
      </div>
    </div>
  );
};

export default RLHFBrainDashboard;