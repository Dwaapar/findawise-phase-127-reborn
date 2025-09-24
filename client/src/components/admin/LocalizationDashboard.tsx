/**
 * Localization Admin Dashboard - Billion-Dollar Empire Grade
 * 
 * Complete admin interface for localization management:
 * - Translation key management and bulk operations
 * - Missing translations report and auto-translation
 * - Cultural adaptation preview and testing
 * - Analytics dashboard with comprehensive metrics
 * - Language management and configuration
 * - Export/import capabilities for translation workflows
 * 
 * @version 2.0.0 - Billion-Dollar Empire Grade
 * @author Findawise Empire - Senior Development Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { 
  Globe, 
  Languages, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Zap, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Eye,
  Settings,
  Users,
  Database,
  RefreshCw,
  Play,
  Pause,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  direction: string;
  region: string;
  isDefault: boolean;
  isActive: boolean;
  completeness: number;
  autoTranslate: boolean;
}

interface TranslationKey {
  id: number;
  keyPath: string;
  category: string;
  context: string;
  defaultValue: string;
  priority: number;
  translationCount: number;
  completedLanguages: string[];
  createdAt: string;
}

interface AnalyticsData {
  languageStats: {
    languageCode: string;
    eventCount: number;
    uniqueSessions: number;
    fallbackRate: number;
    avgQuality: number;
  }[];
  eventTypeStats: {
    eventType: string;
    count: number;
    percentage: number;
  }[];
  dailyTrends: {
    date: string;
    events: number;
    uniqueSessions: number;
    fallbacks: number;
  }[];
  topContent: {
    keyPath: string;
    contentType: string;
    requestCount: number;
    fallbackRate: number;
  }[];
  summary: {
    totalEvents: number;
    totalSessions: number;
    averageFallbackRate: number;
    averageQuality: number;
  };
}

const LocalizationDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadLanguages(),
        loadTranslationKeys(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLanguages = async () => {
    try {
      const response = await fetch('/api/localization/languages');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLanguages(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const loadTranslationKeys = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/localization/admin/keys?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTranslationKeys(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load translation keys:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLanguage) params.append('languageCode', selectedLanguage);
      
      const response = await fetch(`/api/localization/admin/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleBulkTranslate = async (languageCode: string) => {
    if (selectedKeys.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select translation keys to translate',
        variant: 'destructive'
      });
      return;
    }

    setBulkOperationLoading(true);
    try {
      const response = await fetch('/api/localization/admin/bulk-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageCode,
          keyIds: selectedKeys,
          force: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Success',
            description: `Translated ${data.data.success} keys, skipped ${data.data.skipped}, failed ${data.data.failed}`
          });
          loadTranslationKeys();
          setSelectedKeys([]);
        }
      }
    } catch (error) {
      console.error('Bulk translation failed:', error);
      toast({
        title: 'Error',
        description: 'Bulk translation failed',
        variant: 'destructive'
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleKeySelection = (keyId: number, selected: boolean) => {
    if (selected) {
      setSelectedKeys(prev => [...prev, keyId]);
    } else {
      setSelectedKeys(prev => prev.filter(id => id !== keyId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedKeys(translationKeys.map(key => key.id));
    } else {
      setSelectedKeys([]);
    }
  };

  const getCompletionPercentage = (completedLanguages: string[]) => {
    const totalLanguages = languages.filter(lang => lang.isActive).length;
    return totalLanguages > 0 ? Math.round((completedLanguages.length / totalLanguages) * 100) : 0;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'page': 'bg-blue-100 text-blue-800',
      'offer': 'bg-green-100 text-green-800',
      'form': 'bg-yellow-100 text-yellow-800',
      'email': 'bg-purple-100 text-purple-800',
      'dashboard': 'bg-red-100 text-red-800',
      'ui': 'bg-gray-100 text-gray-800',
      'content': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority === 1) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (priority === 2) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Localization Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage translations, cultural adaptations, and global content delivery
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={loadDashboardData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="cultural">Cultural</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Languages</CardTitle>
                  <Languages className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{languages.filter(lang => lang.isActive).length}</div>
                  <p className="text-xs text-muted-foreground">
                    {languages.length} total configured
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Translation Keys</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{translationKeys.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total translation keys
                  </p>
                </CardContent>
              </Card>

              {analytics && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.summary.totalEvents.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Last 30 days
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Fallback Rate</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.summary.averageFallbackRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        Average across languages
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Language Usage Statistics</CardTitle>
                <CardDescription>Most active languages in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    {analytics.languageStats.slice(0, 5).map((stat) => (
                      <div key={stat.languageCode} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{stat.languageCode.toUpperCase()}</Badge>
                          <span className="font-medium">
                            {languages.find(lang => lang.code === stat.languageCode)?.name || stat.languageCode}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{stat.eventCount} events</span>
                          <span>{stat.uniqueSessions} sessions</span>
                          <span className={`${stat.fallbackRate > 20 ? 'text-red-600' : 'text-green-600'}`}>
                            {stat.fallbackRate.toFixed(1)}% fallback
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Loading analytics data...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Translations Tab */}
          <TabsContent value="translations" className="space-y-6">
            {/* Filters and Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Translation Management</CardTitle>
                <CardDescription>Manage translation keys and bulk operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search translation keys..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="ui">UI</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadTranslationKeys}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                {/* Bulk Operations */}
                {selectedKeys.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedKeys.length} keys selected
                      </span>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(languageCode) => handleBulkTranslate(languageCode)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Bulk translate to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.filter(lang => lang.isActive && lang.code !== 'en').map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name} ({lang.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedKeys([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translation Keys Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4 text-left">
                          <Checkbox
                            checked={selectedKeys.length === translationKeys.length && translationKeys.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="p-4 text-left font-medium text-gray-900">Key Path</th>
                        <th className="p-4 text-left font-medium text-gray-900">Category</th>
                        <th className="p-4 text-left font-medium text-gray-900">Priority</th>
                        <th className="p-4 text-left font-medium text-gray-900">Completion</th>
                        <th className="p-4 text-left font-medium text-gray-900">Languages</th>
                        <th className="p-4 text-left font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {translationKeys.map((key) => (
                        <tr key={key.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <Checkbox
                              checked={selectedKeys.includes(key.id)}
                              onCheckedChange={(checked) => handleKeySelection(key.id, checked as boolean)}
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-900">{key.keyPath}</div>
                              <div className="text-sm text-gray-500 truncate max-w-64" title={key.defaultValue}>
                                {key.defaultValue}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getCategoryColor(key.category)}>
                              {key.category}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              {getPriorityIcon(key.priority)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <Progress value={getCompletionPercentage(key.completedLanguages)} className="h-2" />
                              <span className="text-xs text-gray-500">
                                {getCompletionPercentage(key.completedLanguages)}% complete
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {key.completedLanguages.slice(0, 3).map((lang) => (
                                <Badge key={lang} variant="secondary" className="text-xs">
                                  {lang}
                                </Badge>
                              ))}
                              {key.completedLanguages.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{key.completedLanguages.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {translationKeys.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No translation keys found. Try adjusting your search criteria.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Language Configuration</CardTitle>
                <CardDescription>Manage supported languages and their settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {languages.map((language) => (
                    <Card key={language.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{language.name}</CardTitle>
                          <Badge variant={language.isActive ? "default" : "secondary"}>
                            {language.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {language.nativeName} ({language.code}) • {language.region}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Translation Completeness</span>
                            <span>{language.completeness}%</span>
                          </div>
                          <Progress value={language.completeness} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Auto-translate</span>
                          <Switch checked={language.autoTranslate} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Default language</span>
                          <Badge variant={language.isDefault ? "default" : "outline"}>
                            {language.isDefault ? "Default" : ""}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cultural Tab */}
          <TabsContent value="cultural" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cultural Adaptation Preview</CardTitle>
                <CardDescription>Test how content appears in different cultural contexts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  Cultural adaptation preview coming soon...
                  <br />
                  This will integrate with the Cultural Emotion Map Engine.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.summary.totalEvents.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.summary.totalSessions.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Fallback Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.summary.averageFallbackRate.toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.summary.averageQuality.toFixed(1)}/100</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Content Requiring Translation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.topContent.slice(0, 10).map((content, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{content.keyPath}</div>
                              <div className="text-xs text-gray-500">{content.contentType}</div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{content.requestCount} requests</span>
                              <Badge variant={content.fallbackRate > 20 ? "destructive" : "default"}>
                                {content.fallbackRate.toFixed(1)}% fallback
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Event Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.eventTypeStats.map((stat, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{stat.eventType.replace(/_/g, ' ')}</span>
                              <span>{stat.percentage}%</span>
                            </div>
                            <Progress value={stat.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Translation Settings</CardTitle>
                <CardDescription>Configure translation providers and system preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  Translation provider settings and system configuration coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LocalizationDashboard;