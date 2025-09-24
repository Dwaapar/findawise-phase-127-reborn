import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { HealthContentGenerator } from '../utils/healthContentGenerator';

const router = express.Router();

// Health Archetypes
router.get('/archetypes', async (req, res) => {
  try {
    const archetypes = await storage.getHealthArchetypes();
    res.json({ success: true, data: archetypes });
  } catch (error) {
    console.error('Error fetching health archetypes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch health archetypes' });
  }
});

// Health Tools
router.get('/tools', async (req, res) => {
  try {
    const tools = await storage.getHealthTools();
    res.json({ success: true, data: tools });
  } catch (error) {
    console.error('Error fetching health tools:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch health tools' });
  }
});

// Health Quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await storage.getHealthQuizzes();
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Error fetching health quizzes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch health quizzes' });
  }
});

// Health Content
router.get('/content', async (req, res) => {
  try {
    const { category, archetype, limit = 10 } = req.query;
    const content = await storage.getHealthContent({
      category: category as string,
      targetArchetype: archetype as string,
      limit: parseInt(limit as string)
    });
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching health content:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch health content' });
  }
});

// Generate Content Library
router.post('/content/generate-library', async (req, res) => {
  try {
    console.log('🚀 Starting comprehensive content generation...');
    
    // Generate articles and lead magnets
    const articlesGenerated = await HealthContentGenerator.generateComprehensiveContent();
    const magnetsGenerated = await HealthContentGenerator.generateLeadMagnets();
    
    res.json({ 
      success: true, 
      data: {
        articlesGenerated,
        magnetsGenerated,
        totalGenerated: articlesGenerated + magnetsGenerated
      }
    });
  } catch (error) {
    console.error('Error generating content library:', error);
    res.status(500).json({ success: false, error: 'Failed to generate content library' });
  }
});

// Lead Magnets
router.get('/lead-magnets', async (req, res) => {
  try {
    const { archetype } = req.query;
    const magnets = await storage.getHealthLeadMagnets({
      targetArchetype: archetype as string
    });
    res.json({ success: true, data: magnets });
  } catch (error) {
    console.error('Error fetching lead magnets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead magnets' });
  }
});

// Archetype Detection
const archetypeDetectionSchema = z.object({
  sessionId: z.string(),
  behaviorData: z.object({
    timeOfDay: z.number().optional(),
    deviceType: z.string().optional(),
    previousActions: z.array(z.string()).optional(),
    preferences: z.record(z.any()).optional()
  }).optional(),
  quizAnswers: z.array(z.object({
    questionId: z.number(),
    answer: z.string()
  })).optional(),
  userId: z.string().nullable().optional()
});

router.post('/detect-archetype', async (req, res) => {
  try {
    const { sessionId, behaviorData, quizAnswers, userId } = archetypeDetectionSchema.parse(req.body);
    
    // AI-powered archetype detection logic
    let detectedArchetype = 'the-sleepless-pro'; // Default
    let confidence = 0.7;
    let factors = [];

    // Behavioral analysis
    if (behaviorData?.timeOfDay) {
      if (behaviorData.timeOfDay > 22 || behaviorData.timeOfDay < 6) {
        detectedArchetype = 'the-sleepless-pro';
        confidence += 0.1;
        factors.push('Late night activity detected');
      } else if (behaviorData.timeOfDay >= 6 && behaviorData.timeOfDay <= 9) {
        detectedArchetype = 'the-biohacker';
        confidence += 0.05;
        factors.push('Early morning optimization activity');
      }
    }

    // Quiz-based detection
    if (quizAnswers && quizAnswers.length > 0) {
      const archetypeScores = {
        'the-sleepless-pro': 0,
        'the-diet-starter': 0,
        'the-overwhelmed-parent': 0,
        'the-biohacker': 0
      };

      // Get quiz for scoring
      const quizzes = await storage.getHealthQuizzes();
      const quiz = quizzes[0]; // Use first quiz for now

      if (quiz) {
        quizAnswers.forEach(answer => {
          const question = quiz.questions.find(q => q.id === answer.questionId);
          if (question) {
            const option = question.options.find(opt => opt.value === answer.answer);
            if (option && option.weight) {
              Object.entries(option.weight).forEach(([archetype, weight]) => {
                archetypeScores[archetype as keyof typeof archetypeScores] += weight;
              });
            }
          }
        });

        // Find highest scoring archetype
        const topArchetype = Object.entries(archetypeScores).reduce((a, b) => 
          archetypeScores[a[0] as keyof typeof archetypeScores] > archetypeScores[b[0] as keyof typeof archetypeScores] ? a : b
        );

        detectedArchetype = topArchetype[0];
        confidence = Math.min(0.95, 0.6 + (topArchetype[1] * 0.05));
        factors.push(`Quiz analysis: ${topArchetype[1]} points`);
      }
    }

    // Store detection result
    const result = {
      slug: detectedArchetype,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      sessionId,
      detectedAt: new Date().toISOString()
    };

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error detecting archetype:', error);
    res.status(500).json({ success: false, error: 'Failed to detect archetype' });
  }
});

