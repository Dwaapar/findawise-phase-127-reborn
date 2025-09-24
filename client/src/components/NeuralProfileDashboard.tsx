/**
 * Neural User Profile Dashboard - Enterprise Admin Interface
 * Billion-Dollar Grade Neural Profile Management System
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Brain, 
  Activity, 
  TrendingUp, 
  Shield, 
  Globe, 
  Download, 
  RefreshCw,
  UserCheck,
  Devices,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface NeuralProfile {
  userId: string;
  email?: string;
  neuralScore: number;
  primaryArchetype: string;
  deviceCount: number;
  lastSeen: Date;
  totalActivity: number;
  conversionValue: number;
  riskScore: number;
  crossDeviceSync: boolean;
}

interface SystemStats {
  totalProfiles: number;
  totalDevices: number;
  averageNeuralScore: number;
  archetypeDistribution: Record<string, number>;
  topEngagementTypes: Array<{ eventType: string; count: number }>;
  crossDeviceSyncEnabled: number;
  consentStats: {
    trackingConsent: number;
    personalizationConsent: number;
    analyticsConsent: number;
    marketingConsent: number;
  };
}

const NeuralProfileDashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<NeuralProfile[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<NeuralProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Load all profiles
      const profilesResponse = await fetch('/api/neural-profile/admin/profiles', {
        headers: { 'x-user-id': 'admin' }
      });
      const profilesData = await profilesResponse.json();
      
      // Load system stats  
      const statsResponse = await fetch('/api/neural-profile/admin/stats', {
        headers: { 'x-user-id': 'admin' }
      });
      const statsData = await statsResponse.json();
      
      if (profilesData.success) {
        setProfiles(profilesData.data.profiles || []);
      }
      
      if (statsData.success) {
        setStats(statsData.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const exportUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/neural-profile/${userId}/export`, {
        headers: { 'x-user-id': 'admin' }
      });
      const data = await response.json();
      
      if (data.success) {
        // Create downloadable file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neural-profile-${userId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export profile:', err);
    }
  };

  const getNeuralScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 20) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading Neural Profile Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neural User Profile Dashboard</h1>
          <p className="text-gray-600">Enterprise-grade cross-device user intelligence system</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadDashboardData} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProfiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active neural profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
              <Devices className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Cross-device tracking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Neural Score</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageNeuralScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Intelligence rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cross-Device Sync</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.crossDeviceSyncEnabled}</div>
              <p className="text-xs text-muted-foreground">Enabled profiles</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiles">User Profiles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="archetypes">Archetypes</TabsTrigger>
          <TabsTrigger value="compliance">Privacy & Compliance</TabsTrigger>
        </TabsList>

        {/* User Profiles Tab */}
        <TabsContent value="profiles" className="space-y-4">
          <div className="grid gap-4">
            {profiles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Neural Profiles Found</h3>
                  <p className="text-gray-600">Neural profiles will appear here as users interact with the system.</p>
                </CardContent>
              </Card>
            ) : (
              profiles.map((profile) => (
                <Card key={profile.userId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{profile.userId}</h3>
                          {profile.email && (
                            <Badge variant="secondary">{profile.email}</Badge>
                          )}
                          {profile.crossDeviceSync && (
                            <Badge variant="outline" className="text-blue-600">
                              <Globe className="h-3 w-3 mr-1" />
                              Syncing
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Neural Score:</span>
                            <span className={`ml-2 font-semibold ${getNeuralScoreColor(profile.neuralScore)}`}>
                              {profile.neuralScore}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Archetype:</span>
                            <span className="ml-2 font-semibold text-purple-600">
                              {profile.primaryArchetype}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Devices:</span>
                            <span className="ml-2 font-semibold">{profile.deviceCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Last Seen:</span>
                            <span className="ml-2 text-gray-800">
                              {new Date(profile.lastSeen).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => exportUserProfile(profile.userId)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Engagement Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topEngagementTypes.map((engagement, index) => (
                      <div key={engagement.eventType} className="flex justify-between items-center">
                        <span className="capitalize">{engagement.eventType.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${Math.min(100, (engagement.count / Math.max(...stats.topEngagementTypes.map(e => e.count))) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {engagement.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Archetypes Tab */}
        <TabsContent value="archetypes" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.archetypeDistribution).map(([archetype, count]) => (
                <Card key={archetype}>
                  <CardHeader>
                    <CardTitle className="text-base capitalize">{archetype}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{count}</div>
                    <p className="text-sm text-gray-600">
                      {((count / stats.totalProfiles) * 100).toFixed(1)}% of users
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Privacy & Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Consent Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tracking Consent:</span>
                      <Badge variant="outline">{stats.consentStats.trackingConsent}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Personalization Consent:</span>
                      <Badge variant="outline">{stats.consentStats.personalizationConsent}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Analytics Consent:</span>
                      <Badge variant="outline">{stats.consentStats.analyticsConsent}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Marketing Consent:</span>
                      <Badge variant="outline">{stats.consentStats.marketingConsent}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Protection Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm">GDPR Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm">CCPA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Data Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Data Export Available</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Neural Profile Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedProfile(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-sm">{selectedProfile.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm">{selectedProfile.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Neural Score</label>
                  <p className={`text-sm font-semibold ${getNeuralScoreColor(selectedProfile.neuralScore)}`}>
                    {selectedProfile.neuralScore}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Primary Archetype</label>
                  <p className="text-sm text-purple-600 font-semibold">{selectedProfile.primaryArchetype}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Connected Devices</label>
                  <p className="text-sm">{selectedProfile.deviceCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cross-Device Sync</label>
                  <p className="text-sm">
                    {selectedProfile.crossDeviceSync ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => exportUserProfile(selectedProfile.userId)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NeuralProfileDashboard;