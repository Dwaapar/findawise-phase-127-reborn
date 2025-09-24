import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Timer, Trophy, Star, BookOpen, Brain } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'boolean';
  options: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
  category?: string;
}

interface Quiz {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  quizType: string;
  questions: QuizQuestion[];
  scoringLogic: any;
  resultMappings: any;
  estimatedTime: number;
  xpReward: number;
  passingScore: number;
  retakeAllowed: boolean;
}

interface QuizEngineProps {
  quizSlug?: string;
  onComplete?: (result: any) => void;
  showResults?: boolean;
  embedded?: boolean;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  quizSlug,
  onComplete,
  showResults = true,
  embedded = false
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quiz data
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['/api/education/quizzes', quizSlug],
    enabled: !!quizSlug,
  });

  // Submit quiz results
  const submitQuizMutation = useMutation({
    mutationFn: async (resultData: any) => {
      return apiRequest('/api/education/quiz-results', {
        method: 'POST',
        body: resultData,
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Quiz Completed!",
        description: `You scored ${result.percentage}% and earned ${result.xpEarned} XP!`,
      });
      
      // Track analytics
      trackQuizCompletion(result);
      
      if (onComplete) {
        onComplete(result);
      }
      
      // Invalidate queries to update progress
      queryClient.invalidateQueries({ queryKey: ['/api/education/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/education/gamification'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit quiz results. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Track analytics events
  const trackQuizCompletion = (result: any) => {
    apiRequest('/api/analytics/events/batch', {
      method: 'POST',
      body: {
        events: [{
          eventType: 'quiz_completed',
          eventData: {
            quizId: quiz?.id,
            quizSlug: quiz?.slug,
            score: result.score,
            percentage: result.percentage,
            timeSpent: result.timeToComplete,
            xpEarned: result.xpEarned,
            passed: result.isPassed,
          },
          pageSlug: `quiz-${quiz?.slug}`,
        }]
      }
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading quiz...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz not found</h3>
            <p className="text-gray-600">The requested quiz could not be loaded.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleQuizComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleQuizComplete = () => {
    const totalScore = calculateScore();
    const percentage = Math.round((totalScore / getTotalPoints()) * 100);
    const timeToComplete = Math.floor((Date.now() - startTime) / 1000);
    const isPassed = percentage >= quiz.passingScore;
    
    const resultData = {
      quizId: quiz.id,
      answers,
      score: totalScore,
      percentage,
      timeToComplete,
      isPassed,
      xpEarned: isPassed ? quiz.xpReward : Math.floor(quiz.xpReward * 0.5),
      archetypeResult: determineArchetype(answers),
      recommendations: generateRecommendations(percentage, answers),
    };

    submitQuizMutation.mutate(resultData);
    setIsCompleted(true);
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (question.type === 'single' && userAnswer === question.correctAnswer) {
        score += question.points;
      } else if (question.type === 'multiple' && Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
        const correctCount = userAnswer.filter(ans => question.correctAnswer?.includes(ans)).length;
        const incorrectCount = userAnswer.filter(ans => !question.correctAnswer?.includes(ans)).length;
        if (correctCount > 0 && incorrectCount === 0) {
          score += question.points;
        } else if (correctCount > 0) {
          score += Math.floor(question.points * (correctCount / (question.correctAnswer?.length || 1)));
        }
      } else if (question.type === 'boolean' && userAnswer === question.correctAnswer) {
        score += question.points;
      }
    });
    return score;
  };

  const getTotalPoints = () => {
    return quiz.questions.reduce((total, question) => total + question.points, 0);
  };

  const determineArchetype = (answers: Record<string, any>) => {
    // Simple archetype determination based on quiz responses
    const categories = quiz.questions.reduce((acc: Record<string, number>, question) => {
      if (question.category) {
        acc[question.category] = (acc[question.category] || 0) + 1;
      }
      return acc;
    }, {});

    const dominantCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0];
    return dominantCategory ? dominantCategory[0] : 'general';
  };

  const generateRecommendations = (percentage: number, answers: Record<string, any>) => {
    const recommendations = [];
    
    if (percentage >= 90) {
      recommendations.push({
        type: 'advanced',
        title: 'Excellent Performance!',
        description: 'Consider taking advanced courses in this topic',
        action: 'Browse Advanced Courses'
      });
    } else if (percentage >= 70) {
      recommendations.push({
        type: 'intermediate',
        title: 'Good Knowledge Base',
        description: 'Focus on areas where you missed questions',
        action: 'Review Weak Areas'
      });
    } else {
      recommendations.push({
        type: 'beginner',
        title: 'Room for Improvement',
        description: 'Start with fundamental courses in this topic',
        action: 'Take Beginner Course'
      });
    }

    return recommendations;
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">{currentQuestion.question}</h3>
          {currentQuestion.category && (
            <Badge variant="secondary" className="mb-4">
              {currentQuestion.category}
            </Badge>
          )}
        </div>

        {currentQuestion.type === 'single' && (
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.type === 'multiple' && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`multi-option-${index}`}
                  checked={(answers[currentQuestion.id] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentAnswers = answers[currentQuestion.id] || [];
                    if (checked) {
                      handleAnswerChange(currentQuestion.id, [...currentAnswers, option]);
                    } else {
                      handleAnswerChange(currentQuestion.id, currentAnswers.filter((ans: string) => ans !== option));
                    }
                  }}
                />
                <Label htmlFor={`multi-option-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}

        {currentQuestion.type === 'boolean' && (
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value === 'true')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        )}

        {showExplanation && currentQuestion.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Explanation:</h4>
            <p className="text-blue-700 dark:text-blue-300">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  if (isCompleted && showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / getTotalPoints()) * 100);
    const isPassed = percentage >= quiz.passingScore;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            {isPassed ? (
              <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isPassed ? 'Congratulations!' : 'Good Effort!'}
          </CardTitle>
          <CardDescription>
            You scored {percentage}% on "{quiz.title}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Points Earned</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{percentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {isPassed ? quiz.xpReward : Math.floor(quiz.xpReward * 0.5)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">XP Earned</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Time Taken</div>
            <div className="text-lg font-semibold">{formatTime(timeElapsed)}</div>
          </div>

          {quiz.retakeAllowed && !isPassed && (
            <div className="text-center">
              <Button 
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setIsCompleted(false);
                  setStartTime(Date.now());
                  setTimeElapsed(0);
                }}
                variant="outline"
              >
                Retake Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${embedded ? '' : 'max-w-4xl mx-auto'}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{quiz.title}</CardTitle>
            <CardDescription>{quiz.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Timer className="h-4 w-4" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
            <Badge variant="outline">
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>

      <CardContent className="space-y-6">
        {renderQuestion()}

        <div className="flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            {currentQuestion?.explanation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <Brain className="h-4 w-4 mr-1" />
                {showExplanation ? 'Hide' : 'Show'} Explanation
              </Button>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion?.id]}
            className={isLastQuestion ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isLastQuestion ? 'Complete Quiz' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};