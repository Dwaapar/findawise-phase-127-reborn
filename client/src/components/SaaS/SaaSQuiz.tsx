import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, CheckCircle, Sparkles, Users, DollarSign, TrendingUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { userPersonas, saasCategories } from "@/config/saasConfig";

interface QuizQuestion {
  id: string;
  type: "single" | "multiple" | "slider" | "budget";
  title: string;
  description: string;
  options?: { id: string; label: string; description?: string; weight?: number }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "role",
    type: "single",
    title: "What's your primary role?",
    description: "This helps us understand your specific needs and workflow",
    options: [
      { id: "freelancer", label: "Freelancer", description: "Independent professional managing multiple clients", weight: 1 },
      { id: "startup-founder", label: "Startup Founder", description: "Building and scaling a new business", weight: 2 },
      { id: "agency-owner", label: "Agency Owner", description: "Managing client projects and team operations", weight: 3 },
      { id: "enterprise-manager", label: "Enterprise Manager", description: "Overseeing large-scale operations", weight: 4 },
      { id: "marketer", label: "Digital Marketer", description: "Creating and managing marketing campaigns", weight: 2 },
      { id: "developer", label: "Developer", description: "Building and maintaining software applications", weight: 1 }
    ]
  },
  {
    id: "team-size",
    type: "single",
    title: "What's your team size?",
    description: "Different tools work better for different team sizes",
    options: [
      { id: "solo", label: "Just me", description: "Solo professional", weight: 1 },
      { id: "small", label: "2-10 people", description: "Small team or startup", weight: 2 },
      { id: "medium", label: "11-50 people", description: "Medium-sized business", weight: 3 },
      { id: "large", label: "51-200 people", description: "Large company", weight: 4 },
      { id: "enterprise", label: "200+ people", description: "Enterprise organization", weight: 5 }
    ]
  },
  {
    id: "priorities",
    type: "multiple",
    title: "What are your top priorities?",
    description: "Select all that apply - we'll match tools to your needs",
    options: [
      { id: "productivity", label: "Boost Productivity", description: "Save time and work more efficiently" },
      { id: "collaboration", label: "Team Collaboration", description: "Improve team communication and workflow" },
      { id: "automation", label: "Process Automation", description: "Automate repetitive tasks" },
      { id: "analytics", label: "Data & Analytics", description: "Track performance and make data-driven decisions" },
      { id: "customer-management", label: "Customer Management", description: "Better manage customer relationships" },
      { id: "marketing", label: "Marketing Growth", description: "Attract and convert more customers" },
      { id: "scalability", label: "Scalability", description: "Tools that grow with your business" },
      { id: "integration", label: "Integration", description: "Tools that work well together" }
    ]
  },
  {
    id: "budget",
    type: "slider",
    title: "What's your monthly software budget?",
    description: "We'll recommend tools within your budget range",
    min: 0,
    max: 2000,
    step: 50,
    unit: "$"
  },
  {
    id: "categories",
    type: "multiple",
    title: "Which tool categories interest you most?",
    description: "Select the areas where you need the most help",
    options: saasCategories.slice(0, 8).map(cat => ({
      id: cat.id,
      label: cat.name,
      description: cat.description
    }))
  },
  {
    id: "experience",
    type: "single",
    title: "How would you describe your tech experience?",
    description: "This helps us recommend tools with the right complexity level",
    options: [
      { id: "beginner", label: "Beginner", description: "I prefer simple, easy-to-use tools", weight: 1 },
      { id: "intermediate", label: "Intermediate", description: "I'm comfortable with most software", weight: 2 },
      { id: "advanced", label: "Advanced", description: "I can handle complex, feature-rich tools", weight: 3 },
      { id: "expert", label: "Expert", description: "I need powerful, customizable solutions", weight: 4 }
    ]
  }
];

interface SaaSQuizProps {
  onComplete?: (results: any) => void;
}

