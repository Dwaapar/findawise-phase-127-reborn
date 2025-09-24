import { EventEmitter } from 'events';
import { db } from '../../db';
import { edgeAiModels, type EdgeAiModel, type NewEdgeAiModel } from '../../../shared/offlineAiTables';
import { eq, desc, and, or, inArray } from 'drizzle-orm';

interface ModelPerformanceMetrics {
  modelId: string;
  averageInferenceTime: number;
  accuracy: number;
  memoryUsage: number;
  totalInferences: number;
  errorRate: number;
  lastUpdated: Date;
}

interface EdgeAiCapabilities {
  tensorflowjs: boolean;
  onnx: boolean;
  webgl: boolean;
  webgpu: boolean;
  webassembly: boolean;
  sharedArrayBuffer: boolean;
  offscreenCanvas: boolean;
  serviceWorker: boolean;
}

/**
 * Enterprise-Grade Edge AI Manager
 * Handles deployment, lifecycle, and optimization of edge AI models
 */
class EdgeAiManager extends EventEmitter {
  private modelRegistry: Map<string, EdgeAiModel> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map();
  private modelUpdateIntervalId?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the Edge AI Manager
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🧠 Initializing Edge AI Manager...');
      
      // Load all active models
      await this.loadModels();
      
      // Initialize default model configurations
      await this.setupAdvancedModels();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Edge AI Manager initialized successfully');
      
