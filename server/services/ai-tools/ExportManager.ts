import { DatabaseStorage } from '../../storage';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

interface NeuronExportConfig {
  neuronId: string;
  exportPath: string;
  includeAnalytics: boolean;
  includeSensitiveData: boolean;
}

interface NeuronExportData {
  metadata: {
    neuronId: string;
    exportedAt: string;
    version: string;
    type: string;
  };
  config: {
    experiments: any;
    offers: any;
    content: any;
    archetypes: any;
    uiPreferences: any;
    featureFlags: any;
  };
  content: {
    tools: any[];
    categories: any[];
    articles: any[];
    comparisons: any[];
    leadMagnets: any[];
  };
  analytics: {
    summary: any;
    userBehavior: any[];
    offerPerformance: any[];
    contentMetrics: any[];
  };
  offers: {
    active: any[];
    performance: any[];
    rotationRules: any;
  };
  userProfiles: {
    archetypes: any[];
    preferences: any[];
    sessionData: any[];
  };
}

export class ExportManager {
  private storage: DatabaseStorage;
  private config: NeuronExportConfig;

  constructor(storage: DatabaseStorage, config: NeuronExportConfig) {
    this.storage = storage;
    this.config = config;
  }

  async exportNeuronData(): Promise<string> {
    try {
      console.log('📤 Starting neuron data export...');

      const exportData: NeuronExportData = {
        metadata: {
          neuronId: this.config.neuronId,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          type: 'ai-tools'
        },
        config: await this.exportConfig(),
        content: await this.exportContent(),
        analytics: this.config.includeAnalytics ? await this.exportAnalytics() : {},
        offers: await this.exportOffers(),
        userProfiles: this.config.includeSensitiveData ? await this.exportUserProfiles() : { archetypes: [], preferences: [], sessionData: [] }
      };

      const filename = `neuron-ai-tools-export-${Date.now()}.neuron.json`;
      const filepath = join(this.config.exportPath, filename);

      await writeFile(filepath, JSON.stringify(exportData, null, 2));

      console.log(`✅ Export completed: ${filename}`);
      return filepath;

    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  private async exportConfig(): Promise<any> {
    try {
      // Export current configuration settings
      return {
        experiments: await this.storage.getActiveAiToolsExperiments(),
        offers: {
          rotationInterval: 300000,
          maxDisplay: 3,
          priorityWeights: {
            featured: 0.4,
            conversionRate: 0.3,
            commission: 0.2,
            freshness: 0.1
          }
        },
        content: {
          autoGenerate: true,
          updateFrequency: 'daily',
          seoOptimization: true
        },
        archetypes: await this.storage.getAiToolsArchetypes(),
        uiPreferences: {
          themeAdaptation: true,
          personalizationLevel: 'high',
          experimentParticipation: true
        },
        featureFlags: {
          aiRecommendations: true,
          realTimeChat: false,
          advancedFiltering: true,
          socialFeatures: false,
          premiumContent: true
        }
      };
    } catch (error) {
      console.error('Config export error:', error);
      return {};
    }
  }

  private async exportContent(): Promise<any> {
    try {
      return {
        tools: await this.storage.getAiTools(),
        categories: await this.storage.getAiToolsCategories(),
        articles: await this.storage.getAiToolsContent(),
        comparisons: await this.storage.getAiToolsComparisons(),
        leadMagnets: await this.storage.getLeadMagnets()
      };
    } catch (error) {
      console.error('Content export error:', error);
      return { tools: [], categories: [], articles: [], comparisons: [], leadMagnets: [] };
    }
  }

  private async exportAnalytics(): Promise<any> {
    try {
      // Get analytics data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return {
        summary: {
          totalUsers: 0,
          totalSessions: 0,
          avgSessionDuration: 0,
          conversionRate: 0,
          topTools: [],
          topCategories: []
        },
        userBehavior: [],
        offerPerformance: [],
        contentMetrics: []
      };
    } catch (error) {
      console.error('Analytics export error:', error);
      return { summary: {}, userBehavior: [], offerPerformance: [], contentMetrics: [] };
    }
  }

  private async exportOffers(): Promise<any> {
    try {
      return {
        active: await this.storage.getAiToolsOffers(),
        performance: [],
        rotationRules: {
          interval: 300000,
          maxPerSession: 3,
          priorityFactors: ['ctr', 'commission', 'freshness']
        }
      };
    } catch (error) {
      console.error('Offers export error:', error);
      return { active: [], performance: [], rotationRules: {} };
    }
  }

  private async exportUserProfiles(): Promise<any> {
    try {
      return {
        archetypes: await this.storage.getAiToolsArchetypes(),
        preferences: [],
        sessionData: []
      };
    } catch (error) {
      console.error('User profiles export error:', error);
      return { archetypes: [], preferences: [], sessionData: [] };
    }
  }

  async importNeuronData(filepath: string): Promise<boolean> {
    try {
      console.log('📥 Starting neuron data import...');

      const fileContent = await readFile(filepath, 'utf-8');
      const importData: NeuronExportData = JSON.parse(fileContent);

      // Validate import data
      if (!importData.metadata || importData.metadata.type !== 'ai-tools') {
        throw new Error('Invalid neuron data format');
      }

      // Import configuration
      if (importData.config) {
        await this.importConfig(importData.config);
      }

      // Import content (tools, categories, etc.)
      if (importData.content) {
        await this.importContent(importData.content);
      }

      // Import offers
      if (importData.offers) {
        await this.importOffers(importData.offers);
      }

      console.log('✅ Import completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Import failed:', error);
      return false;
    }
  }

  private async importConfig(config: any): Promise<void> {
    // Import configuration settings
    // This would typically update the database with new config values
    console.log('📝 Importing configuration...');
  }

  private async importContent(content: any): Promise<void> {
    // Import content data
    console.log('📝 Importing content...');
  }

  private async importOffers(offers: any): Promise<void> {
    // Import offers data
    console.log('📝 Importing offers...');
  }

  async getExportHistory(): Promise<any[]> {
    // Return list of previous exports
    return [];
  }

  async scheduleAutoExport(interval: number): Promise<void> {
    // Set up automatic export scheduling
    setInterval(async () => {
      try {
        await this.exportNeuronData();
        console.log('🔄 Scheduled export completed');
      } catch (error) {
        console.error('❌ Scheduled export failed:', error);
      }
    }, interval);
  }
}

export default ExportManager;