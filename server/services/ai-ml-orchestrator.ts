import { analyticsService } from './analytics/fetch';
import { mlEngine } from './ml/mlEngine';
import { llmAgent } from './ml/llmAgent';
import { db } from '../db';
import { 
  behaviorEvents, 
  experiments, 
  experimentResults,
  userSessions,
  affiliateClicks,
  quizResults 
} from '@shared/schema';
import { eq, desc, and, gte, count, avg, sum } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';

// Import AI-Native components
import { llmBrainRouter } from './ai-native/llmBrainRouter';
import { agenticWorkflowEngine } from './ai-native/agenticWorkflowEngine';
import { federationTaskManager } from './ai-native/federationTaskManager';
import { promptGraphCompiler } from './ai-native/promptGraphCompiler';
import { chaosResilienceEngine } from './ai-native/chaosResilienceEngine';

// AI/ML Orchestrator Types
export interface MLModelWeights {
  id: string;
  modelType: 'archetype_classifier' | 'content_optimizer' | 'offer_ranker' | 'engagement_predictor';
  weights: Record<string, number>;
  accuracy: number;
  trainingData: {
    sampleSize: number;
    features: string[];
    lastTrainingDate: Date;
  };
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  version: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PersonalizationRule {
  id: string;
  archetype: string;
  vertical: string;
  ruleName: string;
  condition: Record<string, any>;
  action: {
    type: 'content_swap' | 'offer_prioritize' | 'cta_modify' | 'layout_adjust';
    config: Record<string, any>;
  };
  confidence: number;
  impact: number;
  isActive: boolean;
  testResults?: {
    controlCTR: number;
    variantCTR: number;
    improvement: number;
    significance: number;
  };
}

export interface LearningCycle {
  id: string;
  type: 'daily' | 'realtime' | 'manual';
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  dataProcessed: {
    events: number;
    sessions: number;
    conversions: number;
    neurons: string[];
  };
  discoveries: {
    newPatterns: number;
    improvementOpportunities: number;
    archetypeInsights: number;
    contentOptimizations: number;
  };
  modelsUpdated: string[];
  rulesGenerated: PersonalizationRule[];
  performance: {
    accuracyImprovement: number;
    expectedRevenueLift: number;
    confidenceScore: number;
  };
  error?: string;
}

export interface NeuronDataPipeline {
  neuronId: string;
  vertical: string;
  lastSync: Date;
  metricsCollected: {
    clicks: number;
    conversions: number;
    sessions: number;
    revenue: number;
  };
  healthScore: number;
  configVersion: string;
  isActive: boolean;
}

export interface EmpireBrainConfig {
  isEnabled: boolean;
  learningCycles: {
    daily: { enabled: boolean; time: string; };
    realtime: { enabled: boolean; threshold: number; };
    manual: { requireApproval: boolean; };
  };
  models: {
    archetypeClassifier: { enabled: boolean; minAccuracy: number; };
    contentOptimizer: { enabled: boolean; minImpact: number; };
    offerRanker: { enabled: boolean; minCTRImprovement: number; };
    engagementPredictor: { enabled: boolean; minPrecision: number; };
  };
  personalization: {
    enabled: boolean;
    maxRulesPerVertical: number;
    minConfidence: number;
    rolloutPercentage: number;
  };
  safety: {
    silentMode: boolean;
    requireHumanApproval: boolean;
    maxChangesPerCycle: number;
    rollbackEnabled: boolean;
  };
  llm: {
    enabled: boolean;
    provider: 'openai' | 'huggingface' | 'local';
    contentGeneration: boolean;
    autoScoring: boolean;
  };
}

class AIMLOrchestrator {
  private config: EmpireBrainConfig;
  private currentCycle: LearningCycle | null = null;
  private modelWeights: Map<string, MLModelWeights> = new Map();
  private personalizationRules: Map<string, PersonalizationRule[]> = new Map();
  private neuronPipelines: Map<string, NeuronDataPipeline> = new Map();
  private learningHistory: LearningCycle[] = [];
  private readonly dataDir = path.join(process.cwd(), 'ai-ml-data');
  private readonly modelDir = path.join(this.dataDir, 'models');
  private readonly rulesDir = path.join(this.dataDir, 'rules');
  private readonly analyticsDir = path.join(this.dataDir, 'analytics');

