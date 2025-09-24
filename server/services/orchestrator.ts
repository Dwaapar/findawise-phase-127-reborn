import { analyticsService } from './analytics/fetch';
import { mlOptimizer } from './ml/optimizer';
import { mlEngine } from './ml/mlEngine';
import { llmAgent } from './ml/llmAgent';
import { ranker } from '../utils/ranker';
import { configManager } from '../utils/configManager';
import { changelogGenerator } from '../utils/changelogGenerator';
import { archetypeEngine } from '../utils/archetypeEngine';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface OrchestrationChange {
  id: string;
  type: 'page' | 'emotion' | 'cta' | 'offer' | 'module';
  target: string;
  action: 'promote' | 'demote' | 'modify' | 'remove';
  from?: any;
  to?: any;
  reason: string;
  confidence: number;
  expectedImpact: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    engagement: number;
    conversions?: number;
  };
}

export interface OrchestrationRun {
  id: string;
  timestamp: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  manual: boolean;
  changes: OrchestrationChange[];
  analytics: {
    pagesAnalyzed: number;
    offersAnalyzed: number;
    emotionsAnalyzed: number;
    ctasAnalyzed: number;
    modulesAnalyzed: number;
    changesProposed: number;
    changesApplied: number;
    dataQuality: number;
  };
  performance: {
    expectedCTRImprovement: number;
    expectedEngagementImprovement: number;
    expectedConversionImprovement: number;
  };
  backupId?: string;
  error?: string;
  duration: number;
}

export interface OrchestrationConfig {
  isEnabled: boolean;
  confidenceThreshold: {
    minImpressions: number;
    minCTR: number;
    minEngagement: number;
    minConfidence: number;
  };
  archetype: {
    enabled: boolean;
    segments: string[];
    confidenceThreshold: number;
  };
  safety: {
    backupEnabled: boolean;
    maxChangesPerRun: number;
    requireManualApproval: boolean;
    lockedConfigs: string[];
  };
  optimization: {
    enableEmotionOptimization: boolean;
    enableCTAOptimization: boolean;
    enableOfferOptimization: boolean;
    enableContentOptimization: boolean;
    enableArchetypeOptimization: boolean;
  };
  scheduling: {
    frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
    time?: string;
    enabled: boolean;
  };
}

class OrchestratorService {
  private config: OrchestrationConfig;
  private currentRun: OrchestrationRun | null = null;
  private runHistory: OrchestrationRun[] = [];
  private runInterval: NodeJS.Timeout | null = null;
  private readonly orchestrationDir = path.join(process.cwd(), 'orchestration');

  constructor() {
    this.config = {
      isEnabled: true,
      confidenceThreshold: {
        minImpressions: 100,
        minCTR: 0.03,
        minEngagement: 0.25,
        minConfidence: 0.70
      },
      archetype: {
        enabled: true,
        segments: ['power_user', 'casual_browser', 'high_intent', 'price_sensitive'],
        confidenceThreshold: 0.65
      },
      safety: {
        backupEnabled: true,
        maxChangesPerRun: 20,
        requireManualApproval: false,
        lockedConfigs: []
      },
      optimization: {
        enableEmotionOptimization: true,
        enableCTAOptimization: true,
        enableOfferOptimization: true,
        enableContentOptimization: true,
        enableArchetypeOptimization: true
      },
      scheduling: {
        frequency: 'manual',
        enabled: false
      }
    };

    this.initializeOrchestration();
  }

  /**
   * Initialize orchestration system
   */
  private async initializeOrchestration(): Promise<void> {
    console.log('🤖 AI Orchestrator initializing...');
    
    // Create orchestration directory
    await fs.mkdir(this.orchestrationDir, { recursive: true });
    
    // Load configuration if exists
    await this.loadConfiguration();
    
    // Start scheduled runs if enabled
    if (this.config.scheduling.enabled && this.config.scheduling.frequency !== 'manual') {
      this.startScheduledRuns();
    }
    
    console.log('✅ AI Orchestrator initialized successfully');
  }

