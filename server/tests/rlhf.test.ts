/**
 * RLHF + Persona Fusion Engine - Comprehensive Test Suite
 * Billion-Dollar Empire Grade Testing
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { rlhfEngine } from '../services/rlhf/rlhfEngine';
import { personaFusionEngine } from '../services/rlhf/personaFusionEngine';
import { db } from '../db';
import { rlhfFeedback, agentRewards, personaProfiles, personaEvolution } from '../../shared/rlhfTables';
import { eq } from 'drizzle-orm';

describe('RLHF + Persona Fusion Engine', () => {
  const testSessionId = 'test_session_' + Date.now();
  const testUserId = 99999;
  const testAgentId = 'test_agent_v1';

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(rlhfFeedback).where(eq(rlhfFeedback.sessionId, testSessionId));
    await db.delete(agentRewards).where(eq(agentRewards.agentId, testAgentId));
    await db.delete(personaProfiles).where(eq(personaProfiles.sessionId, testSessionId));
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(rlhfFeedback).where(eq(rlhfFeedback.sessionId, testSessionId));
    await db.delete(agentRewards).where(eq(agentRewards.agentId, testAgentId));
    await db.delete(personaProfiles).where(eq(personaProfiles.sessionId, testSessionId));
  });

  describe('Feedback Collection', () => {
    it('should collect explicit feedback with privacy compliance', async () => {
      const signal = {
        sessionId: testSessionId,
        userId: testUserId,
        agentId: testAgentId,
        promptVersion: 'v1.0',
        taskType: 'content_generation',
        feedbackType: 'explicit' as const,
        signalType: 'thumbs_up',
        signalValue: 1.0,
        interactionDuration: 5000,
        deviceType: 'desktop',
        browserInfo: { browser: 'chrome', version: '120.0' },
        geoLocation: 'New York, NY',
        metadata: { test: true }
      };

      await rlhfEngine.collectFeedback(signal);

      // Verify feedback was stored
      const stored = await db.select()
        .from(rlhfFeedback)
        .where(eq(rlhfFeedback.sessionId, testSessionId))
        .limit(1);

      expect(stored).toHaveLength(1);
      expect(stored[0].feedbackType).toBe('explicit');
      expect(stored[0].signalType).toBe('thumbs_up');
      expect(stored[0].signalValue).toBe(1.0);
      expect(stored[0].processingStatus).toBe('processed');
    });

    it('should collect implicit feedback with quality scoring', async () => {
      const signal = {
        sessionId: testSessionId + '_implicit',
        userId: testUserId,
        agentId: testAgentId,
        taskType: 'offer_routing',
        feedbackType: 'implicit' as const,
        signalType: 'scroll_depth_75',
        signalValue: 0.85,
        interactionDuration: 15000,
        deviceType: 'mobile'
      };

      await rlhfEngine.collectFeedback(signal);

      const stored = await db.select()
        .from(rlhfFeedback)
        .where(eq(rlhfFeedback.sessionId, signal.sessionId))
        .limit(1);

      expect(stored).toHaveLength(1);
      expect(stored[0].qualityScore).toBeGreaterThan(0.5);
      expect(stored[0].confidenceScore).toBeGreaterThan(0);
    });

    it('should detect and reject bot behavior', async () => {
      const botSignal = {
        sessionId: testSessionId + '_bot',
        taskType: 'content_generation',
        feedbackType: 'implicit' as const,
        signalType: 'click',
        signalValue: 1.0,
        interactionDuration: 50 // Suspiciously fast
      };

      await rlhfEngine.collectFeedback(botSignal);

      // Bot signals should be rejected, no database entry
      const stored = await db.select()
        .from(rlhfFeedback)
        .where(eq(rlhfFeedback.sessionId, botSignal.sessionId));

      expect(stored).toHaveLength(0);
    });

    it('should enforce rate limiting', async () => {
      const signal1 = {
        sessionId: testSessionId + '_rate',
        taskType: 'content_generation',
        feedbackType: 'implicit' as const,
        signalType: 'click',
        signalValue: 1.0
      };

      const signal2 = { ...signal1 };

      // First signal should go through
      await rlhfEngine.collectFeedback(signal1);
      
      // Second signal immediately after should be rate limited
      await rlhfEngine.collectFeedback(signal2);

      const stored = await db.select()
        .from(rlhfFeedback)
        .where(eq(rlhfFeedback.sessionId, signal1.sessionId));

      // Only one signal should be stored due to rate limiting
      expect(stored).toHaveLength(1);
    });
  });

  describe('Agent Reward System', () => {
    it('should create new agent reward record', async () => {
      const signal = {
        sessionId: testSessionId + '_reward',
        agentId: testAgentId,
        taskType: 'quiz_scoring',
        feedbackType: 'explicit' as const,
        signalType: 'conversion',
        signalValue: 1.0,
        userArchetype: 'optimizer',
        deviceType: 'desktop',
        geoLocation: 'San Francisco, CA'
      };

      await rlhfEngine.collectFeedback(signal);

      const rewards = await db.select()
        .from(agentRewards)
        .where(eq(agentRewards.agentId, testAgentId));

      expect(rewards).toHaveLength(1);
      expect(rewards[0].taskType).toBe('quiz_scoring');
      expect(rewards[0].performanceScore).toBeGreaterThan(0.8);
      expect(rewards[0].usageCount).toBe(1);
    });

    it('should update existing agent rewards with weighted averages', async () => {
      // First signal
      await rlhfEngine.collectFeedback({
        sessionId: testSessionId + '_update1',
        agentId: testAgentId,
        taskType: 'quiz_scoring',
        feedbackType: 'explicit' as const,
        signalType: 'rating_5',
        signalValue: 1.0
      });

      // Second signal with lower performance
      await rlhfEngine.collectFeedback({
        sessionId: testSessionId + '_update2',
        agentId: testAgentId,
        taskType: 'quiz_scoring',
        feedbackType: 'explicit' as const,
        signalType: 'rating_3',
        signalValue: 0.6
      });

      const rewards = await db.select()
        .from(agentRewards)
        .where(eq(agentRewards.agentId, testAgentId));

      expect(rewards[0].usageCount).toBe(2);
      expect(rewards[0].performanceScore).toBeLessThan(1.0);
      expect(rewards[0].performanceScore).toBeGreaterThan(0.6);
    });

    it('should track persona-specific performance', async () => {
      await rlhfEngine.collectFeedback({
        sessionId: testSessionId + '_persona',
        agentId: testAgentId,
        taskType: 'content_generation',
        feedbackType: 'implicit' as const,
        signalType: 'scroll_depth_75',
        signalValue: 0.9,
        userArchetype: 'learner'
      });

      const rewards = await db.select()
        .from(agentRewards)
        .where(eq(agentRewards.agentId, testAgentId));

      const personaPerf = rewards[0].personaPerformance as Record<string, number>;
      expect(personaPerf).toHaveProperty('learner');
      expect(personaPerf.learner).toBeGreaterThan(0.7);
    });

    it('should calculate routing weights correctly', async () => {
      const rankings = await rlhfEngine.getAgentRankings('quiz_scoring', 'optimizer');
      
      expect(rankings).toBeInstanceOf(Array);
      if (rankings.length > 0) {
        expect(rankings[0]).toHaveProperty('agentId');
        expect(rankings[0]).toHaveProperty('score');
        expect(rankings[0]).toHaveProperty('weight');
        expect(rankings[0].score).toBeGreaterThanOrEqual(0);
        expect(rankings[0].score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Persona Fusion', () => {
    it('should analyze and fuse user persona from behavior', async () => {
      // Simulate explorer behavior
      const explorerSignals = [
        {
          sessionId: testSessionId + '_fusion',
          userId: testUserId + 1,
          taskType: 'content_exploration',
          feedbackType: 'implicit' as const,
          signalType: 'page_view',
          signalValue: 0.8
        },
        {
          sessionId: testSessionId + '_fusion',
          userId: testUserId + 1,
          taskType: 'content_exploration',
          feedbackType: 'implicit' as const,
          signalType: 'scroll_depth_75',
          signalValue: 0.9
        }
      ];

      for (const signal of explorerSignals) {
        await rlhfEngine.collectFeedback(signal);
      }

      const fusionResult = await rlhfEngine.fusePersona(testSessionId + '_fusion', testUserId + 1);

      expect(fusionResult).toBeDefined();
      expect(fusionResult.primaryPersona).toBeDefined();
      expect(fusionResult.primaryScore).toBeGreaterThan(0);
      expect(fusionResult.confidenceLevel).toBeGreaterThan(0);
      expect(fusionResult.hybridPersonas).toBeInstanceOf(Array);
    });

    it('should detect persona drift', async () => {
      const sessionId = testSessionId + '_drift';
      const userId = testUserId + 2;

      // First establish baseline persona (explorer)
      await rlhfEngine.collectFeedback({
        sessionId,
        userId,
        taskType: 'content_exploration',
        feedbackType: 'implicit' as const,
        signalType: 'page_view',
        signalValue: 0.9
      });

      await rlhfEngine.fusePersona(sessionId, userId);

      // Then simulate shift to optimizer behavior
      await rlhfEngine.collectFeedback({
        sessionId,
        userId,
        taskType: 'goal_optimization',
        feedbackType: 'explicit' as const,
        signalType: 'conversion',
        signalValue: 1.0
      });

      await rlhfEngine.fusePersona(sessionId, userId);

      // Check for evolution records
      const evolutions = await db.select()
        .from(personaEvolution)
        .where(eq(personaEvolution.evolutionType, 'drift'));

      expect(evolutions.length).toBeGreaterThan(0);
    });

    it('should store persona profiles with fusion data', async () => {
      const sessionId = testSessionId + '_profile';
      const userId = testUserId + 3;

      await rlhfEngine.collectFeedback({
        sessionId,
        userId,
        taskType: 'learning',
        feedbackType: 'explicit' as const,
        signalType: 'quiz_completion',
        signalValue: 1.0
      });

      const fusionResult = await rlhfEngine.fusePersona(sessionId, userId);

      const profiles = await db.select()
        .from(personaProfiles)
        .where(eq(personaProfiles.sessionId, sessionId));

      expect(profiles).toHaveLength(1);
      expect(profiles[0].primaryPersona).toBe(fusionResult.primaryPersona);
      expect(profiles[0].confidenceLevel).toBeGreaterThan(0);
      expect(profiles[0].personaScores).toBeDefined();
    });
  });

  describe('ML Clustering & Discovery', () => {
    it('should perform ML clustering for persona discovery', async () => {
      // Create diverse persona profiles for clustering
      const testProfiles = [
        { sessionId: 'cluster_1', behaviorType: 'explorer', signals: 5 },
        { sessionId: 'cluster_2', behaviorType: 'optimizer', signals: 8 },
        { sessionId: 'cluster_3', behaviorType: 'learner', signals: 12 },
        { sessionId: 'cluster_4', behaviorType: 'achiever', signals: 6 }
      ];

      for (const profile of testProfiles) {
        for (let i = 0; i < profile.signals; i++) {
          await rlhfEngine.collectFeedback({
            sessionId: profile.sessionId,
            taskType: profile.behaviorType === 'explorer' ? 'exploration' : 'optimization',
            feedbackType: Math.random() > 0.5 ? 'explicit' : 'implicit' as const,
            signalType: profile.behaviorType === 'learner' ? 'quiz_completion' : 'click',
            signalValue: Math.random() * 0.5 + 0.5
          });
        }
        await rlhfEngine.fusePersona(profile.sessionId);
      }

      // Run evolution cycle
      await rlhfEngine.runEvolutionCycle();

      // Evolution cycle should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Privacy & Security', () => {
    it('should anonymize PII data', async () => {
      const signal = {
        sessionId: 'privacy_test_' + Date.now(),
        userId: 12345,
        taskType: 'content_generation',
        feedbackType: 'explicit' as const,
        signalType: 'thumbs_up',
        signalValue: 1.0,
        geoLocation: 'Very Specific Address, City, State 12345'
      };

      await rlhfEngine.collectFeedback(signal);

      const stored = await db.select()
        .from(rlhfFeedback)
        .where(eq(rlhfFeedback.sessionId, signal.sessionId));

      expect(stored[0].geoLocation).not.toBe(signal.geoLocation);
      expect(stored[0].geoLocation).toBe('Very Specific Address'); // Generalized
    });

    it('should handle GDPR data erasure', async () => {
      const testUserId = 88888;
      
      // Create test data
      await rlhfEngine.collectFeedback({
        sessionId: 'erasure_test',
        userId: testUserId,
        taskType: 'content_generation',
        feedbackType: 'explicit' as const,
        signalType: 'thumbs_up',
        signalValue: 1.0
      });

      // Erase user data
      const result = await rlhfEngine.eraseUserData(testUserId, true);
      expect(result).toBe(true);

      // Verify data is anonymized
      const feedback = await db.select()
        .from(rlhfFeedback)
        .where(eq(rlhfFeedback.sessionId, 'erasure_test'));

      expect(feedback[0].userId).toBeNull();
      expect(feedback[0].geoLocation).toBe('anonymized');
    });

    it('should require consent for data erasure', async () => {
      const result = await rlhfEngine.eraseUserData(99999, false);
      expect(result).toBe(false);
    });
  });

  describe('Dashboard Analytics', () => {
    it('should provide comprehensive dashboard metrics', async () => {
      const metrics = await rlhfEngine.getDashboardMetrics();

      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('agentMetrics');
      expect(metrics).toHaveProperty('personaDistribution');
      expect(metrics).toHaveProperty('feedbackTrends');
      expect(metrics).toHaveProperty('totalAgents');
      expect(metrics).toHaveProperty('totalPersonas');
      expect(metrics).toHaveProperty('totalFeedback');

      expect(Array.isArray(metrics.agentMetrics)).toBe(true);
      expect(Array.isArray(metrics.personaDistribution)).toBe(true);
      expect(Array.isArray(metrics.feedbackTrends)).toBe(true);
    });
  });

  describe('Persona Simulation', () => {
    it('should simulate persona behavior for testing', async () => {
      const simulation = await rlhfEngine.simulatePersona('explorer', [
        { scenario: 'content_discovery', duration: 5000 },
        { scenario: 'interaction_test', clicks: 3 }
      ]);

      expect(simulation).toBeDefined();
      expect(simulation).toHaveProperty('simulationId');
      expect(simulation).toHaveProperty('results');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete feedback-to-persona-fusion pipeline', async () => {
      const pipelineSessionId = 'pipeline_' + Date.now();
      const pipelineUserId = 77777;

      // Step 1: Collect diverse feedback
      const feedbackSignals = [
        { signalType: 'page_view', signalValue: 0.7, taskType: 'exploration' },
        { signalType: 'scroll_depth_75', signalValue: 0.9, taskType: 'engagement' },
        { signalType: 'quiz_completion', signalValue: 1.0, taskType: 'learning' },
        { signalType: 'conversion', signalValue: 1.0, taskType: 'optimization' }
      ];

      for (const signal of feedbackSignals) {
        await rlhfEngine.collectFeedback({
          sessionId: pipelineSessionId,
          userId: pipelineUserId,
          agentId: 'pipeline_agent',
          feedbackType: 'implicit' as const,
          ...signal
        });
      }

      // Step 2: Fuse persona
      const fusionResult = await rlhfEngine.fusePersona(pipelineSessionId, pipelineUserId);

      // Step 3: Verify agent rewards updated
      const agentRankings = await rlhfEngine.getAgentRankings('learning');

      // Step 4: Check persona profiles created
      const profiles = await db.select()
        .from(personaProfiles)
        .where(eq(personaProfiles.sessionId, pipelineSessionId));

      // Verify complete pipeline
      expect(fusionResult.primaryPersona).toBeDefined();
      expect(agentRankings).toBeInstanceOf(Array);
      expect(profiles).toHaveLength(1);
      expect(profiles[0].primaryPersona).toBe(fusionResult.primaryPersona);
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-volume feedback processing', async () => {
      const startTime = Date.now();
      const batchSize = 50;
      const promises = [];

      for (let i = 0; i < batchSize; i++) {
        promises.push(rlhfEngine.collectFeedback({
          sessionId: `perf_test_${i}`,
          taskType: 'performance_test',
          feedbackType: 'implicit' as const,
          signalType: 'click',
          signalValue: Math.random()
        }));
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should process 50 signals in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should maintain sub-100ms response times for persona fusion', async () => {
      // Pre-populate with feedback data
      await rlhfEngine.collectFeedback({
        sessionId: 'perf_fusion_test',
        taskType: 'performance_test',
        feedbackType: 'explicit' as const,
        signalType: 'thumbs_up',
        signalValue: 1.0
      });

      const startTime = Date.now();
      await rlhfEngine.fusePersona('perf_fusion_test');
      const duration = Date.now() - startTime;

      // Should complete persona fusion in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});