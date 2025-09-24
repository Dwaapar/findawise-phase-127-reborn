import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Download, Upload, Server, Settings, Play, Square, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface Deployment {
  deploymentId: string;
  name: string;
  environment: 'dev' | 'staging' | 'prod' | 'dr';
  deploymentType: 'full' | 'partial' | 'rollback' | 'hotfix';
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  progress: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  startedAt: string;
  completedAt?: string;
  deployedBy: number;
}

interface ExportArchive {
  archiveId: string;
  name: string;
  exportType: 'full' | 'partial' | 'neuron' | 'config' | 'data';
  status: 'processing' | 'completed' | 'failed';
  fileSize: number;
  createdAt: string;
  checksum: string;
}

interface ImportOperation {
  operationId: string;
  name: string;
  importType: 'full' | 'partial' | 'merge' | 'overwrite';
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  rolled_back: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800'
};

const statusIcons = {
  pending: Clock,
  running: Play,
  completed: CheckCircle,
  failed: AlertCircle,
  rolled_back: RotateCcw,
  processing: Play
};

export default function DeploymentDashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [exports, setExports] = useState<ExportArchive[]>([]);
  const [imports, setImports] = useState<ImportOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deployments');

  // New deployment form state
  const [newDeployment, setNewDeployment] = useState({
    name: '',
    environment: 'dev' as const,
    deploymentType: 'full' as const,
    version: 'latest',
    scope: {
      core: true,
      migrations: true,
      assets: false,
      config: false
    },
    parallelization: {
      enabled: true,
      maxConcurrency: 3
    },
    rollback: {
      enabled: true,
      backupBeforeDeployment: true,
      autoRollbackOnFailure: true
    },
    healthChecks: {
      enabled: true,
      endpoints: ['http://localhost:5000/health'],
      timeout: 30000,
      retries: 3
    }
  });

  // New export form state
  const [newExport, setNewExport] = useState({
    name: '',
    exportType: 'full' as const,
    scope: {
      neurons: true,
      databases: true,
      config: true,
      assets: false,
      analytics: false,
      users: false
    },
    compression: 'gzip' as const,
    encryption: true
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [deploymentsRes, exportsRes, importsRes] = await Promise.all([
        fetch('/api/deployment/deployments'),
        fetch('/api/deployment/exports'),
        fetch('/api/deployment/imports')
      ]);

      if (deploymentsRes.ok) {
        const deploymentsData = await deploymentsRes.json();
        setDeployments(deploymentsData.data || []);
      }

      if (exportsRes.ok) {
        const exportsData = await exportsRes.json();
        setExports(exportsData.data || []);
      }

      if (importsRes.ok) {
        const importsData = await importsRes.json();
        setImports(importsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch deployment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDeployment = async () => {
    try {
      const response = await fetch('/api/deployment/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDeployment,
          notifications: {
            channels: [],
            onStart: true,
            onComplete: true,
            onFailure: true
          }
        })
      });

      if (response.ok) {
        fetchData();
        // Reset form
        setNewDeployment({
          ...newDeployment,
          name: '',
          version: 'latest'
        });
      }
    } catch (error) {
      console.error('Failed to start deployment:', error);
    }
  };

  const startExport = async () => {
    try {
      const response = await fetch('/api/deployment/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExport)
      });

      if (response.ok) {
        fetchData();
        // Reset form
        setNewExport({
          ...newExport,
          name: ''
        });
      }
    } catch (error) {
      console.error('Failed to start export:', error);
    }
  };

  const rollbackDeployment = async (deploymentId: string) => {
    try {
      await fetch(`/api/deployment/deployments/${deploymentId}/rollback`, {
        method: 'POST'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to rollback deployment:', error);
    }
  };

  const cancelDeployment = async (deploymentId: string) => {
    try {
      await fetch(`/api/deployment/deployments/${deploymentId}/cancel`, {
        method: 'POST'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading deployment data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empire Deployment Center</h1>
          <p className="text-muted-foreground">
            Billion-Dollar Grade Export/Import Booster & Master Deployment System
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button><Server className="w-4 h-4 mr-2" />New Deployment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Start New Deployment</DialogTitle>
                <DialogDescription>
                  Configure and deploy empire components
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Deployment Name</Label>
                    <Input
                      id="name"
                      value={newDeployment.name}
                      onChange={(e) => setNewDeployment({...newDeployment, name: e.target.value})}
                      placeholder="deploy-v1.0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={newDeployment.version}
                      onChange={(e) => setNewDeployment({...newDeployment, version: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Environment</Label>
                    <Select
                      value={newDeployment.environment}
                      onValueChange={(value: any) => setNewDeployment({...newDeployment, environment: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dev">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="prod">Production</SelectItem>
                        <SelectItem value="dr">Disaster Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newDeployment.deploymentType}
                      onValueChange={(value: any) => setNewDeployment({...newDeployment, deploymentType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Deployment</SelectItem>
                        <SelectItem value="partial">Partial Deployment</SelectItem>
                        <SelectItem value="hotfix">Hotfix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Deployment Scope</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(newDeployment.scope).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => 
                            setNewDeployment({
                              ...newDeployment,
                              scope: { ...newDeployment.scope, [key]: !!checked }
                            })
                          }
                        />
                        <Label htmlFor={key} className="capitalize">
                          {key === 'migrations' ? 'Database Migrations' : key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={startDeployment} className="w-full">
                  Start Deployment
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Export Archive</DialogTitle>
                <DialogDescription>
                  Export empire data for backup or migration
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="export-name">Archive Name</Label>
                  <Input
                    id="export-name"
                    value={newExport.name}
                    onChange={(e) => setNewExport({...newExport, name: e.target.value})}
                    placeholder="empire-backup-2025"
                  />
                </div>
                <div>
                  <Label>Export Type</Label>
                  <Select
                    value={newExport.exportType}
                    onValueChange={(value: any) => setNewExport({...newExport, exportType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full System</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="neuron">Single Neuron</SelectItem>
                      <SelectItem value="config">Configuration Only</SelectItem>
                      <SelectItem value="data">Data Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Export Scope</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(newExport.scope).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`export-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => 
                            setNewExport({
                              ...newExport,
                              scope: { ...newExport.scope, [key]: !!checked }
                            })
                          }
                        />
                        <Label htmlFor={`export-${key}`} className="capitalize">{key}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="encryption"
                    checked={newExport.encryption}
                    onCheckedChange={(checked) => setNewExport({...newExport, encryption: !!checked})}
                  />
                  <Label htmlFor="encryption">Enable Encryption</Label>
                </div>
                <Button onClick={startExport} className="w-full">
                  Create Export
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="exports">Export Archives</TabsTrigger>
          <TabsTrigger value="imports">Import Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="space-y-4">
          <div className="grid gap-4">
            {deployments.map((deployment) => {
              const StatusIcon = statusIcons[deployment.status];
              return (
                <Card key={deployment.deploymentId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          {deployment.name}
                        </CardTitle>
                        <CardDescription>
                          {deployment.deploymentType} deployment to {deployment.environment} • v{deployment.version}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[deployment.status]}>
                          {deployment.status}
                        </Badge>
                        {deployment.status === 'running' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelDeployment(deployment.deploymentId)}
                          >
                            <Square className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {(deployment.status === 'completed' || deployment.status === 'failed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rollbackDeployment(deployment.deploymentId)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress: {deployment.completedSteps}/{deployment.totalSteps} steps</span>
                          <span>{deployment.progress}%</span>
                        </div>
                        <Progress value={deployment.progress} className="w-full" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Started:</span>
                          <br />
                          {new Date(deployment.startedAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <br />
                          {formatDuration(deployment.startedAt, deployment.completedAt)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed Steps:</span>
                          <br />
                          <span className={deployment.failedSteps > 0 ? 'text-red-600' : 'text-green-600'}>
                            {deployment.failedSteps}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {deployments.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No deployments found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <div className="grid gap-4">
            {exports.map((exportArchive) => (
              <Card key={exportArchive.archiveId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{exportArchive.name}</CardTitle>
                      <CardDescription>
                        {exportArchive.exportType} export • {formatFileSize(exportArchive.fileSize)}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[exportArchive.status]}>
                      {exportArchive.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <br />
                      {new Date(exportArchive.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Checksum:</span>
                      <br />
                      <code className="text-xs">{exportArchive.checksum.substring(0, 16)}...</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {exports.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Download className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No export archives found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <div className="grid gap-4">
            {imports.map((importOp) => (
              <Card key={importOp.operationId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{importOp.name}</CardTitle>
                      <CardDescription>
                        {importOp.importType} import
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[importOp.status]}>
                      {importOp.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Items: {importOp.processedItems}/{importOp.totalItems}</span>
                        <span>
                          {importOp.totalItems > 0 
                            ? Math.round((importOp.processedItems / importOp.totalItems) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                      <Progress 
                        value={importOp.totalItems > 0 
                          ? (importOp.processedItems / importOp.totalItems) * 100
                          : 0
                        } 
                        className="w-full" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <br />
                        {new Date(importOp.startedAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed Items:</span>
                        <br />
                        <span className={importOp.failedItems > 0 ? 'text-red-600' : 'text-green-600'}>
                          {importOp.failedItems}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {imports.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No import operations found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}