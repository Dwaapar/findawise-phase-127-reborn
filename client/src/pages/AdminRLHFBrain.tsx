/**
 * Admin RLHF Brain Page - Empire Grade RLHF + Persona Fusion Management
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RLHFBrainDashboard from '@/components/RLHFBrainDashboard';
import { Brain, Shield, Activity, Settings, Users, TrendingUp } from 'lucide-react';

const AdminRLHFBrain: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  RLHF Brain Control Center
                </h1>
                <p className="text-sm text-gray-600">
                  Reinforcement Learning from Human Feedback + Persona Fusion Engine
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Activity className="h-3 w-3 mr-1" />
                System Operational
              </Badge>
              <Badge variant="outline" className="text-purple-600">
                <Shield className="h-3 w-3 mr-1" />
                Enterprise Grade
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Feedback Signals</div>
                <div className="text-lg font-bold text-gray-900">Real-time Collection</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Persona Fusion</div>
                <div className="text-lg font-bold text-gray-900">Advanced ML</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Agent Learning</div>
                <div className="text-lg font-bold text-gray-900">Continuous</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                <Settings className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Status</div>
                <div className="text-lg font-bold text-gray-900">Operational</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="training">Training Control</TabsTrigger>
            <TabsTrigger value="personas">Persona Management</TabsTrigger>
            <TabsTrigger value="evolution">Evolution Pipeline</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          {/* Main Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <RLHFBrainDashboard />
          </TabsContent>

          {/* Training Control Tab */}
          <TabsContent value="training" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Training Session Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full">
                      <Brain className="h-4 w-4 mr-2" />
                      Start Adaptive Learning
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Parameters
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Training Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Last Training:</span>
                        <Badge variant="secondary">2 hours ago</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Scheduled:</span>
                        <Badge variant="outline">In 4 hours</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">94.2%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Learning Efficiency</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm">85%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Prediction Accuracy</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-sm">92%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Reward Optimization</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                        <span className="text-sm">78%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Persona Management Tab */}
          <TabsContent value="personas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Persona Management Center</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Advanced Persona Controls</h3>
                  <p className="text-gray-600 mb-4">
                    Detailed persona management available in the main dashboard
                  </p>
                  <Button onClick={() => {
                    // Switch to main dashboard persona tab
                    const event = new CustomEvent('switchToPersonaTab');
                    window.dispatchEvent(event);
                  }}>
                    View Persona Fusion Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolution Pipeline Tab */}
          <TabsContent value="evolution" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolution Pipeline Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Persona Evolution Management</h3>
                  <p className="text-gray-600 mb-4">
                    Monitor and approve persona evolution events
                  </p>
                  <Button onClick={() => {
                    // Switch to main dashboard evolution tab
                    const event = new CustomEvent('switchToEvolutionTab');
                    window.dispatchEvent(event);
                  }}>
                    Manage Evolution Pipeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>RLHF Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Auto-Training</label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Feedback Collection</label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Persona Evolution</label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Auto-Approve</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Federation Sync</label>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Enabled</Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Connection</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Activity className="h-3 w-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ML Models</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Brain className="h-3 w-3 mr-1" />
                        Loaded
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Endpoints</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Performance</span>
                      <Badge variant="outline" className="text-yellow-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Optimizing
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminRLHFBrain;