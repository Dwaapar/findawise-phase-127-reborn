import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Home, Users, DollarSign, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { AffiliateDisclaimer } from '@/components/PrivacyBanner';

const securityQuizSchema = z.object({
  homeType: z.enum(['apartment', 'house', 'condo', 'townhouse']),
  ownership: z.enum(['rent', 'own']),
  homeSize: z.enum(['small', 'medium', 'large']),
  locationArea: z.enum(['urban', 'suburban', 'rural']),
  crimeRate: z.enum(['low', 'medium', 'high']),
  region: z.string().min(1, 'Please enter your region'),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(10),
  elderly: z.number().min(0).max(10),
  pets: z.boolean(),
  currentSecurity: z.array(z.string()),
  budget: z.enum(['under-200', '200-500', '500-1000', '1000-2000', 'over-2000']),
  primaryConcerns: z.array(z.string()).min(1, 'Please select at least one concern'),
  techComfort: z.enum(['low', 'medium', 'high']),
  timeAtHome: z.enum(['rarely', 'sometimes', 'often', 'always']),
  previousIncident: z.boolean(),
  neighborhoodWatch: z.boolean()
});

type SecurityQuizData = z.infer<typeof securityQuizSchema>;

interface SecurityAssessment {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: Array<{
    category: string;
    severity: string;
    description: string;
    impact: string;
    solution: string;
  }>;
  recommendations: Array<{
    priority: number;
    category: string;
    title: string;
    description: string;
    cost: string;
    difficulty: string;
    timeframe: string;
    products: string[];
  }>;
  productStack: Array<{
    name: string;
    category: string;
    priority: number;
    price: string;
    features: string[];
    pros: string[];
    cons: string[];
  }>;
  persona: {
    type: string;
    description: string;
    primaryConcerns: string[];
    recommendedSolutions: string[];
    budget: string;
    techSavviness: string;
    urgency: string;
  };
}