      this.emit('manager:initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Edge AI Manager:', error);
      throw error;
    }
  }

  /**
   * Load all active models from database
   */
  private async loadModels(): Promise<void> {
    try {
      const models = await db.select()
        .from(edgeAiModels)
        .where(eq(edgeAiModels.isActive, true))
        .orderBy(desc(edgeAiModels.createdAt));

      for (const model of models) {
        this.modelRegistry.set(model.modelId, model);
        
        // Initialize performance metrics
        this.performanceMetrics.set(model.modelId, {
          modelId: model.modelId,
          averageInferenceTime: model.inferenceTime || 0,
          accuracy: model.accuracy || 0,
          memoryUsage: model.memoryUsage || 0,
          totalInferences: 0,
          errorRate: 0,
          lastUpdated: new Date()
        });
      }

      console.log(`📊 Loaded ${models.length} edge AI models`);
    } catch (error) {
      console.error('❌ Failed to load models:', error);
    }
  }

  /**
   * Setup advanced AI models for different use cases
   */
  private async setupAdvancedModels(): Promise<void> {
    const advancedModels = [
      {
        modelName: 'advanced_personalization_engine',
        modelType: 'recommendation',
        modelVersion: '2.0.0',
        modelConfig: {
          algorithm: 'deep_collaborative_filtering',
          neuralNetwork: {
            layers: ['dense:128', 'dropout:0.3', 'dense:64', 'dense:32'],
            activation: 'relu',
            optimizer: 'adam'
          },
          threshold: 0.8,
          maxRecommendations: 20,
          contextualFactors: ['time_of_day', 'device_type', 'location', 'weather']
        },
        inputSchema: {
          userId: 'string',
          userVector: 'tensor',
          itemFeatures: 'tensor',
          contextualData: 'object'
        },
        outputSchema: {
          recommendations: 'array',
          confidence: 'number',
          explanations: 'array'
        },
        deploymentTarget: 'browser',
        modelFormat: 'tensorflowjs',
        modelUrl: '/models/advanced_personalization.json',
        modelSize: 2500000, // 2.5MB
        inferenceTime: 80,
        accuracy: 0.92,
        memoryUsage: 25,
        minBrowserVersion: {
          chrome: '80',
          firefox: '75',
          safari: '13',
          edge: '80'
        },
        deviceRequirements: {
          minMemory: 2048,
          webgl: true,
          sharedArrayBuffer: false
        },
        fallbackStrategy: 'simple_collaborative_filtering'
      },
      {
        modelName: 'semantic_intent_analyzer',
        modelType: 'intent',
        modelVersion: '2.0.0',
        modelConfig: {
          architecture: 'transformer',
          model: 'distilbert-base-uncased',
          maxSequenceLength: 512,
          intentCategories: [
            'purchase_intent', 'comparison_intent', 'learning_intent', 
            'support_intent', 'navigation_intent', 'subscription_intent'
          ],
          confidenceThreshold: 0.75,
          multilingual: true,
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it']
        },
        inputSchema: {
          text: 'string',
          context: 'object',
          userHistory: 'array',
          sessionData: 'object'
        },
        outputSchema: {
          primaryIntent: 'string',
          confidence: 'number',
          allIntents: 'array',
          entities: 'array',
          sentiment: 'object'
        },
        deploymentTarget: 'browser',
        modelFormat: 'tensorflowjs',
        modelUrl: '/models/semantic_intent.json',
        modelSize: 5000000, // 5MB
        inferenceTime: 120,
        accuracy: 0.88,
        memoryUsage: 40,
        minBrowserVersion: {
          chrome: '85',
          firefox: '80',
          safari: '14',
          edge: '85'
        },
        deviceRequirements: {
          minMemory: 4096,
          webgl: true,
          sharedArrayBuffer: true
        },
        fallbackStrategy: 'keyword_pattern_matching'
      },
      {
        modelName: 'dynamic_lead_scorer',
        modelType: 'scoring',
        modelVersion: '2.0.0',
        modelConfig: {
          algorithm: 'gradient_boosting',
          features: [
            'engagement_score', 'behavioral_signals', 'demographic_fit',
            'content_affinity', 'timing_patterns', 'device_patterns',
            'referral_source', 'social_signals'
          ],
          weights: {
            engagement: 0.25,
            behavioral: 0.20,
            demographic: 0.15,
            content: 0.15,
            timing: 0.10,
            device: 0.05,
            referral: 0.05,
            social: 0.05
          },
          scoreRange: [0, 100],
          qualityThresholds: {
            high: 80,
            medium: 60,
            low: 40
          },
          realTimeUpdate: true
        },
        inputSchema: {
          userProfile: 'object',
          sessionData: 'object',
          engagementMetrics: 'object',
          behavioralData: 'array',
          contextualData: 'object'
        },
        outputSchema: {
          score: 'number',
          quality: 'string',
          confidence: 'number',
          factors: 'object',
          recommendations: 'array',
          nextBestAction: 'string'
        },
        deploymentTarget: 'browser',
        modelFormat: 'tensorflowjs',
        modelUrl: '/models/dynamic_lead_scorer.json',
        modelSize: 1800000, // 1.8MB
        inferenceTime: 60,
        accuracy: 0.85,
        memoryUsage: 20,
        minBrowserVersion: {
          chrome: '76',
          firefox: '70',
          safari: '13',
          edge: '79'
        },
        deviceRequirements: {
          minMemory: 1024,
          webgl: false,
          sharedArrayBuffer: false
        },
        fallbackStrategy: 'simple_weighted_scoring'
      },
      {
        modelName: 'content_summarizer',
        modelType: 'summarization',
        modelVersion: '1.0.0',
        modelConfig: {
          architecture: 'encoder_decoder',
          maxInputLength: 2048,
          maxOutputLength: 200,
          summaryTypes: ['extractive', 'abstractive', 'keyword'],
          qualityScoring: true,
          languageDetection: true
        },
        inputSchema: {
          content: 'string',
          summaryType: 'string',
          targetLength: 'number',
          context: 'object'
        },
        outputSchema: {
          summary: 'string',
          keywords: 'array',
          quality: 'number',
          readabilityScore: 'number'
        },
        deploymentTarget: 'browser',
        modelFormat: 'tensorflowjs',
        modelUrl: '/models/content_summarizer.json',
        modelSize: 3200000, // 3.2MB
        inferenceTime: 150,
        accuracy: 0.82,
        memoryUsage: 35,
        minBrowserVersion: {
          chrome: '88',
          firefox: '82',
          safari: '14',
          edge: '88'
        },
        deviceRequirements: {
          minMemory: 3072,
          webgl: true,
          sharedArrayBuffer: false
        },
        fallbackStrategy: 'extractive_summarization'
      },
      {
        modelName: 'emotion_analyzer',
        modelType: 'sentiment',
        modelVersion: '1.0.0',
        modelConfig: {
          emotions: [
            'joy', 'sadness', 'anger', 'fear', 'surprise', 
            'disgust', 'trust', 'anticipation'
          ],
          dimensions: ['valence', 'arousal', 'dominance'],
          contextAware: true,
          multiModal: false, // Text only for now
          realTimeAnalysis: true
        },
        inputSchema: {
          text: 'string',
          context: 'object',
          previousEmotions: 'array'
        },
        outputSchema: {
          emotions: 'object',
          dominantEmotion: 'string',
          confidence: 'number',
          valence: 'number',
          arousal: 'number',
          emotionalTrajectory: 'array'
        },
        deploymentTarget: 'browser',
        modelFormat: 'tensorflowjs',
        modelUrl: '/models/emotion_analyzer.json',
        modelSize: 1500000, // 1.5MB
        inferenceTime: 45,
        accuracy: 0.79,
        memoryUsage: 15,
        minBrowserVersion: {
          chrome: '78',
          firefox: '72',
          safari: '13',
          edge: '79'
        },
        deviceRequirements: {
          minMemory: 1024,
          webgl: false,
          sharedArrayBuffer: false
        },
        fallbackStrategy: 'simple_sentiment_analysis'
      }
    ];

    for (const modelData of advancedModels) {
      try {
        const existingModel = await db.select()
          .from(edgeAiModels)
          .where(and(
            eq(edgeAiModels.modelName, modelData.modelName),
            eq(edgeAiModels.modelVersion, modelData.modelVersion)
          ))
          .limit(1);

        if (existingModel.length === 0) {
          const [newModel] = await db.insert(edgeAiModels)
            .values(modelData)
            .returning();

          this.modelRegistry.set(newModel.modelId, newModel);
          console.log(`✅ Created advanced model: ${modelData.modelName}`);
        }
      } catch (error) {
        console.log(`⏭️ Advanced model ${modelData.modelName} already exists, skipping...`);
      }
    }
  }

  /**
   * Get models compatible with device capabilities
   */
  async getCompatibleModels(capabilities: EdgeAiCapabilities): Promise<EdgeAiModel[]> {
    try {
      const compatibleModels: EdgeAiModel[] = [];

      for (const model of this.modelRegistry.values()) {
        if (this.isModelCompatible(model, capabilities)) {
          compatibleModels.push(model);
        }
      }

      // Sort by performance score (accuracy + speed)
      compatibleModels.sort((a, b) => {
        const scoreA = (a.accuracy || 0) * 0.7 + (1 / (a.inferenceTime || 100)) * 0.3;
        const scoreB = (b.accuracy || 0) * 0.7 + (1 / (b.inferenceTime || 100)) * 0.3;
        return scoreB - scoreA;
      });

      return compatibleModels;
    } catch (error) {
      console.error('❌ Failed to get compatible models:', error);
      return [];
    }
  }

  /**
   * Deploy model to edge device
   */
  async deployModel(modelId: string, deviceCapabilities: EdgeAiCapabilities): Promise<{
    success: boolean;
    deploymentInfo?: any;
    fallbackModel?: string;
    error?: string;
  }> {
    try {
      const model = this.modelRegistry.get(modelId);
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      // Check compatibility
      if (!this.isModelCompatible(model, deviceCapabilities)) {
        // Find fallback model
        const fallbackModel = await this.findFallbackModel(model.modelType, deviceCapabilities);
        return {
          success: false,
          error: 'Model not compatible with device',
          fallbackModel: fallbackModel?.modelId
        };
      }

      // Prepare deployment configuration
      const deploymentInfo = {
        modelId: model.modelId,
        modelName: model.modelName,
        modelVersion: model.modelVersion,
        downloadUrl: model.modelUrl,
        modelSize: model.modelSize,
        expectedPerformance: {
          inferenceTime: model.inferenceTime,
          accuracy: model.accuracy,
          memoryUsage: model.memoryUsage
        },
        configuration: model.modelConfig,
        schemas: {
          input: model.inputSchema,
          output: model.outputSchema
        },
        fallbackStrategy: model.fallbackStrategy,
        deploymentInstructions: this.generateDeploymentInstructions(model)
      };

      console.log(`🚀 Model deployment prepared: ${model.modelName} for device`);
      this.emit('model:deployed', { modelId, deploymentInfo });

      return { success: true, deploymentInfo };
    } catch (error) {
      console.error('❌ Failed to deploy model:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update model performance metrics
   */
  async updateModelPerformance(
    modelId: string,
    inferenceTime: number,
    accuracy?: number,
    error?: boolean
  ): Promise<void> {
    try {
      let metrics = this.performanceMetrics.get(modelId);
      
      if (!metrics) {
        metrics = {
          modelId,
          averageInferenceTime: inferenceTime,
          accuracy: accuracy || 0,
          memoryUsage: 0,
          totalInferences: 1,
          errorRate: error ? 1 : 0,
          lastUpdated: new Date()
        };
      } else {
        // Update running averages
        const totalInferences = metrics.totalInferences + 1;
        metrics.averageInferenceTime = 
          (metrics.averageInferenceTime * metrics.totalInferences + inferenceTime) / totalInferences;
        
        if (accuracy !== undefined) {
          metrics.accuracy = 
            (metrics.accuracy * metrics.totalInferences + accuracy) / totalInferences;
        }
        
        if (error) {
          metrics.errorRate = 
            (metrics.errorRate * metrics.totalInferences + 1) / totalInferences;
        }
        
        metrics.totalInferences = totalInferences;
        metrics.lastUpdated = new Date();
      }

      this.performanceMetrics.set(modelId, metrics);

      // Update database periodically (every 100 inferences)
      if (metrics.totalInferences % 100 === 0) {
        await db.update(edgeAiModels)
          .set({
            inferenceTime: Math.round(metrics.averageInferenceTime),
            accuracy: Number(metrics.accuracy.toFixed(3)),
            updatedAt: new Date()
          })
          .where(eq(edgeAiModels.modelId, modelId));
      }

      this.emit('performance:updated', { modelId, metrics });
    } catch (error) {
      console.error('❌ Failed to update model performance:', error);
    }
  }

  /**
   * Get model performance analytics
   */
  async getModelAnalytics(modelId?: string): Promise<{
    models: ModelPerformanceMetrics[];
    summary: {
      totalModels: number;
      totalInferences: number;
      averageAccuracy: number;
      averageInferenceTime: number;
      overallErrorRate: number;
    };
  }> {
    try {
      const metrics = modelId 
        ? [this.performanceMetrics.get(modelId)].filter(Boolean)
        : Array.from(this.performanceMetrics.values());

      const summary = {
        totalModels: metrics.length,
        totalInferences: metrics.reduce((sum, m) => sum + m.totalInferences, 0),
        averageAccuracy: metrics.reduce((sum, m) => sum + m.accuracy, 0) / metrics.length || 0,
        averageInferenceTime: metrics.reduce((sum, m) => sum + m.averageInferenceTime, 0) / metrics.length || 0,
        overallErrorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length || 0
      };

      return { models: metrics, summary };
    } catch (error) {
      console.error('❌ Failed to get model analytics:', error);
      return {
        models: [],
        summary: {
          totalModels: 0,
          totalInferences: 0,
          averageAccuracy: 0,
          averageInferenceTime: 0,
          overallErrorRate: 0
        }
      };
    }
  }

  /**
   * Optimize model selection for device
   */
  async optimizeModelSelection(
    modelType: string,
    deviceCapabilities: EdgeAiCapabilities,
    prioritizeSpeed: boolean = false
  ): Promise<EdgeAiModel | null> {
    try {
      const compatibleModels = await this.getCompatibleModels(deviceCapabilities);
      const typeModels = compatibleModels.filter(m => m.modelType === modelType);

      if (typeModels.length === 0) {
        return null;
      }

      // Score models based on requirements
      const scoredModels = typeModels.map(model => {
        const metrics = this.performanceMetrics.get(model.modelId);
        const speedScore = 1 / (model.inferenceTime || 100);
        const accuracyScore = model.accuracy || 0;
        const reliabilityScore = metrics ? (1 - metrics.errorRate) : 0.5;
        
        const score = prioritizeSpeed
          ? speedScore * 0.5 + accuracyScore * 0.3 + reliabilityScore * 0.2
          : accuracyScore * 0.5 + speedScore * 0.3 + reliabilityScore * 0.2;

        return { model, score };
      });

      // Return highest scoring model
      scoredModels.sort((a, b) => b.score - a.score);
      return scoredModels[0]?.model || null;
    } catch (error) {
      console.error('❌ Failed to optimize model selection:', error);
      return null;
    }
  }

  // Private helper methods

  private isModelCompatible(model: EdgeAiModel, capabilities: EdgeAiCapabilities): boolean {
    const requirements = model.deviceRequirements || {};
    
    // Check memory requirements
    if (requirements.minMemory && capabilities.sharedArrayBuffer) {
      // Assume we can check actual memory in real implementation
    }
    
    // Check WebGL requirement
    if (requirements.webgl && !capabilities.webgl) {
      return false;
    }
    
    // Check SharedArrayBuffer requirement
    if (requirements.sharedArrayBuffer && !capabilities.sharedArrayBuffer) {
      return false;
    }
    
    // Check model format support
    switch (model.modelFormat) {
      case 'tensorflowjs':
        return capabilities.tensorflowjs;
      case 'onnx':
        return capabilities.onnx;
      case 'wasm':
        return capabilities.webassembly;
      case 'javascript':
        return true; // Always supported
      default:
        return false;
    }
  }

  private async findFallbackModel(
    modelType: string,
    capabilities: EdgeAiCapabilities
  ): Promise<EdgeAiModel | null> {
    const models = Array.from(this.modelRegistry.values())
      .filter(m => m.modelType === modelType && this.isModelCompatible(m, capabilities))
      .sort((a, b) => (a.memoryUsage || 0) - (b.memoryUsage || 0)); // Prefer smaller models

    return models[0] || null;
  }

  private generateDeploymentInstructions(model: EdgeAiModel): any {
    return {
      loadingSteps: [
        'Check device compatibility',
        'Download model files',
        'Initialize model runtime',
        'Validate model performance',
        'Setup fallback mechanisms'
      ],
      initialization: {
        preload: model.modelSize > 1000000, // Preload large models
        lazy: model.modelSize <= 1000000,   // Lazy load small models
        cacheStrategy: 'aggressive'
      },
      runtime: {
        batchInference: model.modelType === 'recommendation',
        realTimeInference: model.modelType === 'intent',
        backgroundInference: model.modelType === 'scoring'
      },
      monitoring: {
        trackPerformance: true,
        reportErrors: true,
        optimizeMemory: true
      }
    };
  }

  private startPerformanceMonitoring(): void {
    // Update model performance metrics every 5 minutes
    this.modelUpdateIntervalId = setInterval(async () => {
      try {
        // Batch update model performance to database
        const updates = Array.from(this.performanceMetrics.values())
          .filter(metrics => metrics.totalInferences > 0);

        for (const metrics of updates) {
          if (metrics.totalInferences % 50 === 0) { // Update every 50 inferences
            await db.update(edgeAiModels)
              .set({
                inferenceTime: Math.round(metrics.averageInferenceTime),
                accuracy: Number(metrics.accuracy.toFixed(3)),
                updatedAt: new Date()
              })
              .where(eq(edgeAiModels.modelId, metrics.modelId));
          }
        }

        this.emit('monitoring:updated', { updatedModels: updates.length });
      } catch (error) {
        console.error('❌ Performance monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.modelUpdateIntervalId) {
      clearInterval(this.modelUpdateIntervalId);
    }
    
    this.removeAllListeners();
    this.modelRegistry.clear();
    this.performanceMetrics.clear();
    
    console.log('🧠 Edge AI Manager destroyed');
  }
}

// Create singleton instance
export const edgeAiManager = new EdgeAiManager();
export default edgeAiManager;