// Gamification endpoints
router.get('/gamification/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get or create gamification data for session
    let gameData = await storage.getHealthGamification(sessionId);
    
    if (!gameData) {
      // Create initial gamification data
      gameData = {
        sessionId,
        currentLevel: 1,
        totalXP: 0,
        streakDays: 0,
        wellnessPoints: 0,
        achievements: [],
        dailyQuests: [],
        lastActiveDate: new Date().toISOString(),
        isActive: true
      };
      
      await storage.createHealthGamification(gameData);
    }

    res.json({ success: true, data: gameData });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch gamification data' });
  }
});

// Daily Quests
router.get('/daily-quests', async (req, res) => {
  try {
    const quests = await storage.getHealthDailyQuests();
    res.json({ success: true, data: quests });
  } catch (error) {
    console.error('Error fetching daily quests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch daily quests' });
  }
});

// Complete Quest
router.post('/complete-quest', async (req, res) => {
  try {
    const { sessionId, questId } = req.body;
    
    // Award XP and update streak
    const quest = await storage.getHealthDailyQuestById(questId);
    if (!quest) {
      return res.status(404).json({ success: false, error: 'Quest not found' });
    }

    // Update gamification data
    let gameData = await storage.getHealthGamification(sessionId);
    if (gameData) {
      gameData.totalXP += quest.xpReward;
      gameData.wellnessPoints += quest.pointsReward;
      
      // Level up logic
      const newLevel = Math.floor(gameData.totalXP / 1000) + 1;
      if (newLevel > gameData.currentLevel) {
        gameData.currentLevel = newLevel;
      }
      
      await storage.updateHealthGamification(sessionId, gameData);
    }

    res.json({ success: true, data: { xpEarned: quest.xpReward, pointsEarned: quest.pointsReward } });
  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({ success: false, error: 'Failed to complete quest' });
  }
});

// Health Analytics
router.post('/analytics/tool-usage', async (req, res) => {
  try {
    const { toolSlug, sessionId, inputs, results } = req.body;
    
    // Track tool usage for analytics
    await storage.createHealthAnalytics({
      eventType: 'tool_usage',
      sessionId,
      metadata: {
        toolSlug,
        inputs,
        results,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking tool usage:', error);
    res.status(500).json({ success: false, error: 'Failed to track tool usage' });
  }
});

// A/B Testing endpoints
router.get('/experiments', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    // Get active experiments for health neuron
    const experiments = [
      {
        id: 'health-cta-text',
        name: 'Health CTA Text',
        variants: [
          { id: 'control', name: 'Get Started', weight: 50 },
          { id: 'variant', name: 'Transform Your Health', weight: 50 }
        ]
      },
      {
        id: 'quiz-length',
        name: 'Quiz Length',
        variants: [
          { id: 'short', name: '3 Questions', weight: 60 },
          { id: 'long', name: '7 Questions', weight: 40 }
        ]
      }
    ];

    // Assign variants based on session ID hash
    const assignments = experiments.map(exp => {
      const hash = sessionId ? sessionId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
      const variantIndex = hash % exp.variants.length;
      return {
        experimentId: exp.id,
        variantId: exp.variants[variantIndex].id,
        variantName: exp.variants[variantIndex].name
      };
    });

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch experiments' });
  }
});

// Content Auto-rotation
router.get('/dynamic-content', async (req, res) => {
  try {
    const { archetype, location, intent } = req.query;
    
    // Get content based on user archetype and context
    const content = await storage.getHealthContent({
      targetArchetype: archetype as string,
      limit: 5
    });

    // Get relevant affiliate offers (simulated)
    const offers = [
      {
        id: 1,
        title: 'Premium Sleep Tracker',
        description: 'Track your sleep with 99% accuracy',
        price: '$299',
        rating: 4.8,
        relevantFor: ['the-sleepless-pro', 'the-biohacker']
      },
      {
        id: 2,
        title: 'Meal Planning App',
        description: 'AI-powered nutrition planning',
        price: '$19/month',
        rating: 4.6,
        relevantFor: ['the-diet-starter', 'the-overwhelmed-parent']
      }
    ];

    // Filter offers based on archetype
    const relevantOffers = offers.filter(offer => 
      offer.relevantFor.includes(archetype as string)
    );

    res.json({ 
      success: true, 
      data: {
        content,
        offers: relevantOffers,
        rotationId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  } catch (error) {
    console.error('Error fetching dynamic content:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dynamic content' });
  }
});

export const healthRouter = router;
export default router;