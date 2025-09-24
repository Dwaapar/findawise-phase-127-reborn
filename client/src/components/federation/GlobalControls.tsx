import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Radio, 
  Upload, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Zap,
  Globe,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PushResult {
  neuronId: string;
  success: boolean;
  error?: string;
}

interface GlobalControlsProps {
  neurons: any[];
}

const GlobalControls: React.FC<GlobalControlsProps> = ({ neurons }) => {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showExperimentDialog, setShowExperimentDialog] = useState(false);
  const [configData, setConfigData] = useState('{\n  "version": "1.0.0",\n  "settings": {\n    "timeout": 30000\n  }\n}');
  const [experimentData, setExperimentData] = useState('{\n  "name": "Feature Test",\n  "variants": ["A", "B"]\n}');
  const [pushResults, setPushResults] = useState<PushResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Global config push mutation
  const pushConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await fetch('/api/federation/configs/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configData: config,
          deployedBy: 'admin'
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPushResults(data.results || []);
      toast({
        title: "Configuration Broadcast Complete",
        description: `Pushed to ${data.sent}/${data.total} neurons`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/federation/neurons'] });
      setShowConfigDialog(false);
    }
  });

  // Global experiment push mutation
  const pushExperimentMutation = useMutation({
    mutationFn: async (experiment: any) => {
      const response = await fetch('/api/federation/experiments/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentData: experiment,
          deployedBy: 'admin'
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPushResults(data.results || []);
      toast({
        title: "Experiment Broadcast Complete",
        description: `Deployed to ${data.sent}/${data.total} neurons`
      });
      setShowExperimentDialog(false);
    }
  });

  const handleConfigPush = () => {
    try {
      const config = JSON.parse(configData);
      setIsProcessing(true);
      pushConfigMutation.mutate(config);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your configuration format",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExperimentPush = () => {
    try {
      const experiment = JSON.parse(experimentData);
      setIsProcessing(true);
      pushExperimentMutation.mutate(experiment);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your experiment format",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getResultIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Global Federation Controls
          </CardTitle>
          <CardDescription>
            Push configurations and experiments to all neurons simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Global Config Push */}
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Push Config to All
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Broadcast Configuration</DialogTitle>
                  <DialogDescription>
                    Push configuration to all {neurons.length} registered neurons
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="config">Configuration JSON</Label>
                    <Textarea 
                      id="config"
                      value={configData}
                      onChange={(e) => setConfigData(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                      placeholder="Enter configuration JSON..."
                    />
                  </div>
                  
                  {pushResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Push Results</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {pushResults.map((result, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                            <span>{result.neuronId}</span>
                            <div className="flex items-center gap-2">
                              {getResultIcon(result.success)}
                              {!result.success && (
                                <span className="text-red-500 text-xs">{result.error}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleConfigPush}
                    disabled={pushConfigMutation.isPending || isProcessing}
                    className="w-full"
                  >
                    {pushConfigMutation.isPending ? 'Broadcasting...' : 'Broadcast Configuration'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Global Experiment Push */}
            <Dialog open={showExperimentDialog} onOpenChange={setShowExperimentDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Deploy Experiment to All
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Broadcast Experiment</DialogTitle>
                  <DialogDescription>
                    Deploy experiment to all {neurons.length} registered neurons
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="experiment">Experiment JSON</Label>
                    <Textarea 
                      id="experiment"
                      value={experimentData}
                      onChange={(e) => setExperimentData(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder="Enter experiment JSON..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleExperimentPush}
                    disabled={pushExperimentMutation.isPending || isProcessing}
                    className="w-full"
                  >
                    {pushExperimentMutation.isPending ? 'Deploying...' : 'Deploy Experiment'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{neurons.length}</div>
              <div className="text-sm text-muted-foreground">Total Neurons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {neurons.filter(n => n.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {neurons.filter(n => n.healthScore >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalControls;