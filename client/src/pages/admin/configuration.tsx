import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Database, Shield, Globe, Mail, Zap, Save } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useToast } from '@/hooks/use-toast';

export default function Configuration() {
  const [settings, setSettings] = useState({
    siteName: 'Findawise Empire',
    siteDescription: 'AI-Powered Affiliate Marketing Platform',
    defaultLanguage: 'en',
    timezone: 'UTC',
    enableAnalytics: true,
    enableAI: true,
    enableLocalization: true,
    maxSessionTimeout: 30,
    apiRateLimit: 1000,
    emailNotifications: true,
    maintenanceMode: false
  });

  const { toast } = useToast();

  const handleSaveSettings = () => {
    // Save settings logic here
    toast({
      title: "Settings Saved",
      description: "Configuration has been updated successfully.",
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
                <p className="text-gray-600 mt-2">Manage system settings and configurations</p>
              </div>
              <Button onClick={handleSaveSettings}>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>Basic site configuration and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.siteName}
                        onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultLanguage">Default Language</Label>
                      <Select value={settings.defaultLanguage} onValueChange={(value) => setSettings({...settings, defaultLanguage: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Analytics</Label>
                        <p className="text-sm text-gray-600">Track user behavior and performance</p>
                      </div>
                      <Switch
                        checked={settings.enableAnalytics}
                        onCheckedChange={(checked) => setSettings({...settings, enableAnalytics: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable AI Features</Label>
                        <p className="text-sm text-gray-600">Activate AI optimization and insights</p>
                      </div>
                      <Switch
                        checked={settings.enableAI}
                        onCheckedChange={(checked) => setSettings({...settings, enableAI: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Localization</Label>
                        <p className="text-sm text-gray-600">Multi-language support</p>
                      </div>
                      <Switch
                        checked={settings.enableLocalization}
                        onCheckedChange={(checked) => setSettings({...settings, enableLocalization: checked})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Configuration
                  </CardTitle>
                  <CardDescription>Database connection and performance settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Database Status</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Connected (PostgreSQL)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Connection Pool Size</Label>
                      <Input value="20" readOnly />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium">Database Statistics</h4>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-600">Tables:</span>
                          <span className="font-medium ml-2">42</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Records:</span>
                          <span className="font-medium ml-2">~50K</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium ml-2">247 MB</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <Button variant="outline">Test Connection</Button>
                      <Button variant="outline">Backup Database</Button>
                      <Button variant="outline">Optimize Indexes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Authentication and security configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.maxSessionTimeout}
                        onChange={(e) => setSettings({...settings, maxSessionTimeout: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Security Level</Label>
                      <Select defaultValue="high">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium">Security Status</h4>
                      <div className="space-y-2 mt-2 text-sm">
                        <div className="flex justify-between">
                          <span>SSL Certificate</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate Limiting</span>
                          <span className="text-green-600 font-medium">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Input Validation</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    API Configuration
                  </CardTitle>
                  <CardDescription>API settings and rate limiting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={settings.apiRateLimit}
                        onChange={(e) => setSettings({...settings, apiRateLimit: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Version</Label>
                      <Input value="v1.0" readOnly />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium">API Usage (24h)</h4>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-600">Requests:</span>
                          <span className="font-medium ml-2">2,847</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Errors:</span>
                          <span className="font-medium ml-2">12</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Response:</span>
                          <span className="font-medium ml-2">145ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>System-level configurations and debugging options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-gray-600">Temporarily disable public access</p>
                      </div>
                      <Switch
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">System alerts and reports</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">System Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Node.js Version:</span>
                        <span className="font-medium ml-2">18.17.0</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Memory Usage:</span>
                        <span className="font-medium ml-2">247 MB</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium ml-2">7d 14h 32m</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Environment:</span>
                        <span className="font-medium ml-2">Development</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline">Export Settings</Button>
                    <Button variant="outline">Import Settings</Button>
                    <Button variant="destructive">Reset to Defaults</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}