/**
 * ConfigSync - Auto-pull orchestrator config with hot-reload
 * Federation-compliant configuration synchronization
 */

import { apiRequest } from './queryClient';

export interface NeuronConfig {
  neuronId: string;
  experiments: ExperimentConfig[];
  features: FeatureFlags;
  analytics: AnalyticsConfig;
  ui: UIConfig;
  content: ContentConfig;
  offers: OfferConfig;
  thresholds: PerformanceThresholds;
  version: string;
  updatedAt: string;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  type: 'ab_test' | 'feature_flag' | 'variant_test';
  status: 'active' | 'paused' | 'completed';
  allocation: number; // 0-100 percentage
  variants: ExperimentVariant[];
  targetAudience: string[];
  startDate: string;
  endDate?: string;
  metrics: string[];
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

export interface FeatureFlags {
  gamificationEnabled: boolean;
  aiTutorEnabled: boolean;
  contentAutoGeneration: boolean;
  advancedAnalytics: boolean;
  multiLanguageSupport: boolean;
  affiliateTracking: boolean;
  realTimeNotifications: boolean;
  darkModeEnabled: boolean;
}

export interface AnalyticsConfig {
  trackingEnabled: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  endpoints: {
    events: string;
    behaviors: string;
    conversions: string;
  };
  retryAttempts: number;
  retryDelay: number;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  animationsEnabled: boolean;
  compactMode: boolean;
  emotionTheme: 'empower' | 'curious' | 'disciplined' | 'inclusive';
}

export interface ContentConfig {
  autoGeneration: {
    enabled: boolean;
    schedule: string; // cron expression
    categories: string[];
    minWordCount: number;
    maxWordCount: number;
  };
  caching: {
    enabled: boolean;
    ttl: number; // seconds
  };
  localization: {
    enabled: boolean;
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}

export interface OfferConfig {
  rotationEnabled: boolean;
  rotationInterval: number; // minutes
  trackingEnabled: boolean;
  cloakingEnabled: boolean;
  affiliateNetworks: string[];
  categories: string[];
  displayRules: {
    maxOffersPerPage: number;
    contextualMatching: boolean;
    archetypeTargeting: boolean;
  };
}

export interface PerformanceThresholds {
  ctrDropThreshold: number; // percentage drop that triggers rollback
  ctrTimeWindow: number; // hours to monitor
  apiFailureThreshold: number; // number of failures
  apiFailureTimeWindow: number; // minutes to monitor
  lcpThreshold: number; // milliseconds
  lcpUserPercentage: number; // percentage of users affected
  bounceRateThreshold: number; // percentage
  conversionDropThreshold: number; // percentage
}

class ConfigSyncManager {
  private config: NeuronConfig | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private listeners: ((config: NeuronConfig) => void)[] = [];
  private isPolling = false;
  private lastSyncTime = 0;
  private syncInterval = 30000; // 30 seconds default
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      await this.fetchConfig();
      this.startPolling();
    } catch (error) {
      console.error('Failed to initialize ConfigSync:', error);
      // Fallback to default config
      this.setDefaultConfig();
    }
  }

  private setDefaultConfig() {
    this.config = {
      neuronId: 'education-neuron',
      experiments: [],
      features: {
        gamificationEnabled: true,
        aiTutorEnabled: true,
        contentAutoGeneration: false,
        advancedAnalytics: true,
        multiLanguageSupport: false,
        affiliateTracking: true,
        realTimeNotifications: true,
        darkModeEnabled: true,
      },
      analytics: {
        trackingEnabled: true,
        batchSize: 10,
        flushInterval: 5000,
        endpoints: {
          events: '/api/analytics/events/batch',
          behaviors: '/api/analytics/behaviors',
          conversions: '/api/analytics/conversions',
        },
        retryAttempts: 3,
        retryDelay: 1000,
      },
      ui: {
        theme: 'auto',
        primaryColor: '#3b82f6',
        accentColor: '#8b5cf6',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '0.5rem',
        animationsEnabled: true,
        compactMode: false,
        emotionTheme: 'empower',
      },
      content: {
        autoGeneration: {
          enabled: false,
          schedule: '0 9 * * *', // Daily at 9 AM
          categories: ['programming', 'languages', 'business'],
          minWordCount: 800,
          maxWordCount: 2000,
        },
        caching: {
          enabled: true,
          ttl: 3600,
        },
        localization: {
          enabled: false,
          defaultLanguage: 'en',
          supportedLanguages: ['en'],
        },
      },
      offers: {
        rotationEnabled: true,
        rotationInterval: 60,
        trackingEnabled: true,
        cloakingEnabled: true,
        affiliateNetworks: ['coursera', 'udemy', 'skillshare'],
        categories: ['courses', 'books', 'tools'],
        displayRules: {
          maxOffersPerPage: 3,
          contextualMatching: true,
          archetypeTargeting: true,
        },
      },
      thresholds: {
        ctrDropThreshold: 40,
        ctrTimeWindow: 3,
        apiFailureThreshold: 5,
        apiFailureTimeWindow: 10,
        lcpThreshold: 4000,
        lcpUserPercentage: 10,
        bounceRateThreshold: 70,
        conversionDropThreshold: 30,
      },
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
    };
  }

