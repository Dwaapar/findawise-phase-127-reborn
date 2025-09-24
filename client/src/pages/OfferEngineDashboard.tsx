import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Settings,
  Eye,
  MousePointer,
  ShoppingCart,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OfferSource {
  id: number;
  name: string;
  type: string;
  slug: string;
  isActive: boolean;
  lastSync?: string;
  errorCount: number;
  totalOffers?: number;
}

interface Offer {
  id: number;
  title: string;
  merchant: string;
  category: string;
  emotion: string;
  price: number;
  currency: string;
  ctr: number;
  conversionRate: number;
  revenueGenerated: number;
  isActive: boolean;
  isExpired: boolean;
  qualityScore: number;
  priority: number;
}

interface OfferAnalytics {
  totalOffers: number;
  activeOffers: number;
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgConversionRate: number;
  topCategories: Array<{ name: string; count: number; revenue: number }>;
  performanceData: Array<{ date: string; revenue: number; clicks: number; conversions: number }>;
}

export default function OfferEngineDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch offer sources
  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/offer-engine/sources"],
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Fetch offers
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["/api/offer-engine/offers"],
    queryFn: () => 
      fetch("/api/offer-engine/offers?limit=100&sortBy=revenue&sortOrder=desc")
        .then(res => res.json())
  });

  // Fetch top performing offers
  const { data: topOffers = [] } = useQuery({
    queryKey: ["/api/offer-engine/analytics/top-performing"],
    queryFn: () => 
      fetch("/api/offer-engine/analytics/top-performing?limit=10")
        .then(res => res.json())
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => 
      fetch("/api/offer-engine/sync/trigger", { method: "POST" })
        .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "Offer sync has been triggered successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offer-engine"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to trigger offer sync",
        variant: "destructive"
      });
    }
  });

  // Calculate analytics
  const analytics: OfferAnalytics = {
    totalOffers: offers.length,
    activeOffers: offers.filter((o: Offer) => o.isActive && !o.isExpired).length,
    totalRevenue: offers.reduce((sum: number, o: Offer) => sum + (o.revenueGenerated || 0), 0),
    totalClicks: offers.reduce((sum: number, o: Offer) => sum + (o.ctr * 1000 || 0), 0),
    totalConversions: offers.reduce((sum: number, o: Offer) => sum + (o.conversionRate * 10 || 0), 0),
    avgCTR: offers.length > 0 ? offers.reduce((sum: number, o: Offer) => sum + (o.ctr || 0), 0) / offers.length : 0,
    avgConversionRate: offers.length > 0 ? offers.reduce((sum: number, o: Offer) => sum + (o.conversionRate || 0), 0) / offers.length : 0,
    topCategories: [],
    performanceData: []
  };

  // Group offers by category for analytics
  const categoryStats = offers.reduce((acc: any, offer: Offer) => {
    if (!acc[offer.category]) {
      acc[offer.category] = { count: 0, revenue: 0 };
    }
    acc[offer.category].count++;
    acc[offer.category].revenue += offer.revenueGenerated || 0;
    return acc;
  }, {});

  analytics.topCategories = Object.entries(categoryStats)
    .map(([name, stats]: [string, any]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Self-Evolving Offer Engine
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Enterprise-grade monetization intelligence platform
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {syncMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync All Sources
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${analytics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From {analytics.totalConversions} conversions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeOffers}</div>
              <p className="text-xs text-muted-foreground">
                Of {analytics.totalOffers} total offers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.avgCTR.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Click-through rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.avgConversionRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average across all offers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="optimization">AI Optimization</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Revenue by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.topCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {analytics.topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performing Offers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Offers</CardTitle>
                  <CardDescription>Highest revenue generators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topOffers.slice(0, 5).map((offer: Offer) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{offer.title}</p>
                          <p className="text-xs text-gray-500">{offer.merchant} • {offer.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ${offer.revenueGenerated?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-gray-500">
                            {offer.ctr?.toFixed(2)}% CTR
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Source Status */}
            <Card>
              <CardHeader>
                <CardTitle>Source Status</CardTitle>
                <CardDescription>Real-time sync status of offer sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sources.map((source: OfferSource) => (
                    <div key={source.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{source.name}</h3>
                        <Badge variant={source.isActive ? "default" : "secondary"}>
                          {source.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{source.type}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Last sync:</span>
                        <span className="text-gray-500">
                          {source.lastSync ? 
                            new Date(source.lastSync).toLocaleDateString() : 
                            "Never"
                          }
                        </span>
                      </div>
                      {source.errorCount > 0 && (
                        <div className="flex items-center mt-2 text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="text-sm">{source.errorCount} errors</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Offer Sources</CardTitle>
                <CardDescription>Manage affiliate networks and data sources</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Offers</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map((source: OfferSource) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{source.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                            ) : (
                              <><Pause className="w-3 h-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {source.lastSync ? 
                            new Date(source.lastSync).toLocaleString() : 
                            "Never"
                          }
                        </TableCell>
                        <TableCell>{source.totalOffers || 0}</TableCell>
                        <TableCell>
                          {source.errorCount > 0 ? (
                            <Badge variant="destructive">{source.errorCount}</Badge>
                          ) : (
                            <span className="text-green-600">✓</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Play className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="w-3 h-3" />
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

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Offer Feed</CardTitle>
                <CardDescription>Real-time offer inventory and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>Conv. Rate</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.slice(0, 20).map((offer: Offer) => (
                      <TableRow key={offer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{offer.title}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {offer.emotion}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{offer.merchant}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{offer.category}</Badge>
                        </TableCell>
                        <TableCell>
                          ${offer.price?.toFixed(2)} {offer.currency}
                        </TableCell>
                        <TableCell>{offer.ctr?.toFixed(2)}%</TableCell>
                        <TableCell>{offer.conversionRate?.toFixed(2)}%</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${offer.revenueGenerated?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={offer.qualityScore || 0} className="w-16" />
                            <span className="text-xs">{offer.qualityScore || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={offer.isActive && !offer.isExpired ? "default" : "secondary"}
                          >
                            {offer.isActive && !offer.isExpired ? "Live" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Click to conversion analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="#8884d8" />
                      <Bar dataKey="conversions" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Optimization Queue</CardTitle>
                <CardDescription>Automated offer optimization tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>AI optimization module will be implemented here</p>
                  <p className="text-sm">Real-time offer optimization using machine learning</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}