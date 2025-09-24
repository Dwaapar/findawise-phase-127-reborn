import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, MapPin, Shield, DollarSign, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { AffiliateDisclaimer } from '@/components/PrivacyBanner';

interface SecurityScoreData {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    category: string;
    score: number;
    impact: string;
    suggestions: string[];
  }>;
}

interface CrimeData {
  location: string;
  crimeRate: number;
  recentIncidents: Array<{
    type: string;
    date: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  neighborhoodRating: string;
  recommendations: string[];
}

interface BudgetEstimate {
  totalCost: number;
  breakdown: Array<{
    category: string;
    items: Array<{
      name: string;
      price: number;
      priority: 'essential' | 'recommended' | 'optional';
    }>;
  }>;
  monthlyCosts: number;
  roi: string;
}

export default function SecurityTools() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Security Analysis Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional-grade tools to analyze your home security needs, budget, and risks
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Budget Calculator
              </TabsTrigger>
              <TabsTrigger value="crime-checker" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Crime Checker
              </TabsTrigger>
              <TabsTrigger value="security-score" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Score
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calculator">
            <SecurityBudgetCalculator />
          </TabsContent>

          <TabsContent value="crime-checker">
            <CrimeDataChecker />
          </TabsContent>

          <TabsContent value="security-score">
            <SecurityScoreAnalyzer />
          </TabsContent>
        </Tabs>

        {/* Affiliate Disclaimer */}
        <div className="mt-12">
          <AffiliateDisclaimer />
        </div>
      </div>
    </div>
  );
}

