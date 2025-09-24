import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Download, 
  Plus, 
  Edit, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Calculator
} from 'lucide-react';

interface Partner {
  id: number;
  partnerId: string;
  partnerName: string;
  partnerType: string;
  defaultCommissionRate: string;
  totalEarnings: string;
  status: string;
  recentMetrics: {
    transactions30d: number;
    revenue30d: number;
    commissions30d: number;
  };
}

interface SplitRule {
  id: number;
  ruleId: string;
  ruleName: string;
  splitType: string;
  isActive: boolean;
  partnerName?: string;
  vertical?: string;
  priority: number;
}

interface Analytics {
  totalRevenue: number;
  totalCommissions: number;
  totalPayouts: number;
  netProfit: number;
  transactionCount: number;
  uniquePartners: number;
  averageCommissionRate: number;
  growth: {
    revenueGrowth: number;
    commissionGrowth: number;
    partnerGrowth: number;
  };
}

interface ForecastResult {
  forecastId: string;
  totalRevenueForecast: number;
  partnerSplitForecast: number;
  netProfitForecast: number;
  accuracy: number;
  predictions: Array<{
    date: string;
    revenue: number;
    commissions: number;
    netProfit: number;
    confidence: {
      lower: number;
      upper: number;
    };
  }>;
}

export default function RevenueSplitDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [rules, setRules] = useState<SplitRule[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // New Partner Form State
  const [showNewPartnerForm, setShowNewPartnerForm] = useState(false);
  const [newPartner, setNewPartner] = useState({
    partnerId: '',
    partnerName: '',
    partnerType: 'affiliate',
    contactEmail: '',
    defaultCommissionRate: '10',
    paymentMethod: 'bank_transfer'
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [partnersRes, rulesRes, analyticsRes, forecastRes] = await Promise.all([
        fetch('/api/revenue-split/partners'),
        fetch('/api/revenue-split/rules'),
        fetch(`/api/revenue-split/analytics?period=${selectedPeriod}`),
        fetch('/api/revenue-split/forecast?horizon=90')
      ]);

      if (partnersRes.ok) {
        const partnersData = await partnersRes.json();
        setPartners(partnersData.data || []);
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.data || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data);
      }

      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setForecast(forecastData.data);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/revenue-split/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });

      if (response.ok) {
        setShowNewPartnerForm(false);
        setNewPartner({
          partnerId: '',
          partnerName: '',
          partnerType: 'affiliate',
          contactEmail: '',
          defaultCommissionRate: '10',
          paymentMethod: 'bank_transfer'
        });
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error creating partner:', error);
    }
  };

  const exportReport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const response = await fetch(`/api/revenue-split/export?startDate=${startDate}&endDate=${endDate}&format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue-split-report-${startDate}-${endDate}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Split Manager</h1>
          <p className="text-gray-600 mt-1">Empire-grade partner revenue management and profit forecasting</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <Button onClick={() => exportReport('csv')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {analytics.growth.revenueGrowth > 0 ? '+' : ''}{analytics.growth.revenueGrowth.toFixed(1)}% from last period
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${analytics.totalCommissions.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Avg rate: {analytics.averageCommissionRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.uniquePartners}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {analytics.growth.partnerGrowth > 0 ? '+' : ''}{analytics.growth.partnerGrowth} new this period
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${analytics.netProfit.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {analytics.transactionCount} transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="partners">Partners ({partners.length})</TabsTrigger>
          <TabsTrigger value="rules">Split Rules ({rules.filter(r => r.isActive).length})</TabsTrigger>
          <TabsTrigger value="forecast">Profit Forecast</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Revenue Split Partners</h3>
            <Button onClick={() => setShowNewPartnerForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>

          {/* New Partner Form */}
          {showNewPartnerForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Partner</CardTitle>
                <CardDescription>Create a new revenue split partner</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePartner} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partnerId">Partner ID</Label>
                      <Input
                        id="partnerId"
                        value={newPartner.partnerId}
                        onChange={(e) => setNewPartner({...newPartner, partnerId: e.target.value})}
                        placeholder="partner-001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="partnerName">Partner Name</Label>
                      <Input
                        id="partnerName"
                        value={newPartner.partnerName}
                        onChange={(e) => setNewPartner({...newPartner, partnerName: e.target.value})}
                        placeholder="Acme Corp"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={newPartner.contactEmail}
                        onChange={(e) => setNewPartner({...newPartner, contactEmail: e.target.value})}
                        placeholder="partner@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultCommissionRate">Default Commission Rate (%)</Label>
                      <Input
                        id="defaultCommissionRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={newPartner.defaultCommissionRate}
                        onChange={(e) => setNewPartner({...newPartner, defaultCommissionRate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Partner</Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewPartnerForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Partners List */}
          <div className="grid gap-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{partner.partnerName}</h4>
                        <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                          {partner.status}
                        </Badge>
                        <Badge variant="outline">{partner.partnerType}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">ID: {partner.partnerId}</p>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Earnings</p>
                          <p className="font-semibold text-green-600">${parseFloat(partner.totalEarnings).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Commission Rate</p>
                          <p className="font-semibold">{partner.defaultCommissionRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">30-Day Revenue</p>
                          <p className="font-semibold text-blue-600">${partner.recentMetrics.revenue30d.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Split Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Split Rules Configuration</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className={`${rule.isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{rule.ruleName}</h4>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{rule.splitType}</Badge>
                        {rule.vertical && <Badge variant="outline">{rule.vertical}</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">Rule ID: {rule.ruleId}</p>
                      {rule.partnerName && (
                        <p className="text-sm text-gray-600">Partner: {rule.partnerName}</p>
                      )}
                      <p className="text-sm text-gray-600">Priority: {rule.priority}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Profit Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Profit Forecast Engine</h3>
            <Button>
              <Calculator className="w-4 h-4 mr-2" />
              Generate New Forecast
            </Button>
          </div>

          {forecast && (
            <div className="grid gap-6">
              {/* Forecast Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue Forecast</CardTitle>
                    <CardDescription className="text-blue-100">Next 90 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${forecast.totalRevenueForecast.toLocaleString()}</div>
                    <p className="text-sm text-blue-100 mt-1">Accuracy: {(forecast.accuracy * 100).toFixed(1)}%</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Partner Splits</CardTitle>
                    <CardDescription className="text-green-100">Projected payouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${forecast.partnerSplitForecast.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Net Profit</CardTitle>
                    <CardDescription className="text-purple-100">After splits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${forecast.netProfitForecast.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Forecast Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend Forecast</CardTitle>
                  <CardDescription>Predicted revenue, commissions, and profit over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would be implemented here with forecast data</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reports & Analytics</h3>
            <div className="flex gap-2">
              <Button onClick={() => exportReport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </Button>
              <Button onClick={() => exportReport('json')}>
                <Download className="w-4 h-4 mr-2" />
                JSON Export
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download comprehensive revenue split reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => exportReport('csv')}>
                    <Download className="w-4 h-4 mr-2" />
                    Partner Performance Report (CSV)
                  </Button>
                  <Button variant="outline" onClick={() => exportReport('json')}>
                    <Download className="w-4 h-4 mr-2" />
                    Detailed Analytics (JSON)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Recent revenue split activities and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Payout processed</p>
                      <p className="text-sm text-gray-600">Partner ABC123 - $2,500</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">New split rule created</p>
                      <p className="text-sm text-gray-600">Tiered commission for finance vertical</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">1 day ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Partner updated</p>
                      <p className="text-sm text-gray-600">Commission rate changed from 10% to 12%</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}