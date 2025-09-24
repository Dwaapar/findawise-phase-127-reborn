import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Zap, 
  Settings, 
  Eye,
  MousePointer,
  ShoppingCart,
  RefreshCw,
  Plus,
  Search,
  Filter,
  BarChart3
} from "lucide-react";

const createOfferSchema = z.object({
  title: z.string().min(1, "Title is required"),
  merchant: z.string().min(1, "Merchant is required"),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().default("USD"),
  category: z.string().min(1, "Category is required"),
  emotion: z.string().min(1, "Emotion is required"),
  region: z.string().default("US"),
  clickTrackingUrl: z.string().url("Invalid URL"),
  description: z.string().optional(),
});

export default function OfferEngineAdmin() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof createOfferSchema>>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      currency: "USD",
      region: "US",
    },
  });

  // =============================================
  // DATA FETCHING
  // =============================================

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/offer-engine/dashboard/stats'],
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['/api/offer-engine/offers', { 
      merchant: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      emotion: selectedEmotion !== 'all' ? selectedEmotion : undefined,
      limit: 50 
    }],
  });

  const { data: sources } = useQuery({
    queryKey: ['/api/offer-engine/sources'],
  });

  const { data: syncHistory } = useQuery({
    queryKey: ['/api/offer-engine/sync/history'],
  });

  const { data: topPerforming } = useQuery({
    queryKey: ['/api/offer-engine/analytics/top-performing'],
    queryFn: async () => {
      const response = await fetch('/api/offer-engine/offers?sortBy=revenue&limit=10');
      return response.json();
    }
  });

  // =============================================
  // MUTATIONS
  // =============================================

  const createOfferMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createOfferSchema>) => {
      const response = await fetch('/api/offer-engine/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offer-engine/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/offer-engine/dashboard/stats'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const triggerSyncMutation = useMutation({
    mutationFn: async (sourceSlug?: string) => {
      const endpoint = sourceSlug 
        ? `/api/offer-engine/sync/source/${sourceSlug}`
        : '/api/offer-engine/sync/trigger';
      
      const response = await fetch(endpoint, { method: 'POST' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offer-engine/sync/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/offer-engine/offers'] });
    },
  });

  // =============================================
  // RENDER FUNCTIONS
  // =============================================

  const renderStatCards = () => {
    if (statsLoading || !stats) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats as any)?.totalOffers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(stats as any)?.activeOffers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats as any)?.totalRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats as any)?.avgCtr?.toFixed(2) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Click-through rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats as any)?.totalConversions?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(stats as any)?.avgConversionRate?.toFixed(2) || 0}% rate
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderOffersTable = () => {
    if (offersLoading || !offers) {
      return <div className="text-center py-8">Loading offers...</div>;
    }

    return (
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Emotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emotions</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="exclusive">Exclusive</SelectItem>
              <SelectItem value="trusted">Trusted</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Offers Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(offers as any[])?.map((offer: any) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm line-clamp-2">{offer.title}</CardTitle>
                  <Badge variant={offer.isActive ? "default" : "secondary"}>
                    {offer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{offer.merchant}</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">${offer.price}</span>
                  <div className="text-xs text-right">
                    <div>CTR: {offer.ctr?.toFixed(2) || 0}%</div>
                    <div>Conv: {offer.conversionRate?.toFixed(2) || 0}%</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {offer.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {offer.emotion}
                  </Badge>
                </div>
                <div className="flex gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{offer.clickCount || 0} clicks</span>
                  <span className="mx-1">•</span>
                  <span>${offer.revenueGenerated?.toFixed(2) || 0} revenue</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSources = () => {
    if (!sources) return <div>Loading sources...</div>;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Offer Sources</h3>
          <Button 
            onClick={() => triggerSyncMutation.mutate(undefined)}
            disabled={triggerSyncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${triggerSyncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(sources as any[])?.map((source: any) => (
            <Card key={source.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{source.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">{source.type}</div>
                  </div>
                  <Badge variant={source.isActive ? "default" : "secondary"}>
                    {source.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <strong>Last Sync:</strong> {source.lastSync ? 
                    new Date(source.lastSync).toLocaleDateString() : 'Never'}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => triggerSyncMutation.mutate(source.slug)}
                  disabled={triggerSyncMutation.isPending}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${triggerSyncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTopPerforming = () => {
    if (!topPerforming) return <div>Loading top performing offers...</div>;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Top Performing Offers</h3>
        <div className="space-y-3">
          {(topPerforming as any[])?.slice(0, 10).map((offer: any, index: number) => (
            <Card key={offer.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm line-clamp-1">{offer.title}</div>
                    <div className="text-xs text-muted-foreground">{offer.merchant}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">${offer.revenueGenerated?.toFixed(2) || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {offer.ctr?.toFixed(2) || 0}% CTR
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Offer Engine Admin</h1>
          <p className="text-muted-foreground">Manage your self-evolving offer monetization system</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createOfferMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Amazing Product Deal..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="merchant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Merchant</FormLabel>
                      <FormControl>
                        <Input placeholder="Amazon, ClickFunnels..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="99.99" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emotion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emotion</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                            <SelectItem value="trusted">Trusted</SelectItem>
                            <SelectItem value="popular">Popular</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="clickTrackingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/track/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Offer description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOfferMutation.isPending}>
                    {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Dashboard */}
      {renderStatCards()}

      {/* Main Content Tabs */}
      <Tabs defaultValue="offers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offers Management</CardTitle>
            </CardHeader>
            <CardContent>
              {renderOffersTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {renderSources()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Top Performing Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTopPerforming()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
            </CardHeader>
            <CardContent>
              {syncHistory ? (
                <div className="space-y-2">
                  {(syncHistory as any[])?.map((sync: any) => (
                    <div key={sync.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium">{sync.syncType} sync</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(sync.startedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={sync.status === 'success' ? 'default' : 'destructive'}>
                          {sync.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {sync.offersProcessed} processed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>Loading sync history...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}