  /**
   * Run full orchestration cycle
   */
  async runOrchestration(manual: boolean = false): Promise<OrchestrationRun> {
    if (!this.config.isEnabled) {
      throw new Error('Orchestration is disabled');
    }

    if (this.currentRun) {
      throw new Error('Orchestration is already running');
    }

    const runId = `orch-${Date.now()}-${randomUUID().substring(0, 8)}`;
    const startTime = Date.now();

    this.currentRun = {
      id: runId,
      timestamp: new Date(),
      status: 'running',
      manual,
      changes: [],
      analytics: {
        pagesAnalyzed: 0,
        offersAnalyzed: 0,
        emotionsAnalyzed: 0,
        ctasAnalyzed: 0,
        modulesAnalyzed: 0,
        changesProposed: 0,
        changesApplied: 0,
        dataQuality: 0
      },
      performance: {
        expectedCTRImprovement: 0,
        expectedEngagementImprovement: 0,
        expectedConversionImprovement: 0
      },
      duration: 0
    };

    try {
      console.log(`🚀 Starting orchestration run: ${runId}`);

      // Step 1: Create backup if enabled
      if (this.config.safety.backupEnabled) {
        console.log('💾 Creating configuration backup...');
        this.currentRun.backupId = await configManager.createBackup(runId, `Orchestration backup for run ${runId}`);
      }

      // Step 2: Fetch analytics data
      console.log('📊 Fetching analytics data...');
      const analyticsData = await analyticsService.fetchAnalytics();
      
      this.currentRun.analytics.pagesAnalyzed = analyticsData.pages.length;
      this.currentRun.analytics.offersAnalyzed = analyticsData.offers.length;
      this.currentRun.analytics.emotionsAnalyzed = analyticsData.emotions.length;
      this.currentRun.analytics.ctasAnalyzed = analyticsData.ctas.length;
      this.currentRun.analytics.modulesAnalyzed = analyticsData.modules.length;
      this.currentRun.analytics.dataQuality = analyticsData.summary.dataQuality;

      if (analyticsData.summary.dataQuality < 0.5) {
        console.warn('⚠️  Low data quality detected, proceeding with caution');
      }

      // Step 3: Rank elements by performance
      console.log('🏆 Ranking elements by performance...');
      const rankings = await ranker.rankElements(analyticsData, this.config.confidenceThreshold);

      // Step 4: Generate optimization changes
      console.log('🧠 Generating optimization changes...');
      const changes = await this.generateOptimizationChanges(analyticsData, rankings);
      
      this.currentRun.changes = changes;
      this.currentRun.analytics.changesProposed = changes.length;

      // Step 5: Apply changes (if not requiring manual approval)
      if (!this.config.safety.requireManualApproval) {
        console.log('⚡ Applying optimization changes...');
        await this.applyChanges(changes);
        this.currentRun.analytics.changesApplied = changes.length;
      } else {
        console.log('⏳ Changes generated, awaiting manual approval...');
        this.currentRun.analytics.changesApplied = 0;
      }

      // Step 6: Calculate performance expectations
      this.currentRun.performance = this.calculatePerformanceExpectations(changes);

      // Step 7: Generate changelog
      console.log('📝 Generating changelog...');
      await changelogGenerator.generateChangelog(changes, runId);

      // Step 8: Complete run
      this.currentRun.status = 'completed';
      this.currentRun.duration = Date.now() - startTime;
      
      console.log(`✅ Orchestration run completed: ${runId} (${this.currentRun.duration}ms)`);
      console.log(`📈 Applied ${this.currentRun.analytics.changesApplied} changes`);
      console.log(`🎯 Expected CTR improvement: ${(this.currentRun.performance.expectedCTRImprovement * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Orchestration run failed:', error);
      this.currentRun.status = 'failed';
      this.currentRun.error = error instanceof Error ? error.message : 'Unknown error';
      this.currentRun.duration = Date.now() - startTime;

      // Rollback if backup exists
      if (this.currentRun.backupId && this.config.safety.backupEnabled) {
        console.log('🔄 Rolling back due to failure...');
        try {
          await configManager.rollbackToBackup(this.currentRun.backupId);
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }
      }

      throw error;
    } finally {
      // Add to history and clear current run
      this.runHistory.unshift(this.currentRun);
      
      // Keep only last 50 runs in memory
      if (this.runHistory.length > 50) {
        this.runHistory = this.runHistory.slice(0, 50);
      }

      // Save run to disk
      await this.saveRunToDisk(this.currentRun);
      
      const completedRun = this.currentRun;
      this.currentRun = null;
      
      return completedRun;
    }
  }

  /**
   * Generate optimization changes based on analytics and rankings
   */
  private async generateOptimizationChanges(analyticsData: any, rankings: any[]): Promise<OrchestrationChange[]> {
    const changes: OrchestrationChange[] = [];
    
    // Process poor performing elements
    const poorPerformers = rankings
      .filter(r => r.recommendation === 'needs_improvement')
      .slice(0, this.config.safety.maxChangesPerRun);

    for (const element of poorPerformers) {
      try {
        const change = await this.generateChangeForElement(element, analyticsData);
        if (change) {
          changes.push(change);
        }
      } catch (error) {
        console.warn(`Failed to generate change for ${element.id}:`, error);
      }
    }

    // Process top performers for promotion
    const topPerformers = rankings
      .filter(r => r.recommendation === 'promote')
      .slice(0, Math.floor(this.config.safety.maxChangesPerRun / 2));

    for (const element of topPerformers) {
      try {
        const change = await this.generatePromotionChange(element, analyticsData);
        if (change) {
          changes.push(change);
        }
      } catch (error) {
        console.warn(`Failed to generate promotion for ${element.id}:`, error);
      }
    }

    return changes;
  }

  /**
   * Generate change for underperforming element
   */
  private async generateChangeForElement(element: any, analyticsData: any): Promise<OrchestrationChange | null> {
    const changeId = `change-${Date.now()}-${randomUUID().substring(0, 8)}`;
    
    switch (element.type) {
      case 'page':
        return this.generatePageChange(changeId, element, analyticsData);
      case 'emotion':
        return this.generateEmotionChange(changeId, element, analyticsData);
      case 'cta':
        return this.generateCTAChange(changeId, element, analyticsData);
      case 'offer':
        return this.generateOfferChange(changeId, element, analyticsData);
      case 'module':
        return this.generateModuleChange(changeId, element, analyticsData);
      default:
        return null;
    }
  }

  /**
   * Generate page-specific change
   */
  private async generatePageChange(changeId: string, element: any, analyticsData: any): Promise<OrchestrationChange | null> {
    const pageData = analyticsData.pages.find((p: any) => p.slug === element.id);
    if (!pageData) return null;

    // Use ML optimizer for suggestions
    const mlSuggestions = await mlOptimizer.optimizeContent('page', pageData.metrics);
    
    if (mlSuggestions.suggestions.length === 0) return null;

    const suggestion = mlSuggestions.suggestions[0];
    
    return {
      id: changeId,
      type: 'page',
      target: element.id,
      action: 'modify',
      from: pageData.config,
      to: { ...pageData.config, [suggestion.field]: suggestion.suggestedValue },
      reason: suggestion.reason,
      confidence: suggestion.confidence,
      expectedImpact: suggestion.expectedImpact,
      metrics: {
        impressions: pageData.metrics.impressions,
        clicks: pageData.metrics.clicks,
        ctr: pageData.metrics.ctr,
        engagement: pageData.metrics.engagement,
        conversions: pageData.metrics.conversion
      }
    };
  }

  /**
   * Generate emotion-specific change
   */
  private async generateEmotionChange(changeId: string, element: any, analyticsData: any): Promise<OrchestrationChange | null> {
    const emotionData = analyticsData.emotions.find((e: any) => e.name === element.id);
    if (!emotionData) return null;

    const mlSuggestions = await mlOptimizer.optimizeEmotionTheme(element.id, emotionData.metrics);
    
    if (mlSuggestions.suggestions.length === 0) return null;

    const suggestion = mlSuggestions.suggestions[0];
    
    return {
      id: changeId,
      type: 'emotion',
      target: element.id,
      action: 'modify',
      from: emotionData.theme,
      to: { ...emotionData.theme, [suggestion.field]: suggestion.suggestedValue },
      reason: suggestion.reason,
      confidence: suggestion.confidence,
      expectedImpact: suggestion.expectedImpact,
      metrics: {
        impressions: emotionData.metrics.totalImpressions,
        clicks: emotionData.metrics.totalClicks,
        ctr: emotionData.metrics.averageCTR,
        engagement: emotionData.metrics.averageEngagement,
        conversions: emotionData.metrics.averageConversion
      }
    };
  }

  /**
   * Generate CTA-specific change
   */
  private async generateCTAChange(changeId: string, element: any, analyticsData: any): Promise<OrchestrationChange | null> {
    const ctaData = analyticsData.ctas.find((c: any) => c.text === element.id);
    if (!ctaData) return null;

    const mlSuggestions = await mlOptimizer.optimizeCTAText(element.id, ctaData.metrics);
    
    if (mlSuggestions.suggestions.length === 0) return null;

    const suggestion = mlSuggestions.suggestions[0];
    
    return {
      id: changeId,
      type: 'cta',
      target: element.id,
      action: 'modify',
      from: ctaData.config,
      to: { ...ctaData.config, [suggestion.field]: suggestion.suggestedValue },
      reason: suggestion.reason,
      confidence: suggestion.confidence,
      expectedImpact: suggestion.expectedImpact,
      metrics: {
        impressions: ctaData.metrics.impressions,
        clicks: ctaData.metrics.clicks,
        ctr: ctaData.metrics.ctr,
        engagement: ctaData.metrics.ctr, // CTAs don't have engagement, use CTR
        conversions: ctaData.metrics.conversions
      }
    };
  }

  /**
   * Generate offer-specific change
   */
  private async generateOfferChange(changeId: string, element: any, analyticsData: any): Promise<OrchestrationChange | null> {
    const offerData = analyticsData.offers.find((o: any) => o.slug === element.id);
    if (!offerData) return null;

    const mlSuggestions = await mlOptimizer.optimizeOffer(offerData.config, offerData.metrics);
    
    if (mlSuggestions.suggestions.length === 0) return null;

    const suggestion = mlSuggestions.suggestions[0];
    
    return {
      id: changeId,
      type: 'offer',
      target: element.id,
      action: 'modify',
      from: offerData.config,
      to: { ...offerData.config, [suggestion.field]: suggestion.suggestedValue },
      reason: suggestion.reason,
      confidence: suggestion.confidence,
      expectedImpact: suggestion.expectedImpact,
      metrics: {
        impressions: offerData.metrics.impressions,
        clicks: offerData.metrics.clicks,
        ctr: offerData.metrics.ctr,
        engagement: offerData.metrics.ctr, // Offers don't have engagement, use CTR
        conversions: offerData.metrics.conversions
      }
    };
  }

  /**
   * Generate module-specific change
   */
  private async generateModuleChange(changeId: string, element: any, analyticsData: any): Promise<OrchestrationChange | null> {
    const moduleData = analyticsData.modules.find((m: any) => m.type === element.id);
    if (!moduleData) return null;

    return {
      id: changeId,
      type: 'module',
      target: element.id,
      action: moduleData.metrics.interactionRate < 0.2 ? 'demote' : 'modify',
      from: moduleData.config,
      to: { ...moduleData.config, priority: moduleData.metrics.interactionRate < 0.2 ? 'low' : 'medium' },
      reason: moduleData.metrics.interactionRate < 0.2 ? 'Low interaction rate' : 'Moderate performance',
      confidence: 0.7,
      expectedImpact: 'improve module engagement by 10-20%',
      metrics: {
        impressions: moduleData.metrics.impressions,
        clicks: moduleData.metrics.interactions,
        ctr: moduleData.metrics.interactionRate,
        engagement: moduleData.metrics.completionRate,
        conversions: moduleData.metrics.completions
      }
    };
  }

  /**
   * Generate promotion change for top performers
   */
  private async generatePromotionChange(element: any, analyticsData: any): Promise<OrchestrationChange | null> {
    const changeId = `promo-${Date.now()}-${randomUUID().substring(0, 8)}`;
    
    return {
      id: changeId,
      type: element.type,
      target: element.id,
      action: 'promote',
      reason: 'High performance metrics - promoting for wider exposure',
      confidence: element.confidence,
      expectedImpact: 'increase overall CTR by 5-10%',
      metrics: element.metrics
    };
  }

  /**
   * Apply changes to configuration
   */
  private async applyChanges(changes: OrchestrationChange[]): Promise<void> {
    for (const change of changes) {
      try {
        await this.applyChange(change);
      } catch (error) {
        console.error(`Failed to apply change ${change.id}:`, error);
      }
    }
  }

  /**
   * Apply individual change
   */
  private async applyChange(change: OrchestrationChange): Promise<void> {
    switch (change.type) {
      case 'page':
        await configManager.updatePageConfig(change.target, change.to);
        break;
      case 'emotion':
        await configManager.updateEmotionConfig(change.target, change.to);
        break;
      case 'cta':
        await configManager.updateCTAConfig(change.target, change.to);
        break;
      case 'offer':
        await configManager.updateOfferConfig(change.target, change.to);
        break;
      case 'module':
        // Module changes would be handled differently
        console.log(`Module change applied: ${change.target}`);
        break;
    }
  }

  /**
   * Calculate performance expectations
   */
  private calculatePerformanceExpectations(changes: OrchestrationChange[]): any {
    let totalCTRImprovement = 0;
    let totalEngagementImprovement = 0;
    let totalConversionImprovement = 0;

    for (const change of changes) {
      // Extract improvement percentages from expected impact
      const ctrMatch = change.expectedImpact.match(/CTR.*?(\d+)-(\d+)%/);
      const engagementMatch = change.expectedImpact.match(/engagement.*?(\d+)-(\d+)%/);
      const conversionMatch = change.expectedImpact.match(/conversion.*?(\d+)-(\d+)%/);

      if (ctrMatch) {
        const avg = (parseInt(ctrMatch[1]) + parseInt(ctrMatch[2])) / 2;
        totalCTRImprovement += (avg * change.confidence) / 100;
      }

      if (engagementMatch) {
        const avg = (parseInt(engagementMatch[1]) + parseInt(engagementMatch[2])) / 2;
        totalEngagementImprovement += (avg * change.confidence) / 100;
      }

      if (conversionMatch) {
        const avg = (parseInt(conversionMatch[1]) + parseInt(conversionMatch[2])) / 2;
        totalConversionImprovement += (avg * change.confidence) / 100;
      }
    }

    return {
      expectedCTRImprovement: Math.min(totalCTRImprovement, 0.5), // Cap at 50%
      expectedEngagementImprovement: Math.min(totalEngagementImprovement, 0.4), // Cap at 40%
      expectedConversionImprovement: Math.min(totalConversionImprovement, 0.3) // Cap at 30%
    };
  }

  /**
   * Save run to disk
   */
  private async saveRunToDisk(run: OrchestrationRun): Promise<void> {
    const runFile = path.join(this.orchestrationDir, `runs`, `${run.id}.json`);
    await fs.mkdir(path.dirname(runFile), { recursive: true });
    await fs.writeFile(runFile, JSON.stringify(run, null, 2));
  }

  /**
   * Load configuration from disk
   */
  private async loadConfiguration(): Promise<void> {
    const configFile = path.join(this.orchestrationDir, 'config.json');
    
    try {
      const configData = await fs.readFile(configFile, 'utf-8');
      const savedConfig = JSON.parse(configData);
      this.config = { ...this.config, ...savedConfig };
    } catch (error) {
      // Config file doesn't exist, use defaults
      await this.saveConfiguration();
    }
  }

  /**
   * Save configuration to disk
   */
  private async saveConfiguration(): Promise<void> {
    const configFile = path.join(this.orchestrationDir, 'config.json');
    await fs.mkdir(path.dirname(configFile), { recursive: true });
    await fs.writeFile(configFile, JSON.stringify(this.config, null, 2));
  }

  /**
   * Start scheduled runs
   */
  private startScheduledRuns(): void {
    if (this.runInterval) {
      clearInterval(this.runInterval);
    }

    const intervals = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[this.config.scheduling.frequency as keyof typeof intervals];
    if (interval) {
      this.runInterval = setInterval(() => {
        this.runOrchestration(false).catch(console.error);
      }, interval);
    }
  }

  /**
   * Public API methods
   */

  getCurrentRunStatus(): OrchestrationRun | null {
    return this.currentRun;
  }

  getConfig(): OrchestrationConfig {
    return this.config;
  }

  updateConfig(updates: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfiguration();

    // Restart scheduled runs if scheduling changed
    if (updates.scheduling) {
      if (this.config.scheduling.enabled && this.config.scheduling.frequency !== 'manual') {
        this.startScheduledRuns();
      } else {
        if (this.runInterval) {
          clearInterval(this.runInterval);
          this.runInterval = null;
        }
      }
    }
  }

  async getOrchestrationHistory(limit: number = 10): Promise<OrchestrationRun[]> {
    return this.runHistory.slice(0, limit);
  }

  async cancelCurrentRun(): Promise<void> {
    if (this.currentRun) {
      console.log(`🛑 Cancelling orchestration run: ${this.currentRun.id}`);
      this.currentRun.status = 'cancelled';
      this.currentRun.duration = Date.now() - this.currentRun.timestamp.getTime();
      
      // Add to history
      this.runHistory.unshift(this.currentRun);
      await this.saveRunToDisk(this.currentRun);
      
      this.currentRun = null;
    }
  }

  async rollback(runId: string): Promise<void> {
    const run = this.runHistory.find(r => r.id === runId);
    if (!run) {
      throw new Error(`Run ${runId} not found in history`);
    }

    if (!run.backupId) {
      throw new Error(`No backup available for run ${runId}`);
    }

    await configManager.rollbackToBackup(run.backupId);
    console.log(`✅ Rolled back to backup from run ${runId}`);
  }
}

export const orchestrator = new OrchestratorService();