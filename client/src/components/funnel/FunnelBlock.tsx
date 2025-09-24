import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface FunnelBlockProps {
  block: {
    id: number;
    type: string;
    name: string;
    config: any;
    content: any;
  };
  onInteraction: (interaction: any) => void;
  onComplete: (result: any) => void;
}

export default function FunnelBlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const renderBlockContent = () => {
    switch (block.type) {
      case 'quiz':
        return <QuizBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
      case 'calculator':
        return <CalculatorBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
      case 'content':
        return <ContentBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
      case 'cta':
        return <CTABlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
      case 'form':
        return <FormBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
      case 'game':
        return <GameBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
      default:
        return <DefaultBlock block={block} onInteraction={onInteraction} onComplete={onComplete} />;
    }
  };

  return (
    <div className="funnel-block max-w-2xl mx-auto">
      {renderBlockContent()}
    </div>
  );
}

// Quiz Block Component
function QuizBlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = React.useState(false);

  const questions = block.content?.questions || [
    {
      id: 1,
      question: "What's your primary financial goal?",
      options: ["Save for retirement", "Buy a house", "Pay off debt", "Build emergency fund"]
    },
    {
      id: 2,
      question: "What's your current age range?",
      options: ["18-25", "26-35", "36-45", "46-55", "55+"]
    }
  ];

  const handleAnswer = (questionId: number, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    onInteraction({
      type: 'quiz_answer',
      questionId,
      answer,
      progress: ((currentQuestion + 1) / questions.length) * 100
    });

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      setIsCompleted(true);
      const result = calculateQuizResult(newAnswers);
      onComplete(result);
    }
  };

  const calculateQuizResult = (answers: Record<number, string>) => {
    // Simple archetype calculation
    const archetypes = {
      'conservative': 0,
      'balanced': 0,
      'aggressive': 0
    };

    // Calculate based on answers
    Object.values(answers).forEach(answer => {
      if (answer.includes('retirement') || answer.includes('emergency')) {
        archetypes.conservative++;
      } else if (answer.includes('house') || answer.includes('debt')) {
        archetypes.balanced++;
      } else {
        archetypes.aggressive++;
      }
    });

    const topArchetype = Object.entries(archetypes).reduce((a, b) => 
      archetypes[a[0] as keyof typeof archetypes] > archetypes[b[0] as keyof typeof archetypes] ? a : b
    )[0];

    return {
      archetype: topArchetype,
      score: Math.max(...Object.values(archetypes)) * 20,
      answers
    };
  };

  if (isCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-green-600">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg mb-4">Thank you for completing the quiz.</p>
          <Badge variant="default" className="text-lg px-4 py-2">
            Results calculated successfully
          </Badge>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.name}</CardTitle>
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-gray-600">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-medium mb-4">{question.question}</h3>
        <div className="space-y-3">
          {question.options.map((option: string, index: number) => (
            <Button
              key={index}
              variant="outline"
              className="w-full text-left justify-start p-4 h-auto"
              onClick={() => handleAnswer(question.id, option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Calculator Block Component
function CalculatorBlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const [inputs, setInputs] = React.useState<Record<string, number>>({
    age: 30,
    income: 50000,
    savings: 10000
  });
  const [result, setResult] = React.useState<number | null>(null);

  const calculateResult = () => {
    // Simple retirement calculation
    const yearsToRetirement = 65 - inputs.age;
    const annualSavings = inputs.income * 0.1; // 10% savings rate
    const futureValue = (inputs.savings + annualSavings) * Math.pow(1.07, yearsToRetirement);
    
    setResult(futureValue);
    
    onInteraction({
      type: 'calculator_use',
      inputs,
      result: futureValue
    });

    onComplete({
      type: 'calculation_completed',
      inputs,
      result: futureValue,
      insights: [
        `You'll have approximately $${futureValue.toLocaleString()} by retirement`,
        `This assumes a 7% annual return and 10% savings rate`
      ]
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="age">Current Age</Label>
          <Input
            id="age"
            type="number"
            value={inputs.age}
            onChange={(e) => setInputs(prev => ({ ...prev, age: parseInt(e.target.value) }))}
          />
        </div>
        
        <div>
          <Label htmlFor="income">Annual Income ($)</Label>
          <Input
            id="income"
            type="number"
            value={inputs.income}
            onChange={(e) => setInputs(prev => ({ ...prev, income: parseInt(e.target.value) }))}
          />
        </div>
        
        <div>
          <Label htmlFor="savings">Current Savings ($)</Label>
          <Input
            id="savings"
            type="number"
            value={inputs.savings}
            onChange={(e) => setInputs(prev => ({ ...prev, savings: parseInt(e.target.value) }))}
          />
        </div>

        <Button onClick={calculateResult} className="w-full">
          Calculate
        </Button>

        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Your Retirement Projection
            </h4>
            <p className="text-2xl font-bold text-green-600">
              ${result.toLocaleString()}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Based on current savings and 10% annual contributions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Content Block Component
function ContentBlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const [timeSpent, setTimeSpent] = React.useState(0);
  const [hasScrolled, setHasScrolled] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    const handleScroll = () => {
      if (!hasScrolled) {
        setHasScrolled(true);
        onInteraction({
          type: 'content_scroll',
          timeSpent,
          scrolled: true
        });
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasScrolled, timeSpent, onInteraction]);

  const handleContinue = () => {
    onComplete({
      type: 'content_read',
      timeSpent,
      scrolled: hasScrolled,
      engagement: timeSpent > 10 ? 'high' : 'low'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose dark:prose-invert">
          <p>
            {block.content.text || "This is personalized content based on your previous responses. We've analyzed your profile and created recommendations specifically for you."}
          </p>
          <p>
            Understanding your financial goals is crucial for building wealth. Based on your quiz responses, we recommend focusing on long-term investment strategies that align with your risk tolerance.
          </p>
          <ul>
            <li>Start with a diversified portfolio</li>
            <li>Automate your savings</li>
            <li>Review and rebalance quarterly</li>
            <li>Stay focused on long-term goals</li>
          </ul>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Time reading: {timeSpent}s</span>
          <span>{hasScrolled ? '📖 Scrolled' : '👀 Reading'}</span>
        </div>

        <Button onClick={handleContinue} className="w-full">
          Continue to Next Step
        </Button>
      </CardContent>
    </Card>
  );
}

// CTA Block Component
function CTABlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const handleClick = (ctaType: string) => {
    onInteraction({
      type: 'cta_click',
      ctaType,
      timestamp: Date.now()
    });

    onComplete({
      type: 'cta_clicked',
      ctaType,
      conversion: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{block.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-lg">
          {block.content.headline || "Ready to take the next step?"}
        </p>
        <p className="text-gray-600">
          {block.content.description || "Join thousands of others who have transformed their financial future."}
        </p>
        
        <div className="space-y-3">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => handleClick('primary')}
          >
            Get Started Now
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={() => handleClick('secondary')}
          >
            Learn More
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          No spam, unsubscribe at any time
        </p>
      </CardContent>
    </Card>
  );
}

// Form Block Component
function FormBlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const [formData, setFormData] = React.useState({
    email: '',
    name: '',
    phone: ''
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onInteraction({
        type: 'form_validation_error',
        errors
      });
      return;
    }

    onInteraction({
      type: 'form_submit',
      formData
    });

    onComplete({
      type: 'lead_captured',
      formData,
      leadScore: calculateLeadScore(formData)
    });
  };

  const calculateLeadScore = (data: any) => {
    let score = 50; // Base score
    if (data.email) score += 20;
    if (data.name) score += 15;
    if (data.phone) score += 15;
    return Math.min(100, score);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Game Block Component
function GameBlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const [gameState, setGameState] = React.useState({
    level: 1,
    score: 0,
    attempts: 0,
    completed: false
  });

  const [currentChallenge, setCurrentChallenge] = React.useState(0);
  
  const challenges = [
    { question: "What's 15% of $1,000?", answer: "150", type: "math" },
    { question: "How many years to double money at 7% return?", answer: "10", type: "finance" },
    { question: "What's the safe withdrawal rate?", answer: "4", type: "finance" }
  ];

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === challenges[currentChallenge].answer;
    const newScore = isCorrect ? gameState.score + 100 : gameState.score;
    const newAttempts = gameState.attempts + 1;

    setGameState(prev => ({
      ...prev,
      score: newScore,
      attempts: newAttempts
    }));

    onInteraction({
      type: 'game_answer',
      challengeId: currentChallenge,
      answer,
      isCorrect,
      score: newScore
    });

    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
    } else {
      // Game completed
      setGameState(prev => ({ ...prev, completed: true }));
      onComplete({
        type: 'game_completed',
        finalScore: newScore,
        attempts: newAttempts,
        accuracy: (newScore / (challenges.length * 100)) * 100
      });
    }
  };

  if (gameState.completed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🎉 Game Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-3xl font-bold text-green-600">
            {gameState.score} points
          </div>
          <p>You answered {gameState.score / 100} out of {challenges.length} correctly!</p>
          <Badge variant="default">Financial Ninja Level Achieved!</Badge>
        </CardContent>
      </Card>
    );
  }

  const challenge = challenges[currentChallenge];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.name}</CardTitle>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Challenge {currentChallenge + 1}/{challenges.length}</span>
          <span>Score: {gameState.score}</span>
        </div>
        <Progress value={((currentChallenge + 1) / challenges.length) * 100} />
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-medium">{challenge.question}</h3>
        <Input
          placeholder="Enter your answer"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAnswer((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <p className="text-sm text-gray-600">Press Enter to submit your answer</p>
      </CardContent>
    </Card>
  );
}

// Default Block Component
function DefaultBlock({ block, onInteraction, onComplete }: FunnelBlockProps) {
  const handleContinue = () => {
    onInteraction({
      type: 'block_view',
      blockType: block.type
    });

    onComplete({
      type: 'block_completed',
      blockType: block.type
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p>This is a {block.type} block.</p>
        <p>Block-specific implementation coming soon.</p>
        <Button onClick={handleContinue}>Continue</Button>
      </CardContent>
    </Card>
  );
}