import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { 
  insertAiToolsArchetypeSchema, 
  insertAiToolSchema, 
  insertAiToolsOfferSchema,
  insertAiToolsQuizSchema,
  insertAiToolsContentSchema,
  insertAiToolsLeadSchema
} from '@shared/aiToolsTables';
import type { DatabaseStorage } from '../storage';

export function createAiToolsRoutes(storage: DatabaseStorage) {
  const router = Router();

  // Get all AI tool archetypes
  router.get('/archetypes', async (req, res) => {
    try {
      const archetypes = await storage.getAiToolsArchetypes();
      res.json(archetypes);
    } catch (error) {
      console.error('Error fetching AI tools archetypes:', error);
      res.status(500).json({ error: 'Failed to fetch archetypes' });
    }
  });

  // Get all AI tool categories
  router.get('/categories', async (req, res) => {
    try {
      const categories = await storage.getAiToolsCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching AI tools categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get AI tools with filtering
  router.get('/tools', async (req, res) => {
    try {
      const {
        category,
        pricing,
        search,
        featured,
        limit = '20',
        offset = '0',
        sort = 'featured'
      } = req.query;

      const filters = {
        categoryId: category ? parseInt(category as string) : undefined,
        pricingModel: pricing as string,
        search: search as string,
        featured: featured === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sort: sort as string
      };

      const tools = await storage.getAiTools(filters);
      res.json(tools);
    } catch (error) {
      console.error('Error fetching AI tools:', error);
      res.status(500).json({ error: 'Failed to fetch tools' });
    }
  });

  // Get single AI tool by ID or slug
  router.get('/tools/:identifier', async (req, res) => {
    try {
      const { identifier } = req.params;
      const isNumeric = /^\d+$/.test(identifier);
      
      const tool = isNumeric 
        ? await storage.getAiToolById(parseInt(identifier))
        : await storage.getAiToolBySlug(identifier);
      
      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }

      // Track tool view
      await storage.trackAiToolAnalytics({
        sessionId: req.sessionID,
        event: 'tool_view',
        toolId: tool.id,
        data: { source: 'api' }
      });

      res.json(tool);
    } catch (error) {
      console.error('Error fetching AI tool:', error);
      res.status(500).json({ error: 'Failed to fetch tool' });
    }
  });

  // Get AI tools quiz
  router.get('/quiz', async (req, res) => {
    try {
      const quiz = await storage.getActiveAiToolsQuiz();
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not available' });
      }
      res.json(quiz);
    } catch (error) {
      console.error('Error fetching AI tools quiz:', error);
      res.status(500).json({ error: 'Failed to fetch quiz' });
    }
  });

  // Submit quiz results
  router.post('/quiz/results', validateRequest({
    body: z.object({
      quizId: z.number(),
      sessionId: z.string(),
      answers: z.record(z.any()),
      userId: z.string().optional()
    })
  }), async (req, res) => {
    try {
      const { quizId, sessionId, answers, userId } = req.body;
      
      // Process quiz answers and determine archetype
      const results = await storage.processAiToolsQuizResults({
        quizId,
        sessionId,
        userId,
        answers
      });

      res.json(results);
    } catch (error) {
      console.error('Error processing quiz results:', error);
      res.status(500).json({ error: 'Failed to process quiz results' });
    }
  });

  // Get personalized recommendations
  router.get('/recommendations', async (req, res) => {
    try {
      const { archetype, sessionId } = req.query;
      
      if (!archetype && !sessionId) {
        return res.status(400).json({ error: 'Archetype or session ID required' });
      }

      const recommendations = await storage.getAiToolRecommendations({
        archetype: archetype as string,
        sessionId: sessionId as string
      });

      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  // Get AI tool offers
  router.get('/offers', async (req, res) => {
    try {
      const { toolId, active = 'true' } = req.query;
      
      const offers = await storage.getAiToolsOffers({
        toolId: toolId ? parseInt(toolId as string) : undefined,
        isActive: active === 'true'
      });

      res.json(offers);
    } catch (error) {
      console.error('Error fetching AI tool offers:', error);
      res.status(500).json({ error: 'Failed to fetch offers' });
    }
  });

  // Track offer click
  router.post('/offers/:offerId/click', async (req, res) => {
    try {
      const { offerId } = req.params;
      const { sessionId, archetype } = req.body;

      await storage.trackOfferClick(parseInt(offerId), sessionId, archetype);
      
      // Get redirect URL
      const offer = await storage.getAiToolsOfferById(parseInt(offerId));
      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      res.json({ redirectUrl: offer.affiliateUrl });
    } catch (error) {
      console.error('Error tracking offer click:', error);
      res.status(500).json({ error: 'Failed to track offer click' });
    }
  });

  // Get AI tools content
  router.get('/content', async (req, res) => {
    try {
      const { 
        type, 
        category, 
        limit = '10', 
        offset = '0',
        status = 'published'
      } = req.query;

      const content = await storage.getAiToolsContent({
        type: type as string,
        category: category as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as string
      });

      res.json(content);
    } catch (error) {
      console.error('Error fetching AI tools content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // Get single content piece
  router.get('/content/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const content = await storage.getAiToolsContentBySlug(slug);
      
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Track content view
      await storage.trackAiToolAnalytics({
        sessionId: req.sessionID,
        event: 'content_view',
        contentId: content.id,
        data: { slug }
      });

      res.json(content);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // Get lead magnets
  router.get('/lead-magnets', async (req, res) => {
    try {
      const { archetype } = req.query;
      const leadMagnets = await storage.getLeadMagnets(archetype as string);
      res.json(leadMagnets);
    } catch (error) {
      console.error('Error fetching lead magnets:', error);
      res.status(500).json({ error: 'Failed to fetch lead magnets' });
    }
  });

  // Subscribe to newsletter
  router.post('/subscribe', validateRequest({
    body: z.object({
      email: z.string().email(),
      leadMagnet: z.string().optional(),
      archetype: z.string().optional(),
      interests: z.array(z.string()).optional()
    })
  }), async (req, res) => {
    try {
      const { email, leadMagnet, archetype, interests } = req.body;
      
      const lead = await storage.createAiToolsLead({
        email,
        sessionId: req.sessionID,
        source: leadMagnet ? 'download' : 'newsletter',
        leadMagnet,
        archetype,
        interests
      });

      // Track subscription
      await storage.trackAiToolAnalytics({
        sessionId: req.sessionID,
        event: 'newsletter_subscribe',
        data: { email, archetype, leadMagnet }
      });

      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  });

  // Download resource
  router.post('/download/:magnetId', async (req, res) => {
    try {
      const { magnetId } = req.params;
      const { email, archetype } = req.body;

      // Get lead magnet
      const magnet = await storage.getLeadMagnetById(magnetId);
      if (!magnet) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Track download
      await storage.trackAiToolAnalytics({
        sessionId: req.sessionID,
        event: 'resource_download',
        data: { magnetId, email, archetype }
      });

      // Create lead if email provided
      if (email) {
        await storage.createAiToolsLead({
          email,
          sessionId: req.sessionID,
          source: 'download',
          leadMagnet: magnetId,
          archetype
        });
      }

      res.json({ 
        success: true, 
        downloadUrl: magnet.downloadUrl,
        title: magnet.title 
      });
    } catch (error) {
      console.error('Error processing download:', error);
      res.status(500).json({ error: 'Failed to process download' });
    }
  });

  // Get user's saved tools
  router.get('/saved', async (req, res) => {
    try {
      const { sessionId } = req.query;
      const savedTools = await storage.getUserSavedTools(sessionId as string || req.sessionID);
      res.json(savedTools);
    } catch (error) {
      console.error('Error fetching saved tools:', error);
      res.status(500).json({ error: 'Failed to fetch saved tools' });
    }
  });

  // Save/unsave tool
  router.post('/save', validateRequest({
    body: z.object({
      toolId: z.number(),
      action: z.enum(['save', 'unsave'])
    })
  }), async (req, res) => {
    try {
      const { toolId, action } = req.body;
      const sessionId = req.sessionID;

      if (action === 'save') {
        await storage.saveAiTool(sessionId, toolId);
      } else {
        await storage.unsaveAiTool(sessionId, toolId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving/unsaving tool:', error);
      res.status(500).json({ error: 'Failed to save tool' });
    }
  });

  // Get AI tools comparisons
  router.get('/comparisons', async (req, res) => {
    try {
      const { limit = '10', offset = '0' } = req.query;
      
      const comparisons = await storage.getAiToolsComparisons({
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json(comparisons);
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      res.status(500).json({ error: 'Failed to fetch comparisons' });
    }
  });

  // Get single comparison
  router.get('/comparisons/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const comparison = await storage.getAiToolsComparisonBySlug(slug);
      
      if (!comparison) {
        return res.status(404).json({ error: 'Comparison not found' });
      }

      res.json(comparison);
    } catch (error) {
      console.error('Error fetching comparison:', error);
      res.status(500).json({ error: 'Failed to fetch comparison' });
    }
  });

  // Analytics endpoint
  router.post('/analytics', async (req, res) => {
    try {
      const events = Array.isArray(req.body) ? req.body : [req.body];
      
      for (const event of events) {
        await storage.trackAiToolAnalytics({
          sessionId: req.sessionID,
          ...event
        });
      }

      res.json({ success: true, processed: events.length });
    } catch (error) {
      console.error('Error tracking analytics:', error);
      res.status(500).json({ error: 'Failed to track analytics' });
    }
  });

  return router;
}