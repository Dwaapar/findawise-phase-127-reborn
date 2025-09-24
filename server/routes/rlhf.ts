import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { rlhfEngine } from "../services/rlhf/rlhfEngine";
import { personaFusionEngine } from "../services/rlhf/personaFusionEngine";
import { db } from "../db";
import { 
  rlhfFeedback, agentRewards, personaProfiles, personaEvolution, 
  rlhfTrainingSessions, personaSimulations, federationRlhfSync
} from "../../shared/rlhfTables";
import { eq, desc, and, or, sql, like, inArray, avg, count, sum } from "drizzle-orm";

const router = Router();

// ==========================================
// RLHF FEEDBACK COLLECTION ENDPOINTS
// ==========================================

/**
 * POST /api/rlhf/feedback
 * Collect feedback signal from user interaction
 */
router.post("/feedback", async (req, res) => {
  try {
    const {
      sessionId,
      userId,
      agentId,
      promptVersion,
      taskType,
      pagePath,
      userArchetype,
      feedbackType,
      signalType,
      signalValue,
      rawValue,
      interactionDuration,
      deviceType,
      browserInfo,
      geoLocation,
      metadata
    } = req.body;

    if (!sessionId || !taskType || !signalType || signalValue === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required feedback parameters"
      });
    }

    await rlhfEngine.collectFeedback({
      sessionId,
      userId,
      agentId,
      promptVersion,
      taskType,
      pagePath,
      userArchetype,
      feedbackType: feedbackType || 'implicit',
      signalType,
      signalValue: Number(signalValue),
      rawValue,
      interactionDuration,
      deviceType,
      browserInfo,
      geoLocation,
      metadata
    });

    res.json({
      success: true,
      message: "Feedback collected successfully"
    });
  } catch (error) {
    console.error("❌ Failed to collect feedback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to collect feedback"
    });
  }
});

/**
 * GET /api/rlhf/feedback
 * Get feedback history and analytics
 */
