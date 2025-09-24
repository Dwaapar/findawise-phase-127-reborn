/**
 * ML Optimizer Service - Enhanced with AI/ML Engine Integration
 * 
 * This service provides comprehensive ML-powered optimization:
 * - Real machine learning model integration via mlEngine
 * - LLM-powered insights via llmAgent
 * - Feature extraction and prediction capabilities
 * - Hybrid rule-based + ML optimization
 */

import { mlEngine } from './mlEngine';
import { llmAgent, type LLMConfig } from './llmAgent';

export interface OptimizationSuggestion {
  type: 'color' | 'text' | 'layout' | 'timing' | 'targeting';
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
  expectedImpact: string;
}

export interface MLOptimizationRequest {
  type: 'emotion' | 'cta' | 'content' | 'offer' | 'page';
  target: string;
  currentConfig: any;
  performanceData: any;
  contextData?: any;
}

export interface MLOptimizationResponse {
  suggestions: OptimizationSuggestion[];
  confidence: number;
  reasoning: string;
  expectedImpact: {
    ctr: number;
    engagement: number;
    conversion: number;
  };
}

class MLOptimizerService {
  private readonly COLOR_PSYCHOLOGY = {
    trust: {
      highPerformance: ['hsl(147, 70%, 52%)', 'hsl(120, 60%, 45%)', 'hsl(134, 65%, 48%)'],
      lowPerformance: ['hsl(147, 30%, 70%)', 'hsl(120, 40%, 60%)']
    },
    excitement: {
      highPerformance: ['hsl(43, 96%, 56%)', 'hsl(35, 85%, 55%)', 'hsl(50, 90%, 50%)'],
      lowPerformance: ['hsl(43, 60%, 70%)', 'hsl(35, 50%, 65%)']
    },
    relief: {
      highPerformance: ['hsl(262, 83%, 68%)', 'hsl(270, 75%, 65%)', 'hsl(255, 80%, 70%)'],
      lowPerformance: ['hsl(262, 50%, 80%)', 'hsl(270, 40%, 75%)']
    },
    confidence: {
      highPerformance: ['hsl(0, 84%, 60%)', 'hsl(355, 80%, 58%)', 'hsl(5, 85%, 62%)'],
      lowPerformance: ['hsl(0, 50%, 70%)', 'hsl(355, 45%, 65%)']
    },
    calm: {
      highPerformance: ['hsl(188, 94%, 43%)', 'hsl(200, 85%, 45%)', 'hsl(180, 90%, 40%)'],
      lowPerformance: ['hsl(188, 60%, 65%)', 'hsl(200, 50%, 60%)']
    }
  };

  private readonly CTA_PATTERNS = {
    highConversion: {
      action: ['Get', 'Start', 'Unlock', 'Access', 'Discover', 'Transform'],
      urgency: ['Now', 'Today', 'Instantly', 'Immediately'],
      benefit: ['Free', 'Premium', 'Exclusive', 'Advanced', 'Pro']
    },
    lowConversion: {
      action: ['Click', 'Submit', 'Go', 'Continue'],
      generic: ['Here', 'Button', 'Link']
    }
  };

  /**
   * Optimize emotion theme based on performance data
   */
  async optimizeEmotionTheme(emotion: string, performanceData: any): Promise<any> {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Color optimization based on performance
    if (performanceData.averageCTR < 0.03) {
      const colorSuggestions = this.generateColorSuggestions(emotion, performanceData);
      suggestions.push(...colorSuggestions);
    }

    // Saturation optimization
    if (performanceData.averageEngagement < 0.25) {
      suggestions.push({
        type: 'color',
        field: 'saturation',
        currentValue: this.extractSaturation(performanceData.currentTheme?.primary),
        suggestedValue: '85%',
        confidence: 0.75,
        reason: 'Low engagement suggests need for higher saturation',
        expectedImpact: 'increase engagement by 10-15%'
      });
    }

    // Gradient optimization
    if (performanceData.averageCTR < 0.04) {
      suggestions.push({
        type: 'color',
        field: 'gradient',
        currentValue: performanceData.currentTheme?.gradient,
        suggestedValue: this.generateOptimizedGradient(emotion),
        confidence: 0.65,
        reason: 'CTR below optimal threshold',
        expectedImpact: 'increase CTR by 8-12%'
      });
    }

    return this.formatMLResponse(suggestions, emotion);
  }

