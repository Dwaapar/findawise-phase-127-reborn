import React, { useState } from 'react';
import { Calculator, Shield, Camera, Home, MapPin, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Advanced Security Tools Component - 2025 Premium Features
export default function SecurityTools() {
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [results, setResults] = useState<any>({});

  const toggleTool = (toolId: string) => {
    setActiveTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  // Home Security Score Calculator
  const SecurityScoreCalculator = () => {
    const [formData, setFormData] = useState({
      homeType: '',
      entryPoints: '',
      currentSecurity: [],
      location: '',
      lighting: '',
      neighborhood: ''
    });
    const [score, setScore] = useState(0);
    const [recommendations, setRecommendations] = useState<string[]>([]);

    const calculateScore = () => {
      let baseScore = 30;
      
      // Home type scoring
      const homeTypeScores = { apartment: 15, condo: 10, house: 5, mansion: 0 };
      baseScore += (homeTypeScores as any)[formData.homeType] || 0;
      
      // Security features scoring
      baseScore += formData.currentSecurity.length * 8;
      
      // Location scoring
      const locationScores = { urban: 5, suburban: 10, rural: 0 };
      baseScore += locationScores[formData.location as keyof typeof locationScores] || 0;
      
      // Lighting scoring
      const lightingScores = { excellent: 15, good: 10, fair: 5, poor: 0 };
      baseScore += lightingScores[formData.lighting as keyof typeof lightingScores] || 0;
      
      const finalScore = Math.min(100, Math.max(0, baseScore));
      setScore(finalScore);
      
      // Generate recommendations
      const recs = [];
      if (finalScore < 40) recs.push("Install smart doorbell camera immediately");
      if (finalScore < 60) recs.push("Add motion sensor lighting");
      if (finalScore < 80) recs.push("Consider professional monitoring service");
      if (!formData.currentSecurity.includes('smart-locks')) recs.push("Upgrade to smart door locks");
      
      setRecommendations(recs);
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Home Security Score Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Home Type</Label>
              <Select onValueChange={(value) => setFormData({...formData, homeType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select home type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="mansion">Large Home/Mansion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Location Type</Label>
              <Select onValueChange={(value) => setFormData({...formData, location: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="suburban">Suburban</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Lighting Quality</Label>
              <Select onValueChange={(value) => setFormData({...formData, lighting: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Rate your lighting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={calculateScore} className="w-full">
            Calculate Security Score
          </Button>
          
          {score > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Your Security Score</span>
                <Badge className={`text-lg px-3 py-1 ${
                  score >= 80 ? 'bg-green-100 text-green-800' :
                  score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {score}/100
                </Badge>
              </div>
              <Progress value={score} className="mb-4" />
              
              {recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Priority Recommendations:</h4>
                  <ul className="space-y-1">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Security Budget Estimator
  const BudgetEstimator = () => {
    const [budget, setBudget] = useState('');
    const [homeSize, setHomeSize] = useState('');
    const [securityLevel, setSecurityLevel] = useState('');
    const [estimate, setEstimate] = useState<any>(null);

    const calculateBudget = () => {
      const budgetNum = parseInt(budget);
      const sizeMultipliers = { small: 1, medium: 1.5, large: 2.2 } as const;
      const levelMultipliers = { basic: 0.7, standard: 1.0, premium: 1.8 } as const;
      const sizeMultiplier = sizeMultipliers[homeSize as keyof typeof sizeMultipliers] || 1;
      const levelMultiplier = levelMultipliers[securityLevel as keyof typeof levelMultipliers] || 1;
      
      const baseCosts = {
        cameras: Math.round(budgetNum * 0.4 * sizeMultiplier * levelMultiplier),
        sensors: Math.round(budgetNum * 0.2 * sizeMultiplier),
        locks: Math.round(budgetNum * 0.15 * levelMultiplier),
        monitoring: Math.round(budgetNum * 0.25)
      };
      
      setEstimate({
        breakdown: baseCosts,
        total: Object.values(baseCosts).reduce((a, b) => a + b, 0),
        monthlyMonitoring: Math.round(budgetNum * 0.05)
      });
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Security Budget Estimator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Total Budget ($)</Label>
              <Input 
                type="number" 
                placeholder="e.g., 1500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Home Size</Label>
              <Select onValueChange={setHomeSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (&lt; 1500 sq ft)</SelectItem>
                  <SelectItem value="medium">Medium (1500-3000 sq ft)</SelectItem>
                  <SelectItem value="large">Large (&gt; 3000 sq ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Security Level</Label>
              <Select onValueChange={setSecurityLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Protection</SelectItem>
                  <SelectItem value="standard">Standard Security</SelectItem>
                  <SelectItem value="premium">Premium System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={calculateBudget} className="w-full">
            Calculate Budget Breakdown
          </Button>
          
          {estimate && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4">Recommended Budget Allocation</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Security Cameras</span>
                  <span className="font-medium">${estimate.breakdown.cameras}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sensors & Alarms</span>
                  <span className="font-medium">${estimate.breakdown.sensors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Smart Locks</span>
                  <span className="font-medium">${estimate.breakdown.locks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monitoring Setup</span>
                  <span className="font-medium">${estimate.breakdown.monitoring}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Initial Cost</span>
                  <span>${estimate.total}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Estimated Monthly Monitoring</span>
                  <span>${estimate.monthlyMonitoring}/month</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Local Crime Data Checker
  const CrimeDataChecker = () => {
    const [zipCode, setZipCode] = useState('');
    const [crimeData, setCrimeData] = useState<any>(null);

    const checkCrimeData = () => {
      // Simulate crime data lookup with realistic data
      const mockData = {
        location: `ZIP ${zipCode}`,
        crimeRate: Math.floor(Math.random() * 60) + 20,
        recentIncidents: [
          { type: 'Package Theft', date: '2025-01-15', severity: 'Low' },
          { type: 'Vehicle Break-in', date: '2025-01-12', severity: 'Medium' },
          { type: 'Residential Burglary', date: '2025-01-08', severity: 'High' }
        ],
        neighborhoodRating: 'Moderate Risk',
        recommendations: [
          'Install visible security cameras',
          'Use smart package delivery boxes',
          'Add motion-activated lighting',
          'Consider professional monitoring'
        ]
      };
      setCrimeData(mockData);
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            Local Crime Data Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>ZIP Code</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter your ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
              <Button onClick={checkCrimeData}>Check Data</Button>
            </div>
          </div>
          
          {crimeData && (
            <div className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {crimeData.crimeRate}
                      </div>
                      <div className="text-sm text-gray-600">Crime Rate (per 1000)</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">
                        {crimeData.neighborhoodRating}
                      </div>
                      <div className="text-sm text-gray-600">Risk Level</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Recent Incidents (Last 30 Days)</h4>
                <div className="space-y-2">
                  {crimeData.recentIncidents.map((incident: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{incident.type}</span>
                        <span className="text-sm text-gray-600 ml-2">{incident.date}</span>
                      </div>
                      <Badge variant={incident.severity === 'High' ? 'destructive' : 
                                   incident.severity === 'Medium' ? 'default' : 'secondary'}>
                        {incident.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Security Recommendations</h4>
                <ul className="space-y-1">
                  {crimeData.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-blue-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Camera Placement Generator
  const CameraPlacementGenerator = () => {
    const [homeLayout, setHomeLayout] = useState({
      floors: '',
      entryPoints: '',
      yardSize: '',
      specialAreas: []
    });
    const [placement, setPlacement] = useState<any>(null);

    const generatePlacement = () => {
      const floors = parseInt(homeLayout.floors) || 1;
      const entries = parseInt(homeLayout.entryPoints) || 2;
      
      const recommendations = [
        {
          location: 'Front Door/Entrance',
          cameraType: 'Video Doorbell Camera',
          height: '9-10 feet',
          angle: '15-30° downward',
          features: ['Facial recognition', 'Two-way audio', 'Night vision'],
          priority: 'Critical'
        },
        {
          location: 'Driveway/Vehicle Area', 
          cameraType: '4K Security Camera',
          height: '12-15 feet',
          angle: '20-45° downward',
          features: ['License plate capture', 'Motion detection', 'Spotlight'],
          priority: 'High'
        },
        {
          location: 'Backyard/Patio',
          cameraType: 'Wireless Outdoor Camera',
          height: '10-12 feet', 
          angle: '30-45° downward',
          features: ['Weather resistant', 'Color night vision', 'Smart alerts'],
          priority: 'Medium'
        }
      ];
      
      if (floors > 1) {
        recommendations.push({
          location: 'Second Floor Windows',
          cameraType: 'Indoor/Outdoor Camera',
          height: '8-10 feet',
          angle: '10-20° downward',
          features: ['Window monitoring', 'Motion zones', 'Mobile alerts'],
          priority: 'Medium'
        });
      }
      
      setPlacement({
        totalCameras: Math.max(3, entries + floors),
        cameras: recommendations,
        estimatedCost: Math.max(3, entries + floors) * 150
      });
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-600" />
            Camera Placement Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Number of Floors</Label>
              <Input 
                type="number"
                placeholder="1"
                value={homeLayout.floors}
                onChange={(e) => setHomeLayout({...homeLayout, floors: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Entry Points (doors)</Label>
              <Input 
                type="number"
                placeholder="3"
                value={homeLayout.entryPoints}
                onChange={(e) => setHomeLayout({...homeLayout, entryPoints: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Yard Size</Label>
              <Select onValueChange={(value) => setHomeLayout({...homeLayout, yardSize: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={generatePlacement} className="w-full">
            Generate Camera Plan
          </Button>
          
          {placement && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Recommended Cameras: {placement.totalCameras}</span>
                <span className="font-semibold">Est. Cost: ${placement.estimatedCost}</span>
              </div>
              
              <div className="space-y-3">
                {placement.cameras.map((camera: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{camera.location}</h4>
                      <Badge variant={camera.priority === 'Critical' ? 'destructive' : 
                                   camera.priority === 'High' ? 'default' : 'secondary'}>
                        {camera.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{camera.cameraType}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Height: {camera.height}</div>
                      <div>Angle: {camera.angle}</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Key Features:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {camera.features.map((feature: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const tools = [
    {
      id: 'security-score',
      title: 'Home Security Score',
      description: 'Assess your current security level',
      icon: <Shield className="h-6 w-6" />,
      component: <SecurityScoreCalculator />
    },
    {
      id: 'budget-estimator', 
      title: 'Budget Estimator',
      description: 'Plan your security investment',
      icon: <DollarSign className="h-6 w-6" />,
      component: <BudgetEstimator />
    },
    {
      id: 'crime-checker',
      title: 'Crime Data Checker', 
      description: 'Check local crime statistics',
      icon: <MapPin className="h-6 w-6" />,
      component: <CrimeDataChecker />
    },
    {
      id: 'camera-placement',
      title: 'Camera Placement Guide',
      description: 'Optimize camera positioning',
      icon: <Camera className="h-6 w-6" />,
      component: <CameraPlacementGenerator />
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Professional Security Tools
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Use our expert tools to design the perfect security system for your home
        </p>
      </div>
      
      {/* Tool Selection Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tools.map((tool) => (
          <Card 
            key={tool.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              activeTools.includes(tool.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => toggleTool(tool.id)}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {tool.icon}
              </div>
              <h3 className="font-semibold mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Active Tools */}
      <div className="space-y-8">
        {tools
          .filter(tool => activeTools.includes(tool.id))
          .map(tool => (
            <div key={tool.id}>
              {tool.component}
            </div>
          ))
        }
      </div>
      
      {activeTools.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select tools above to get started with your security planning</p>
        </div>
      )}
    </div>
  );
}