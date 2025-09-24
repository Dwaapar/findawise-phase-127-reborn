import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  TrendingUp, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  RefreshCw,
  BarChart3,
  Globe,
  Users,
  Clock
} from 'lucide-react';

interface ComplianceCheck {
  id: string;
  networkSlug: string;
  offerSlug: string;
  framework: string;
  decision: 'ALLOWED' | 'BLOCKED';
  reason: string;
  timestamp: string;
  userLocation: string;
  ip: string;
}

interface AnalyticsData {
  totalClicks: number;
  conversions: number;
  conversionRate: number;
  topOffers: Array<{
    id: number;
    title: string;
    slug: string;
    totalClicks: number;
    conversionRate: number;
  }>;
  networkStats: Array<{
    id: number;
    name: string;
    totalClicks: number;
    conversionRate: number;
  }>;
}

const AffiliateRedirectDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceCheck[]>([]);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('30d');

  // Compliance Test Form
  const [testNetworkSlug, setTestNetworkSlug] = useState('');
  const [testOfferSlug, setTestOfferSlug] = useState('');
  const [complianceResult, setComplianceResult] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
    loadComplianceData();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/affiliate/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Error loading analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const response = await fetch(`/api/affiliate/compliance/report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const data = await response.json();
      
      if (data.success) {
        setComplianceData(data.data || []);
      } else {
        setError('Failed to load compliance data');
      }
    } catch (err) {
      setError('Error loading compliance data');
      console.error(err);
    }
  };

  const runComplianceCheck = async () => {
    if (!testNetworkSlug || !testOfferSlug) {
      setError('Please enter both network slug and offer slug');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/affiliate/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          networkSlug: testNetworkSlug,
          offerSlug: testOfferSlug
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setComplianceResult(data.data);
        setError(null);
      } else {
        setError(data.error || 'Compliance check failed');
      }
    } catch (err) {
      setError('Error running compliance check');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const response = await fetch(`/api/affiliate/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&format=${format}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `affiliate-data-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'affiliate-data.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError('Error exporting data');
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empire-Grade Affiliate Redirect Engine</h1>
          <p className="text-gray-600 mt-2">
            Billion-dollar compliant affiliate management with advanced analytics and fraud detection
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '1d' | '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalClicks?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">Last {timeRange}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.conversions?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  {((analytics?.conversionRate || 0) * 100).toFixed(2)}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {complianceData.length > 0 
                    ? Math.round((complianceData.filter(c => c.decision === 'ALLOWED').length / complianceData.length) * 100)
                    : 100}%
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Networks</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.networkStats?.length || '0'}</div>
                <p className="text-xs text-muted-foreground">Networks with traffic</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Offers</CardTitle>
                <CardDescription>Best converting affiliate offers in the selected time range</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {analytics?.topOffers?.map((offer, index) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{offer.title}</p>
                            <p className="text-sm text-gray-500">/go/{offer.slug}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{offer.totalClicks} clicks</p>
                          <p className="text-sm text-gray-500">
                            {(offer.conversionRate * 100).toFixed(1)}% CR
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!analytics?.topOffers || analytics.topOffers.length === 0) && (
                      <p className="text-gray-500 text-center py-4">No data available</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Compliance Activity</CardTitle>
                <CardDescription>Latest compliance checks and decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {complianceData.slice(0, 10).map((check) => (
                      <div key={check.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {check.decision === 'ALLOWED' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{check.networkSlug}/{check.offerSlug}</p>
                            <p className="text-sm text-gray-500">{check.framework}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={check.decision === 'ALLOWED' ? 'default' : 'destructive'}>
                            {check.decision}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(check.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {complianceData.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No compliance data</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Performance Statistics</CardTitle>
              <CardDescription>Performance metrics by affiliate network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.networkStats?.map((network) => (
                  <div key={network.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{network.name}</h3>
                      <p className="text-sm text-gray-500">Network ID: {network.id}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-bold">{network.totalClicks}</p>
                        <p className="text-xs text-gray-500">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{(network.conversionRate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Conversion</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!analytics?.networkStats || analytics.networkStats.length === 0) && (
                  <p className="text-gray-500 text-center py-8">No network performance data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Monitor</CardTitle>
              <CardDescription>Real-time compliance monitoring and audit trail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceData.map((check) => (
                  <div key={check.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={check.decision === 'ALLOWED' ? 'default' : 'destructive'}>
                          {check.decision}
                        </Badge>
                        <span className="font-medium">{check.networkSlug}/{check.offerSlug}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(check.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Framework</p>
                        <p className="font-medium">{check.framework}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium">{check.userLocation}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">IP Address</p>
                        <p className="font-medium">{check.ip}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Reason</p>
                        <p className="font-medium">{check.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {complianceData.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No compliance data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Testing</CardTitle>
              <CardDescription>Test affiliate offers for compliance and regulatory requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Network Slug</label>
                  <Input
                    value={testNetworkSlug}
                    onChange={(e) => setTestNetworkSlug(e.target.value)}
                    placeholder="e.g., amazon-associates"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Offer Slug</label>
                  <Input
                    value={testOfferSlug}
                    onChange={(e) => setTestOfferSlug(e.target.value)}
                    placeholder="e.g., premium-laptop-deal"
                  />
                </div>
              </div>
              <Button onClick={runComplianceCheck} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Compliance Check...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Run Compliance Check
                  </>
                )}
              </Button>

              {complianceResult && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {complianceResult.allowed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>Compliance Result: {complianceResult.allowed ? 'ALLOWED' : 'BLOCKED'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Framework</p>
                        <p className="font-medium">{complianceResult.framework}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Decision Reason</p>
                        <p className="font-medium">{complianceResult.auditTrail?.reason}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Requirements</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={complianceResult.consentRequired ? 'destructive' : 'secondary'}>
                            Consent: {complianceResult.consentRequired ? 'Required' : 'Not Required'}
                          </Badge>
                          <Badge variant={complianceResult.disclosureRequired ? 'destructive' : 'secondary'}>
                            Disclosure: {complianceResult.disclosureRequired ? 'Required' : 'Not Required'}
                          </Badge>
                        </div>
                      </div>

                      {complianceResult.restrictions && complianceResult.restrictions.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Restrictions</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {complianceResult.restrictions.map((restriction: string, index: number) => (
                              <li key={index} className="text-orange-600">{restriction}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {complianceResult.recommendations && complianceResult.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Recommendations</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {complianceResult.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-blue-600">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Export affiliate click data and compliance reports for analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => exportData('json')} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </Button>
                <Button onClick={() => exportData('csv')} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
              
              <Separator />
              
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Export includes:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>All affiliate clicks from the last 30 days</li>
                  <li>Compliance check results and audit trail</li>
                  <li>Network and offer performance metrics</li>
                  <li>User location and device information (anonymized)</li>
                  <li>Conversion tracking data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateRedirectDashboard;