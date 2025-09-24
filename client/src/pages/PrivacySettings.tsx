import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Edit, AlertTriangle, CheckCircle, Clock, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import ConsentBanner from '../components/ConsentBanner';

interface ConsentData {
  id: number;
  consentType: string;
  consentValue: boolean;
  consentGrantedAt: string;
  expiresAt: string;
  legalFramework: string;
  country: string;
  cookiesConsent: string;
  analyticsConsent: string;
  marketingConsent: string;
  personalizationConsent: string;
  affiliateConsent: string;
  emailConsent: string;
  pushConsent: string;
}

interface DataRequest {
  id: number;
  requestId: string;
  requestType: string;
  status: string;
  requestDate: string;
  estimatedCompletionDate: string;
  completedAt?: string;
  description?: string;
}

export default function PrivacySettings() {
  const [consents, setConsents] = useState<ConsentData[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consent');
  const [userId] = useState('user123'); // In production, get from auth
  
  // Data request form
  const [requestType, setRequestType] = useState('access');
  const [requestDescription, setRequestDescription] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user consents
      const consentsResponse = await fetch(`/api/compliance/consent/user/${userId}`, {
        credentials: 'include'
      });
      if (consentsResponse.ok) {
        const consentsData = await consentsResponse.json();
        setConsents(consentsData.data || []);
      }

      // Load data requests
      const requestsResponse = await fetch('/api/compliance/data-requests', {
        credentials: 'include'
      });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setDataRequests(requestsData.data || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (consentType: string, value: boolean) => {
    try {
      const response = await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          consentType,
          consentValue: value,
          consentMethod: 'settings_page',
          consentVersion: '1.0'
        })
      });

      if (response.ok) {
        await loadUserData();
      }
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const submitDataRequest = async () => {
    try {
      setSubmittingRequest(true);
      
      const response = await fetch('/api/compliance/data-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          requestType,
          userId,
          email: 'user@example.com', // In production, get from user profile
          description: requestDescription,
          country: 'US',
          vertical: 'general',
          legalBasis: 'gdpr_article_15'
        })
      });

      if (response.ok) {
        setRequestDescription('');
        setRequestType('access');
        await loadUserData();
      }
    } catch (error) {
      console.error('Error submitting data request:', error);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const exportUserData = async () => {
    try {
      const response = await fetch('/api/compliance/data-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          requestType: 'export',
          userId,
          email: 'user@example.com',
          description: 'Data export request',
          country: 'US',
          vertical: 'general',
          legalBasis: 'gdpr_article_20'
        })
      });

      if (response.ok) {
        await loadUserData();
      }
    } catch (error) {
      console.error('Error requesting data export:', error);
    }
  };

  const deleteUserData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/compliance/data-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          requestType: 'erasure',
          userId,
          email: 'user@example.com',
          description: 'Complete data deletion request',
          country: 'US',
          vertical: 'general',
          legalBasis: 'gdpr_article_17'
        })
      });

      if (response.ok) {
        await loadUserData();
      }
    } catch (error) {
      console.error('Error requesting data deletion:', error);
    }
  };

  const getConsentStatus = (consent: ConsentData, type: string): boolean => {
    switch (type) {
      case 'cookies': return consent.cookiesConsent === 'granted';
      case 'analytics': return consent.analyticsConsent === 'granted';
      case 'marketing': return consent.marketingConsent === 'granted';
      case 'personalization': return consent.personalizationConsent === 'granted';
      case 'affiliate': return consent.affiliateConsent === 'granted';
      case 'email': return consent.emailConsent === 'granted';
      case 'push': return consent.pushConsent === 'granted';
      default: return false;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  const latestConsent = consents[0]; // Most recent consent

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Privacy & Data Control</h1>
            <p className="text-gray-600">Manage your consent preferences and data rights</p>
          </div>
        </div>

        {latestConsent && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your consent preferences are managed under <strong>{latestConsent.legalFramework}</strong> framework 
              for <strong>{latestConsent.country}</strong>. 
              Last updated: {new Date(latestConsent.consentGrantedAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="data-rights">Data Rights</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        {/* Consent Management Tab */}
        <TabsContent value="consent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Consent Preferences</span>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConsentBanner(true)}
                  className="text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {latestConsent ? (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Essential Cookies</h4>
                      <p className="text-sm text-gray-500">Required for website functionality</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Required</Badge>
                      <Switch checked={true} disabled={true} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Analytics Cookies</h4>
                      <p className="text-sm text-gray-500">Help us understand how you use our website</p>
                    </div>
                    <Switch 
                      checked={getConsentStatus(latestConsent, 'analytics')} 
                      onCheckedChange={(checked) => updateConsent('analytics', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Marketing Cookies</h4>
                      <p className="text-sm text-gray-500">Used to deliver personalized advertisements</p>
                    </div>
                    <Switch 
                      checked={getConsentStatus(latestConsent, 'marketing')} 
                      onCheckedChange={(checked) => updateConsent('marketing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Personalization</h4>
                      <p className="text-sm text-gray-500">Customize content based on your preferences</p>
                    </div>
                    <Switch 
                      checked={getConsentStatus(latestConsent, 'personalization')} 
                      onCheckedChange={(checked) => updateConsent('personalization', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Affiliate Tracking</h4>
                      <p className="text-sm text-gray-500">Track referrals and commissions</p>
                    </div>
                    <Switch 
                      checked={getConsentStatus(latestConsent, 'affiliate')} 
                      onCheckedChange={(checked) => updateConsent('affiliate', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Communications</h4>
                      <p className="text-sm text-gray-500">Receive product updates and newsletters</p>
                    </div>
                    <Switch 
                      checked={getConsentStatus(latestConsent, 'email')} 
                      onCheckedChange={(checked) => updateConsent('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-gray-500">Receive browser notifications</p>
                    </div>
                    <Switch 
                      checked={getConsentStatus(latestConsent, 'push')} 
                      onCheckedChange={(checked) => updateConsent('push', checked)}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No consent preferences found</h3>
                  <p className="text-gray-500 mb-4">Set your privacy preferences to get started</p>
                  <Button onClick={() => setShowConsentBanner(true)}>
                    Set Privacy Preferences
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Rights Tab */}
        <TabsContent value="data-rights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Access Your Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Request a copy of all personal data we have about you. This includes your profile, 
                  activity history, and preferences.
                </p>
                <Button onClick={exportUserData} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Delete Your Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete all your personal data from our systems. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={deleteUserData} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submit Custom Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Request Type</label>
                <select 
                  value={requestType} 
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="access">Access my data</option>
                  <option value="portability">Data portability</option>
                  <option value="rectification">Correct my data</option>
                  <option value="erasure">Delete my data</option>
                  <option value="restriction">Restrict processing</option>
                  <option value="objection">Object to processing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Please describe your request in detail..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={submitDataRequest} 
                disabled={submittingRequest}
                className="w-full"
              >
                {submittingRequest ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Data Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {dataRequests.length > 0 ? (
                <div className="space-y-4">
                  {dataRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium capitalize">{request.requestType} Request</h4>
                          <p className="text-sm text-gray-500">#{request.requestId}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      {request.description && (
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      )}
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Requested: {new Date(request.requestDate).toLocaleDateString()}</span>
                        <span>
                          {request.completedAt 
                            ? `Completed: ${new Date(request.completedAt).toLocaleDateString()}`
                            : `Expected: ${new Date(request.estimatedCompletionDate).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No requests found</h3>
                  <p className="text-gray-500">You haven't submitted any data requests yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Consent Banner Modal */}
      {showConsentBanner && (
        <Dialog open={showConsentBanner} onOpenChange={setShowConsentBanner}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Privacy Preferences</DialogTitle>
            </DialogHeader>
            <ConsentBanner 
              vertical="general"
              position="modal"
              onConsentChange={() => {
                setShowConsentBanner(false);
                loadUserData();
              }}
              onClose={() => setShowConsentBanner(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}