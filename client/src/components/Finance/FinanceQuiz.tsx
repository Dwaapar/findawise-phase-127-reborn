import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, CheckCircle, Target, TrendingUp, Shield, Clock, Award } from 'lucide-react';
import { financeQuizzes, financePersonas } from '@/config/financeConfig';
import { useAnalytics } from '@/hooks/useAnalytics';

interface FinanceQuizProps {
  quizId?: string;
  onComplete?: (result: any) => void;
}

export default function FinanceQuiz({ quizId = 'money-persona', onComplete }: FinanceQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const { trackEvent, sessionId } = useAnalytics();

  const quiz = financeQuizzes.find(q => q.id === quizId) || financeQuizzes[0];
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const canProceed = currentQuestion.required ? answers[currentQuestion.id] !== undefined : true;

  useEffect(() => {
    trackEvent({
      eventType: 'quiz_started',
      eventData: { 
        quizId: quiz.id,
        quizTitle: quiz.title 
      }
    });
  }, [quiz.id]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    trackEvent({
      eventType: 'quiz_answer',
      eventData: { 
        quizId: quiz.id,
        questionId,
        questionIndex: currentQuestionIndex,
        answer: value
      }
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const completionTime = Math.round((Date.now() - startTime) / 1000);

    try {
      // First assess the persona
      const assessmentResponse = await fetch('/api/finance/assess-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!assessmentResponse.ok) {
        throw new Error('Failed to assess persona');
      }

      const assessment = await assessmentResponse.json();

      // Save quiz result
      const quizResultResponse = await fetch('/api/finance/quiz-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          quizType: quiz.id,
          answers,
          completionTime
        }),
      });

      if (!quizResultResponse.ok) {
        throw new Error('Failed to save quiz result');
      }

      const quizResult = await quizResultResponse.json();
      
      const finalResult = {
        ...assessment.data,
        completionTime,
        quizResult: quizResult.data
      };

      setResult(finalResult);

      trackEvent({
        eventType: 'quiz_completed',
        eventData: { 
          quizId: quiz.id,
          persona: finalResult.persona,
          confidence: finalResult.confidence,
          completionTime
        }
      });

      if (onComplete) {
        onComplete(finalResult);
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return <QuizResult result={result} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-600 mt-2">{quiz.description}</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {quiz.estimatedTime}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {currentQuestion.question}
          </CardTitle>
          {currentQuestion.helpText && (
            <p className="text-sm text-gray-600">{currentQuestion.helpText}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.type === 'single-choice' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'multiple-choice' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id={option.value}
                    checked={(answers[currentQuestion.id] || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentAnswers = answers[currentQuestion.id] || [];
                      const newAnswers = checked
                        ? [...currentAnswers, option.value]
                        : currentAnswers.filter((a: string) => a !== option.value);
                      handleAnswerChange(currentQuestion.id, newAnswers);
                    }}
                  />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Strongly Disagree</span>
                <span>Neutral</span>
                <span>Strongly Agree</span>
              </div>
              <div className="flex justify-center">
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="flex space-x-4"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center space-y-2">
                      <RadioGroupItem value={value.toString()} id={value.toString()} />
                      <Label htmlFor={value.toString()} className="text-sm font-medium">
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                'Processing...'
              ) : isLastQuestion ? (
                <>
                  Complete Quiz
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuizResult({ result }: { result: any }) {
  const persona = financePersonas.find(p => p.id === result.persona);
  
  if (!persona) {
    return <div>Error: Persona not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 mx-auto mb-4 flex items-center justify-center">
          <Award className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
        <p className="text-xl text-gray-600">Here's your personalized financial profile</p>
      </div>

      <Card className="bg-gradient-to-br from-white to-gray-50 shadow-xl border-0 mb-8" style={{ backgroundColor: persona.colors.background }}>
        <CardHeader className="text-center pb-4">
          <div className="space-y-2">
            <Badge className="px-4 py-2 text-lg" style={{ backgroundColor: persona.colors.primary, color: 'white' }}>
              Your Money Persona
            </Badge>
            <CardTitle className="text-3xl font-bold" style={{ color: persona.colors.primary }}>
              {persona.name}
            </CardTitle>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-semibold">Confidence Score:</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {result.confidence}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
              {persona.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: persona.colors.primary }} />
                Primary Concerns
              </h3>
              <div className="space-y-2">
                {persona.primaryConcerns.map((concern) => (
                  <div key={concern} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="capitalize">{concern.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: persona.colors.primary }} />
                Recommended Products
              </h3>
              <div className="space-y-2">
                {persona.recommendedProducts.map((product) => (
                  <div key={product} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="capitalize">{product.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: persona.colors.primary }} />
              Your Financial Profile
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Budget Range</div>
                <div className="font-semibold">{persona.budgetRange}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Risk Tolerance</div>
                <div className="font-semibold capitalize">{persona.riskTolerance.replace('-', ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time Horizon</div>
                <div className="font-semibold capitalize">{persona.timeHorizon.replace('-', ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Urgency Level</div>
                <div className="font-semibold capitalize">{persona.urgencyLevel}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Your Personalized Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Immediate Next Steps</h3>
              <div className="space-y-2">
                {result.recommendations.slice(0, 4).map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recommended Tools</h3>
              <div className="space-y-3">
                {result.matchedProducts.slice(0, 3).map((product: any, index: number) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors">
                    <div className="font-medium text-gray-900">{product.productName || product.name}</div>
                    <div className="text-sm text-gray-600">{product.providerName || 'Financial Product'}</div>
                    <Badge variant="outline" className="mt-1">
                      {product.category || product.productType || 'Financial Tool'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Start Your Budget Calculator
            </Button>
            <Button variant="outline" className="flex-1">
              View Personalized Content
            </Button>
            <Button variant="outline" className="flex-1">
              Get Product Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completion Stats */}
      <div className="mt-8 text-center text-gray-600">
        <p>Quiz completed in {Math.round(result.completionTime / 60)} minutes • Results saved to your profile</p>
      </div>
    </div>
  );
}