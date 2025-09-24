import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { emotionMap } from "@/config/emotionMap";
import { PagesConfig } from "@/types/config";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { useLocalization } from "@/hooks/useLocalization";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import AdminSidebar from "@/components/AdminSidebar";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Settings, 
  Palette, 
  Zap,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  BookOpen,
  Wand2,
  BarChart3,
  FlaskConical,
  Mail,
  Smartphone,
  Globe,
  Database,
  Activity,
  DollarSign,
  Shield,
  Heart,
  PiggyBank,
  Plane
} from "lucide-react";

const Dashboard = () => {
  const [pagesConfig, setPagesConfig] = useState<PagesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  const [location, navigate] = useLocation();
  const { translate, isRTL, textDirection } = useLocalization();

  // Fetch analytics overview data
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/analytics/overview'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/overview');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Fetch affiliate networks data
  const { data: affiliateData } = useQuery({
    queryKey: ['/api/affiliate/networks'],
    queryFn: async () => {
      const response = await fetch('/api/affiliate/networks');
      if (!response.ok) throw new Error('Failed to fetch affiliate data');
      return response.json();
    }
  });

  // Fetch experiments data
  const { data: experimentsData } = useQuery({
    queryKey: ['/api/experiments'],
    queryFn: async () => {
      const response = await fetch('/api/experiments');
      if (!response.ok) throw new Error('Failed to fetch experiments');
      return response.json();
    }
  });

  // Fetch leads overview data
  const { data: leadsData } = useQuery({
    queryKey: ['/api/analytics/leads/overview'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/leads/overview');
      if (!response.ok) throw new Error('Failed to fetch leads data');
      return response.json();
    }
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/src/config/pages.json');
        const config = await response.json();
        setPagesConfig(config);
      } catch (error) {
        console.error('Error loading pages config:', error);
        // Create a default config if loading fails
        setPagesConfig({
          pages: [
            { slug: "homepage", title: "Homepage", niche: "general", emotion: "trust", interactiveModule: "hero" }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Findawise Empire Dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalPages: pagesConfig?.pages.length || 0,
    activeModules: new Set(pagesConfig?.pages.map(p => p.interactiveModule)).size || 0,
    emotionThemes: Object.keys(emotionMap).length,
    niches: new Set(pagesConfig?.pages.map(p => p.niche)).size || 0,
    totalClicks: analyticsData?.totalClicks || 0,
    conversions: analyticsData?.conversions || 0,
    conversionRate: analyticsData?.conversionRate || 0,
    activeNetworks: affiliateData?.networks?.filter((n: any) => n.isActive).length || 0,
    activeExperiments: experimentsData?.filter((e: any) => e.status === 'active').length || 0,
    totalLeads: leadsData?.totalLeads || 0
  };

  // Show analytics dashboard if requested
  if (currentView === 'analytics') {
    return <AnalyticsDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ display: 'block', visibility: 'visible', minHeight: '100vh' }}>
      <AdminSidebar />
      <div className="ml-64 p-6" style={{ marginLeft: '16rem', padding: '1.5rem' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
                  🚀 Findawise Empire - Central Config + Dynamic Page Generator
                </h1>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>Framework-independent, modular foundation for the Findawise Empire</p>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <Button onClick={() => setCurrentView('analytics')} variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card className="enhanced-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalClicks}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="enhanced-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversions</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.conversions}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.conversionRate}%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Networks</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.activeNetworks}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Experiments</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.activeExperiments}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <FlaskConical className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalLeads}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Database</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">AI Engine</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Analytics</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Tracking</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Languages</span>
                    <Badge variant="secondary">13 Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="font-semibold text-green-600">{stats.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Click-through Rate</span>
                    <span className="font-semibold">24.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue Generated</span>
                    <span className="font-semibold text-green-600">$2,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Offers</span>
                    <span className="font-semibold">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-purple-600" />
                  Global Reach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Countries</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Languages</span>
                    <span className="font-semibold">13</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sessions Today</span>
                    <span className="font-semibold">{stats.totalClicks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Top Region</span>
                    <span className="font-semibold">North America</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Modules Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Interactive Modules</h2>
              <Badge variant="secondary">{stats.activeModules} Active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="enhanced-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Quiz Module</p>
                      <p className="text-sm text-gray-600">Fitness transformation quiz</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Active</Badge>
                  </div>
                  <Link href="/fitness-transformation-quiz">
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      <FileText className="w-4 h-4 mr-2" />
                      Test Quiz
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Calculator Module</p>
                      <p className="text-sm text-gray-600">Investment calculator</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <Link href="/investment-calculator">
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      <Target className="w-4 h-4 mr-2" />
                      Test Calculator
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Timer Module</p>
                      <p className="text-sm text-gray-600">Meditation timer</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  </div>
                  <Link href="/meditation-timer">
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      <Activity className="w-4 h-4 mr-2" />
                      Test Timer
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Comparison Module</p>
                      <p className="text-sm text-gray-600">Anxiety relief toolkit</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                  </div>
                  <Link href="/anxiety-relief-toolkit">
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      <Users className="w-4 h-4 mr-2" />
                      Test Comparison
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Neuron Intelligence Hub */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Neuron Intelligence Hub</h2>
              <Badge variant="secondary">4 Active Neurons</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="enhanced-card border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-800">Security</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">AI-powered home security intelligence</p>
                  <Link href="/security">
                    <Button size="sm" variant="outline" className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      Enter Security Hub
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="enhanced-card border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-800">Health</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Wellness optimization & archetype detection</p>
                  <Link href="/health">
                    <Button size="sm" variant="outline" className="w-full">
                      <Heart className="w-4 h-4 mr-2" />
                      Enter Health Hub
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="enhanced-card border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <PiggyBank className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-800">Finance</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Personal finance AI & wealth building</p>
                  <Link href="/finance">
                    <Button size="sm" variant="outline" className="w-full">
                      <PiggyBank className="w-4 h-4 mr-2" />
                      Enter Finance Hub
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="enhanced-card border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-gray-800">Travel</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">New</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">AI-powered global travel intelligence</p>
                  <Link href="/travel">
                    <Button size="sm" variant="outline" className="w-full">
                      <Plane className="w-4 h-4 mr-2" />
                      Enter Travel Hub
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="enhanced-card">
              <CardHeader className="enhanced-card-header">
                <CardTitle className="flex items-center text-lg">
                  <FlaskConical className="w-5 h-5 mr-2 text-blue-600" />
                  A/B Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="enhanced-card-content">
                <p className="text-gray-600 mb-4">Manage experiments and test different page variations</p>
                <Link href="/admin/experiments-dashboard">
                  <Button className="btn-primary w-full">
                    Manage Experiments
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader className="enhanced-card-header">
                <CardTitle className="flex items-center text-lg">
                  <Mail className="w-5 h-5 mr-2 text-green-600" />
                  Lead Management
                </CardTitle>
              </CardHeader>
              <CardContent className="enhanced-card-content">
                <p className="text-gray-600 mb-4">Track and analyze lead capture performance</p>
                <Link href="/admin/leads-dashboard">
                  <Button className="btn-primary w-full">
                    View Leads
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader className="enhanced-card-header">
                <CardTitle className="flex items-center text-lg">
                  <Wand2 className="w-5 h-5 mr-2 text-purple-600" />
                  AI Orchestrator
                </CardTitle>
              </CardHeader>
              <CardContent className="enhanced-card-content">
                <p className="text-gray-600 mb-4">AI-powered content optimization and automation</p>
                <Link href="/admin/ai-dashboard">
                  <Button className="btn-primary w-full">
                    Open AI Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Pages */}
          <Card className="enhanced-card">
            <CardHeader className="enhanced-card-header">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Recent Pages
                </span>
                <Badge variant="secondary">{stats.totalPages} total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="enhanced-card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagesConfig?.pages.slice(0, 6).map((page, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800">{page.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${page.emotion === 'trust' ? 'border-green-300 text-green-700' : ''}
                          ${page.emotion === 'excitement' ? 'border-yellow-300 text-yellow-700' : ''}
                          ${page.emotion === 'confidence' ? 'border-red-300 text-red-700' : ''}
                          ${page.emotion === 'calm' ? 'border-blue-300 text-blue-700' : ''}
                          ${page.emotion === 'relief' ? 'border-purple-300 text-purple-700' : ''}
                        `}
                      >
                        {page.emotion}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {page.niche} • {page.interactiveModule}
                    </p>
                    <Link href={`/${page.slug}`}>
                      <Button variant="ghost" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Page
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;