  /**
   * Optimize CTA text based on performance patterns
   */
  async optimizeCTAText(ctaText: string, performanceData: any): Promise<any> {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Analyze current CTA structure
    const ctaAnalysis = this.analyzeCTAStructure(ctaText);
    
    // Suggest improvements based on patterns
    if (performanceData.averageCTR < 0.05) {
      if (!ctaAnalysis.hasAction) {
        suggestions.push({
          type: 'text',
          field: 'action_verb',
          currentValue: ctaText,
          suggestedValue: this.generateActionBasedCTA(ctaText),
          confidence: 0.85,
          reason: 'Missing action verb reduces click-through rates',
          expectedImpact: 'increase CTR by 15-25%'
        });
      }
      
      if (!ctaAnalysis.hasUrgency) {
        suggestions.push({
          type: 'text',
          field: 'urgency',
          currentValue: ctaText,
          suggestedValue: this.addUrgencyToCTA(ctaText),
          confidence: 0.70,
          reason: 'Adding urgency can improve conversion rates',
          expectedImpact: 'increase conversion by 10-20%'
        });
      }
    }

    return this.formatMLResponse(suggestions, ctaText);
  }

  /**
   * Optimize content based on user engagement patterns
   */
  async optimizeContent(contentType: string, performanceData: any): Promise<any> {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Length optimization
    if (performanceData.averageEngagement < 0.30) {
      suggestions.push({
        type: 'text',
        field: 'length',
        currentValue: performanceData.wordCount || 'unknown',
        suggestedValue: this.getOptimalWordCount(performanceData),
        confidence: 0.70,
        reason: 'Engagement below optimal threshold',
        expectedImpact: 'increase engagement by 12-18%'
      });
    }

    // Structure optimization
    if (performanceData.bounceRate > 0.60) {
      suggestions.push({
        type: 'layout',
        field: 'structure',
        currentValue: 'current',
        suggestedValue: 'scannable_format',
        confidence: 0.75,
        reason: 'High bounce rate suggests content structure issues',
        expectedImpact: 'reduce bounce rate by 15-25%'
      });
    }

    return this.formatMLResponse(suggestions, contentType);
  }

  /**
   * Optimize offer placement and presentation
   */
  async optimizeOffer(offerData: any, performanceData: any): Promise<any> {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Placement optimization
    if (performanceData.averageCTR < 0.06) {
      suggestions.push({
        type: 'layout',
        field: 'placement',
        currentValue: offerData.position || 'unknown',
        suggestedValue: this.getOptimalPlacement(performanceData),
        confidence: 0.80,
        reason: 'CTR below optimal for current placement',
        expectedImpact: 'increase CTR by 20-30%'
      });
    }

    // Timing optimization
    if (performanceData.conversionRate < 0.08) {
      suggestions.push({
        type: 'timing',
        field: 'display_timing',
        currentValue: offerData.timing || 'immediate',
        suggestedValue: this.getOptimalTiming(performanceData),
        confidence: 0.65,
        reason: 'Conversion rate suggests suboptimal timing',
        expectedImpact: 'increase conversion by 15-25%'
      });
    }

    return this.formatMLResponse(suggestions, offerData.slug);
  }

  /**
   * Generate color suggestions based on performance
   */
  private generateColorSuggestions(emotion: string, performanceData: any): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const emotionColors = this.COLOR_PSYCHOLOGY[emotion as keyof typeof this.COLOR_PSYCHOLOGY];
    
    if (emotionColors && performanceData.averageCTR < 0.04) {
      const suggestedColor = emotionColors.highPerformance[0];
      
      suggestions.push({
        type: 'color',
        field: 'primary',
        currentValue: performanceData.currentTheme?.primary,
        suggestedValue: suggestedColor,
        confidence: 0.80,
        reason: 'Color psychology suggests this hue performs better',
        expectedImpact: 'increase CTR by 12-18%'
      });
    }

