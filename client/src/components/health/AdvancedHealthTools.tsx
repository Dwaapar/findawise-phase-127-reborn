import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calculator, Heart, Moon, Droplets, Brain, Activity, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HealthTool {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  emotionMapping: string;
  inputFields: any;
  outputFormat: any;
}

interface AdvancedHealthToolsProps {
  tools: HealthTool[];
  onToolUsage?: (toolSlug: string, inputs: any, results: any) => void;
}

export function AdvancedHealthTools({ tools, onToolUsage }: AdvancedHealthToolsProps) {
  const [activeTab, setActiveTab] = useState('bmi-calculator');
  const [results, setResults] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const toolCategories = [...new Set(tools.map(tool => tool.category))];

  const getToolIcon = (category: string) => {
    const icons = {
      'fitness': Calculator,
      'nutrition': Heart,
      'sleep': Moon,
      'hydration': Droplets,
      'mental-health': Brain,
      'general': Activity
    };
    const Icon = icons[category as keyof typeof icons] || Activity;
    return <Icon className="w-5 h-5" />;
  };

  const getEmotionColors = (emotion: string) => {
    const colors = {
      'calm': { primary: '#3B82F6', secondary: '#93C5FD', accent: '#1E40AF' },
      'energetic': { primary: '#10B981', secondary: '#6EE7B7', accent: '#047857' },
      'trustworthy': { primary: '#8B5CF6', secondary: '#C4B5FD', accent: '#6D28D9' },
      'playful': { primary: '#F59E0B', secondary: '#FCD34D', accent: '#D97706' }
    };
    return colors[emotion as keyof typeof colors] || colors.trustworthy;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Health Tools</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Precision health calculators powered by evidence-based algorithms
        </p>
      </motion.div>

      {/* Tool Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {tools.map((tool) => (
            <TabsTrigger key={tool.slug} value={tool.slug} className="flex items-center gap-2">
              {getToolIcon(tool.category)}
              <span className="hidden sm:inline">{tool.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tools.map((tool) => (
          <TabsContent key={tool.slug} value={tool.slug}>
            <HealthToolCalculator
              tool={tool}
              onCalculate={(inputs, results) => {
                setResults(prev => ({ ...prev, [tool.slug]: results }));
                onToolUsage?.(tool.slug, inputs, results);
              }}
              emotionColors={getEmotionColors(tool.emotionMapping)}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Results Dashboard */}
      {Object.keys(results).length > 0 && (
        <ResultsDashboard results={results} tools={tools} />
      )}
    </div>
  );
}