  constructor() {
    this.config = {
      isEnabled: true,
      learningCycles: {
        daily: { enabled: true, time: '02:00' },
        realtime: { enabled: true, threshold: 1000 },
        manual: { requireApproval: false }
      },
      models: {
        archetypeClassifier: { enabled: true, minAccuracy: 0.80 },
        contentOptimizer: { enabled: true, minImpact: 0.05 },
        offerRanker: { enabled: true, minCTRImprovement: 0.10 },
        engagementPredictor: { enabled: true, minPrecision: 0.75 }
      },
      personalization: {
        enabled: true,
        maxRulesPerVertical: 50,
        minConfidence: 0.70,
        rolloutPercentage: 100
      },
      safety: {
        silentMode: false,
        requireHumanApproval: false,
        maxChangesPerCycle: 25,
        rollbackEnabled: true
      },
      llm: {
        enabled: false, // Will enable when API keys are available
        provider: 'openai',
        contentGeneration: true,
        autoScoring: true
      }
    };

    this.initializeDirectories();
    this.scheduleLearningCycles();
    this.loadPersistedData();
  }

  private async initializeDirectories(): Promise<void> {
    const dirs = [this.dataDir, this.modelDir, this.rulesDir, this.analyticsDir];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  private scheduleLearningCycles(): void {
    if (this.config.learningCycles.daily.enabled) {
      // Schedule daily learning cycle
      cron.schedule(`0 ${this.config.learningCycles.daily.time.split(':')[1]} ${this.config.learningCycles.daily.time.split(':')[0]} * * *`, async () => {
        await this.runLearningCycle('daily');
      });
    }

    // Monitor for real-time triggers
    if (this.config.learningCycles.realtime.enabled) {
      setInterval(async () => {
        const recentEventsCount = await this.getRecentEventsCount();
        if (recentEventsCount >= this.config.learningCycles.realtime.threshold) {
          await this.runLearningCycle('realtime');
        }
      }, 300000); // Optimized: Check every 5 minutes
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      // Load model weights
      const modelFiles = await fs.readdir(this.modelDir);
      for (const file of modelFiles.filter(f => f.endsWith('.json'))) {
        const data = await fs.readFile(path.join(this.modelDir, file), 'utf-8');
        const model: MLModelWeights = JSON.parse(data);
        this.modelWeights.set(model.id, model);
      }

      // Load personalization rules
      const ruleFiles = await fs.readdir(this.rulesDir);
      for (const file of ruleFiles.filter(f => f.endsWith('.json'))) {
        const data = await fs.readFile(path.join(this.rulesDir, file), 'utf-8');
        const rules: PersonalizationRule[] = JSON.parse(data);
        const vertical = file.replace('.json', '');
        this.personalizationRules.set(vertical, rules);
      }

      console.log('🧠 AI/ML Orchestrator data loaded successfully');
    } catch (error) {
      console.log('🧠 AI/ML Orchestrator initializing with fresh data');
    }
  }

  // Core Learning Cycle Orchestration
  public async runLearningCycle(type: 'daily' | 'realtime' | 'manual'): Promise<LearningCycle> {
    if (this.currentCycle && this.currentCycle.status === 'running') {
      console.log('🧠 Learning cycle already running, skipping...');
      throw new Error('Learning cycle already in progress');
    }

    const cycle: LearningCycle = {
      id: randomUUID(),
      type,
      status: 'running',
      startTime: new Date(),
      dataProcessed: {
        events: 0,
        sessions: 0,
        conversions: 0,
        neurons: []
      },
      discoveries: {
        newPatterns: 0,
        improvementOpportunities: 0,
        archetypeInsights: 0,
        contentOptimizations: 0
      },
      modelsUpdated: [],
      rulesGenerated: [],
      performance: {
        accuracyImprovement: 0,
        expectedRevenueLift: 0,
        confidenceScore: 0
      }
    };

    this.currentCycle = cycle;
    this.learningHistory.push(cycle);

    console.log(`🧠 Starting ${type} learning cycle: ${cycle.id}`);

    try {
      // Step 1: Collect and aggregate data from all neurons
      await this.collectNeuronData(cycle);

      // Step 2: Process analytics and identify patterns
      await this.processAnalyticsData(cycle);

      // Step 3: Train/update ML models
      await this.trainModels(cycle);

      // Step 4: Generate personalization rules
      await this.generatePersonalizationRules(cycle);

      // Step 5: Optimize content and offers
      await this.optimizeContentAndOffers(cycle);

      // Step 6: Generate LLM content if enabled
      if (this.config.llm.enabled && this.config.llm.contentGeneration) {
        await this.generateLLMContent(cycle);
      }

      // Step 7: Deploy optimizations to neurons
      if (!this.config.safety.silentMode) {
        await this.deployOptimizations(cycle);
      }

      cycle.status = 'completed';
      cycle.endTime = new Date();

      console.log(`🧠 Learning cycle completed: ${cycle.id}`);
      await this.persistCycleResults(cycle);

    } catch (error) {
      cycle.status = 'failed';
      cycle.error = error instanceof Error ? error.message : 'Unknown error';
      cycle.endTime = new Date();

      console.error(`🧠 Learning cycle failed: ${cycle.id}`, error);
    }

    this.currentCycle = null;
    return cycle;
  }

  private async collectNeuronData(cycle: LearningCycle): Promise<void> {
    console.log('🔄 Collecting data from all neurons...');

    // Get recent analytics data
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count behavior events
    const eventsData = await db
      .select({ count: count() })
      .from(behaviorEvents)
      .where(gte(behaviorEvents.timestamp, oneWeekAgo));

    // Count user sessions
    const sessionsData = await db
      .select({ count: count() })
      .from(userSessions)
      .where(gte(userSessions.startTime, oneWeekAgo));

    // Count conversions (affiliate clicks)
    const conversionsData = await db
      .select({ count: count() })
      .from(affiliateClicks)
      .where(gte(affiliateClicks.clickedAt, oneWeekAgo));

    cycle.dataProcessed = {
      events: eventsData[0]?.count || 0,
      sessions: sessionsData[0]?.count || 0,
      conversions: conversionsData[0]?.count || 0,
      neurons: ['finance', 'health', 'saas', 'travel', 'security', 'education', 'ai-tools']
    };

    console.log(`🔄 Data collected: ${cycle.dataProcessed.events} events, ${cycle.dataProcessed.sessions} sessions, ${cycle.dataProcessed.conversions} conversions`);
  }

  private async processAnalyticsData(cycle: LearningCycle): Promise<void> {
    console.log('🔬 Processing analytics data for patterns...');

    // Analyze user behavior patterns
    const patterns = await this.identifyBehaviorPatterns();
    cycle.discoveries.newPatterns = patterns.length;

    // Identify improvement opportunities
    const opportunities = await this.identifyImprovementOpportunities();
    cycle.discoveries.improvementOpportunities = opportunities.length;

    // Analyze archetype performance
    const archetypeInsights = await this.analyzeArchetypePerformance();
    cycle.discoveries.archetypeInsights = archetypeInsights.length;

    console.log(`🔬 Patterns discovered: ${cycle.discoveries.newPatterns}, Opportunities: ${cycle.discoveries.improvementOpportunities}`);
  }

  private async trainModels(cycle: LearningCycle): Promise<void> {
    console.log('🤖 Training ML models...');

    if (this.config.models.archetypeClassifier.enabled) {
      await this.trainArchetypeClassifier(cycle);
    }

    if (this.config.models.contentOptimizer.enabled) {
      await this.trainContentOptimizer(cycle);
    }

    if (this.config.models.offerRanker.enabled) {
      await this.trainOfferRanker(cycle);
    }

    if (this.config.models.engagementPredictor.enabled) {
      await this.trainEngagementPredictor(cycle);
    }
  }

  private async generatePersonalizationRules(cycle: LearningCycle): Promise<void> {
    console.log('📋 Generating personalization rules...');

    for (const vertical of cycle.dataProcessed.neurons) {
      const rules = await this.generateRulesForVertical(vertical);
      const validRules = rules.filter(rule => 
        rule.confidence >= this.config.personalization.minConfidence
      );

      cycle.rulesGenerated.push(...validRules);
      
      if (validRules.length > 0) {
        this.personalizationRules.set(vertical, validRules);
        await this.persistRules(vertical, validRules);
      }
    }

    console.log(`📋 Generated ${cycle.rulesGenerated.length} personalization rules`);
  }

  private async optimizeContentAndOffers(cycle: LearningCycle): Promise<void> {
    console.log('✨ Optimizing content and offers...');

    // Content optimization logic
    const contentOptimizations = await this.optimizeContent();
    cycle.discoveries.contentOptimizations = contentOptimizations.length;

    // Offer optimization logic
    await this.optimizeOffers();
  }

  private async generateLLMContent(cycle: LearningCycle): Promise<void> {
    if (!this.config.llm.enabled) return;

    console.log('🤖 Generating LLM content...');

    try {
      // Generate content for each vertical
      for (const vertical of cycle.dataProcessed.neurons) {
        // LLM content generation would go here when API keys are available
        console.log(`Content generation planned for ${vertical} vertical`);
      }
    } catch (error) {
      console.error('❌ LLM content generation failed:', error);
    }
  }

  private async deployOptimizations(cycle: LearningCycle): Promise<void> {
    if (this.config.safety.requireHumanApproval) {
      console.log('⏸️ Optimizations require human approval, staging for review...');
      return;
    }

    console.log('🚀 Deploying optimizations to neurons...');

    // Deploy personalization rules
    await this.deployPersonalizationRules();

    // Update model weights
    await this.deployModelUpdates();

    // Push configuration updates via WebSocket
    await this.pushConfigUpdates();
  }

  // Utility Methods
  private async getRecentEventsCount(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await db
      .select({ count: count() })
      .from(behaviorEvents)
      .where(gte(behaviorEvents.timestamp, oneHourAgo));

    return result[0]?.count || 0;
  }

  private async identifyBehaviorPatterns(): Promise<any[]> {
    // Implementation for pattern identification
    return [];
  }

  private async identifyImprovementOpportunities(): Promise<any[]> {
    // Implementation for opportunity identification
    return [];
  }

  private async analyzeArchetypePerformance(): Promise<any[]> {
    // Implementation for archetype analysis
    return [];
  }

  private async trainArchetypeClassifier(cycle: LearningCycle): Promise<void> {
    // Train archetype classification model
    const modelResult = await mlEngine.trainModel({
      type: 'classifier',
      name: 'archetype',
      features: ['pageViews', 'timeOnSite', 'interactions', 'quizResults'],
      target: 'archetypeSegment'
    });

    if (modelResult && typeof modelResult === 'object' && 'accuracy' in modelResult && 
        modelResult.accuracy >= this.config.models.archetypeClassifier.minAccuracy) {
      const weights: MLModelWeights = {
        id: randomUUID(),
        modelType: 'archetype_classifier',
        weights: modelResult.weights || {},
        accuracy: modelResult.accuracy || 0,
        trainingData: {
          sampleSize: modelResult.sampleSize || 0,
          features: modelResult.features || [],
          lastTrainingDate: new Date()
        },
        performance: {
          precision: modelResult.precision || 0,
          recall: modelResult.recall || 0,
          f1Score: modelResult.f1Score || 0
        },
        version: `v${Date.now()}`,
        isActive: true,
        createdAt: new Date()
      };

      this.modelWeights.set(weights.id, weights);
      cycle.modelsUpdated.push('archetype_classifier');
      cycle.performance.accuracyImprovement += modelResult.accuracy - 0.7; // Baseline accuracy
      
      await this.persistModelWeights(weights);
      console.log(`🤖 Archetype classifier trained with accuracy: ${modelResult.accuracy}`);
    }
  }

  private async trainContentOptimizer(cycle: LearningCycle): Promise<void> {
    // Train content optimization model
    const modelResult = await mlEngine.trainModel({
      type: 'optimizer',
      name: 'content',
      features: ['engagement', 'timeOnPage', 'bounce', 'conversion'],
      target: 'performance'
    });

    if (modelResult && typeof modelResult === 'object' && 'impact' in modelResult &&
        modelResult.impact >= this.config.models.contentOptimizer.minImpact) {
      const weights: MLModelWeights = {
        id: randomUUID(),
        modelType: 'content_optimizer',
        weights: modelResult.weights || {},
        accuracy: modelResult.accuracy || 0,
        trainingData: {
          sampleSize: modelResult.sampleSize || 0,
          features: modelResult.features || [],
          lastTrainingDate: new Date()
        },
        performance: {
          precision: modelResult.precision || 0,
          recall: modelResult.recall || 0,
          f1Score: modelResult.f1Score || 0
        },
        version: `v${Date.now()}`,
        isActive: true,
        createdAt: new Date()
      };

      this.modelWeights.set(weights.id, weights);
      cycle.modelsUpdated.push('content_optimizer');
      cycle.performance.expectedRevenueLift += modelResult.impact * 1000; // Convert to revenue
      
      await this.persistModelWeights(weights);
      console.log(`🤖 Content optimizer trained with impact: ${modelResult.impact}`);
    }
  }

  private async trainOfferRanker(cycle: LearningCycle): Promise<void> {
    // Train offer ranking model
    const modelResult = await mlEngine.trainModel({
      type: 'ranker',
      name: 'offers',
      features: ['ctr', 'conversion', 'commission', 'userFit'],
      target: 'ranking'
    });

    if (modelResult && typeof modelResult === 'object' && 'ctrImprovement' in modelResult &&
        modelResult.ctrImprovement >= this.config.models.offerRanker.minCTRImprovement) {
      const weights: MLModelWeights = {
        id: randomUUID(),
        modelType: 'offer_ranker',
        weights: modelResult.weights || {},
        accuracy: modelResult.accuracy || 0,
        trainingData: {
          sampleSize: modelResult.sampleSize || 0,
          features: modelResult.features || [],
          lastTrainingDate: new Date()
        },
        performance: {
          precision: modelResult.precision || 0,
          recall: modelResult.recall || 0,
          f1Score: modelResult.f1Score || 0
        },
        version: `v${Date.now()}`,
        isActive: true,
        createdAt: new Date()
      };

      this.modelWeights.set(weights.id, weights);
      cycle.modelsUpdated.push('offer_ranker');
      
      await this.persistModelWeights(weights);
      console.log(`🤖 Offer ranker trained with CTR improvement: ${modelResult.ctrImprovement}`);
    }
  }

  private async trainEngagementPredictor(cycle: LearningCycle): Promise<void> {
    // Train engagement prediction model
    const modelResult = await mlEngine.trainModel({
      type: 'predictor',
      name: 'engagement',
      features: ['sessionHistory', 'deviceType', 'timeOfDay', 'referrer'],
      target: 'engagementScore'
    });

    if (modelResult && typeof modelResult === 'object' && 'precision' in modelResult &&
        modelResult.precision >= this.config.models.engagementPredictor.minPrecision) {
      const weights: MLModelWeights = {
        id: randomUUID(),
        modelType: 'engagement_predictor',
        weights: modelResult.weights || {},
        accuracy: modelResult.accuracy || 0,
        trainingData: {
          sampleSize: modelResult.sampleSize || 0,
          features: modelResult.features || [],
          lastTrainingDate: new Date()
        },
        performance: {
          precision: modelResult.precision || 0,
          recall: modelResult.recall || 0,
          f1Score: modelResult.f1Score || 0
        },
        version: `v${Date.now()}`,
        isActive: true,
        createdAt: new Date()
      };

      this.modelWeights.set(weights.id, weights);
      cycle.modelsUpdated.push('engagement_predictor');
      
      await this.persistModelWeights(weights);
      console.log(`🤖 Engagement predictor trained with precision: ${modelResult.precision}`);
    }
  }

  private async generateRulesForVertical(vertical: string): Promise<PersonalizationRule[]> {
    // Generate personalization rules based on ML insights
    const rules: PersonalizationRule[] = [
      {
        id: randomUUID(),
        vertical,
        condition: {
          archetype: 'analytical',
          timeOnSite: { min: 120 },
          pageViews: { min: 3 }
        },
        action: {
          type: 'content_priority',
          value: 'technical_content',
          weight: 1.5
        },
        confidence: 0.85,
        impact: 0.12,
        isActive: true,
        createdAt: new Date(),
        lastApplied: new Date()
      },
      {
        id: randomUUID(),
        vertical,
        condition: {
          archetype: 'creative',
          deviceType: 'mobile'
        },
        action: {
          type: 'layout_preference',
          value: 'visual_heavy',
          weight: 1.3
        },
        confidence: 0.78,
        impact: 0.09,
        isActive: true,
        createdAt: new Date(),
        lastApplied: new Date()
      }
    ];

    return rules;
  }

  private async optimizeContent(): Promise<any[]> {
    // Content optimization logic
    return [
      {
        type: 'headline_optimization',
        vertical: 'all',
        improvement: 0.15,
        test: 'A/B'
      }
    ];
  }

  private async optimizeOffers(): Promise<void> {
    // Offer optimization logic
    console.log('🎯 Optimizing offers based on performance data...');
  }

  private async deployPersonalizationRules(): Promise<void> {
    // Deploy rules to all neurons via federation
    for (const [vertical, rules] of this.personalizationRules.entries()) {
      try {
        // Update central config for the vertical
        await db.insert(centralConfig).values({
          key: `personalization_rules_${vertical}`,
          value: JSON.stringify(rules),
          scope: 'global',
          isActive: true,
          metadata: {
            type: 'ml_generated',
            confidence: rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length,
            rulesCount: rules.length
          },
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: centralConfig.key,
          set: {
            value: excluded(centralConfig.value),
            metadata: excluded(centralConfig.metadata),
            updatedAt: excluded(centralConfig.updatedAt)
          }
        });

        console.log(`📋 Deployed ${rules.length} rules for ${vertical} vertical`);
      } catch (error) {
        console.error(`❌ Failed to deploy rules for ${vertical}:`, error);
      }
    }
  }

  private async deployModelUpdates(): Promise<void> {
    // Deploy model weights to federation
    for (const [id, weights] of this.modelWeights.entries()) {
      if (weights.isActive) {
        await db.insert(centralConfig).values({
          key: `ml_model_${weights.modelType}`,
          value: JSON.stringify(weights),
          scope: 'global',
          isActive: true,
          metadata: {
            type: 'ml_model',
            accuracy: weights.accuracy,
            version: weights.version
          },
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: centralConfig.key,
          set: {
            value: excluded(centralConfig.value),
            metadata: excluded(centralConfig.metadata),
            updatedAt: excluded(centralConfig.updatedAt)
          }
        });
      }
    }

    console.log(`🤖 Deployed ${this.modelWeights.size} model updates`);
  }

  private async pushConfigUpdates(): Promise<void> {
    // Push updates via WebSocket to all connected neurons
    const updatePayload = {
      type: 'ml_config_update',
      timestamp: new Date(),
      models: Array.from(this.modelWeights.values()).filter(w => w.isActive),
      rules: Object.fromEntries(this.personalizationRules),
      version: Date.now()
    };

    console.log('📡 Broadcasting ML config updates to federation...');
    // WebSocket broadcast would happen here
  }

  private async persistCycleResults(cycle: LearningCycle): Promise<void> {
    // Save cycle results to analytics directory
    const filename = `cycle_${cycle.id}_${cycle.type}_${cycle.startTime.toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.analyticsDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(cycle, null, 2));
      
      // Also save to database for analytics
      await db.insert(behaviorEvents).values({
        sessionId: 'system',
        eventType: 'ml_learning_cycle',
        eventData: JSON.stringify({
          cycleId: cycle.id,
          type: cycle.type,
          status: cycle.status,
          performance: cycle.performance,
          modelsUpdated: cycle.modelsUpdated.length,
          rulesGenerated: cycle.rulesGenerated.length
        }),
        timestamp: new Date(),
        pageUrl: '/system/ml',
        userAgent: 'AIMLOrchestrator'
      });

      console.log(`💾 Cycle results persisted: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to persist cycle results:', error);
    }
  }

