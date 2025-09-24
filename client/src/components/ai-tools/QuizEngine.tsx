import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Brain, Target, Rocket, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'slider' | 'checkbox' | 'text';
  options?: Array<{
    text: string;
    value: any;
    archetypes: string[];
    categories: string[];
  }>;
  weight: number;
}

interface QuizEngineProps {
  onComplete: (results: any) => void;
  currentArchetype?: string | null;
}

export function QuizEngine({ onComplete, currentArchetype }: QuizEngineProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Fetch quiz data
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['/api/ai-tools/quiz'],
  });

  // Submit quiz results
  const submitQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      return apiRequest('/api/ai-tools/quiz/results', {
        method: 'POST',
        body: quizData
      });
    },
    onSuccess: (data) => {
      setResults(data);
      setIsCompleted(true);
      onComplete(data);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalization quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Quiz not available at the moment</p>
      </div>
    );
  }

  const questions: QuizQuestion[] = quiz.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Submit quiz
      submitQuizMutation.mutate({
        quizId: quiz.id,
        answers,
        sessionId: crypto.randomUUID()
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isCurrentQuestionAnswered = () => {
    return answers[currentQuestion.id] !== undefined;
  };

  if (isCompleted && results) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Your AI Tool Personality</h2>
          <p className="text-gray-600">Based on your responses, here's what we discovered about you:</p>
        </div>

        <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Target className="w-8 h-8 text-purple-600" />
              {results.primaryArchetype}
            </CardTitle>
            {results.secondaryArchetype && (
              <CardDescription className="text-center text-lg">
                Secondary: {results.secondaryArchetype}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Your Tool Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {results.recommendedCategories?.map((category: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-white">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {results.recommendedTools && results.recommendedTools.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Top Recommended Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {results.recommendedTools.slice(0, 6).map((tool: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <Rocket className="w-4 h-4 text-blue-500" />
                        <span>{tool.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Archetype Scores</h3>
                <div className="space-y-2">
                  {Object.entries(results.archetypeScores || {}).map(([archetype, score]: [string, any]) => (
                    <div key={archetype} className="flex items-center gap-3">
                      <span className="text-sm w-24 font-medium">{archetype}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(score / 100) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{Math.round(score)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => {
              setIsCompleted(false);
              setCurrentQuestionIndex(0);
              setAnswers({});
              setResults(null);
            }}
            variant="outline"
            className="mr-4"
          >
            Retake Quiz
          </Button>
          <Button onClick={() => onComplete(results)}>
            Explore Recommended Tools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'multiple_choice' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'checkbox' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`checkbox-${index}`}
                    checked={(answers[currentQuestion.id] || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentAnswers = answers[currentQuestion.id] || [];
                      if (checked) {
                        handleAnswer(currentQuestion.id, [...currentAnswers, option.value]);
                      } else {
                        handleAnswer(currentQuestion.id, currentAnswers.filter((v: any) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`checkbox-${index}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'slider' && (
            <div className="space-y-4">
              <div className="px-4">
                <Slider
                  value={[answers[currentQuestion.id] || 50]}
                  onValueChange={([value]) => handleAnswer(currentQuestion.id, value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Low</span>
                <span className="font-medium">
                  Value: {answers[currentQuestion.id] || 50}
                </span>
                <span>High</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < currentQuestionIndex ? 'bg-green-500' :
                index === currentQuestionIndex ? 'bg-blue-500' :
                'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={!isCurrentQuestionAnswered() || submitQuizMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {currentQuestionIndex === questions.length - 1 ? 
            (submitQuizMutation.isPending ? 'Analyzing...' : 'Get Results') : 
            'Next'
          }
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center mt-6 text-sm text-gray-500">
        <p>This quiz helps us understand your workflow and recommend the best AI tools for your needs.</p>
      </div>
    </div>
  );
}