import { Request, Response } from 'express';
import { storage } from '../storage';
import { securityEngine } from '../services/homeSecurity/securityEngine';
import { neuronOS } from '../services/federation/neuronOS';
import { z } from 'zod';

const homeProfileSchema = z.object({
  homeType: z.enum(['apartment', 'house', 'condo', 'townhouse']),
  ownership: z.enum(['rent', 'own']),
  homeSize: z.enum(['small', 'medium', 'large']),
  locationArea: z.enum(['urban', 'suburban', 'rural']),
  crimeRate: z.enum(['low', 'medium', 'high']),
  region: z.string(),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(10),
  elderly: z.number().min(0).max(10),
  pets: z.boolean(),
  currentSecurity: z.array(z.string()),
  budget: z.enum(['under-200', '200-500', '500-1000', '1000-2000', 'over-2000']),
  primaryConcerns: z.array(z.string()),
  techComfort: z.enum(['low', 'medium', 'high']),
  timeAtHome: z.enum(['rarely', 'sometimes', 'often', 'always']),
  previousIncident: z.boolean(),
  neighborhoodWatch: z.boolean()
});

export function registerSecurityRoutes(app: any) {
  
  // Security Assessment Endpoint
  app.post('/api/security/assess', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      
      // Validate input
      const validatedData = homeProfileSchema.parse(req.body);
      
      // Convert to internal format
      const homeProfile = {
        type: validatedData.homeType,
        ownership: validatedData.ownership,
        size: validatedData.homeSize,
        location: {
          area: validatedData.locationArea,
          crimeRate: validatedData.crimeRate,
          region: validatedData.region
        },
        residents: {
          adults: validatedData.adults,
          children: validatedData.children,
          elderly: validatedData.elderly,
          pets: validatedData.pets
        },
        currentSecurity: validatedData.currentSecurity,
        budget: validatedData.budget,
        primaryConcerns: validatedData.primaryConcerns,
        techComfort: validatedData.techComfort
      };

      // Run security assessment
      const assessment = await securityEngine.assessHomeSecurity(homeProfile, sessionId);

      // Track assessment completion
      await neuronOS.reportAnalytics('security_assessment_completed', {
        sessionId,
        assessment: {
          score: assessment.overallScore,
          riskLevel: assessment.riskLevel,
          persona: assessment.persona.type,
          vulnerabilityCount: assessment.vulnerabilities.length
        },
        homeProfile: validatedData,
        pageUrl: '/security-quiz',
        eventName: 'assessment_completed'
      });

      // Store quiz result
      await storage.createQuizResult({
        sessionId,
        quizId: 'home-security-assessment',
        answers: validatedData,
        score: assessment.overallScore,
        result: JSON.stringify(assessment),
        userId: sessionId
      });

      res.json({
        success: true,
        assessment
      });

    } catch (error) {
      console.error('Security assessment failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete security assessment'
      });
    }
  });

  // Security Metrics Dashboard
  app.get('/api/security/metrics', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Get all security assessments
      const assessments = await storage.getQuizResults('home-security-assessment', start, end);
      
      const totalAssessments = assessments.length;
      const averageSecurityScore = assessments.length > 0 
        ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)
        : 0;
      
      const highRiskUsers = assessments.filter(a => a.score < 40).length;
      
      // Calculate conversion rate (users who completed assessment)
      const totalSessions = await storage.getUniqueSessions(start, end);
      const conversionRate = totalSessions > 0 ? ((totalAssessments / totalSessions) * 100).toFixed(1) : '0';

      // Top personas analysis
      const personaMap = new Map();
      assessments.forEach(assessment => {
        try {
          const result = JSON.parse(assessment.result);
          const personaType = result.persona?.type || 'Unknown';
          const existing = personaMap.get(personaType) || { count: 0, totalScore: 0 };
          personaMap.set(personaType, {
            count: existing.count + 1,
            totalScore: existing.totalScore + assessment.score
          });
        } catch (e) {
          // Skip invalid results
        }
      });

      const topPersonas = Array.from(personaMap.entries()).map(([persona, data]) => ({
        persona,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count)
      })).sort((a, b) => b.count - a.count);

      // Vulnerability trends (mock data for now)
      const vulnerabilityTrends = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          critical: Math.floor(Math.random() * 5),
          high: Math.floor(Math.random() * 10) + 5,
          medium: Math.floor(Math.random() * 15) + 10,
          low: Math.floor(Math.random() * 20) + 15
        };
      });

      // Product recommendations performance
      const productRecommendations = [
        { product: 'Ring Video Doorbell', recommendations: 45, conversions: 12, revenue: 1200 },
        { product: 'SimpliSafe System', recommendations: 38, conversions: 15, revenue: 2250 },
        { product: 'Arlo Pro 4', recommendations: 32, conversions: 8, revenue: 1600 },
        { product: 'August Smart Lock', recommendations: 28, conversions: 6, revenue: 1200 },
        { product: 'Nest Cam Outdoor', recommendations: 25, conversions: 7, revenue: 1400 }
      ];

      // Quiz metrics
      const completedAssessments = assessments.length;
      const startedSessions = await storage.getBehaviorEventsByType('quiz_started', start, end);
      const completionRate = startedSessions.length > 0 
        ? ((completedAssessments / startedSessions.length) * 100).toFixed(1)
        : '0';

      const quizMetrics = {
        completionRate: parseFloat(completionRate),
        averageTime: 3.2, // Mock data
        dropoffPoints: [
          { step: 'Home Information', dropoffRate: 5 },
          { step: 'Location & Environment', dropoffRate: 8 },
          { step: 'Household Information', dropoffRate: 12 },
          { step: 'Current Security', dropoffRate: 15 },
          { step: 'Security Concerns', dropoffRate: 18 },
          { step: 'Budget & Preferences', dropoffRate: 22 }
        ]
      };

      res.json({
        totalAssessments,
        averageSecurityScore,
        highRiskUsers,
        conversionRate: parseFloat(conversionRate),
        topPersonas,
        vulnerabilityTrends,
        productRecommendations,
        quizMetrics
      });

    } catch (error) {
      console.error('Failed to get security metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security metrics'
      });
    }
  });

  // Real-time Security Data
  app.get('/api/security/realtime', async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent activity
      const recentBehaviors = await storage.getBehaviorEvents({
        eventType: 'security_related',
        startDate: oneHourAgo,
        endDate: now,
        limit: 50
      });

      const activeUsers = await storage.getActiveSessions();
      const quizStarts = await storage.getBehaviorEventsByType('quiz_started', oneHourAgo, now);
      const completions = await storage.getBehaviorEventsByType('assessment_completed', oneHourAgo, now);

      // Mock real-time activities
      const activities = [
        { user: 'User #1847', action: 'started security assessment', timestamp: '2 min ago' },
        { user: 'User #1848', action: 'completed security quiz', timestamp: '3 min ago' },
        { user: 'User #1849', action: 'viewed product recommendations', timestamp: '5 min ago' },
        { user: 'User #1850', action: 'downloaded security checklist', timestamp: '7 min ago' },
        { user: 'User #1851', action: 'clicked affiliate offer', timestamp: '9 min ago' }
      ];

      res.json({
        activeUsers: activeUsers.length,
        quizStarts: quizStarts.length,
        completions: completions.length,
        avgResponseTime: 150, // Mock data
        activities
      });

    } catch (error) {
      console.error('Failed to get real-time data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve real-time data'
      });
    }
  });

  // Crime Data API
  app.get('/api/security/crime-data/:zipCode', async (req: Request, res: Response) => {
    try {
      const { zipCode } = req.params;
      const crimeData = await securityEngine.getCrimeData(zipCode);
      
      res.json({
        success: true,
        data: crimeData
      });

    } catch (error) {
      console.error('Failed to get crime data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve crime data'
      });
    }
  });

  // Security Tips API
  app.post('/api/security/tips', async (req: Request, res: Response) => {
    try {
      const { personaType } = req.body;
      
      // Mock persona object
      const persona = {
        type: personaType,
        description: '',
        primaryConcerns: [],
        recommendedSolutions: [],
        budget: '',
        techSavviness: 'medium',
        urgency: 'medium'
      };

      const tips = await securityEngine.generateSecurityTips(persona);
      
      res.json({
        success: true,
        tips
      });

    } catch (error) {
      console.error('Failed to get security tips:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security tips'
      });
    }
  });

  // Security Product Search
  app.get('/api/security/products', async (req: Request, res: Response) => {
    try {
      const { category, budget, persona } = req.query;
      
      // Get affiliate offers related to security
      const offers = await storage.getAffiliateOffersByCategory('security');
      
      // Filter based on query parameters
      let filteredOffers = offers;
      
      if (category) {
        filteredOffers = filteredOffers.filter(offer => 
          offer.description?.toLowerCase().includes((category as string).toLowerCase())
        );
      }

      // Add product recommendations from security engine
      const securityProducts = [
        {
          id: 1,
          name: 'Ring Video Doorbell Pro 2',
          category: 'doorbell-camera',
          price: '$249.99',
          features: ['1536p HD Video', 'Pre-Roll', '3D Motion Detection', 'Hardwired'],
          rating: 4.5,
          reviews: 12847,
          affiliateUrl: '/affiliate/ring-doorbell-pro-2'
        },
        {
          id: 2,
          name: 'SimpliSafe 8-Piece System',
          category: 'security-system',
          price: '$279.99',
          features: ['Wireless', '24/7 Monitoring', 'Mobile App', 'Easy Setup'],
          rating: 4.6,
          reviews: 8934,
          affiliateUrl: '/affiliate/simplisafe-8-piece'
        },
        {
          id: 3,
          name: 'Arlo Pro 4 Spotlight Camera',
          category: 'wireless-camera',
          price: '$199.99',
          features: ['4K Video', 'Color Night Vision', 'Wireless', 'Spotlight'],
          rating: 4.3,
          reviews: 5672,
          affiliateUrl: '/affiliate/arlo-pro-4'
        }
      ];

      res.json({
        success: true,
        products: securityProducts,
        affiliateOffers: filteredOffers
      });

    } catch (error) {
      console.error('Failed to get security products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security products'
      });
    }
  });

  // Neuron Registration & Health
  app.post('/api/neuron/register', async (req: Request, res: Response) => {
    try {
      const neuronData = req.body;
      
      await storage.registerNeuron({
        neuronId: neuronData.neuronId || neuronOS.getNeuronId(),
        name: neuronData.name || 'neuron-home-security',
        type: neuronData.type || 'home-security',
        url: neuronData.url || process.env.REPLIT_DOMAINS,
        status: 'active',
        healthScore: 100,
        supportedFeatures: neuronData.supportedFeatures || [],
        apiToken: neuronData.apiToken,
        niche: 'home-security',
        version: '1.0.0',
        deployedAt: new Date(),
        lastCheckIn: new Date()
      });

      res.json({
        success: true,
        message: 'Neuron registered successfully'
      });

    } catch (error) {
      console.error('Neuron registration failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register neuron'
      });
    }
  });

  app.post('/api/neuron/status', async (req: Request, res: Response) => {
    try {
      const statusData = req.body;
      
      await storage.updateNeuronStatus({
        neuronId: statusData.neuronId || neuronOS.getNeuronId(),
        status: statusData.status || 'active',
        healthScore: statusData.healthScore || neuronOS.getHealthScore(),
        uptime: statusData.uptime || Math.round(process.uptime()),
        memoryUsage: statusData.memoryUsage || process.memoryUsage().rss,
        responseTime: statusData.responseTime || Date.now(),
        errorCount: statusData.errorCount || 0,
        lastCheckIn: new Date(),
        metadata: statusData.metadata || {}
      });

      res.json({
        success: true,
        message: 'Status updated successfully'
      });

    } catch (error) {
      console.error('Status update failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update status'
      });
    }
  });

  app.get('/api/neuron/update-config', async (req: Request, res: Response) => {
    try {
      const neuronId = req.query.neuronId as string || neuronOS.getNeuronId();
      
      const config = await storage.getActiveNeuronConfig(neuronId);
      const experiments = await storage.getActiveExperiments();
      const empireConfig = await storage.getAllEmpireConfig();

      res.json({
        success: true,
        config,
        experiments,
        empireConfig,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Config retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve config'
      });
    }
  });

  app.post('/api/analytics/report', async (req: Request, res: Response) => {
    try {
      const analyticsData = req.body;
      
      await neuronOS.reportAnalytics(analyticsData.eventType, analyticsData);

      res.json({
        success: true,
        message: 'Analytics reported successfully'
      });

    } catch (error) {
      console.error('Analytics reporting failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to report analytics'
      });
    }
  });

  // Security Budget Calculator
  app.post('/api/security/calculate-budget', async (req: Request, res: Response) => {
    try {
      const { homeSize, budget, securityLevel } = req.body;
      
      const estimate = await securityEngine.calculateSecurityBudget({
        homeSize: parseInt(homeSize),
        budget: parseInt(budget),
        securityLevel: parseInt(securityLevel)
      });

      res.json({ estimate });
    } catch (error) {
      console.error('Error calculating budget:', error);
      res.status(500).json({ error: 'Failed to calculate security budget' });
    }
  });

  // Crime Data Checker
  app.post('/api/security/crime-data', async (req: Request, res: Response) => {
    try {
      const { zipCode } = req.body;
      
      const crimeData = await securityEngine.getCrimeData(zipCode);

      res.json({ crimeData });
    } catch (error) {
      console.error('Error fetching crime data:', error);
      res.status(500).json({ error: 'Failed to fetch crime data' });
    }
  });

  // Security Score Analyzer
  app.get('/api/security/score', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      
      const score = await securityEngine.getSecurityScore(sessionId);

      res.json({ score });
    } catch (error) {
      console.error('Error fetching security score:', error);
      res.status(500).json({ error: 'Failed to fetch security score' });
    }
  });

  // Quiz Data Endpoint
  app.get('/api/security/quiz-data', async (req: Request, res: Response) => {
    try {
      const quizData = {
        questions: securityEngine.getQuizQuestions(),
        personas: securityEngine.getSecurityPersonas(),
        products: securityEngine.getProductRecommendations()
      };
      res.json(quizData);
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      res.status(500).json({ error: 'Failed to fetch quiz data' });
    }
  });
}