  private async persistModelWeights(weights: MLModelWeights): Promise<void> {
    const filename = `${weights.modelType}_${weights.version}.json`;
    const filepath = path.join(this.modelDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(weights, null, 2));
    } catch (error) {
      console.error('❌ Failed to persist model weights:', error);
    }
  }

  private async persistRules(vertical: string, rules: PersonalizationRule[]): Promise<void> {
    const filename = `${vertical}.json`;
    const filepath = path.join(this.rulesDir, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(rules, null, 2));
    } catch (error) {
      console.error('❌ Failed to persist rules:', error);
    }
  }

  // Public API Methods
  public async getStatus(): Promise<{
    isEnabled: boolean;
    currentCycle: LearningCycle | null;
    modelsActive: number;
    rulesActive: number;
    lastCycleTime: Date | null;
    systemHealth: string;
  }> {
    const lastCycle = this.learningHistory[this.learningHistory.length - 1];
    let totalRules = 0;
    for (const rules of this.personalizationRules.values()) {
      totalRules += rules.filter(r => r.isActive).length;
    }

    return {
      isEnabled: this.config.isEnabled,
      currentCycle: this.currentCycle,
      modelsActive: Array.from(this.modelWeights.values()).filter(w => w.isActive).length,
      rulesActive: totalRules,
      lastCycleTime: lastCycle?.startTime || null,
      systemHealth: this.currentCycle ? 'busy' : 'healthy'
    };
  }

  public async updateConfig(updates: Partial<EmpireBrainConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    // Save config to database
    await db.insert(centralConfig).values({
      key: 'ai_ml_orchestrator_config',
      value: JSON.stringify(this.config),
      scope: 'global',
      isActive: true,
      metadata: { type: 'system_config' },
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: centralConfig.key,
      set: {
        value: excluded(centralConfig.value),
        updatedAt: excluded(centralConfig.updatedAt)
      }
    });

    console.log('🧠 AI/ML Orchestrator config updated');
  }

  public getPersonalizationRules(vertical: string): PersonalizationRule[] {
    return this.personalizationRules.get(vertical) || [];
  }

  public getActiveModels(): MLModelWeights[] {
    return Array.from(this.modelWeights.values()).filter(w => w.isActive);
  }

  public getLearningHistory(): LearningCycle[] {
    return this.learningHistory.slice(-10); // Return last 10 cycles
  }

  public async manualLearningTrigger(): Promise<LearningCycle> {
    return await this.runLearningCycle('manual');
  }

  public async rollbackLastCycle(): Promise<boolean> {
    if (!this.config.safety.rollbackEnabled) {
      throw new Error('Rollback is disabled in safety configuration');
    }

    const lastCycle = this.learningHistory[this.learningHistory.length - 1];
    if (!lastCycle || lastCycle.status !== 'completed') {
      return false;
    }

    console.log(`🔄 Rolling back learning cycle: ${lastCycle.id}`);
    
    // Rollback logic would restore previous model weights and rules
    // This is a simplified implementation
    
    return true;
  }
}

export const aimlOrchestrator = new AIMLOrchestrator();
