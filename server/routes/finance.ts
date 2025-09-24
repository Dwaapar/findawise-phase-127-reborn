import { Request, Response } from 'express';
import { PersonalFinanceEngine } from '../services/finance/financeEngine';
import { z } from 'zod';

const financeEngine = new PersonalFinanceEngine();

// Initialize sample data on first load
financeEngine.initializeSampleData().catch(console.error);

// Validation schemas
const budgetCalculatorSchema = z.object({
  income: z.number().min(0),
  fixedExpenses: z.number().min(0),
  goals: z.array(z.string()),
  persona: z.string()
});

const fireCalculatorSchema = z.object({
  currentAge: z.number().min(18).max(100),
  currentSavings: z.number().min(0),
  monthlyInvestment: z.number().min(0),
  targetRetirementAge: z.number().min(30).max(100),
  expectedReturn: z.number().min(0).max(1).optional()
});

const compoundInterestSchema = z.object({
  principal: z.number().min(0),
  monthlyContribution: z.number().min(0),
  annualRate: z.number().min(0).max(1),
  years: z.number().min(1).max(50)
});

const financeQuizSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  quizType: z.string(),
  answers: z.record(z.any()),
  completionTime: z.number().optional()
});

const financeProfileSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  persona: z.string(),
  goals: z.array(z.string()),
  riskTolerance: z.string().optional(),
  currentIncome: z.number().optional(),
  currentSavings: z.number().optional(),
  currentDebt: z.number().optional(),
  age: z.number().optional(),
  dependents: z.number().optional(),
  financialExperience: z.string().optional()
});

export function registerFinanceRoutes(app: any) {
  
  // Budget Calculator
  app.post('/api/finance/calculate-budget', async (req: Request, res: Response) => {
    try {
      const data = budgetCalculatorSchema.parse(req.body);
      const recommendations = await financeEngine.calculatePersonalizedBudget(
        data.income,
        data.fixedExpenses,
        data.goals,
        data.persona
      );
      res.json({ success: true, data: recommendations });
    } catch (error) {
      console.error('Budget calculation error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : 'Invalid input data' 
      });
    }
  });

  // FIRE Calculator
  app.post('/api/finance/calculate-fire', async (req: Request, res: Response) => {
    try {
      const data = fireCalculatorSchema.parse(req.body);
      const fireProjection = await financeEngine.calculateFIRENumbers(
        data.currentAge,
        data.currentSavings,
        data.monthlyInvestment,
        data.targetRetirementAge,
        data.expectedReturn
      );
      res.json({ success: true, data: fireProjection });
    } catch (error) {
      console.error('FIRE calculation error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : 'Invalid input data' 
      });
    }
  });

  // Compound Interest Calculator
  app.post('/api/finance/calculate-compound-interest', async (req: Request, res: Response) => {
    try {
      const data = compoundInterestSchema.parse(req.body);
      const projection = await financeEngine.calculateCompoundInterest(
        data.principal,
        data.monthlyContribution,
        data.annualRate,
        data.years
      );
      res.json({ success: true, data: projection });
    } catch (error) {
      console.error('Compound interest calculation error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : 'Invalid input data' 
      });
    }
  });

  // Financial Persona Assessment
  app.post('/api/finance/assess-persona', async (req: Request, res: Response) => {
    try {
      const { answers } = req.body;
      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid answers format' });
      }

      const assessment = await financeEngine.assessFinancialPersona(answers);
      res.json({ success: true, data: assessment });
    } catch (error) {
      console.error('Persona assessment error:', error);
      res.status(500).json({ success: false, error: 'Assessment failed' });
    }
  });

  // Save Quiz Result
  app.post('/api/finance/quiz-result', async (req: Request, res: Response) => {
    try {
      const data = financeQuizSchema.parse(req.body);
      
      // First assess the persona from the answers
      const assessment = await financeEngine.assessFinancialPersona(data.answers);
      
      // Prepare quiz result data
      const quizResultData = {
        sessionId: data.sessionId,
        userId: data.userId,
        quizType: data.quizType,
        answers: data.answers,
        calculatedPersona: assessment.persona,
        score: assessment.confidence,
        recommendations: assessment.recommendations,
        productMatches: assessment.matchedProducts,
        completionTime: data.completionTime,
        timestamp: new Date()
      };

      const result = await financeEngine.saveQuizResult(quizResultData);
      res.json({ success: true, data: { result, assessment } });
    } catch (error) {
      console.error('Quiz result save error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : 'Failed to save quiz result' 
      });
    }
  });

  // Save Financial Profile
  app.post('/api/finance/profile', async (req: Request, res: Response) => {
    try {
      const data = financeProfileSchema.parse(req.body);
      const profile = await financeEngine.saveFinanceProfile(data);
      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('Profile save error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : 'Failed to save profile' 
      });
    }
  });

  // Get Personalized Content
  app.get('/api/finance/content/:persona', async (req: Request, res: Response) => {
    try {
      const { persona } = req.params;
      const { category, limit } = req.query;
      
      const content = await financeEngine.getPersonalizedContent(
        persona,
        category as string,
        limit ? parseInt(limit as string) : 10
      );
      
      res.json({ success: true, data: content });
    } catch (error) {
      console.error('Content retrieval error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve content' });
    }
  });

  // Get Product Offers for Persona
  app.get('/api/finance/offers/:persona', async (req: Request, res: Response) => {
    try {
      const { persona } = req.params;
      const { productType } = req.query;
      
      const offers = await financeEngine.getProductOffersForPersona(
        persona,
        productType as string
      );
      
      res.json({ success: true, data: offers });
    } catch (error) {
      console.error('Offers retrieval error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve offers' });
    }
  });

  // Finance Overview/Dashboard Data
  app.get('/api/finance/overview', async (req: Request, res: Response) => {
    try {
      // This would typically aggregate data from various tables
      const overview = {
        totalUsers: Math.floor(Math.random() * 1000) + 500,
        quizCompletions: Math.floor(Math.random() * 200) + 100,
        calculatorUsage: Math.floor(Math.random() * 300) + 150,
        topPersonas: [
          { persona: 'young-investor', percentage: 32 },
          { persona: 'broke-student', percentage: 28 },
          { persona: 'fire-seeker', percentage: 18 },
          { persona: 'anxious-debtor', percentage: 22 }
        ],
        topCalculators: [
          { name: 'Budget Calculator', usage: 156 },
          { name: 'Compound Interest', usage: 134 },
          { name: 'FIRE Calculator', usage: 98 },
          { name: 'Debt Payoff', usage: 87 }
        ],
        recentActivity: [
          { action: 'Quiz completed', persona: 'young-investor', timestamp: new Date() },
          { action: 'Budget calculated', persona: 'broke-student', timestamp: new Date() },
          { action: 'FIRE projection', persona: 'fire-seeker', timestamp: new Date() }
        ]
      };
      
      res.json({ success: true, data: overview });
    } catch (error) {
      console.error('Overview retrieval error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve overview' });
    }
  });

  // Health check endpoint for the finance neuron
  app.get('/api/finance/health', async (req: Request, res: Response) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        version: '1.0.0',
        features: [
          'budget-calculator',
          'fire-calculator', 
          'compound-interest-calculator',
          'persona-assessment',
          'product-recommendations',
          'personalized-content',
          'gamification',
          'ai-financial-advisor'
        ],
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
      
      res.json({ success: true, data: health });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ success: false, error: 'Health check failed' });
    }
  });

  console.log('✅ Finance API routes registered successfully');
}