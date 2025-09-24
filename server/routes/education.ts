import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { randomUUID } from "crypto";

// Education-specific API routes for neuron-education compliance

export function registerEducationRoutes(app: Express) {
  // Education Archetypes
  app.get('/api/education/archetypes', async (req, res) => {
    try {
      const archetypes = await storage.getEducationArchetypes();
      res.json({ success: true, data: archetypes });
    } catch (error) {
      console.error('Failed to get education archetypes:', error);
      res.status(500).json({ success: false, error: 'Failed to get education archetypes' });
    }
  });

  app.get('/api/education/archetypes/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const archetype = await storage.getEducationArchetypeBySlug(slug);
      if (!archetype) {
        return res.status(404).json({ success: false, error: 'Archetype not found' });
      }
      res.json({ success: true, data: archetype });
    } catch (error) {
      console.error('Failed to get education archetype:', error);
      res.status(500).json({ success: false, error: 'Failed to get education archetype' });
    }
  });

  // Education Content
  app.get('/api/education/content', async (req, res) => {
    try {
      const { category, difficulty, archetype, limit = 20 } = req.query;
      const content = await storage.getEducationContent({
        category: category as string,
        difficulty: difficulty as string,
        targetArchetype: archetype as string,
        limit: parseInt(limit as string)
      });
      res.json({ success: true, data: content });
    } catch (error) {
      console.error('Failed to get education content:', error);
      res.status(500).json({ success: false, error: 'Failed to get education content' });
    }
  });

  app.post('/api/education/content/batch', async (req, res) => {
    try {
      const { content } = req.body;
      const results = [];
      
      for (const item of content) {
        try {
          const created = await storage.createEducationContent(item);
          results.push(created);
        } catch (error) {
          console.warn('Failed to create content item:', error);
        }
      }
      
      res.json({ success: true, data: results, processed: results.length });
    } catch (error) {
      console.error('Failed to batch create content:', error);
      res.status(500).json({ success: false, error: 'Failed to batch create content' });
    }
  });

  // Education Quizzes
  app.get('/api/education/quizzes', async (req, res) => {
    try {
      const { category, type, difficulty } = req.query;
      const quizzes = await storage.getEducationQuizzes({
        category: category as string,
        quizType: type as string,
        difficulty: difficulty as string
      });
      res.json({ success: true, data: quizzes });
    } catch (error) {
      console.error('Failed to get education quizzes:', error);
      res.status(500).json({ success: false, error: 'Failed to get education quizzes' });
    }
  });

  app.get('/api/education/quizzes/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const quiz = await storage.getEducationQuizBySlug(slug);
      if (!quiz) {
        return res.status(404).json({ success: false, error: 'Quiz not found' });
      }
      res.json({ success: true, data: quiz });
    } catch (error) {
      console.error('Failed to get education quiz:', error);
      res.status(500).json({ success: false, error: 'Failed to get education quiz' });
    }
  });

  app.post('/api/education/quizzes/:slug/submit', async (req, res) => {
    try {
      const { slug } = req.params;
      const { sessionId, globalUserId, answers, timeSpent } = req.body;
      
      const quiz = await storage.getEducationQuizBySlug(slug);
      if (!quiz) {
        return res.status(404).json({ success: false, error: 'Quiz not found' });
      }

      // Calculate score and results
      const result = calculateQuizScore(quiz, answers);
      
      // Save quiz result
      const quizResult = await storage.saveEducationQuizResult({
        quizId: quiz.id,
        sessionId,
        globalUserId,
        answers,
        score: result.score,
        percentage: result.percentage,
        archetype: result.archetype,
        xpEarned: result.xpEarned,
        timeSpent,
        completedAt: new Date()
      });

      res.json({ 
        success: true, 
        data: {
          ...quizResult,
          score: result.score,
          percentage: result.percentage,
          archetype: result.archetype,
          xpEarned: result.xpEarned,
          recommendations: result.recommendations
        }
      });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      res.status(500).json({ success: false, error: 'Failed to submit quiz' });
    }
  });

  // Education Gamification
  app.get('/api/education/gamification/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const gamification = await storage.getEducationGamification(sessionId);
      res.json({ success: true, data: gamification });
    } catch (error) {
      console.error('Failed to get gamification data:', error);
      res.status(500).json({ success: false, error: 'Failed to get gamification data' });
    }
  });

  app.post('/api/education/gamification/xp', async (req, res) => {
    try {
      const { sessionId, xpAmount, source, metadata } = req.body;
      const result = await storage.addEducationXP({
        sessionId,
        xpAmount,
        source,
        metadata,
        timestamp: new Date()
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Failed to add XP:', error);
      res.status(500).json({ success: false, error: 'Failed to add XP' });
    }
  });

  // Daily Quests
  app.get('/api/education/daily-quests/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const quests = await storage.getEducationDailyQuests(sessionId);
      res.json({ success: true, data: quests });
    } catch (error) {
      console.error('Failed to get daily quests:', error);
      res.status(500).json({ success: false, error: 'Failed to get daily quests' });
    }
  });

  app.post('/api/education/daily-quests/:questId/complete', async (req, res) => {
    try {
      const { questId } = req.params;
      const { sessionId } = req.body;
      const result = await storage.completeEducationQuest({
        questId: parseInt(questId),
        sessionId,
        completedAt: new Date()
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Failed to complete quest:', error);
      res.status(500).json({ success: false, error: 'Failed to complete quest' });
    }
  });

  // Leaderboard
  app.get('/api/education/leaderboard', async (req, res) => {
    try {
      const { timeframe = 'all', limit = 20 } = req.query;
      const leaderboard = await storage.getEducationLeaderboard({
        timeframe: timeframe as string,
        limit: parseInt(limit as string)
      });
      res.json({ success: true, data: leaderboard });
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
    }
  });

  // Education Offers
  app.get('/api/education/offers', async (req, res) => {
    try {
      const { category, archetype, featured } = req.query;
      const offers = await storage.getEducationOffers({
        category: category as string,
        targetArchetype: archetype as string,
        isFeatured: featured === 'true'
      });
      res.json({ success: true, data: offers });
    } catch (error) {
      console.error('Failed to get education offers:', error);
      res.status(500).json({ success: false, error: 'Failed to get education offers' });
    }
  });

  app.get('/api/education/offers/featured', async (req, res) => {
    try {
      const { limit = 6 } = req.query;
      const offers = await storage.getEducationOffers({
        isFeatured: true,
        limit: parseInt(limit as string)
      });
      res.json({ success: true, data: offers });
    } catch (error) {
      console.error('Failed to get featured offers:', error);
      res.status(500).json({ success: false, error: 'Failed to get featured offers' });
    }
  });

  app.get('/api/education/offers/category', async (req, res) => {
    try {
      const { category, limit = 10 } = req.query;
      const offers = await storage.getEducationOffers({
        category: category as string,
        limit: parseInt(limit as string)
      });
      res.json({ success: true, data: offers });
    } catch (error) {
      console.error('Failed to get offers by category:', error);
      res.status(500).json({ success: false, error: 'Failed to get offers by category' });
    }
  });

  app.post('/api/education/offers/track-click', async (req, res) => {
    try {
      const { offerId, context, timestamp } = req.body;
      const result = await storage.trackEducationOfferClick({
        offerId,
        sessionId: context.sessionId,
        context,
        timestamp: new Date(timestamp)
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Failed to track offer click:', error);
      res.status(500).json({ success: false, error: 'Failed to track offer click' });
    }
  });

  app.post('/api/education/offers/track-conversion', async (req, res) => {
    try {
      const { offerId, value, timestamp } = req.body;
      const result = await storage.trackEducationOfferConversion({
        offerId,
        value: value || 0,
        timestamp: new Date(timestamp)
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Failed to track offer conversion:', error);
      res.status(500).json({ success: false, error: 'Failed to track offer conversion' });
    }
  });

  // AI Chat Sessions
  app.post('/api/education/ai-chat/init', async (req, res) => {
    try {
      const { subject, archetype, context } = req.body;
      const chatSession = await storage.createEducationAIChatSession({
        sessionId: randomUUID(),
        subject,
        archetype,
        context,
        startedAt: new Date()
      });
      res.json({ success: true, data: chatSession });
    } catch (error) {
      console.error('Failed to init AI chat session:', error);
      res.status(500).json({ success: false, error: 'Failed to init AI chat session' });
    }
  });

  app.post('/api/education/ai-chat/message', async (req, res) => {
    try {
      const { chatId, message, subject, archetype, context } = req.body;
      
      // Generate AI response (placeholder - would integrate with actual AI service)
      const aiResponse = await generateAIResponse(message, subject, archetype, context);
      
      res.json({ 
        success: true, 
        data: {
          content: aiResponse.content,
          messageType: aiResponse.messageType,
          metadata: aiResponse.metadata
        }
      });
    } catch (error) {
      console.error('Failed to process AI chat message:', error);
      res.status(500).json({ success: false, error: 'Failed to process AI chat message' });
    }
  });

  // Content Generation
  app.post('/api/content/generate', async (req, res) => {
    try {
      const { topic, category, difficulty, wordCount, tone } = req.body;
      
      // Generate content using AI (placeholder)
      const generatedContent = await generateEducationContent({
        topic,
        category,
        difficulty,
        wordCount,
        tone
      });
      
      res.json({ success: true, data: generatedContent });
    } catch (error) {
      console.error('Failed to generate content:', error);
      res.status(500).json({ success: false, error: 'Failed to generate content' });
    }
  });

  app.post('/api/content/enhance', async (req, res) => {
    try {
      const { contentId, enhancements } = req.body;
      
      // Enhance existing content (placeholder)
      const enhancedContent = await enhanceEducationContent(contentId, enhancements);
      
      res.json({ success: true, data: enhancedContent });
    } catch (error) {
      console.error('Failed to enhance content:', error);
      res.status(500).json({ success: false, error: 'Failed to enhance content' });
    }
  });

  app.post('/api/content/fetch-rss', async (req, res) => {
    try {
      const { url, sourceId } = req.body;
      
      // Fetch RSS content (placeholder)
      const rssContent = await fetchRSSContent(url, sourceId);
      
      res.json({ success: true, data: rssContent });
    } catch (error) {
      console.error('Failed to fetch RSS content:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch RSS content' });
    }
  });

  app.post('/api/content/scrape', async (req, res) => {
    try {
      const { url, sourceId, selectors } = req.body;
      
      // Scrape web content (placeholder)
      const scrapedContent = await scrapeWebContent(url, sourceId, selectors);
      
      res.json({ success: true, data: scrapedContent });
    } catch (error) {
      console.error('Failed to scrape content:', error);
      res.status(500).json({ success: false, error: 'Failed to scrape content' });
    }
  });

  app.post('/api/content/suggestions', async (req, res) => {
    try {
      const { category, limit } = req.body;
      
      // Get content suggestions (placeholder)
      const suggestions = await getContentSuggestions(category, limit);
      
      res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('Failed to get content suggestions:', error);
      res.status(500).json({ success: false, error: 'Failed to get content suggestions' });
    }
  });

  // Behavior tracking for ArchetypeEngine
  app.get('/api/analytics/behavior-data', async (req, res) => {
    try {
      const { sessionId } = req.query;
      const behaviorData = await storage.getUserBehaviorData(sessionId as string);
      res.json({ success: true, data: behaviorData });
    } catch (error) {
      console.error('Failed to get behavior data:', error);
      res.status(500).json({ success: false, error: 'Failed to get behavior data' });
    }
  });
}

// Helper functions (placeholders for actual AI implementations)
function calculateQuizScore(quiz: any, answers: any) {
  // Placeholder quiz scoring logic
  const totalQuestions = quiz.questions.length;
  let correctAnswers = 0;
  
  quiz.questions.forEach((question: any, index: number) => {
    if (answers[index] === question.correct) {
      correctAnswers++;
    }
  });
  
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const score = correctAnswers;
  const xpEarned = Math.round(percentage * 0.5); // XP based on performance
  
  return {
    score,
    percentage,
    archetype: determineArchetypeFromAnswers(answers),
    xpEarned,
    recommendations: generateQuizRecommendations(percentage, quiz.category)
  };
}

function determineArchetypeFromAnswers(answers: any): string {
  // Placeholder archetype determination
  return 'curious-learner';
}

function generateQuizRecommendations(percentage: number, category: string): string[] {
  // Placeholder recommendations
  if (percentage >= 80) {
    return ['Advanced content in ' + category, 'Consider teaching others'];
  } else if (percentage >= 60) {
    return ['Practice more in ' + category, 'Try intermediate content'];
  } else {
    return ['Review basics in ' + category, 'Start with beginner content'];
  }
}

async function generateAIResponse(message: string, subject: string, archetype: string, context: any) {
  // Placeholder AI response generation
  return {
    content: `I understand you're asking about "${message}". As an AI tutor specialized in ${subject}, I'd recommend focusing on the fundamentals first.`,
    messageType: 'text',
    metadata: {
      suggestions: ['Can you explain this more?', 'What are the basics?', 'Give me an example'],
      recommendations: [{
        title: 'Study Guide for ' + subject,
        description: 'Comprehensive guide covering fundamentals',
        action: 'View Guide',
        url: '/content/' + subject.toLowerCase()
      }]
    }
  };
}

async function generateEducationContent(params: any) {
  // Placeholder content generation
  return {
    title: `Complete Guide to ${params.topic}`,
    content: `This is a comprehensive guide about ${params.topic}...`,
    excerpt: `Learn everything about ${params.topic} in this detailed guide.`,
    tags: [params.topic, params.category],
    seoTitle: `Master ${params.topic} - Complete ${params.difficulty} Guide`,
    seoDescription: `Learn ${params.topic} with our ${params.difficulty} guide.`,
    readingTime: Math.ceil(params.wordCount / 200),
    qualityScore: 8.5
  };
}

async function enhanceEducationContent(contentId: string, enhancements: any) {
  // Placeholder content enhancement
  return {
    title: 'Enhanced: Complete Guide',
    content: 'Enhanced content with improvements...',
    qualityScore: 9.0
  };
}

async function fetchRSSContent(url: string, sourceId: string) {
  // Placeholder RSS fetching
  return [{
    title: 'Sample RSS Article',
    content: 'Content from RSS feed...',
    link: url,
    pubDate: new Date().toISOString()
  }];
}

async function scrapeWebContent(url: string, sourceId: string, selectors: any) {
  // Placeholder web scraping
  return [{
    title: 'Scraped Article',
    content: 'Scraped content...',
    url: url,
    date: new Date().toISOString()
  }];
}

async function getContentSuggestions(category: string, limit: number) {
  // Placeholder content suggestions
  return [
    `Getting Started with ${category}`,
    `Advanced ${category} Techniques`,
    `Common ${category} Mistakes to Avoid`
  ].slice(0, limit);
}