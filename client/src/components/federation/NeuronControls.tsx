import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  History,
  Eye,
  Download,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NeuronControlsProps {
  neuron: any;
}

const NeuronControls: React.FC<NeuronControlsProps> = ({ neuron }) => {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [configData, setConfigData] = useState('{\n  "version": "1.0.0",\n  "settings": {}\n}');
  const [configFile, setConfigFile] = useState<File | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch neuron configuration history
  const { data: configHistory = [] } = useQuery({
    queryKey: [`/api/federation/neurons/${neuron.neuronId}/configs`],
    enabled: showHistoryDialog
  });

  // Fetch real-time logs
  const { data: logsData = [] } = useQuery({
    queryKey: [`/api/federation/neurons/${neuron.neuronId}/logs`],
    enabled: showLogsDialog,
    refetchInterval: showLogsDialog ? 2000 : false
  });

  // Push configuration mutation
  const pushConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await fetch(`/api/federation/neurons/${neuron.neuronId}/configs/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configData: config,
          deployedBy: 'admin',
          notes: 'Manual deployment from admin panel'
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Deployed",
        description: `Successfully deployed to ${neuron.name}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/federation/neurons'] });
      setShowConfigDialog(false);
    },
    onError: () => {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy configuration",
        variant: "destructive"
      });
    }
  });

  // Deploy experiment mutation
  const deployExperimentMutation = useMutation({
    mutationFn: async (experiment: any) => {
      const response = await fetch(`/api/federation/neurons/${neuron.neuronId}/experiments/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment,
          deployedBy: 'admin'
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Experiment Deployed",
        description: `Successfully deployed to ${neuron.name}`
      });
    }
  });

  // Rollback configuration mutation
  const rollbackMutation = useMutation({
    mutationFn: async (configId: number) => {
      const response = await fetch(`/api/federation/neurons/${neuron.neuronId}/configs/${configId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rolledBackBy: 'admin',
          reason: 'Manual rollback from admin panel'
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Rolled Back",
        description: `Successfully rolled back ${neuron.name}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/federation/neurons'] });
    }
  });

  const handleConfigPush = () => {
    try {
      const config = JSON.parse(configData);
      pushConfigMutation.mutate(config);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your configuration format",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setConfigFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content); // Validate JSON
          setConfigData(content);
        } catch (error) {
          toast({
            title: "Invalid File",
            description: "Please upload a valid JSON file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRollback = (configId: number) => {
    rollbackMutation.mutate(configId);
  };

  const quickExperiment = () => {
    const experiment = {
      name: "Quick Test",
      type: "feature_flag",
      variants: ["control", "test"],
      traffic: 50
    };
    deployExperimentMutation.mutate(experiment);
  };

  return (
    <div className="flex items-center gap-2">
      
      {/* Push Config Button */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Push Configuration to {neuron.name}</DialogTitle>
            <DialogDescription>
              Deploy new configuration to this neuron
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-file">Upload Config File (Optional)</Label>
              <Input 
                id="config-file"
                type="file" 
                accept=".json"
                onChange={handleFileUpload}
              />
            </div>
            <div>
              <Label htmlFor="config-text">Configuration JSON</Label>
              <Textarea 
                id="config-text"
                value={configData}
                onChange={(e) => setConfigData(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleConfigPush}
              disabled={pushConfigMutation.isPending}
            >
              {pushConfigMutation.isPending ? 'Deploying...' : 'Deploy Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Experiment Button */}
      <Button 
        size="sm" 
        variant="outline"
        onClick={quickExperiment}
        disabled={deployExperimentMutation.isPending}
      >
        <Zap className="h-4 w-4" />
      </Button>

      {/* View Logs Button */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Real-time Logs - {neuron.name}</DialogTitle>
            <DialogDescription>
              Live logs and errors from this neuron
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full rounded border p-4">
            <div className="space-y-2 font-mono text-sm">
              {logsData.length === 0 ? (
                <div className="text-muted-foreground">No logs available</div>
              ) : (
                logsData.map((log: any, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-muted-foreground">{log.timestamp}</span>
                    <span className={`${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-blue-500'}`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Configuration History Button */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <History className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Configuration History - {neuron.name}</DialogTitle>
            <DialogDescription>
              View and rollback to previous configurations
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-2">
              {(configHistory as any[]).map((config, idx) => (
                <Card key={config.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Version {config.configVersion}</div>
                      <div className="text-sm text-muted-foreground">
                        Deployed by {config.deployedBy} • {new Date(config.deployedAt).toLocaleString()}
                      </div>
                      {config.notes && (
                        <div className="text-sm mt-1">{config.notes}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {config.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                      {!config.isActive && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRollback(config.id)}
                          disabled={rollbackMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Open Neuron Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => window.open(neuron.url, '_blank')}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default NeuronControls;