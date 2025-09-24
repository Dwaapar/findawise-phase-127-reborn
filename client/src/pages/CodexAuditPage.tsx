import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Settings, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Bug,
  Shield,
  Code,
  Search,
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  autoFixedIssues: number;
  auditScore: number;
  executionTime: number;
  recommendations: string[];
}

interface CodexAudit {
  id: number;
  auditId: string;
  auditType: string;
  scope: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  issuesFound?: number;
  issuesResolved?: number;
  auditScore?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  executionTime?: number;
}

interface CodexIssue {
  id: number;
  issueId: string;
  auditId: number;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed' | 'false_positive';
  filePath?: string;
  lineNumber?: number;
  createdAt: string;
}

interface CodexSchedule {
  id: number;
  scheduleId: string;
  name: string;
  description?: string;
  cronExpression: string;
  auditTypes: string[];
  isActive: boolean;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export default function CodexAuditPage() {
  const [selectedAuditType, setSelectedAuditType] = useState<string>('code');
  const [selectedScope, setSelectedScope] = useState<string>('global');
  const [activeTab, setActiveTab] = useState('dashboard');
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/codex/dashboard'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch recent audits
  const { data: audits, isLoading: isAuditsLoading } = useQuery({
    queryKey: ['/api/codex/audits'],
    select: (data: any) => data.data
  });

  // Fetch recent issues
  const { data: issues, isLoading: isIssuesLoading } = useQuery({
    queryKey: ['/api/codex/issues'],
    select: (data: any) => data.data
  });

  // Fetch schedules
  const { data: schedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['/api/codex/schedules'],
    select: (data: any) => data.data
  });

  // Run audit mutation
  const runAuditMutation = useMutation({
    mutationFn: async (auditRequest: any) => {
      const response = await fetch('/api/codex/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditRequest)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/codex/audits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/codex/dashboard'] });
    }
  });

  const handleRunAudit = () => {
    runAuditMutation.mutate({
      auditType: selectedAuditType,
      scope: selectedScope,
      priority: 'medium',
      autoFix: true,
      triggeredBy: 'manual'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'running': return 'bg-blue-500 text-white';
      case 'failed': return 'bg-red-500 text-white';
      case 'pending': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Codex Auto-Audit Engine</h1>
          <p className="text-muted-foreground">AI-powered self-healing quality assurance system</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRunAudit}
            disabled={runAuditMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {runAuditMutation.isPending ? 'Running...' : 'Run Audit'}
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Excellent</div>
                <p className="text-xs text-muted-foreground">Score: {(dashboardData as any)?.data?.summary?.auditScore || 95}/100</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(dashboardData as any)?.data?.summary?.totalAudits || 0}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(dashboardData as any)?.data?.summary?.totalIssues || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(dashboardData as any)?.data?.summary?.criticalIssues || 0} critical
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auto-Fixed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(dashboardData as any)?.data?.summary?.autoFixedIssues || 0}</div>
                <p className="text-xs text-muted-foreground">Automatically resolved</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Audit</CardTitle>
              <CardDescription>Run a targeted audit on specific components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="auditType">Audit Type</Label>
                  <Select value={selectedAuditType} onValueChange={setSelectedAuditType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Code Quality</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="ux">User Experience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scope">Scope</Label>
                  <Select value={selectedScope} onValueChange={setSelectedScope}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="frontend">Frontend</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleRunAudit}
                disabled={runAuditMutation.isPending}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                {runAuditMutation.isPending ? 'Running Audit...' : 'Run Quick Audit'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Audits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audits?.slice(0, 5).map((audit: CodexAudit) => (
                    <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(audit.status)}>
                          {audit.status}
                        </Badge>
                        <div>
                          <p className="font-medium capitalize">{audit.auditType} Audit</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(audit.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {audit.auditScore && (
                          <p className="font-medium">{audit.auditScore}/100</p>
                        )}
                        {audit.issuesFound !== undefined && (
                          <p className="text-sm text-muted-foreground">{audit.issuesFound} issues</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {issues?.filter((issue: CodexIssue) => issue.severity === 'critical').slice(0, 5).map((issue: CodexIssue) => (
                    <div key={issue.id} className="p-3 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="destructive">Critical</Badge>
                        <Badge variant="outline">{issue.category}</Badge>
                      </div>
                      <p className="font-medium">{issue.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{issue.description}</p>
                      {issue.filePath && (
                        <p className="text-xs text-muted-foreground mt-1">{issue.filePath}</p>
                      )}
                    </div>
                  )) || (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                      <p>No critical issues found!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audits Tab */}
        <TabsContent value="audits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Audits</CardTitle>
              <CardDescription>Complete history of system audits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audits?.map((audit: CodexAudit) => (
                  <div key={audit.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(audit.status)}>
                          {audit.status}
                        </Badge>
                        <Badge className={
                          audit.priority === 'critical' ? 'bg-red-500 text-white' :
                          audit.priority === 'high' ? 'bg-orange-500 text-white' :
                          audit.priority === 'medium' ? 'bg-yellow-500 text-black' :
                          'bg-gray-500 text-white'
                        }>
                          {audit.priority}
                        </Badge>
                        <h3 className="font-semibold capitalize">{audit.auditType} Audit</h3>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(audit.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Scope</p>
                        <p className="font-medium capitalize">{audit.scope}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issues Found</p>
                        <p className="font-medium">{audit.issuesFound || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{audit.auditScore || 'N/A'}/100</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">
                          {audit.executionTime ? `${(audit.executionTime / 1000).toFixed(1)}s` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Issues</CardTitle>
              <CardDescription>Identified issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues?.map((issue: CodexIssue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <Badge variant="outline">{issue.category}</Badge>
                        <Badge variant="outline">{issue.type}</Badge>
                      </div>
                      <Badge variant={
                        issue.status === 'resolved' ? 'default' :
                        issue.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <h3 className="font-semibold mb-2">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>

                    {issue.filePath && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Code className="w-3 h-3" />
                        <span>{issue.filePath}</span>
                        {issue.lineNumber && <span>Line {issue.lineNumber}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Audits</CardTitle>
              <CardDescription>Automated audit schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules?.map((schedule: CodexSchedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{schedule.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          schedule.healthStatus === 'healthy' ? 'bg-green-500 text-white' :
                          schedule.healthStatus === 'degraded' ? 'bg-yellow-500 text-black' :
                          'bg-red-500 text-white'
                        }>
                          {schedule.healthStatus}
                        </Badge>
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{schedule.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Schedule</p>
                        <p className="font-medium">{schedule.cronExpression}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Run</p>
                        <p className="font-medium">
                          {schedule.lastRun ? format(new Date(schedule.lastRun), 'MMM dd, HH:mm') : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Run</p>
                        <p className="font-medium">
                          {schedule.nextRun ? format(new Date(schedule.nextRun), 'MMM dd, HH:mm') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-1">Audit Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {schedule.auditTypes?.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Reports</CardTitle>
              <CardDescription>Generated audit reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Generated</h3>
                <p className="text-muted-foreground mb-4">Run some audits to generate comprehensive reports</p>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}