const QuizStep = ({ 
  children, 
  title, 
  description 
}: { 
  children: React.ReactNode; 
  title: string; 
  description: string; 
}) => (
  <Card className="w-full max-w-2xl mx-auto">
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        {title}
      </CardTitle>
      <p className="text-muted-foreground">{description}</p>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const SecurityScoreDisplay = ({ assessment }: { assessment: SecurityAssessment }) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(assessment.overallScore)}`}>
              {assessment.overallScore}
            </div>
            <div className="text-lg text-muted-foreground">Security Score</div>
            <Badge className={`${getRiskColor(assessment.riskLevel)} text-lg px-4 py-1`}>
              {assessment.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security Persona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Security Persona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="font-semibold text-lg">{assessment.persona.type}</div>
            <p className="text-muted-foreground">{assessment.persona.description}</p>
            <div className="flex flex-wrap gap-2">
              {assessment.persona.primaryConcerns.map((concern, index) => (
                <Badge key={index} variant="secondary">{concern}</Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Budget: </span>
                {assessment.persona.budget}
              </div>
              <div>
                <span className="font-medium">Tech Level: </span>
                {assessment.persona.techSavviness}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      {assessment.vulnerabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Security Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessment.vulnerabilities.map((vuln, index) => (
                <div key={index} className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={vuln.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {vuln.severity}
                    </Badge>
                    <span className="font-medium">{vuln.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                  <p className="text-sm font-medium">Solution: {vuln.solution}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Priority Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessment.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge>{`Priority ${rec.priority}`}</Badge>
                    <span className="font-medium">{rec.title}</span>
                  </div>
                  <Badge variant="outline">{rec.cost}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                <div className="flex gap-2 text-xs">
                  <Badge variant="secondary">Difficulty: {rec.difficulty}</Badge>
                  <Badge variant="secondary">Timeline: {rec.timeframe}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recommended Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {assessment.productStack.slice(0, 4).map((product, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{product.name}</div>
                  <Badge variant="outline">{product.price}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{product.category}</div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-green-600">Features: </span>
                    <span className="text-xs">{product.features.slice(0, 3).join(', ')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-green-600">Pros: </span>
                      {product.pros.slice(0, 2).join(', ')}
                    </div>
                    <div>
                      <span className="font-medium text-orange-600">Cons: </span>
                      {product.cons.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Disclaimer for Product Recommendations */}
      <div className="mt-6">
        <AffiliateDisclaimer />
      </div>
    </div>
  );
};

export default function SecurityQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessment, setAssessment] = useState<SecurityAssessment | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<SecurityQuizData>({
    resolver: zodResolver(securityQuizSchema),
    defaultValues: {
      homeType: 'apartment',
      ownership: 'rent',
      homeSize: 'medium',
      locationArea: 'suburban',
      crimeRate: 'medium',
      region: '',
      adults: 2,
      children: 0,
      elderly: 0,
      pets: false,
      currentSecurity: [],
      budget: '500-1000',
      primaryConcerns: [],
      techComfort: 'medium',
      timeAtHome: 'sometimes',
      previousIncident: false,
      neighborhoodWatch: false
    }
  });

  const assessmentMutation = useMutation({
    mutationFn: async (data: SecurityQuizData) => {
      return apiRequest('/api/security/assess', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setAssessment(data.assessment);
      setCurrentStep(steps.length); // Go to results
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    }
  });

  const securityOptions = [
    'Smart doorbell', 'Security cameras', 'Motion sensors', 'Door/window sensors',
    'Smart locks', 'Alarm system', 'Professional monitoring', 'Security lights',
    'Nothing currently'
  ];

  const concernOptions = [
    'Break-ins', 'Package theft', 'Vandalism', 'Child safety',
    'Elderly safety', 'Pet safety', 'Fire/smoke', 'Medical emergencies',
    'Property damage', 'Privacy', 'False alarms', 'Cost effectiveness'
  ];

  const steps = [
    {
      title: "Home Information",
      description: "Tell us about your living situation",
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="homeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What type of home do you live in?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    {[
                      { value: 'apartment', label: 'Apartment', icon: '🏢' },
                      { value: 'house', label: 'House', icon: '🏠' },
                      { value: 'condo', label: 'Condo', icon: '🏘️' },
                      { value: 'townhouse', label: 'Townhouse', icon: '🏘️' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                          <span>{option.icon}</span>
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownership"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Do you rent or own?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rent" id="rent" />
                      <label htmlFor="rent">Rent</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="own" id="own" />
                      <label htmlFor="own">Own</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="homeSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home size</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-6"
                  >
                    {[
                      { value: 'small', label: 'Small (1-2 bedrooms)' },
                      { value: 'medium', label: 'Medium (3-4 bedrooms)' },
                      { value: 'large', label: 'Large (5+ bedrooms)' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <label htmlFor={option.value}>{option.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      title: "Location & Environment",
      description: "Help us understand your neighborhood",
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="locationArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-6"
                  >
                    {[
                      { value: 'urban', label: 'Urban' },
                      { value: 'suburban', label: 'Suburban' },
                      { value: 'rural', label: 'Rural' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <label htmlFor={option.value}>{option.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="crimeRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How would you rate crime in your area?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-6"
                  >
                    {[
                      { value: 'low', label: 'Low crime' },
                      { value: 'medium', label: 'Average crime' },
                      { value: 'high', label: 'High crime' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <label htmlFor={option.value}>{option.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      title: "Household Information",
      description: "Who lives in your home?",
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="adults"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of adults: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="children"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of children: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="elderly"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of elderly residents: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pets"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Do you have pets?</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      title: "Current Security",
      description: "What security measures do you currently have?",
      content: (
        <FormField
          control={form.control}
          name="currentSecurity"
          render={() => (
            <FormItem>
              <FormLabel>Select all that apply:</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                {securityOptions.map((option) => (
                  <FormField
                    key={option}
                    control={form.control}
                    name="currentSecurity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, option])
                                : field.onChange(field.value?.filter((value) => value !== option))
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {option}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    },
    {
      title: "Security Concerns",
      description: "What are your main security concerns?",
      content: (
        <FormField
          control={form.control}
          name="primaryConcerns"
          render={() => (
            <FormItem>
              <FormLabel>Select your primary concerns:</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                {concernOptions.map((concern) => (
                  <FormField
                    key={concern}
                    control={form.control}
                    name="primaryConcerns"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(concern)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, concern])
                                : field.onChange(field.value?.filter((value) => value !== concern))
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {concern}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    },
    {
      title: "Budget & Preferences",
      description: "Help us recommend the right solutions",
      content: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What's your budget for security improvements?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-2"
                  >
                    {[
                      { value: 'under-200', label: 'Under $200' },
                      { value: '200-500', label: '$200 - $500' },
                      { value: '500-1000', label: '$500 - $1,000' },
                      { value: '1000-2000', label: '$1,000 - $2,000' },
                      { value: 'over-2000', label: 'Over $2,000' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <label htmlFor={option.value}>{option.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="techComfort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How comfortable are you with technology?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-6"
                  >
                    {[
                      { value: 'low', label: 'Not very tech-savvy' },
                      { value: 'medium', label: 'Moderately comfortable' },
                      { value: 'high', label: 'Very tech-savvy' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <label htmlFor={option.value}>{option.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: SecurityQuizData) => {
    assessmentMutation.mutate(data);
  };

  if (assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Security Assessment</h1>
            <p className="text-muted-foreground">Personalized recommendations for your home</p>
          </div>
          <SecurityScoreDisplay assessment={assessment} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Home Security Assessment</h1>
          <p className="text-muted-foreground">Get personalized security recommendations in 2 minutes</p>
          <div className="mt-4">
            <Progress value={(currentStep / steps.length) * 100} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <QuizStep
              title={steps[currentStep].title}
              description={steps[currentStep].description}
            >
              {steps[currentStep].content}
              
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                
                {currentStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    disabled={assessmentMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    {assessmentMutation.isPending ? (
                      'Analyzing...'
                    ) : (
                      <>
                        Get My Assessment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </QuizStep>
          </form>
        </Form>
      </div>
    </div>
  );
}