function SecurityBudgetCalculator() {
  const [homeSize, setHomeSize] = useState(2000);
  const [budget, setBudget] = useState(1000);
  const [securityLevel, setSecurityLevel] = useState(2); // 1=basic, 2=standard, 3=premium
  const [estimate, setEstimate] = useState<BudgetEstimate | null>(null);

  const calculateBudget = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/security/calculate-budget', {
        method: 'POST',
        body: JSON.stringify({
          homeSize,
          budget,
          securityLevel
        })
      });
    },
    onSuccess: (data) => {
      setEstimate(data.estimate);
    }
  });

  const handleCalculate = () => {
    calculateBudget.mutate();
  };

  const getSecurityLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Basic Protection';
      case 2: return 'Standard Security';
      case 3: return 'Premium Defense';
      default: return 'Standard Security';
    }
  };

  const getSecurityLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Security Budget Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">
              Home Size: {homeSize.toLocaleString()} sq ft
            </Label>
            <Slider
              value={[homeSize]}
              onValueChange={(value) => setHomeSize(value[0])}
              min={500}
              max={5000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>500 sq ft</span>
              <span>5,000 sq ft</span>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">
              Target Budget: ${budget.toLocaleString()}
            </Label>
            <Slider
              value={[budget]}
              onValueChange={(value) => setBudget(value[0])}
              min={200}
              max={5000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>$200</span>
              <span>$5,000+</span>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Security Level</Label>
            <div className="space-y-3">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    securityLevel === level 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSecurityLevel(level)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{getSecurityLevelLabel(level)}</div>
                      <div className="text-sm text-gray-600">
                        {level === 1 && "Essential devices only"}
                        {level === 2 && "Balanced protection & features"}
                        {level === 3 && "Comprehensive smart security"}
                      </div>
                    </div>
                    <Badge className={getSecurityLevelColor(level)}>
                      {level === 1 && "Basic"}
                      {level === 2 && "Standard"}
                      {level === 3 && "Premium"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCalculate}
            disabled={calculateBudget.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            {calculateBudget.isPending ? 'Calculating...' : 'Calculate Security Budget'}
          </Button>
        </CardContent>
      </Card>

      {estimate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Your Security Budget Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${estimate.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Initial Investment</div>
              </div>
              <div className="flex justify-between mt-4 text-sm">
                <div>
                  <span className="text-gray-600">Monthly: </span>
                  <span className="font-medium">${estimate.monthlyCosts}</span>
                </div>
                <div>
                  <span className="text-gray-600">ROI: </span>
                  <span className="font-medium text-green-600">{estimate.roi}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {estimate.breakdown.map((category, index) => (
                <div key={index}>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.name}</span>
                          <Badge 
                            variant={item.priority === 'essential' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.priority}
                          </Badge>
                        </div>
                        <span className="font-medium">${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CrimeDataChecker() {
  const [zipCode, setZipCode] = useState('');
  const [crimeData, setCrimeData] = useState<CrimeData | null>(null);

  const checkCrimeData = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/security/crime-data', {
        method: 'POST',
        body: JSON.stringify({ zipCode })
      });
    },
    onSuccess: (data) => {
      setCrimeData(data.crimeData);
    }
  });

  const handleCheck = () => {
    if (zipCode.length >= 5) {
      checkCrimeData.mutate();
    }
  };

  const getRiskColor = (rate: number) => {
    if (rate <= 30) return 'text-green-600 bg-green-50';
    if (rate <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskLabel = (rate: number) => {
    if (rate <= 30) return 'Low Risk';
    if (rate <= 60) return 'Moderate Risk';
    return 'High Risk';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Neighborhood Crime Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="zipcode" className="text-base font-medium">
              Enter ZIP Code
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="zipcode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter 5-digit ZIP code"
                maxLength={5}
                className="flex-1"
              />
              <Button 
                onClick={handleCheck}
                disabled={zipCode.length < 5 || checkCrimeData.isPending}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                {checkCrimeData.isPending ? 'Analyzing...' : 'Check Crime Data'}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What we analyze:</h4>
            <ul className="space-y-1">
              <li>• Recent crime incidents (90 days)</li>
              <li>• Property crime rates vs. national average</li>
              <li>• Violent crime statistics</li>
              <li>• Neighborhood safety trends</li>
              <li>• Police response times</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {crimeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Crime Report: {crimeData.location}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`p-4 rounded-lg ${getRiskColor(crimeData.crimeRate)}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{getRiskLabel(crimeData.crimeRate)}</div>
                <div className="text-sm">Crime Rate: {crimeData.crimeRate}/100</div>
                <div className="text-xs mt-1">Neighborhood Rating: {crimeData.neighborhoodRating}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Recent Incidents (90 days)</h4>
              <div className="space-y-2">
                {crimeData.recentIncidents.map((incident, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{incident.type}</span>
                      <div className="text-xs text-gray-600">{incident.date}</div>
                    </div>
                    <Badge 
                      variant={incident.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {incident.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Security Recommendations</h4>
              <div className="space-y-2">
                {crimeData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SecurityScoreAnalyzer() {
  const [currentScore, setCurrentScore] = useState<SecurityScoreData | null>(null);

  const { data: scoreData, isLoading } = useQuery({
    queryKey: ['/api/security/score'],
    refetchInterval: 30000
  });

  React.useEffect(() => {
    if (scoreData?.score) {
      setCurrentScore(scoreData.score);
    }
  }, [scoreData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-pulse">Loading security analysis...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Home Security Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentScore ? (
            <>
              <div className={`p-6 rounded-lg ${getScoreColor(currentScore.overallScore)}`}>
                <div className="text-center">
                  <div className="text-4xl font-bold">{currentScore.overallScore}</div>
                  <div className="text-sm">{getScoreLabel(currentScore.overallScore)} Security</div>
                  <div className="text-xs mt-1 capitalize">Risk Level: {currentScore.riskLevel}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Security Factors</h4>
                <div className="space-y-3">
                  {currentScore.factors.map((factor, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{factor.category}</span>
                        <Badge className={getScoreColor(factor.score)}>
                          {factor.score}/100
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{factor.impact}</div>
                      <div className="space-y-1">
                        {factor.suggestions.map((suggestion, suggestionIndex) => (
                          <div key={suggestionIndex} className="flex items-start gap-2 text-xs">
                            <TrendingUp className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Security Data Available</h3>
              <p className="text-gray-600 mb-6">
                Take our security quiz to get your personalized security score and recommendations.
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                Take Security Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Security Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">87%</div>
              <div className="text-sm text-gray-600">Homes Underprotected</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">$2,847</div>
              <div className="text-sm text-gray-600">Avg. Loss Prevention</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">6 min</div>
              <div className="text-sm text-gray-600">Avg. Response Time</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">73%</div>
              <div className="text-sm text-gray-600">Crime Deterrence</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Industry Insights</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Homes with visible security systems are 3x less likely to be targeted</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Smart doorbells reduce package theft by 89%</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Professional monitoring cuts response time by 67%</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Motion sensors detect 94% of unauthorized entries</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Upgrade Recommendation</h4>
            <p className="text-sm text-gray-600 mb-3">
              Based on current trends, consider adding smart cameras and door sensors 
              to improve your security score by an estimated 15-25 points.
            </p>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-green-600">
              View Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}