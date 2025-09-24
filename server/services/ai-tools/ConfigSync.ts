import { EventEmitter } from 'events';

interface ConfigSyncOptions {
  apiUrl: string;
  neuronId: string;
  syncInterval: number; // in milliseconds
  token: string;
}

interface ConfigUpdate {
  timestamp: string;
  version: string;
  updates: {
    experiments?: any;
    offers?: any;
    content?: any;
    archetype_weights?: any;
    ui_preferences?: any;
    feature_flags?: any;
  };
}

export class ConfigSync extends EventEmitter {
  private options: ConfigSyncOptions;
  private syncTimer?: NodeJS.Timeout;
  private isRunning = false;
  private lastSyncTime?: Date;
  private currentConfig: Record<string, any> = {};

  constructor(options: ConfigSyncOptions) {
    super();
    this.options = options;
    this.initializeDefaults();
  }

  private initializeDefaults() {
    this.currentConfig = {
      experiments: {},
      offers: {
        rotation_interval: 300000, // 5 minutes
        max_display: 3,
        priority_weights: {
          featured: 0.4,
          conversion_rate: 0.3,
          commission: 0.2,
          freshness: 0.1
        }
      },
      content: {
        auto_generate: true,
        update_frequency: 'daily',
        seo_optimization: true
      },
      archetype_weights: {
        Explorer: { discovery: 0.8, research: 0.7, experimentation: 0.9 },
        Engineer: { technical: 0.9, development: 0.8, programming: 0.7 },
        Creator: { design: 0.9, content: 0.8, creative: 0.7 },
        'Growth Hacker': { marketing: 0.9, analytics: 0.8, optimization: 0.7 },
        Researcher: { analysis: 0.9, data: 0.8, research: 0.9 }
      },
      ui_preferences: {
        theme_adaptation: true,
        personalization_level: 'high',
        experiment_participation: true
      },
      feature_flags: {
        ai_recommendations: true,
        real_time_chat: false,
        advanced_filtering: true,
        social_features: false,
        premium_content: true
      }
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 ConfigSync already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Tools ConfigSync...');

    try {
      // Initial sync
      await this.performSync();
      
      // Set up periodic sync
      this.syncTimer = setInterval(async () => {
        try {
          await this.performSync();
        } catch (error) {
          console.error('❌ Periodic config sync failed:', error);
          this.emit('sync_error', error);
        }
      }, this.options.syncInterval);

      console.log(`✅ ConfigSync started with ${this.options.syncInterval}ms interval`);
      this.emit('started');
    } catch (error) {
      console.error('❌ Failed to start ConfigSync:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping ConfigSync...');
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    this.isRunning = false;
    console.log('✅ ConfigSync stopped');
    this.emit('stopped');
  }

  private async performSync(): Promise<void> {
    try {
      const response = await fetch(`${this.options.apiUrl}/api/neuron/update-config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.options.token}`,
          'Content-Type': 'application/json',
          'X-Neuron-ID': this.options.neuronId,
          'X-Last-Sync': this.lastSyncTime?.toISOString() || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Config sync failed: ${response.status} ${response.statusText}`);
      }

      const update: ConfigUpdate = await response.json();
      
      if (this.shouldApplyUpdate(update)) {
        await this.applyUpdate(update);
        this.lastSyncTime = new Date();
        
        console.log(`✅ Config synced successfully (version: ${update.version})`);
        this.emit('sync_success', update);
      } else {
        console.log('📋 No config updates available');
      }

    } catch (error) {
      console.error('❌ Config sync failed:', error);
      this.emit('sync_error', error);
      throw error;
    }
  }

  private shouldApplyUpdate(update: ConfigUpdate): boolean {
    if (!this.lastSyncTime) return true;
    
    const updateTime = new Date(update.timestamp);
    return updateTime > this.lastSyncTime;
  }

  private async applyUpdate(update: ConfigUpdate): Promise<void> {
    const { updates } = update;
    let hasChanges = false;

    // Apply experiments
    if (updates.experiments) {
      this.currentConfig.experiments = { ...this.currentConfig.experiments, ...updates.experiments };
      hasChanges = true;
      this.emit('experiments_updated', updates.experiments);
    }

    // Apply offers configuration
    if (updates.offers) {
      this.currentConfig.offers = { ...this.currentConfig.offers, ...updates.offers };
      hasChanges = true;
      this.emit('offers_updated', updates.offers);
    }

    // Apply content settings
    if (updates.content) {
      this.currentConfig.content = { ...this.currentConfig.content, ...updates.content };
      hasChanges = true;
      this.emit('content_updated', updates.content);
    }

    // Apply archetype weights
    if (updates.archetype_weights) {
      this.currentConfig.archetype_weights = { ...this.currentConfig.archetype_weights, ...updates.archetype_weights };
      hasChanges = true;
      this.emit('archetypes_updated', updates.archetype_weights);
    }

    // Apply UI preferences
    if (updates.ui_preferences) {
      this.currentConfig.ui_preferences = { ...this.currentConfig.ui_preferences, ...updates.ui_preferences };
      hasChanges = true;
      this.emit('ui_updated', updates.ui_preferences);
    }

    // Apply feature flags
    if (updates.feature_flags) {
      this.currentConfig.feature_flags = { ...this.currentConfig.feature_flags, ...updates.feature_flags };
      hasChanges = true;
      this.emit('features_updated', updates.feature_flags);
    }

    if (hasChanges) {
      this.emit('config_updated', this.currentConfig);
      console.log('📝 Configuration updated successfully');
    }
  }

  // Getters for different config sections
  getExperiments(): any {
    return this.currentConfig.experiments;
  }

  getOffersConfig(): any {
    return this.currentConfig.offers;
  }

  getContentConfig(): any {
    return this.currentConfig.content;
  }

  getArchetypeWeights(): any {
    return this.currentConfig.archetype_weights;
  }

  getUIPreferences(): any {
    return this.currentConfig.ui_preferences;
  }

  getFeatureFlags(): any {
    return this.currentConfig.feature_flags;
  }

  // Get full config
  getConfig(): Record<string, any> {
    return { ...this.currentConfig };
  }

  // Update local config (for testing or manual overrides)
  updateConfig(section: string, updates: any): void {
    if (this.currentConfig[section]) {
      this.currentConfig[section] = { ...this.currentConfig[section], ...updates };
      this.emit('config_updated', this.currentConfig);
      console.log(`📝 Local config updated: ${section}`);
    } else {
      console.warn(`⚠️ Unknown config section: ${section}`);
    }
  }

  // Force sync (useful for immediate updates)
  async forceSync(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('ConfigSync is not running');
    }

    console.log('🔄 Forcing config sync...');
    await this.performSync();
  }

  // Health check
  getStatus(): { 
    isRunning: boolean; 
    lastSync?: string; 
    syncInterval: number;
    nextSync?: string;
  } {
    const status = {
      isRunning: this.isRunning,
      lastSync: this.lastSyncTime?.toISOString(),
      syncInterval: this.options.syncInterval
    };

    if (this.isRunning && this.lastSyncTime) {
      const nextSync = new Date(this.lastSyncTime.getTime() + this.options.syncInterval);
      return { ...status, nextSync: nextSync.toISOString() };
    }

    return status;
  }

  // Export current config for backup
  exportConfig(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      config: this.currentConfig,
      metadata: {
        neuronId: this.options.neuronId,
        lastSync: this.lastSyncTime?.toISOString()
      }
    }, null, 2);
  }

  // Import config from backup
  importConfig(configData: string): void {
    try {
      const data = JSON.parse(configData);
      if (data.config) {
        this.currentConfig = data.config;
        this.emit('config_imported', this.currentConfig);
        console.log('📥 Configuration imported successfully');
      }
    } catch (error) {
      console.error('❌ Failed to import config:', error);
      throw new Error('Invalid config data format');
    }
  }
}