export default function SaaSQuiz({ onComplete }: SaaSQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const { toast } = useToast();

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleAnswer = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: checked
        ? [...(prev[questionId] || []), optionId]
        : (prev[questionId] || []).filter((id: string) => id !== optionId)
    }));
  };

  const handleSliderAnswer = (questionId: string, value: number[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value[0] }));
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const completeQuiz = async () => {
    try {
      // Calculate persona based on role and team size
      const role = answers.role || 'freelancer';
      const teamSize = answers.team_size || 'solo';
      const persona = userPersonas.find(p => p.id === role) || userPersonas[0];

      // Generate recommendations based on answers
      const stackRecommendations = generateRecommendations(answers, persona);

      const quizResults = {
        sessionId: sessionStorage.getItem('sessionId') || 'anonymous',
        answers,
        persona: persona.id,
        recommendations: stackRecommendations,
        budget: { max: answers.budget || 100, preferred: (answers.budget || 100) * 0.8 },
        priorities: answers.priorities || [],
        categories: answers.categories || [],
        experience: answers.experience || 'intermediate',
        completedAt: new Date().toISOString()
      };

      setRecommendations(stackRecommendations);
      setIsComplete(true);

      // Save results to backend
      const response = await fetch('/api/saas/quiz/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: quizResults.sessionId,
          quizType: 'saas-tool-finder',
          answers: quizResults.answers,
          persona: quizResults.persona,
          recommendedTools: stackRecommendations.tools,
          recommendedStack: stackRecommendations.stack,
          budget: quizResults.budget,
          priorities: quizResults.priorities
        })
      });

      if (response.ok) {
        console.log('Quiz results saved successfully');
      }

      onComplete?.(quizResults);

      toast({
        title: "Quiz Complete!",
        description: "Your personalized SaaS recommendations are ready.",
      });

    } catch (error) {
      console.error('Error completing quiz:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateRecommendations = (answers: any, persona: any) => {
    // This is a simplified recommendation engine
    // In production, this would be more sophisticated with real tool data
    
    const budget = answers.budget || 100;
    const categories = answers.categories || [];
    const priorities = answers.priorities || [];
    const experience = answers.experience || 'intermediate';
    
    // Sample recommendations based on persona and answers
    const baseTools = [
      {
        id: 'notion',
        name: 'Notion',
        category: 'productivity',
        monthlyPrice: 8,
        match: 95,
        reason: 'Perfect for organizing work and collaboration'
      },
      {
        id: 'slack',
        name: 'Slack',
        category: 'communication',
        monthlyPrice: 7.25,
        match: 90,
        reason: 'Essential for team communication'
      },
      {
        id: 'figma',
        name: 'Figma',
        category: 'design',
        monthlyPrice: 12,
        match: 85,
        reason: 'Industry standard for design collaboration'
      }
    ];

    const filteredTools = baseTools.filter(tool => 
      tool.monthlyPrice <= budget && 
      (categories.length === 0 || categories.includes(tool.category))
    );

    const totalMonthlyCost = filteredTools.reduce((sum, tool) => sum + tool.monthlyPrice, 0);
    const totalYearlyCost = totalMonthlyCost * 12 * 0.9; // 10% discount for annual

    return {
      tools: filteredTools,
      stack: {
        name: `${persona.name} Essentials`,
        totalCost: {
          monthly: totalMonthlyCost,
          yearly: totalYearlyCost
        },
        savingsWithAnnual: (totalMonthlyCost * 12) - totalYearlyCost
      },
      persona: persona.name,
      matchScore: Math.round(filteredTools.reduce((sum, tool) => sum + tool.match, 0) / filteredTools.length)
    };
  };

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto p-6"
      >
        <Card className="text-center">
          <CardHeader className="pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl mb-2">Your Perfect SaaS Stack</CardTitle>
            <CardDescription className="text-lg">
              Based on your answers, we've curated the ideal tools for your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {recommendations.matchScore}%
                    </div>
                    <div className="text-sm text-slate-600">Match Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${recommendations.stack.totalCost.monthly}/mo
                    </div>
                    <div className="text-sm text-slate-600">Monthly Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${recommendations.stack.savingsWithAnnual.toFixed(0)}
                    </div>
                    <div className="text-sm text-slate-600">Annual Savings</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Recommended Tools</h3>
                  {recommendations.tools.map((tool: any, index: number) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                                {tool.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-semibold">{tool.name}</h4>
                                <p className="text-sm text-slate-600">{tool.reason}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="mb-1">
                                {tool.match}% match
                              </Badge>
                              <div className="text-sm font-semibold">
                                ${tool.monthlyPrice}/mo
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-4 justify-center pt-6">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get My Stack
                  </Button>
                  <Button variant="outline" size="lg">
                    Customize Further
                  </Button>
                  <Button variant="outline" size="lg">
                    Take Quiz Again
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-600">
            Question {currentQuestion + 1} of {quizQuestions.length}
          </span>
          <span className="text-sm font-medium text-slate-600">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{question.title}</CardTitle>
              <CardDescription className="text-lg">
                {question.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {question.type === "single" && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => handleSingleAnswer(question.id, value)}
                  className="space-y-3"
                >
                  {question.options?.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-slate-600 mt-1">
                            {option.description}
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "multiple" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options?.map((option) => (
                    <div key={option.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                      <Checkbox
                        id={option.id}
                        checked={(answers[question.id] || []).includes(option.id)}
                        onCheckedChange={(checked) => handleMultipleAnswer(question.id, option.id, !!checked)}
                      />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-slate-600 mt-1">
                            {option.description}
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "slider" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-blue-600">
                      {question.unit}{answers[question.id] || question.min || 0}
                    </span>
                    <span className="text-slate-600">/{question.unit}{question.max}</span>
                  </div>
                  <Slider
                    value={[answers[question.id] || question.min || 0]}
                    onValueChange={(value) => handleSliderAnswer(question.id, value)}
                    max={question.max}
                    min={question.min}
                    step={question.step}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{question.unit}{question.min}</span>
                    <span>{question.unit}{question.max}+</span>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!answers[question.id] || 
                    (question.type === "multiple" && (!answers[question.id] || answers[question.id].length === 0))}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {currentQuestion === quizQuestions.length - 1 ? "Get Results" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}