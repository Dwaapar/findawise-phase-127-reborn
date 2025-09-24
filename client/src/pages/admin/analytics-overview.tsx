import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, MousePointer, Eye, Target, Calendar, Filter } from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AdminSidebar from '@/components/AdminSidebar';

export default function AnalyticsOverview() {
  const [dateRange, setDateRange] = useState('7d');

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
                <p className="text-gray-600 mt-2">Comprehensive insights into your affiliate performance</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateRange === '7d' ? 'Last 7 Days' : 
                   dateRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,849</div>
                <p className="text-xs text-muted-foreground">+18.2% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18.3%</div>
                <p className="text-xs text-muted-foreground">+2.4% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">50,284</div>
                <p className="text-xs text-muted-foreground">+12.5% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,941</div>
                <p className="text-xs text-muted-foreground">+7.8% from last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Dashboard Component */}
          <div className="mb-8">
            <AnalyticsDashboard />
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
              <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Detailed breakdown of your affiliate performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Top Performing Campaign</h4>
                        <p className="text-sm text-gray-600">Wealth Building Masterclass</p>
                      </div>
                      <Badge variant="secondary">$4,892 revenue</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Best Conversion Rate</h4>
                        <p className="text-sm text-gray-600">Fitness Transformation Guide</p>
                      </div>
                      <Badge variant="secondary">24.7%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traffic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where your visitors are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Organic Search</span>
                      <span className="font-medium">45.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Direct Traffic</span>
                      <span className="font-medium">28.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Social Media</span>
                      <span className="font-medium">16.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email</span>
                      <span className="font-medium">9.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Track user journey through your conversion process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span>Page Views</span>
                      <span className="font-bold">50,284</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span>Affiliate Clicks</span>
                      <span className="font-bold">12,847</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <span>Lead Captures</span>
                      <span className="font-bold">3,492</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <span>Conversions</span>
                      <span className="font-bold">2,358</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>Detailed revenue breakdown and projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">This Month</h4>
                      <p className="text-2xl font-bold text-green-600">$12,849</p>
                      <p className="text-sm text-gray-600">+18.2% vs last month</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Projected</h4>
                      <p className="text-2xl font-bold text-blue-600">$15,420</p>
                      <p className="text-sm text-gray-600">Based on current trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}