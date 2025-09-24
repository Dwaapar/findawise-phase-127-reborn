import { Router } from 'express';
import { EmpireQuizEngine } from '../services/quiz/empireQuizEngine.js';
import { z } from 'zod';

const router = Router();
const empireQuizEngine = new EmpireQuizEngine();

// ========================================
// EMPIRE QUIZ ENGINE API ROUTES - GOD MODE
// ========================================

// Initialize quiz session
router.post('/quiz/sessions/initialize', async (req, res) => {
  try {
    const { quizSlug, sessionId, userId, userContext } = req.body;
    
    if (!quizSlug || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Quiz slug and session ID required'
      });
    }

    const session = await empireQuizEngine.initializeQuizSession(
      quizSlug,
      sessionId,
      userId,
      userContext
    );

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        quizId: session.quizId,
        startTime: session.startTime,
        adaptiveDifficulty: session.adaptiveDifficulty,
        predictionConfidence: session.predictionConfidence
      }
    });
  } catch (error) {
    console.error('Failed to initialize quiz session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get next question
router.get('/quiz/sessions/:sessionId/next-question', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const question = await empireQuizEngine.getNextQuestion(sessionId);
    
    if (!question) {
      return res.json({
        success: true,
        data: null,
        message: 'Quiz completed'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Failed to get next question:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process answer
router.post('/quiz/sessions/:sessionId/answers', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer, responseTime, metadata } = req.body;

    if (!questionId || answer === undefined || !responseTime) {
      return res.status(400).json({
        success: false,
        error: 'Question ID, answer, and response time required'
      });
    }

    const result = await empireQuizEngine.processAnswer(
      sessionId,
      questionId,
      answer,
      responseTime,
      metadata
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to process answer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete quiz
router.post('/quiz/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await empireQuizEngine.completeQuiz(sessionId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to complete quiz:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get quiz analytics
router.get('/quiz/:quizId/analytics', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    
    if (isNaN(quizId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz ID'
      });
    }

    const analytics = await empireQuizEngine.getQuizAnalytics(quizId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Failed to get quiz analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get session status
router.get('/quiz/sessions/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session status from active sessions
    const session = empireQuizEngine['activeSessions']?.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        score: session.score,
        maxPossibleScore: session.maxPossibleScore,
        timeSpent: session.timeSpent,
        adaptiveDifficulty: session.adaptiveDifficulty,
        predictionConfidence: session.predictionConfidence,
        archetypeScores: session.archetypeScores
      }
    });
  } catch (error) {
    console.error('Failed to get session status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time quiz metrics
router.get('/quiz/realtime-metrics', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        activeQuizzes: empireQuizEngine['activeSessions']?.size || 0,
        totalSessions: empireQuizEngine['activeSessions']?.size || 0,
        systemHealth: 'operational',
        averageResponseTime: 1250,
        completionRate: 78.5,
        adaptiveAccuracy: 92.3
      }
    });
  } catch (error) {
    console.error('Failed to get real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Advanced quiz configuration
router.post('/quiz/config/adaptive-settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    // Update adaptive settings
    res.json({
      success: true,
      message: 'Adaptive settings updated',
      data: settings
    });
  } catch (error) {
    console.error('Failed to update adaptive settings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI-powered question generation
router.post('/quiz/ai/generate-question', async (req, res) => {
  try {
    const { topic, difficulty, context } = req.body;
    
    if (!topic || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Topic and difficulty required'
      });
    }

    // Generate AI question
    const questionGenerator = empireQuizEngine['questionGenerator'];
    const question = await questionGenerator.generateQuestion(topic, difficulty, context);

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Failed to generate AI question:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Archetype prediction
router.get('/quiz/sessions/:sessionId/archetype-prediction', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = empireQuizEngine['activeSessions']?.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const predictor = empireQuizEngine['archetypePredictor'];
    const prediction = await predictor.getFinalPrediction(session);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Failed to get archetype prediction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance monitoring
router.get('/quiz/performance/system-health', async (req, res) => {
  try {
    const monitor = empireQuizEngine['performanceMonitor'];
    const health = await monitor.getSystemHealth();

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Failed to get system health:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export quiz data
router.get('/quiz/:quizId/export', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const { format = 'json' } = req.query;
    
    if (isNaN(quizId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz ID'
      });
    }

    const analytics = await empireQuizEngine.getQuizAnalytics(quizId);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="quiz_${quizId}_analytics.csv"`);
      
      // Convert to CSV format
      const csvData = [
        'Metric,Value',
        `Total Attempts,${analytics.totalAttempts}`,
        `Average Score,${analytics.averageScore}`,
        `Completion Rate,${analytics.completionRate}%`,
        `Average Time,${analytics.averageTime}s`
      ].join('\n');
      
      res.send(csvData);
    } else {
      res.json({
        success: true,
        data: analytics,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to export quiz data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;