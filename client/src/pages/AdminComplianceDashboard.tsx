import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Check, Shield, Users, FileText, Globe, Clock, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ConsentMetrics {
  totalConsents: number;
  grantedConsents: number;
  deniedConsents: number;
  pendingConsents: number;
  withdrawnConsents: number;
  complianceRate: number;
}

interface DataRequest {
  id: number;
  requestId: string;
  requestType: string;
  status: string;
  email: string;
  createdAt: string;
  estimatedCompletionDate?: string;
  legalBasis: string;
}

interface ComplianceAudit {
  id: number;
  auditId: string;
  auditType: string;
  status: string;
  overallScore: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  completedAt?: string;
}

interface AffiliateNetwork {
  id: number;
  networkName: string;
  networkType: string;
  status: string;
  complianceScore: number;
  allowedCountries: string[];
  restrictedCountries: string[];
  lastComplianceCheck?: string;
}

export default function AdminComplianceDashboard() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedVertical, setSelectedVertical] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30d');
  const queryClient = useQueryClient();

  // Consent Overview Query
  const { data: consentOverview, isLoading: consentLoading } = useQuery({
    queryKey: ['/api/compliance/consent/overview', selectedCountry, selectedVertical, dateRange],
    queryFn: () => apiRequest(`/api/compliance/consent/overview?country=${selectedCountry}&vertical=${selectedVertical}&dateRange=${dateRange}`),
    staleTime: 30000
  });

  // Data Requests Query
  const { data: dataRequestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/compliance/data-requests', selectedCountry, dateRange],
    queryFn: () => apiRequest(`/api/compliance/data-requests?country=${selectedCountry}&dateRange=${dateRange}&limit=20`),
    staleTime: 30000
  });

  // Compliance Audits Query
  const { data: auditsData, isLoading: auditsLoading } = useQuery({
    queryKey: ['/api/compliance/audit', selectedCountry, selectedVertical, dateRange],
    queryFn: () => apiRequest(`/api/compliance/audit?country=${selectedCountry}&vertical=${selectedVertical}&limit=10`),
    staleTime: 30000
  });

  // Affiliate Networks Query
  const { data: affiliateNetworksData, isLoading: networksLoading } = useQuery({
    queryKey: ['/api/compliance/affiliate/networks'],
    queryFn: () => apiRequest('/api/compliance/affiliate/networks'),
    staleTime: 30000
  });

  // Geo Restrictions Query
  const { data: geoRestrictionsData, isLoading: geoLoading } = useQuery({
    queryKey: ['/api/compliance/geo-restrictions'],
    queryFn: () => apiRequest('/api/compliance/geo-restrictions?status=active'),
    staleTime: 30000
  });

  // Run Audit Mutation
  const runAuditMutation = useMutation({
    mutationFn: (data: { auditType: string; vertical?: string; country?: string }) =>
      apiRequest('/api/compliance/audit/run', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/audit'] });
    }
  });

  // Export Data Mutation
  const exportDataMutation = useMutation({
    mutationFn: (data: { requestId: string; format: string }) =>
      apiRequest(`/api/compliance/data-requests/${data.requestId}/export`, 'POST', { format: data.format })
  });

  const handleRunAudit = (auditType: string) => {
    runAuditMutation.mutate({
      auditType,
      vertical: selectedVertical || undefined,
      country: selectedCountry || undefined
    });
  };

  const handleExportData = (requestId: string, format: string = 'json') => {
    exportDataMutation.mutate({ requestId, format });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
      'denied': 'bg-red-100 text-red-800',
      'processing': 'bg-purple-100 text-purple-800',
      'suspended': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityIcon = (criticalIssues: number, highIssues: number) => {
    if (criticalIssues > 0) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (highIssues > 0) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <Check className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compliance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Enterprise-grade privacy, consent, and regulatory compliance management</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleRunAudit('comprehensive')}
            disabled={runAuditMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Run Audit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="BR">Brazil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vertical</label>
              <Select value={selectedVertical} onValueChange={setSelectedVertical}>
                <SelectTrigger>
                  <SelectValue placeholder="All Verticals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Verticals</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="ai_tools">AI Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  queryClient.invalidateQueries();
                }}
                variant="outline"
                className="w-full"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="data-requests">Data Requests</TabsTrigger>
          <TabsTrigger value="audits">Audits & Monitoring</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliate Compliance</TabsTrigger>
          <TabsTrigger value="geo">Geo Restrictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consentLoading ? '...' : consentOverview?.totalConsents?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {consentOverview?.complianceRate ? `${consentOverview.complianceRate.toFixed(1)}% compliance rate` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Requests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requestsLoading ? '...' : dataRequestsData?.count || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active subject requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditsLoading ? '...' : auditsData?.[0]?.overallScore ? `${auditsData[0].overallScore}/100` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Latest audit score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Networks</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {networksLoading ? '...' : affiliateNetworksData?.filter((n: AffiliateNetwork) => n.status === 'active')?.length || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Compliant affiliate networks
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consent Management Tab */}
        <TabsContent value="consent">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Consent Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {consentLoading ? (
                  <div className="text-center py-8">Loading consent data...</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {consentOverview?.data?.grantedConsents || 0}
                      </div>
                      <div className="text-sm text-gray-600">Granted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {consentOverview?.data?.deniedConsents || 0}
                      </div>
                      <div className="text-sm text-gray-600">Denied</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {consentOverview?.data?.pendingConsents || 0}
                      </div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {consentOverview?.data?.withdrawnConsents || 0}
                      </div>
                      <div className="text-sm text-gray-600">Withdrawn</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {consentOverview?.data?.complianceRate?.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Compliance Rate</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consent Banner Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Legal Framework</label>
                      <Select defaultValue="gdpr">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gdpr">GDPR (EU)</SelectItem>
                          <SelectItem value="ccpa">CCPA (California)</SelectItem>
                          <SelectItem value="lgpd">LGPD (Brazil)</SelectItem>
                          <SelectItem value="pipeda">PIPEDA (Canada)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Banner Position</label>
                      <Select defaultValue="bottom">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="modal">Modal Overlay</SelectItem>
                          <SelectItem value="slide">Slide-in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full md:w-auto">
                    Generate Banner Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Requests Tab */}
        <TabsContent value="data-requests">
          <Card>
            <CardHeader>
              <CardTitle>User Data Control Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-8">Loading data requests...</div>
              ) : (
                <div className="space-y-4">
                  {dataRequestsData?.data?.map((request: DataRequest) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{request.requestId}</div>
                          <div className="text-sm text-gray-600">{request.email}</div>
                          <div className="text-sm text-gray-500">
                            {request.requestType} • {request.legalBasis}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadge(request.status)}>
                            {request.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportData(request.requestId)}
                            disabled={exportDataMutation.isPending}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-4">
                        <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.estimatedCompletionDate && (
                          <span>Est. Completion: {new Date(request.estimatedCompletionDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )) || <div className="text-center py-8 text-gray-500">No data requests found</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audits Tab */}
        <TabsContent value="audits">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Audits</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => handleRunAudit('gdpr')} size="sm" variant="outline">
                    GDPR Audit
                  </Button>
                  <Button onClick={() => handleRunAudit('ccpa')} size="sm" variant="outline">
                    CCPA Audit
                  </Button>
                  <Button onClick={() => handleRunAudit('security')} size="sm" variant="outline">
                    Security Audit
                  </Button>
                  <Button onClick={() => handleRunAudit('affiliate')} size="sm" variant="outline">
                    Affiliate Audit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {auditsLoading ? (
                  <div className="text-center py-8">Loading audit data...</div>
                ) : (
                  <div className="space-y-4">
                    {auditsData?.data?.map((audit: ComplianceAudit) => (
                      <div key={audit.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {getSeverityIcon(audit.criticalIssues, audit.highIssues)}
                              {audit.auditId}
                            </div>
                            <div className="text-sm text-gray-600">{audit.auditType}</div>
                            <div className="text-sm text-gray-500">
                              Score: {audit.overallScore}/100
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusBadge(audit.status)}>
                              {audit.status}
                            </Badge>
                            {audit.completedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(audit.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-red-600">
                            <span className="font-medium">{audit.criticalIssues}</span> Critical
                          </div>
                          <div className="text-orange-600">
                            <span className="font-medium">{audit.highIssues}</span> High
                          </div>
                          <div className="text-yellow-600">
                            <span className="font-medium">{audit.mediumIssues}</span> Medium
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">{audit.lowIssues}</span> Low
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-center py-8 text-gray-500">No audits found</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Affiliate Compliance Tab */}
        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Network Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              {networksLoading ? (
                <div className="text-center py-8">Loading affiliate networks...</div>
              ) : (
                <div className="space-y-4">
                  {affiliateNetworksData?.data?.map((network: AffiliateNetwork) => (
                    <div key={network.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{network.networkName}</div>
                          <div className="text-sm text-gray-600">{network.networkType}</div>
                          <div className="text-sm text-gray-500">
                            Compliance Score: {network.complianceScore}/100
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusBadge(network.status)}>
                            {network.status}
                          </Badge>
                          {network.lastComplianceCheck && (
                            <div className="text-xs text-gray-500 mt-1">
                              Last Check: {new Date(network.lastComplianceCheck).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Allowed:</span> {network.allowedCountries?.length || 0} countries
                        </div>
                        <div>
                          <span className="font-medium">Restricted:</span> {network.restrictedCountries?.length || 0} countries
                        </div>
                      </div>
                    </div>
                  )) || <div className="text-center py-8 text-gray-500">No affiliate networks found</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geo Restrictions Tab */}
        <TabsContent value="geo">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              {geoLoading ? (
                <div className="text-center py-8">Loading geo restrictions...</div>
              ) : (
                <div className="space-y-4">
                  {geoRestrictionsData?.data?.map((restriction: any) => (
                    <div key={restriction.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{restriction.ruleName}</div>
                          <div className="text-sm text-gray-600">{restriction.ruleType}</div>
                          <div className="text-sm text-gray-500">
                            {restriction.legalBasis}
                          </div>
                        </div>
                        <Badge className={getStatusBadge(restriction.status)}>
                          {restriction.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Target Countries:</span> {restriction.targetCountries?.length || 0}
                        </div>
                        <div>
                          <span className="font-medium">Applications:</span> {restriction.applicationsCount || 0}
                        </div>
                      </div>
                    </div>
                  )) || <div className="text-center py-8 text-gray-500">No geo restrictions found</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}