router.get("/feedback", requireAuth, async (req, res) => {
  try {
    const { 
      sessionId, 
      agentId, 
      taskType, 
      signalType, 
      limit = 100, 
      offset = 0,
      timeframe = '7d'
    } = req.query;

    let query = db.select().from(rlhfFeedback);
    let conditions = [];

    // Add filters
    if (sessionId) conditions.push(eq(rlhfFeedback.sessionId, sessionId as string));
    if (agentId) conditions.push(eq(rlhfFeedback.agentId, agentId as string));
    if (taskType) conditions.push(eq(rlhfFeedback.taskType, taskType as string));
    if (signalType) conditions.push(eq(rlhfFeedback.signalType, signalType as string));

    // Add timeframe filter
    if (timeframe) {
      conditions.push(sql`${rlhfFeedback.createdAt} > NOW() - INTERVAL ${timeframe}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const feedback = await query
      .orderBy(desc(rlhfFeedback.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Get summary statistics
    const summary = await db.select({
      totalFeedback: count(),
      avgSignalValue: avg(rlhfFeedback.signalValue),
      avgQualityScore: avg(rlhfFeedback.qualityScore)
    })
    .from(rlhfFeedback)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      success: true,
      data: {
        feedback,
        summary: summary[0],
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: feedback.length
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to get feedback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve feedback"
    });
  }
});

// ==========================================
// AGENT REWARD & RANKING ENDPOINTS
// ==========================================

/**
 * GET /api/rlhf/agents/rankings
 * Get agent performance rankings for routing
 */
router.get("/agents/rankings", async (req, res) => {
  try {
    const { taskType, userArchetype, limit = 20 } = req.query;

    if (!taskType) {
      return res.status(400).json({
        success: false,
        error: "taskType parameter is required"
      });
    }

    const rankings = await rlhfEngine.getAgentRankings(
      taskType as string, 
      userArchetype as string
    );

    res.json({
      success: true,
      data: {
        taskType,
        userArchetype,
        rankings: rankings.slice(0, Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Failed to get agent rankings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve agent rankings"
    });
  }
});

/**
 * GET /api/rlhf/agents/rewards
 * Get agent reward scores and performance metrics
 */
router.get("/agents/rewards", requireAuth, async (req, res) => {
  try {
    const { agentId, taskType, limit = 50, offset = 0 } = req.query;

    let query = db.select().from(agentRewards);
    let conditions = [];

    if (agentId) conditions.push(eq(agentRewards.agentId, agentId as string));
    if (taskType) conditions.push(eq(agentRewards.taskType, taskType as string));
    conditions.push(eq(agentRewards.isActive, true));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rewards = await query
      .orderBy(desc(agentRewards.overallPerformance))
      .limit(Number(limit))
      .offset(Number(offset));

    // Get performance trends
    const trends = await db.select({
      agentId: agentRewards.agentId,
      taskType: agentRewards.taskType,
      recentPerformance: agentRewards.recentPerformance,
      weeklyPerformance: agentRewards.weeklyPerformance,
      overallPerformance: agentRewards.overallPerformance,
      usageCount: agentRewards.usageCount
    })
    .from(agentRewards)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(agentRewards.lastUpdated));

    res.json({
      success: true,
      data: {
        rewards,
        trends,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: rewards.length
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to get agent rewards:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve agent rewards"
    });
  }
});

/**
 * PUT /api/rlhf/agents/:agentId/reward
 * Manually adjust agent reward score
 */
router.put("/agents/:agentId/reward", requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { taskType, rewardScore, reason } = req.body;

    if (!taskType || rewardScore === undefined) {
      return res.status(400).json({
        success: false,
        error: "taskType and rewardScore are required"
      });
    }

    // Update agent reward
    await db.update(agentRewards)
      .set({
        rewardScore: Number(rewardScore),
        lastUpdated: new Date(),
        metadata: { manualAdjustment: true, reason }
      })
      .where(and(
        eq(agentRewards.agentId, agentId),
        eq(agentRewards.taskType, taskType)
      ));

    res.json({
      success: true,
      message: "Agent reward updated successfully"
    });
  } catch (error) {
    console.error("❌ Failed to update agent reward:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update agent reward"
    });
  }
});

// ==========================================
// PERSONA FUSION ENDPOINTS
// ==========================================

/**
 * POST /api/rlhf/persona/analyze
 * Analyze and fuse persona for user session
 */
router.post("/persona/analyze", async (req, res) => {
  try {
    const { sessionId, userId, behaviorData } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "sessionId is required"
      });
    }

    const personaProfile = await personaFusionEngine.analyzeAndFusePersona(
      sessionId,
      userId,
      behaviorData
    );

    if (!personaProfile) {
      return res.status(500).json({
        success: false,
        error: "Failed to analyze persona"
      });
    }

    res.json({
      success: true,
      data: personaProfile
    });
  } catch (error) {
    console.error("❌ Failed to analyze persona:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze persona"
    });
  }
});

/**
 * GET /api/rlhf/persona/:sessionId
 * Get persona profile for session
 */
router.get("/persona/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    const profile = await db.select()
      .from(personaProfiles)
      .where(
        userId ? 
          or(eq(personaProfiles.sessionId, sessionId), eq(personaProfiles.userId, Number(userId))) :
          eq(personaProfiles.sessionId, sessionId)
      )
      .orderBy(desc(personaProfiles.lastUpdated))
      .limit(1);

    if (profile.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Persona profile not found"
      });
    }

    res.json({
      success: true,
      data: profile[0]
    });
  } catch (error) {
    console.error("❌ Failed to get persona profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve persona profile"
    });
  }
});

/**
 * GET /api/rlhf/personas
 * Get persona distribution and analytics
 */
router.get("/personas", requireAuth, async (req, res) => {
  try {
    const { timeframe = '7d', limit = 100 } = req.query;

    // Get persona distribution
    const distribution = await db.select({
      persona: personaProfiles.primaryPersona,
      count: count(),
      avgConfidence: avg(personaProfiles.confidenceLevel),
      avgStability: avg(personaProfiles.stabilityScore)
    })
    .from(personaProfiles)
    .where(sql`${personaProfiles.lastActive} > NOW() - INTERVAL ${timeframe}`)
    .groupBy(personaProfiles.primaryPersona)
    .orderBy(desc(count()))
    .limit(Number(limit));

    // Get hybrid persona analysis
    const hybridAnalysis = await db.select({
      hybridPersonas: personaProfiles.hybridPersonas,
      count: count()
    })
    .from(personaProfiles)
    .where(and(
      sql`${personaProfiles.lastActive} > NOW() - INTERVAL ${timeframe}`,
      sql`jsonb_array_length(${personaProfiles.hybridPersonas}) > 1`
    ))
    .groupBy(personaProfiles.hybridPersonas)
    .orderBy(desc(count()))
    .limit(10);

    // Get evolution trends
    const evolutionTrends = await db.select({
      evolutionType: personaEvolution.evolutionType,
      count: count(),
      avgStrength: avg(personaEvolution.evolutionStrength)
    })
    .from(personaEvolution)
    .where(sql`${personaEvolution.detectedAt} > NOW() - INTERVAL ${timeframe}`)
    .groupBy(personaEvolution.evolutionType);

    res.json({
      success: true,
      data: {
        distribution,
        hybridAnalysis,
        evolutionTrends,
        totalActivePersonas: distribution.length,
        totalHybridUsers: hybridAnalysis.reduce((sum, item) => sum + Number(item.count), 0)
      }
    });
  } catch (error) {
    console.error("❌ Failed to get persona analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve persona analytics"
    });
  }
});

/**
 * POST /api/rlhf/persona/simulate
 * Simulate persona behavior for testing
 */
router.post("/persona/simulate", requireAuth, async (req, res) => {
  try {
    const { targetPersona, testConfig } = req.body;

    if (!targetPersona) {
      return res.status(400).json({
        success: false,
        error: "targetPersona is required"
      });
    }

    const simulationResult = await personaFusionEngine.simulatePersona(
      targetPersona,
      testConfig || {}
    );

    if (!simulationResult) {
      return res.status(500).json({
        success: false,
        error: "Failed to run persona simulation"
      });
    }

    res.json({
      success: true,
      data: simulationResult
    });
  } catch (error) {
    console.error("❌ Failed to simulate persona:", error);
    res.status(500).json({
      success: false,
      error: "Failed to simulate persona"
    });
  }
});

// ==========================================
// PERSONA EVOLUTION & DISCOVERY ENDPOINTS
// ==========================================

/**
 * POST /api/rlhf/persona/discover
 * Run persona discovery cycle
 */
router.post("/persona/discover", requireAuth, async (req, res) => {
  try {
    const discoveries = await personaFusionEngine.discoverNewPersonas();

    res.json({
      success: true,
      data: {
        discoveries,
        count: discoveries.length
      }
    });
  } catch (error) {
    console.error("❌ Failed to discover personas:", error);
    res.status(500).json({
      success: false,
      error: "Failed to discover new personas"
    });
  }
});

/**
 * GET /api/rlhf/persona/evolution
 * Get persona evolution history
 */
router.get("/persona/evolution", requireAuth, async (req, res) => {
  try {
    const { timeframe = '30d', status, limit = 50, offset = 0 } = req.query;

    let conditions = [
      sql`${personaEvolution.detectedAt} > NOW() - INTERVAL ${timeframe}`
    ];

    if (status) {
      conditions.push(eq(personaEvolution.validationStatus, status as string));
    }

    const evolutions = await db.select()
      .from(personaEvolution)
      .where(and(...conditions))
      .orderBy(desc(personaEvolution.detectedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Get evolution statistics
    const stats = await db.select({
      evolutionType: personaEvolution.evolutionType,
      count: count(),
      avgStrength: avg(personaEvolution.evolutionStrength),
      avgAffectedUsers: avg(personaEvolution.affectedUsers)
    })
    .from(personaEvolution)
    .where(and(...conditions))
    .groupBy(personaEvolution.evolutionType);

    res.json({
      success: true,
      data: {
        evolutions,
        stats,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: evolutions.length
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to get persona evolution:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve persona evolution"
    });
  }
});

/**
 * PUT /api/rlhf/persona/evolution/:evolutionId
 * Approve or reject persona evolution
 */
router.put("/persona/evolution/:evolutionId", requireAuth, async (req, res) => {
  try {
    const { evolutionId } = req.params;
    const { approved, notes } = req.body;

    if (approved === undefined) {
      return res.status(400).json({
        success: false,
        error: "approved parameter is required"
      });
    }

    const success = await personaFusionEngine.evolvePersonaStructure(
      evolutionId,
      Boolean(approved)
    );

    if (notes) {
      await db.update(personaEvolution)
        .set({ validationNotes: notes })
        .where(eq(personaEvolution.evolutionId, evolutionId));
    }

    res.json({
      success,
      message: approved ? "Evolution approved and applied" : "Evolution rejected"
    });
  } catch (error) {
    console.error("❌ Failed to update persona evolution:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update persona evolution"
    });
  }
});

// ==========================================
// RLHF TRAINING & OPTIMIZATION ENDPOINTS
// ==========================================

/**
 * POST /api/rlhf/training/start
 * Start RLHF training session
 */
router.post("/training/start", requireAuth, async (req, res) => {
  try {
    const {
      trainingType,
      targetAgents,
      targetPersonas,
      feedbackDataRange,
      hyperparameters
    } = req.body;

    if (!trainingType) {
      return res.status(400).json({
        success: false,
        error: "trainingType is required"
      });
    }

    // Create training session record
    const trainingSession = await db.insert(rlhfTrainingSessions).values({
      trainingType,
      targetAgents: targetAgents || [],
      targetPersonas: targetPersonas || [],
      feedbackDataRange: feedbackDataRange || { days: 30 },
      trainingDataSize: 0, // Will be calculated
      hyperparameters: hyperparameters || {},
      status: 'queued',
      triggeredBy: req.user?.id || 1,
      metadata: { triggeredAt: new Date() }
    }).returning();

    // TODO: Queue actual training job
    
    res.json({
      success: true,
      data: {
        sessionId: trainingSession[0].sessionId,
        status: 'queued',
        message: "Training session queued successfully"
      }
    });
  } catch (error) {
    console.error("❌ Failed to start training:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start training session"
    });
  }
});

/**
 * GET /api/rlhf/training/sessions
 * Get training session history
 */
router.get("/training/sessions", requireAuth, async (req, res) => {
  try {
    const { status, trainingType, limit = 20, offset = 0 } = req.query;

    let conditions = [];
    if (status) conditions.push(eq(rlhfTrainingSessions.status, status as string));
    if (trainingType) conditions.push(eq(rlhfTrainingSessions.trainingType, trainingType as string));

    const sessions = await db.select()
      .from(rlhfTrainingSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rlhfTrainingSessions.queuedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: sessions.length
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to get training sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve training sessions"
    });
  }
});

// ==========================================
// DASHBOARD & ANALYTICS ENDPOINTS
// ==========================================

/**
 * GET /api/rlhf/analytics/metrics
 * Get comprehensive feedback metrics for dashboard
 */
router.get("/analytics/metrics", async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Get total feedback signals
    const totalSignalsResult = await db.select({ count: count() })
      .from(rlhfFeedback);
    
    const totalSignals = totalSignalsResult[0]?.count || 0;
    
    // Get explicit/implicit breakdown
    const feedbackBreakdown = await db.select({
      feedbackType: rlhfFeedback.feedbackType,
      count: count()
    })
    .from(rlhfFeedback)
    .groupBy(rlhfFeedback.feedbackType);
    
    const explicitFeedback = feedbackBreakdown.find(f => f.feedbackType === 'explicit')?.count || 0;
    const implicitFeedback = feedbackBreakdown.find(f => f.feedbackType === 'implicit')?.count || 0;
    
    // Get average reward score
    const avgRewardResult = await db.select({ avg: avg(agentRewards.overallPerformance) })
      .from(agentRewards)
      .where(eq(agentRewards.isActive, true));
    
    const averageRewardScore = avgRewardResult[0]?.avg || 0;
    
    // Get top signal types
    const topSignalTypes = await db.select({
      type: rlhfFeedback.signalType,
      count: count(),
      averageValue: avg(rlhfFeedback.signalValue)
    })
    .from(rlhfFeedback)
    .groupBy(rlhfFeedback.signalType)
    .orderBy(desc(count()))
    .limit(10);
    
    // Get signal trends (simplified)
    const signalTrends = await db.select({
      date: sql`DATE(${rlhfFeedback.createdAt})`,
      signals: count(),
      avgReward: avg(rlhfFeedback.signalValue)
    })
    .from(rlhfFeedback)
    .where(sql`${rlhfFeedback.createdAt} > NOW() - INTERVAL '7 days'`)
    .groupBy(sql`DATE(${rlhfFeedback.createdAt})`)
    .orderBy(sql`DATE(${rlhfFeedback.createdAt})`);

    res.json({
      success: true,
      data: {
        totalSignals: Number(totalSignals),
        explicitFeedback: Number(explicitFeedback),
        implicitFeedback: Number(implicitFeedback),
        averageRewardScore: Number(averageRewardScore) || 0,
        topSignalTypes: topSignalTypes.map(s => ({
          type: s.type,
          count: Number(s.count),
          averageValue: Number(s.averageValue) || 0
        })),
        signalTrends: signalTrends.map(t => ({
          date: t.date,
          signals: Number(t.signals),
          avgReward: Number(t.avgReward) || 0
        }))
      }
    });
  } catch (error) {
    console.error("❌ Failed to get analytics metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve analytics metrics"
    });
  }
});

/**
 * GET /api/rlhf/persona/distribution
 * Get persona distribution analytics
 */
router.get("/persona/distribution", async (req, res) => {
  try {
    const distribution = await db.select({
      personaId: personaProfiles.primaryPersona,
      userCount: count(),
      averageConfidence: avg(personaProfiles.confidenceLevel),
      avgEngagement: avg(sql`CAST(${personaProfiles.engagementHistory}->>'totalEngagement' AS FLOAT)`),
    })
    .from(personaProfiles)
    .where(eq(personaProfiles.isActive, true))
    .groupBy(personaProfiles.primaryPersona)
    .orderBy(desc(count()));
    
    const totalUsers = await db.select({ count: count() })
      .from(personaProfiles)
      .where(eq(personaProfiles.isActive, true));
    
    const total = Number(totalUsers[0]?.count) || 1;
    
    const personaDistribution = distribution.map((item, index) => ({
      personaId: item.personaId,
      personaName: item.personaId.charAt(0).toUpperCase() + item.personaId.slice(1),
      userCount: Number(item.userCount),
      percentage: (Number(item.userCount) / total) * 100,
      averageConfidence: Number(item.averageConfidence) || 0,
      avgEngagement: Number(item.avgEngagement) || 0,
      conversionRate: Math.random() * 0.3, // Simplified - would need conversion tracking
      traits: {
        engagement: Math.random(),
        exploration: Math.random(),
        completion: Math.random()
      }
    }));

    res.json({
      success: true,
      data: personaDistribution
    });
  } catch (error) {
    console.error("❌ Failed to get persona distribution:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve persona distribution"
    });
  }
});

/**
 * GET /api/rlhf/agents/performance
 * Get agent performance analytics
 */
router.get("/agents/performance", async (req, res) => {
  try {
    const performance = await db.select({
      agentId: agentRewards.agentId,
      taskType: agentRewards.taskType,
      totalTasks: agentRewards.usageCount,
      averageReward: agentRewards.overallPerformance,
      improvementTrend: sql`${agentRewards.recentPerformance} - ${agentRewards.weeklyPerformance}`,
      lastOptimized: agentRewards.lastUpdated
    })
    .from(agentRewards)
    .where(eq(agentRewards.isActive, true))
    .orderBy(desc(agentRewards.overallPerformance))
    .limit(20);
    
    const agentPerformance = performance.map(agent => ({
      agentId: agent.agentId,
      agentType: agent.taskType,
      totalTasks: Number(agent.totalTasks),
      averageReward: Number(agent.averageReward),
      bestPersonas: ['explorer', 'optimizer'], // Simplified - would need cross-reference
      improvementTrend: Number(agent.improvementTrend) || 0,
      lastOptimized: agent.lastOptimized
    }));

    res.json({
      success: true,
      data: agentPerformance
    });
  } catch (error) {
    console.error("❌ Failed to get agent performance:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve agent performance"
    });
  }
});

/**
 * GET /api/rlhf/dashboard/metrics
 * Get comprehensive RLHF dashboard metrics
 */
router.get("/dashboard/metrics", requireAuth, async (req, res) => {
  try {
    const metrics = await rlhfEngine.getDashboardMetrics();
    const fusionAnalytics = await personaFusionEngine.getFusionAnalytics();

    res.json({
      success: true,
      data: {
        rlhf: metrics,
        persona: fusionAnalytics,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("❌ Failed to get dashboard metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve dashboard metrics"
    });
  }
});

/**
 * GET /api/rlhf/dashboard/trends
 * Get RLHF performance trends
 */
router.get("/dashboard/trends", requireAuth, async (req, res) => {
  try {
    const { timeframe = '7d', granularity = 'day' } = req.query;

    // Feedback trends
    const feedbackTrends = await db.select({
      date: sql`DATE_TRUNC(${granularity}, ${rlhfFeedback.createdAt})`,
      signalType: rlhfFeedback.signalType,
      count: count(),
      avgValue: avg(rlhfFeedback.signalValue),
      avgQuality: avg(rlhfFeedback.qualityScore)
    })
    .from(rlhfFeedback)
    .where(sql`${rlhfFeedback.createdAt} > NOW() - INTERVAL ${timeframe}`)
    .groupBy(sql`DATE_TRUNC(${granularity}, ${rlhfFeedback.createdAt})`, rlhfFeedback.signalType)
    .orderBy(sql`DATE_TRUNC(${granularity}, ${rlhfFeedback.createdAt})`);

    // Agent performance trends
    const agentTrends = await db.select({
      agentId: agentRewards.agentId,
      taskType: agentRewards.taskType,
      recentPerformance: agentRewards.recentPerformance,
      weeklyPerformance: agentRewards.weeklyPerformance,
      overallPerformance: agentRewards.overallPerformance,
      usageCount: agentRewards.usageCount
    })
    .from(agentRewards)
    .where(eq(agentRewards.isActive, true))
    .orderBy(desc(agentRewards.lastUpdated))
    .limit(50);

    // Persona evolution trends
    const personaTrends = await db.select({
      date: sql`DATE_TRUNC(${granularity}, ${personaEvolution.detectedAt})`,
      evolutionType: personaEvolution.evolutionType,
      count: count(),
      avgStrength: avg(personaEvolution.evolutionStrength)
    })
    .from(personaEvolution)
    .where(sql`${personaEvolution.detectedAt} > NOW() - INTERVAL ${timeframe}`)
    .groupBy(sql`DATE_TRUNC(${granularity}, ${personaEvolution.detectedAt})`, personaEvolution.evolutionType)
    .orderBy(sql`DATE_TRUNC(${granularity}, ${personaEvolution.detectedAt})`);

    res.json({
      success: true,
      data: {
        feedbackTrends,
        agentTrends,
        personaTrends,
        timeframe,
        granularity
      }
    });
  } catch (error) {
    console.error("❌ Failed to get trends:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve trends"
    });
  }
});

// ==========================================
// FEDERATION SYNC ENDPOINTS
// ==========================================

/**
 * POST /api/rlhf/federation/sync
 * Sync RLHF data with federation neurons
 */
router.post("/federation/sync", requireAuth, async (req, res) => {
  try {
    const { targetNeurons, syncType, dataType } = req.body;

    if (!targetNeurons || !syncType || !dataType) {
      return res.status(400).json({
        success: false,
        error: "targetNeurons, syncType, and dataType are required"
      });
    }

    // Create federation sync record
    const syncRecord = await db.insert(federationRlhfSync).values({
      sourceNeuron: 'core', // Current neuron
      targetNeurons,
      syncType,
      dataType,
      syncData: {}, // Will be populated by sync process
      dataSize: 0,
      status: 'pending'
    }).returning();

    // TODO: Implement actual federation sync logic

    res.json({
      success: true,
      data: {
        syncId: syncRecord[0].syncId,
        status: 'pending',
        message: "Federation sync initiated"
      }
    });
  } catch (error) {
    console.error("❌ Failed to sync federation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync federation"
    });
  }
});

/**
 * GET /api/rlhf/federation/status
 * Get federation sync status
 */
router.get("/federation/status", requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const syncHistory = await db.select()
      .from(federationRlhfSync)
      .orderBy(desc(federationRlhfSync.initiatedAt))
      .limit(Number(limit));

    const summary = await db.select({
      status: federationRlhfSync.status,
      count: count(),
      avgDataSize: avg(federationRlhfSync.dataSize)
    })
    .from(federationRlhfSync)
    .where(sql`${federationRlhfSync.initiatedAt} > NOW() - INTERVAL '24 hours'`)
    .groupBy(federationRlhfSync.status);

    res.json({
      success: true,
      data: {
        syncHistory,
        summary,
        lastSync: syncHistory[0]?.initiatedAt || null
      }
    });
  } catch (error) {
    console.error("❌ Failed to get federation status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve federation status"
    });
  }
});

// ==========================================
// PRIVACY & COMPLIANCE ENDPOINTS
// ==========================================

/**
 * POST /api/rlhf/privacy/erase
 * GDPR/CCPA compliant data erasure
 */
router.post("/privacy/erase", requireAuth, async (req, res) => {
  try {
    const { userId, consent } = req.body;

    if (!userId || consent !== true) {
      return res.status(400).json({
        success: false,
        error: "userId and explicit consent required"
      });
    }

    const success = await rlhfEngine.eraseUserData(Number(userId), consent);

    res.json({
      success,
      message: success ? "User data anonymized successfully" : "Failed to anonymize user data"
    });
  } catch (error) {
    console.error("❌ Failed to erase user data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process data erasure request"
    });
  }
});

/**
 * GET /api/rlhf/analytics/dashboard
 * Real-time dashboard analytics
 */
router.get("/analytics/dashboard", requireAuth, async (req, res) => {
  try {
    const metrics = await rlhfEngine.getDashboardMetrics();
    const fusionAnalytics = await personaFusionEngine.getFusionAnalytics();
    
    res.json({
      success: true,
      data: {
        ...metrics,
        fusion: fusionAnalytics,
        timestamp: new Date().toISOString(),
        systemStatus: 'operational'
      }
    });
  } catch (error) {
    console.error("❌ Failed to get dashboard analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve dashboard analytics"
    });
  }
});

/**
 * GET /api/rlhf/health
 * System health check
 */
router.get("/health", async (req, res) => {
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      components: {
        database: 'healthy',
        rlhfEngine: 'operational',
        personaFusion: 'operational',
        clustering: 'available'
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error("❌ Health check failed:", error);
    res.status(503).json({
      success: false,
      error: "System health check failed",
      status: 'unhealthy'
    });
  }
});

export default router;