function HealthToolCalculator({ 
  tool, 
  onCalculate, 
  emotionColors 
}: { 
  tool: HealthTool; 
  onCalculate: (inputs: any, results: any) => void;
  emotionColors: any;
}) {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [results, setResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const calculateResults = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const calculatedResults = performCalculation(tool, inputs);
    setResults(calculatedResults);
    onCalculate(inputs, calculatedResults);
    setIsCalculating(false);
  };

  const isFormValid = () => {
    return Object.keys(tool.inputFields).every(field => {
      const fieldConfig = tool.inputFields[field];
      return !fieldConfig.required || (inputs[field] !== undefined && inputs[field] !== '');
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid lg:grid-cols-2 gap-8"
    >
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: emotionColors.primary + '20', color: emotionColors.primary }}
            >
              {getToolIcon(tool.category)}
            </div>
            {tool.name}
          </CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(tool.inputFields).map(([fieldName, fieldConfig]: [string, any]) => (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName} className="capitalize">
                {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {fieldConfig.type === 'select' ? (
                <Select onValueChange={(value) => handleInputChange(fieldName, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${fieldName}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldConfig.options.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : fieldConfig.type === 'multiselect' ? (
                <div className="grid grid-cols-2 gap-2">
                  {fieldConfig.options.map((option: string) => (
                    <Button
                      key={option}
                      variant={inputs[fieldName]?.includes(option) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const current = inputs[fieldName] || [];
                        const updated = current.includes(option)
                          ? current.filter((item: string) => item !== option)
                          : [...current, option];
                        handleInputChange(fieldName, updated);
                      }}
                    >
                      {option.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id={fieldName}
                    type={fieldConfig.type}
                    placeholder={`Enter ${fieldName}`}
                    value={inputs[fieldName] || ''}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  />
                  {fieldConfig.unit && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      {fieldConfig.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          <Button 
            onClick={calculateResults}
            disabled={!isFormValid() || isCalculating}
            className="w-full"
            style={{ backgroundColor: emotionColors.primary }}
          >
            {isCalculating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              'Calculate Results'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Your Results</CardTitle>
          <CardDescription>
            {results ? 'Based on your inputs' : 'Complete the form to see your results'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results ? (
            <ResultsDisplay results={results} emotionColors={emotionColors} tool={tool} />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter your information to get personalized results</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResultsDisplay({ results, emotionColors, tool }: { results: any; emotionColors: any; tool: HealthTool }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Primary Result */}
      {results.primaryValue && (
        <div className="text-center p-6 rounded-lg" style={{ backgroundColor: emotionColors.primary + '10' }}>
          <div className="text-4xl font-bold mb-2" style={{ color: emotionColors.primary }}>
            {results.primaryValue}
          </div>
          <div className="text-lg font-medium">{results.primaryLabel}</div>
          {results.category && (
            <Badge className="mt-2" style={{ backgroundColor: emotionColors.accent }}>
              {results.category}
            </Badge>
          )}
        </div>
      )}

      {/* Secondary Metrics */}
      {results.metrics && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(results.metrics).map(([key, value]: [string, any]) => (
            <div key={key} className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {results.recommendations && (
        <div className="space-y-3">
          <h4 className="font-semibold">Recommendations</h4>
          {results.recommendations.map((rec: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <div 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: emotionColors.primary }}
              />
              <p className="text-sm">{rec}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Progress Indicator */}
      {results.healthScore && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Health Score</span>
            <span>{results.healthScore}/100</span>
          </div>
          <Progress value={results.healthScore} className="h-3" />
        </div>
      )}
    </motion.div>
  );
}

function ResultsDashboard({ results, tools }: { results: Record<string, any>; tools: HealthTool[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-2xl font-bold">Your Health Dashboard</h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(results).map(([toolSlug, result]) => {
          const tool = tools.find(t => t.slug === toolSlug);
          if (!tool) return null;

          return (
            <Card key={toolSlug}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{tool.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {result.primaryValue && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.primaryValue}</div>
                    <div className="text-sm text-muted-foreground">{result.primaryLabel}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

// Calculation logic for different tools
function performCalculation(tool: HealthTool, inputs: any) {
  switch (tool.slug) {
    case 'bmi-calculator':
      return calculateBMI(inputs);
    case 'calorie-calculator':
      return calculateCalories(inputs);
    case 'sleep-debt-calculator':
      return calculateSleepDebt(inputs);
    case 'water-intake-tracker':
      return calculateWaterIntake(inputs);
    case 'stress-assessment':
      return calculateStressLevel(inputs);
    default:
      return { primaryValue: '---', primaryLabel: 'Calculation not available' };
  }
}

function calculateBMI(inputs: any) {
  const height = parseFloat(inputs.height) / 100; // Convert cm to m
  const weight = parseFloat(inputs.weight);
  const bmi = weight / (height * height);
  
  let category = '';
  let recommendations = [];
  
  if (bmi < 18.5) {
    category = 'Underweight';
    recommendations = [
      'Consider consulting a healthcare provider',
      'Focus on nutrient-dense foods',
      'Strength training may help build muscle mass'
    ];
  } else if (bmi < 25) {
    category = 'Normal weight';
    recommendations = [
      'Maintain current lifestyle habits',
      'Continue regular physical activity',
      'Eat a balanced, nutritious diet'
    ];
  } else if (bmi < 30) {
    category = 'Overweight';
    recommendations = [
      'Aim for gradual weight loss through diet and exercise',
      'Increase physical activity to 150 minutes per week',
      'Consider portion control strategies'
    ];
  } else {
    category = 'Obese';
    recommendations = [
      'Consult with a healthcare provider for a weight management plan',
      'Focus on sustainable lifestyle changes',
      'Consider working with a registered dietitian'
    ];
  }

  return {
    primaryValue: bmi.toFixed(1),
    primaryLabel: 'BMI',
    category,
    recommendations,
    healthScore: Math.max(20, Math.min(100, 100 - Math.abs(22 - bmi) * 3)),
    metrics: {
      weight: `${weight} kg`,
      height: `${inputs.height} cm`,
      idealRange: '18.5 - 24.9'
    }
  };
}

function calculateCalories(inputs: any) {
  const { weight, height, age, gender, activityLevel, goal } = inputs;
  
  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Activity multipliers
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9
  };
  
  const maintenanceCalories = bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers];
  
  // Goal adjustments
  let goalCalories = maintenanceCalories;
  if (goal === 'lose') goalCalories -= 500; // 1 lb per week
  if (goal === 'gain') goalCalories += 500;
  
  const macros = {
    protein: Math.round((goalCalories * 0.25) / 4), // 25% protein
    carbs: Math.round((goalCalories * 0.45) / 4),   // 45% carbs
    fats: Math.round((goalCalories * 0.30) / 9)     // 30% fats
  };

  return {
    primaryValue: Math.round(goalCalories).toLocaleString(),
    primaryLabel: 'Daily Calories',
    recommendations: [
      'Spread calories across 3-4 meals',
      'Include protein with each meal',
      'Stay hydrated throughout the day',
      'Adjust based on hunger and energy levels'
    ],
    healthScore: 85,
    metrics: {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenanceCalories),
      protein: `${macros.protein}g`,
      carbs: `${macros.carbs}g`,
      fats: `${macros.fats}g`
    }
  };
}

function calculateSleepDebt(inputs: any) {
  const { sleepLog, idealSleep } = inputs;
  
  if (!sleepLog || sleepLog.length === 0) {
    return {
      primaryValue: '0',
      primaryLabel: 'Sleep Debt (hours)',
      recommendations: ['Start tracking your sleep to calculate debt']
    };
  }
  
  const totalDebt = sleepLog.reduce((debt: number, entry: any) => {
    const deficit = Math.max(0, idealSleep - entry.hours);
    return debt + deficit;
  }, 0);
  
  const averageSleep = sleepLog.reduce((sum: number, entry: any) => sum + entry.hours, 0) / sleepLog.length;
  
  let recommendations = [];
  if (totalDebt > 10) {
    recommendations = [
      'Prioritize consistent sleep schedule',
      'Aim for 7-9 hours nightly',
      'Create a relaxing bedtime routine',
      'Consider napping (20-30 minutes max)'
    ];
  } else if (totalDebt > 5) {
    recommendations = [
      'Focus on sleep consistency',
      'Optimize sleep environment',
      'Limit screens before bedtime'
    ];
  } else {
    recommendations = [
      'Maintain current sleep habits',
      'Continue prioritizing sleep quality',
      'Monitor for sleep disruptions'
    ];
  }

  return {
    primaryValue: totalDebt.toFixed(1),
    primaryLabel: 'Sleep Debt (hours)',
    recommendations,
    healthScore: Math.max(20, 100 - (totalDebt * 5)),
    metrics: {
      averageSleep: `${averageSleep.toFixed(1)} hrs`,
      idealSleep: `${idealSleep} hrs`,
      nights: sleepLog.length
    }
  };
}

function calculateWaterIntake(inputs: any) {
  const { weight, activityLevel, climate } = inputs;
  
  // Base calculation: 35ml per kg body weight
  let baseIntake = weight * 35;
  
  // Activity adjustments
  if (activityLevel === 'active') baseIntake *= 1.2;
  if (activityLevel === 'very-active') baseIntake *= 1.4;
  
  // Climate adjustments
  if (climate === 'hot') baseIntake *= 1.15;
  if (climate === 'humid') baseIntake *= 1.1;
  
  const dailyIntake = Math.round(baseIntake);
  const glassesPerDay = Math.round(dailyIntake / 250); // 250ml per glass

  return {
    primaryValue: `${dailyIntake}ml`,
    primaryLabel: 'Daily Water Goal',
    recommendations: [
      `Drink ${glassesPerDay} glasses (250ml each) per day`,
      'Start your day with a glass of water',
      'Drink before, during, and after exercise',
      'Monitor urine color as hydration indicator'
    ],
    healthScore: 90,
    metrics: {
      glasses: `${glassesPerDay} glasses`,
      liters: `${(dailyIntake / 1000).toFixed(1)}L`,
      bodyWeight: `${weight}kg`
    }
  };
}

function calculateStressLevel(inputs: any) {
  const { symptoms, triggers, frequency } = inputs;
  
  const symptomsScore = (symptoms?.length || 0) * 2;
  const triggersScore = (triggers?.length || 0) * 1.5;
  const frequencyScore = {
    'rarely': 1,
    'sometimes': 2,
    'often': 3,
    'always': 4
  }[frequency] || 1;
  
  const totalScore = symptomsScore + triggersScore + frequencyScore;
  
  let level = '';
  let recommendations = [];
  
  if (totalScore <= 5) {
    level = 'Low';
    recommendations = [
      'Maintain current stress management',
      'Continue healthy lifestyle habits',
      'Practice preventive stress techniques'
    ];
  } else if (totalScore <= 10) {
    level = 'Moderate';
    recommendations = [
      'Implement daily stress reduction practices',
      'Try meditation or deep breathing',
      'Ensure adequate sleep and exercise',
      'Consider time management strategies'
    ];
  } else {
    level = 'High';
    recommendations = [
      'Consider professional stress management support',
      'Prioritize stress-reducing activities',
      'Evaluate and address major stressors',
      'Practice daily relaxation techniques'
    ];
  }

  return {
    primaryValue: level,
    primaryLabel: 'Stress Level',
    recommendations,
    healthScore: Math.max(20, 100 - (totalScore * 5)),
    metrics: {
      symptoms: symptoms?.length || 0,
      triggers: triggers?.length || 0,
      frequency: frequency || 'Not specified'
    }
  };
}

// Helper function to get tool icon
const getToolIcon = (category: string) => {
  const icons = {
    'fitness': Calculator,
    'nutrition': Heart,
    'sleep': Moon,
    'hydration': Droplets,
    'mental-health': Brain,
    'general': Activity
  };
  const Icon = icons[category as keyof typeof icons] || Activity;
  return <Icon className="w-5 h-5" />;
};