import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Database, Download, Upload, Trash2, RefreshCw, FileText, Users, Target } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useToast } from '@/hooks/use-toast';

export default function DataManagement() {
  const { toast } = useToast();

  // Fetch database statistics
  const { data: dbStats } = useQuery({
    queryKey: ['/api/database/stats'],
    refetchInterval: 30000,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const tableStats = [
    { name: 'affiliate_networks', records: 3, size: '12 KB' },
    { name: 'affiliate_offers', records: 5, size: '28 KB' },
    { name: 'affiliate_clicks', records: 50, size: '156 KB' },
    { name: 'user_sessions', records: 30, size: '89 KB' },
    { name: 'behavior_events', records: 90, size: '234 KB' },
    { name: 'experiments', records: 3, size: '15 KB' },
    { name: 'experiment_variants', records: 6, size: '18 KB' },
    { name: 'lead_captures', records: 25, size: '67 KB' },
    { name: 'lead_forms', records: 2, size: '8 KB' },
    { name: 'translations', records: 1014, size: '445 KB' }
  ];

  const handleExportData = async (type: string) => {
    setIsExporting(true);
    try {
      // Export logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export
      toast({
        title: "Export Complete",
        description: `${type} data has been exported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (type: string) => {
    setIsImporting(true);
    try {
      // Import logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate import
      toast({
        title: "Import Complete",
        description: `${type} data has been imported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing the data.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
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
                <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
                <p className="text-gray-600 mt-2">Manage database operations, backups, and data integrity</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Stats
                </Button>
                <Button size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Database Health Check
                </Button>
              </div>
            </div>
          </div>

          {/* Database Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">Core system tables</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,228</div>
                <p className="text-xs text-muted-foreground">Across all tables</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.1 GB</div>
                <p className="text-xs text-muted-foreground">Including indexes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2h ago</div>
                <p className="text-xs text-muted-foreground">Automated backup</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tables" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
              <TabsTrigger value="import">Import/Export</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="tables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Tables</CardTitle>
                  <CardDescription>Overview of all database tables and their statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tableStats.map((table) => (
                      <div key={table.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Database className="w-5 h-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium">{table.name}</h4>
                            <p className="text-sm text-gray-600">{table.records} records • {table.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{table.records > 100 ? 'Large' : table.records > 10 ? 'Medium' : 'Small'}</Badge>
                          <Button variant="outline" size="sm">
                            View Schema
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Automated Backups</CardTitle>
                    <CardDescription>Configure and monitor automated backup schedules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Daily Backup</h4>
                          <p className="text-sm text-gray-600">Full database backup at 2:00 AM UTC</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Weekly Archive</h4>
                          <p className="text-sm text-gray-600">Compressed backup every Sunday</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>

                      <div className="flex gap-4">
                        <Button>
                          <Download className="w-4 h-4 mr-2" />
                          Download Latest Backup
                        </Button>
                        <Button variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Create Backup Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Restore Options</CardTitle>
                    <CardDescription>Restore database from backup files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Upload backup file to restore</p>
                        <Button variant="outline" className="mt-2">
                          Select Backup File
                        </Button>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p>⚠️ Restoring will overwrite current data. Please backup current data first.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Data</CardTitle>
                    <CardDescription>Export data in various formats</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleExportData('Affiliate')}
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Affiliate Data (CSV)
                    </Button>
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleExportData('Analytics')}
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Analytics Data (JSON)
                    </Button>
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleExportData('Users')}
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export User Data (CSV)
                    </Button>
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleExportData('Translations')}
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Translations (JSON)
                    </Button>
                    
                    {isExporting && (
                      <div className="space-y-2">
                        <Progress value={65} />
                        <p className="text-sm text-gray-600">Exporting data...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Import Data</CardTitle>
                    <CardDescription>Import data from external sources</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleImportData('Affiliate')}
                      disabled={isImporting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Affiliate Data
                    </Button>
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleImportData('Translations')}
                      disabled={isImporting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Translations
                    </Button>
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleImportData('Content')}
                      disabled={isImporting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Content
                    </Button>
                    
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600">Drop files here or click to upload</p>
                    </div>
                    
                    {isImporting && (
                      <div className="space-y-2">
                        <Progress value={45} />
                        <p className="text-sm text-gray-600">Importing data...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Database Maintenance</CardTitle>
                    <CardDescription>Optimize database performance and clean up data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Optimize Indexes</h4>
                          <p className="text-sm text-gray-600">Rebuild and optimize database indexes</p>
                        </div>
                        <Button variant="outline">Run Optimization</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Clean Old Sessions</h4>
                          <p className="text-sm text-gray-600">Remove expired user sessions</p>
                        </div>
                        <Button variant="outline">Clean Sessions</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Vacuum Database</h4>
                          <p className="text-sm text-gray-600">Reclaim storage space</p>
                        </div>
                        <Button variant="outline">Run Vacuum</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Update Statistics</h4>
                          <p className="text-sm text-gray-600">Refresh query planner statistics</p>
                        </div>
                        <Button variant="outline">Update Stats</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Cleanup</CardTitle>
                    <CardDescription>Remove old or unnecessary data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Old Analytics Data</h4>
                          <p className="text-sm text-gray-600">Remove analytics data older than 1 year</p>
                        </div>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Old Data
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Failed Events</h4>
                          <p className="text-sm text-gray-600">Remove failed tracking events</p>
                        </div>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clean Failed Events
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}