  private async fetchConfig(): Promise<void> {
    try {
      const response = await apiRequest('/api/neuron/update-config', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_NEURON_API_TOKEN || 'default-token'}`,
        },
      });

      if (response.success) {
        const newConfig = response.data as NeuronConfig;
        
        // Check if config has actually changed
        if (!this.config || newConfig.version !== this.config.version) {
          this.config = newConfig;
          this.notifyListeners(newConfig);
          this.retryCount = 0;
          
          console.log('Config updated:', {
            version: newConfig.version,
            experiments: newConfig.experiments.length,
            features: Object.keys(newConfig.features).filter(key => newConfig.features[key as keyof FeatureFlags]).length,
          });
        }
      }
      
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('Failed to fetch config:', error);
      this.retryCount++;
      
      if (this.retryCount >= this.maxRetries) {
        console.warn('Max retries reached, using cached config');
        this.retryCount = 0;
      } else {
        // Exponential backoff
        setTimeout(() => this.fetchConfig(), Math.pow(2, this.retryCount) * 1000);
      }
    }
  }

  private startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollInterval = setInterval(() => {
      this.fetchConfig();
    }, this.syncInterval);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  private notifyListeners(config: NeuronConfig) {
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Config listener error:', error);
      }
    });
  }

  // Public API
  public getConfig(): NeuronConfig | null {
    return this.config;
  }

  public getFeatureFlag(flag: keyof FeatureFlags): boolean {
    return this.config?.features[flag] ?? false;
  }

  public getExperiment(experimentId: string): ExperimentConfig | null {
    return this.config?.experiments.find(exp => exp.id === experimentId) ?? null;
  }

  public getExperimentVariant(experimentId: string, userId?: string): ExperimentVariant | null {
    const experiment = this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'active') return null;

    // Simple hash-based allocation
    const hash = this.hashString(userId || 'anonymous');
    const allocation = hash % 100;
    
    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (allocation < cumulativeWeight) {
        return variant;
      }
    }
    
    return experiment.variants[0] || null;
  }

  public subscribe(listener: (config: NeuronConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current config
    if (this.config) {
      listener(this.config);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async forceSync(): Promise<void> {
    await this.fetchConfig();
  }

  public getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  public setSyncInterval(interval: number): void {
    this.syncInterval = interval;
    
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
  }

  // Performance monitoring
  public checkPerformanceThresholds(metrics: {
    ctr?: number;
    apiFailures?: number;
    lcp?: number;
    bounceRate?: number;
    conversionRate?: number;
  }): { shouldRollback: boolean; reasons: string[] } {
    if (!this.config) return { shouldRollback: false, reasons: [] };

    const reasons: string[] = [];
    const thresholds = this.config.thresholds;

    if (metrics.ctr !== undefined && metrics.ctr < thresholds.ctrDropThreshold) {
      reasons.push(`CTR dropped below ${thresholds.ctrDropThreshold}%`);
    }

    if (metrics.apiFailures !== undefined && metrics.apiFailures >= thresholds.apiFailureThreshold) {
      reasons.push(`API failures exceeded ${thresholds.apiFailureThreshold} in ${thresholds.apiFailureTimeWindow} minutes`);
    }

    if (metrics.lcp !== undefined && metrics.lcp > thresholds.lcpThreshold) {
      reasons.push(`LCP exceeded ${thresholds.lcpThreshold}ms for ${thresholds.lcpUserPercentage}% of users`);
    }

    if (metrics.bounceRate !== undefined && metrics.bounceRate > thresholds.bounceRateThreshold) {
      reasons.push(`Bounce rate exceeded ${thresholds.bounceRateThreshold}%`);
    }

    if (metrics.conversionRate !== undefined && metrics.conversionRate < -thresholds.conversionDropThreshold) {
      reasons.push(`Conversion rate dropped by more than ${thresholds.conversionDropThreshold}%`);
    }

    return {
      shouldRollback: reasons.length > 0,
      reasons,
    };
  }

  public async triggerRollback(reason: string): Promise<void> {
    try {
      await apiRequest('/api/neuron/rollback', {
        method: 'POST',
        body: {
          reason,
          timestamp: new Date().toISOString(),
          configVersion: this.config?.version,
        },
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_NEURON_API_TOKEN || 'default-token'}`,
        },
      });
      
      console.log('Rollback triggered:', reason);
      
      // Force config refresh after rollback
      await this.forceSync();
    } catch (error) {
      console.error('Failed to trigger rollback:', error);
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  public destroy(): void {
    this.stopPolling();
    this.listeners = [];
    this.config = null;
  }
}

// Singleton instance
export const configSync = new ConfigSyncManager();

// React hook for easy integration
export const useConfig = () => {
  const [config, setConfig] = React.useState<NeuronConfig | null>(configSync.getConfig());

  React.useEffect(() => {
    const unsubscribe = configSync.subscribe(setConfig);
    return unsubscribe;
  }, []);

  return {
    config,
    getFeatureFlag: configSync.getFeatureFlag.bind(configSync),
    getExperiment: configSync.getExperiment.bind(configSync),
    getExperimentVariant: configSync.getExperimentVariant.bind(configSync),
    forceSync: configSync.forceSync.bind(configSync),
    checkPerformanceThresholds: configSync.checkPerformanceThresholds.bind(configSync),
    triggerRollback: configSync.triggerRollback.bind(configSync),
  };
};

// Feature flag hook
export const useFeatureFlag = (flag: keyof FeatureFlags) => {
  const { getFeatureFlag } = useConfig();
  return getFeatureFlag(flag);
};

// Experiment hook
export const useExperiment = (experimentId: string, userId?: string) => {
  const { getExperiment, getExperimentVariant } = useConfig();
  const experiment = getExperiment(experimentId);
  const variant = getExperimentVariant(experimentId, userId);
  
  return {
    experiment,
    variant,
    isActive: experiment?.status === 'active',
    config: variant?.config,
  };
};

export default configSync;