    return suggestions;
  }

  /**
   * Analyze CTA structure for optimization opportunities
   */
  private analyzeCTAStructure(ctaText: string): any {
    const lowerText = ctaText.toLowerCase();
    
    return {
      hasAction: this.CTA_PATTERNS.highConversion.action.some(action => 
        lowerText.includes(action.toLowerCase())
      ),
      hasUrgency: this.CTA_PATTERNS.highConversion.urgency.some(urgency => 
        lowerText.includes(urgency.toLowerCase())
      ),
      hasBenefit: this.CTA_PATTERNS.highConversion.benefit.some(benefit => 
        lowerText.includes(benefit.toLowerCase())
      ),
      wordCount: ctaText.split(' ').length,
      length: ctaText.length
    };
  }

  /**
   * Generate action-based CTA
   */
  private generateActionBasedCTA(currentCTA: string): string {
    const actions = this.CTA_PATTERNS.highConversion.action;
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    // If CTA is generic, replace it
    if (currentCTA.toLowerCase().includes('click here') || 
        currentCTA.toLowerCase().includes('submit') ||
        currentCTA.toLowerCase() === 'go') {
      return `${randomAction} Started`;
    }
    
    // Otherwise, prepend action
    return `${randomAction} ${currentCTA}`;
  }

  /**
   * Add urgency to CTA
   */
  private addUrgencyToCTA(currentCTA: string): string {
    const urgencyWords = this.CTA_PATTERNS.highConversion.urgency;
    const randomUrgency = urgencyWords[Math.floor(Math.random() * urgencyWords.length)];
    
    return `${currentCTA} ${randomUrgency}`;
  }

  /**
   * Get optimal word count based on performance
   */
  private getOptimalWordCount(performanceData: any): string {
    if (performanceData.averageEngagement < 0.20) {
      return '300-500 words'; // Shorter for low engagement
    } else if (performanceData.averageEngagement > 0.40) {
      return '800-1200 words'; // Longer for high engagement
    }
    return '500-800 words'; // Medium length
  }

  /**
   * Get optimal placement based on performance
   */
  private getOptimalPlacement(performanceData: any): string {
    if (performanceData.averageCTR < 0.03) {
      return 'header'; // More prominent placement
    } else if (performanceData.averageCTR > 0.08) {
      return 'inline'; // Current placement working well
    }
    return 'sidebar'; // Balanced placement
  }

  /**
   * Get optimal timing based on performance
   */
  private getOptimalTiming(performanceData: any): string {
    if (performanceData.bounceRate > 0.70) {
      return 'exit_intent'; // Catch users before they leave
    } else if (performanceData.averageEngagement > 0.35) {
      return 'scroll_50'; // Show when engaged
    }
    return 'time_30s'; // Show after 30 seconds
  }

  /**
   * Generate optimized gradient
   */
  private generateOptimizedGradient(emotion: string): string {
    const emotionColors = this.COLOR_PSYCHOLOGY[emotion as keyof typeof this.COLOR_PSYCHOLOGY];
    if (!emotionColors) return '';
    
    const colors = emotionColors.highPerformance;
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1] || colors[0]} 100%)`;
  }

  /**
   * Extract saturation from HSL color
   */
  private extractSaturation(hslColor: string): string {
    if (!hslColor) return '50%';
    const match = hslColor.match(/hsl\(\d+,\s*(\d+%)/);
    return match ? match[1] : '50%';
  }

  /**
   * Format ML response
   */
  private formatMLResponse(suggestions: OptimizationSuggestion[], target: string): any {
    const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
    
    return {
      suggestions,
      confidence: avgConfidence,
      reasoning: `Analyzed ${target} performance patterns and generated ${suggestions.length} optimization suggestions`,
      expectedImpact: {
        ctr: this.calculateExpectedCTRImpact(suggestions),
        engagement: this.calculateExpectedEngagementImpact(suggestions),
        conversion: this.calculateExpectedConversionImpact(suggestions)
      }
    };
  }

  /**
   * Calculate expected CTR impact
   */
  private calculateExpectedCTRImpact(suggestions: OptimizationSuggestion[]): number {
    return suggestions.reduce((sum, s) => {
      if (s.expectedImpact.includes('CTR')) {
        const match = s.expectedImpact.match(/(\d+)-(\d+)%/);
        if (match) {
          const avg = (parseInt(match[1]) + parseInt(match[2])) / 2;
          return sum + (avg * s.confidence);
        }
      }
      return sum;
    }, 0) / 100;
  }

  /**
   * Calculate expected engagement impact
   */
  private calculateExpectedEngagementImpact(suggestions: OptimizationSuggestion[]): number {
    return suggestions.reduce((sum, s) => {
      if (s.expectedImpact.includes('engagement')) {
        const match = s.expectedImpact.match(/(\d+)-(\d+)%/);
        if (match) {
          const avg = (parseInt(match[1]) + parseInt(match[2])) / 2;
          return sum + (avg * s.confidence);
        }
      }
      return sum;
    }, 0) / 100;
  }

  /**
   * Calculate expected conversion impact
   */
  private calculateExpectedConversionImpact(suggestions: OptimizationSuggestion[]): number {
    return suggestions.reduce((sum, s) => {
      if (s.expectedImpact.includes('conversion')) {
        const match = s.expectedImpact.match(/(\d+)-(\d+)%/);
        if (match) {
          const avg = (parseInt(match[1]) + parseInt(match[2])) / 2;
          return sum + (avg * s.confidence);
        }
      }
      return sum;
    }, 0) / 100;
  }

  /**
   * Enhanced ML model integration with real AI/ML capabilities
   */
  async callMLModel(request: MLOptimizationRequest): Promise<MLOptimizationResponse> {
    try {
      console.log(`🤖 Calling ML model for ${request.type} optimization`);
      
      // Extract features from performance data
      const features = mlEngine.extractFeatures(request.performanceData, request.contextData);
      
      // Try ML prediction first
      let mlSuggestions: OptimizationSuggestion[] = [];
      let mlConfidence = 0;
      
      try {
        const modelName = this.getModelNameForType(request.type);
        const prediction = await mlEngine.predict(modelName, features);
        
        // Convert ML prediction to optimization suggestions
        mlSuggestions = this.convertPredictionToSuggestions(prediction, request);
        mlConfidence = prediction.confidence;
        
        console.log(`✅ ML prediction successful (${mlConfidence}% confidence)`);
      } catch (mlError) {
        console.warn(`⚠️  ML prediction failed, falling back to rule-based:`, mlError);
      }
      
      // Get rule-based suggestions as fallback/enhancement
      const ruleSuggestions = await this.getRuleBasedSuggestions(request);
      
      // Combine ML and rule-based suggestions
      const combinedSuggestions = this.combineSuggestions(mlSuggestions, ruleSuggestions);
      
      // Get LLM insights for additional context
      let llmInsights = null;
      try {
        const llmConfig: LLMConfig = {
          provider: 'openrouter',
          model: 'anthropic/claude-3-haiku',
          apiKey: process.env.OPENROUTER_API_KEY || '',
          maxTokens: 1000,
          temperature: 0.7
        };
        
        if (llmConfig.apiKey) {
          llmInsights = await llmAgent.generateInsights({
            type: this.mapTypeToLLMAnalysis(request.type),
            scope: 'single_page',
            targetEntity: request.target,
            analyticsData: request.performanceData,
            contextData: request.contextData
          }, llmConfig);
        }
      } catch (llmError) {
        console.warn(`⚠️  LLM insights failed:`, llmError);
      }
      
      // Build final response
      const response: MLOptimizationResponse = {
        suggestions: combinedSuggestions,
        confidence: this.calculateOverallConfidence(mlConfidence, combinedSuggestions),
        reasoning: this.buildReasoningText(mlSuggestions, ruleSuggestions, llmInsights),
        expectedImpact: this.calculateExpectedImpact(combinedSuggestions)
      };
      
      return response;
      
    } catch (error) {
      console.error(`❌ ML model call failed:`, error);
      
      // Fallback to rule-based optimization
      return this.getRuleBasedOptimization(request);
    }
  }

  /**
   * Enhanced LLM-powered content analysis
   */
  async generateLLMInsights(
    analyticsData: any, 
    contextData: any, 
    analysisType: 'content_suggestion' | 'cta_optimization' | 'experiment_proposal' = 'content_suggestion'
  ): Promise<any> {
    try {
      const llmConfig: LLMConfig = {
        provider: 'openrouter',
        model: 'anthropic/claude-3-sonnet',
        apiKey: process.env.OPENROUTER_API_KEY || '',
        maxTokens: 2000,
        temperature: 0.7
      };
      
      if (!llmConfig.apiKey) {
        console.warn('⚠️  No LLM API key available, skipping LLM insights');
        return null;
      }
      
      const insights = await llmAgent.generateInsights({
        type: analysisType,
        scope: 'single_page',
        analyticsData,
        contextData
      }, llmConfig);
      
      return insights;
      
    } catch (error) {
      console.error(`❌ LLM insights generation failed:`, error);
      return null;
    }
  }

  /**
   * Train ML models with analytics data
   */
  async trainOptimizationModel(modelType: 'content_optimizer' | 'cta_predictor' | 'emotion_classifier'): Promise<string> {
    try {
      console.log(`🧠 Training ${modelType} model`);
      
      const trainingRequest = {
        modelName: `${modelType}_${Date.now()}`,
        modelType,
        algorithm: 'random_forest' as const,
        features: this.getFeatureSetForModel(modelType),
        targetVariable: this.getTargetVariableForModel(modelType),
        trainingDataFilter: {
          dateRange: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
            end: new Date()
          },
          minSamples: 100,
          entityTypes: [modelType.replace('_optimizer', '').replace('_predictor', '').replace('_classifier', '')],
          performanceThreshold: 0.1
        },
        hyperparameters: {
          n_estimators: 100,
          max_depth: 10,
          min_samples_split: 5,
          random_state: 42
        },
        validationSplit: 0.2,
        testSplit: 0.1
      };
      
      const modelId = await mlEngine.trainModel(trainingRequest);
      console.log(`✅ Model training completed: ${modelId}`);
      
      return modelId;
      
    } catch (error) {
      console.error(`❌ Model training failed:`, error);
      throw error;
    }
  }

  /**
   * Get model name for optimization type
   */
  private getModelNameForType(type: string): string {
    const modelMap: Record<string, string> = {
      content: 'content_optimizer',
      cta: 'cta_predictor',
      emotion: 'emotion_classifier',
      offer: 'content_optimizer',
      page: 'content_optimizer'
    };
    
    return modelMap[type] || 'content_optimizer';
  }

  /**
   * Convert ML prediction to optimization suggestions
   */
  private convertPredictionToSuggestions(prediction: any, request: MLOptimizationRequest): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Convert prediction based on type
    if (typeof prediction.prediction === 'object' && prediction.prediction.suggestions) {
      for (const mlSuggestion of prediction.prediction.suggestions) {
        suggestions.push({
          type: mlSuggestion.type || 'text',
          field: mlSuggestion.field || 'content',
          currentValue: mlSuggestion.currentValue,
          suggestedValue: mlSuggestion.suggestedValue,
          confidence: prediction.confidence,
          reason: `ML Model: ${mlSuggestion.reason || prediction.explanation}`,
          expectedImpact: mlSuggestion.expectedImpact || `${prediction.confidence}% confidence improvement`
        });
      }
    } else {
      // Single prediction value
      suggestions.push({
        type: 'text',
        field: request.type,
        currentValue: request.currentConfig,
        suggestedValue: prediction.prediction,
        confidence: prediction.confidence,
        reason: prediction.explanation || 'ML model recommendation',
        expectedImpact: `${(prediction.confidence * 0.01 * 0.15 * 100).toFixed(1)}% expected improvement`
      });
    }
    
    return suggestions;
  }

  /**
   * Get rule-based suggestions for comparison
   */
  private async getRuleBasedSuggestions(request: MLOptimizationRequest): Promise<OptimizationSuggestion[]> {
    switch (request.type) {
      case 'emotion':
        const emotionResult = await this.optimizeEmotionTheme(request.target, request.performanceData);
        return emotionResult.suggestions;
      case 'cta':
        const ctaResult = await this.optimizeCTAText(request.target, request.performanceData);
        return ctaResult.suggestions;
      case 'content':
        const contentResult = await this.optimizeContent(request.target, request.performanceData);
        return contentResult.suggestions;
      case 'offer':
        const offerResult = await this.optimizeOffer(request.currentConfig, request.performanceData);
        return offerResult.suggestions;
      default:
        return [];
    }
  }

  /**
   * Combine ML and rule-based suggestions
   */
  private combineSuggestions(mlSuggestions: OptimizationSuggestion[], ruleSuggestions: OptimizationSuggestion[]): OptimizationSuggestion[] {
    const combined = [...mlSuggestions];
    
    // Add rule-based suggestions that don't conflict with ML suggestions
    for (const ruleSuggestion of ruleSuggestions) {
      const conflict = mlSuggestions.find(ml => 
        ml.field === ruleSuggestion.field && ml.type === ruleSuggestion.type
      );
      
      if (!conflict) {
        // Mark as rule-based
        ruleSuggestion.reason = `Rule-based: ${ruleSuggestion.reason}`;
        combined.push(ruleSuggestion);
      }
    }
    
    // Sort by confidence
    return combined.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(mlConfidence: number, suggestions: OptimizationSuggestion[]): number {
    if (suggestions.length === 0) return 0;
    
    const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
    
    // Weight ML confidence higher if available
    if (mlConfidence > 0) {
      return Math.round((mlConfidence * 0.7 + avgConfidence * 0.3));
    }
    
    return Math.round(avgConfidence);
  }

  /**
   * Build reasoning text
   */
  private buildReasoningText(mlSuggestions: OptimizationSuggestion[], ruleSuggestions: OptimizationSuggestion[], llmInsights: any): string {
    const parts = [];
    
    if (mlSuggestions.length > 0) {
      parts.push(`ML analysis identified ${mlSuggestions.length} optimization opportunities`);
    }
    
    if (ruleSuggestions.length > 0) {
      parts.push(`Rule-based analysis found ${ruleSuggestions.length} additional improvements`);
    }
    
    if (llmInsights?.insights?.summary) {
      parts.push(`LLM insights: ${llmInsights.insights.summary}`);
    }
    
    return parts.join('. ') || 'Analysis completed with available optimization techniques';
  }

  /**
   * Calculate expected impact
   */
  private calculateExpectedImpact(suggestions: OptimizationSuggestion[]): { ctr: number; engagement: number; conversion: number } {
    const ctr = this.calculateExpectedCTRImpact(suggestions);
    const engagement = this.calculateExpectedEngagementImpact(suggestions);
    const conversion = this.calculateExpectedConversionImpact(suggestions);
    
    return { ctr, engagement, conversion };
  }

  /**
   * Get rule-based optimization as fallback
   */
  private async getRuleBasedOptimization(request: MLOptimizationRequest): Promise<MLOptimizationResponse> {
    switch (request.type) {
      case 'emotion':
        return this.optimizeEmotionTheme(request.target, request.performanceData);
      case 'cta':
        return this.optimizeCTAText(request.target, request.performanceData);
      case 'content':
        return this.optimizeContent(request.target, request.performanceData);
      case 'offer':
        return this.optimizeOffer(request.currentConfig, request.performanceData);
      default:
        return {
          suggestions: [],
          confidence: 0,
          reasoning: 'Unsupported optimization type',
          expectedImpact: { ctr: 0, engagement: 0, conversion: 0 }
        };
    }
  }

  /**
   * Map optimizer type to LLM analysis type
   */
  private mapTypeToLLMAnalysis(type: string): 'content_suggestion' | 'cta_optimization' | 'experiment_proposal' {
    const mapping: Record<string, 'content_suggestion' | 'cta_optimization' | 'experiment_proposal'> = {
      content: 'content_suggestion',
      page: 'content_suggestion',
      cta: 'cta_optimization',
      offer: 'experiment_proposal',
      emotion: 'experiment_proposal'
    };
    
    return mapping[type] || 'content_suggestion';
  }

  /**
   * Get feature set for model training
   */
  private getFeatureSetForModel(modelType: string): string[] {
    const baseFeatures = [
      'pageAge', 'wordCount', 'imageCount', 'linkCount', 'headingCount',
      'averageTimeOnPage', 'bounceRate', 'pageViews', 'uniqueVisitors',
      'dayOfWeek', 'hourOfDay', 'isWeekend', 'scrollDepth'
    ];
    
    switch (modelType) {
      case 'content_optimizer':
        return [...baseFeatures, 'emotionType', 'emotionIntensity', 'ctaCount', 'moduleCount'];
      case 'cta_predictor':
        return [...baseFeatures, 'ctaCount', 'emotionType', 'clickThroughRate'];
      case 'emotion_classifier':
        return [...baseFeatures, 'emotionIntensity', 'engagementScore', 'conversionRate'];
      default:
        return baseFeatures;
    }
  }

  /**
   * Get target variable for model training
   */
  private getTargetVariableForModel(modelType: string): string {
    switch (modelType) {
      case 'content_optimizer':
        return 'engagementScore';
      case 'cta_predictor':
        return 'clickThroughRate';
      case 'emotion_classifier':
        return 'emotionOptimal';
      default:
        return 'performance';
    }
  }
}

export const mlOptimizer = new MLOptimizerService();