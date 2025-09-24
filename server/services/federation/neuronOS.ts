import { storage } from "../../storage";
import { randomUUID } from "crypto";

export interface NeuronConfig {
  name: string;
  url: string;
  type: string;
  supportedFeatures: string[];
  projectSlug: string;
  apiToken: string;
  niche: string;
  status: 'initializing' | 'active' | 'inactive' | 'error';
  healthScore: number;
}

export class NeuronFederationOS {
  private neuronId: string;
  private config: NeuronConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private configPullInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.neuronId = randomUUID();
    this.config = {
      name: "findawise-empire-core",
      url: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000",
      type: "empire-core",
      supportedFeatures: [
        "dynamic-pages",
        "emotion-theming", 
        "quiz-engine",
        "affiliate-tracking",
        "personalization",
        "ab-testing",
        "analytics",
        "lead-capture",
        "localization",
        "ai-orchestration",
        "content-generation",
        "federation-management",
        "neuron-registry",
        "empire-brain",
        "multi-niche-support"
      ],
      projectSlug: "findawise-empire",
      apiToken: process.env.NEURON_API_TOKEN || randomUUID(),
      niche: "empire-core",
      status: 'initializing',
      healthScore: 100
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log('🧠 Initializing Neuron Federation OS...');
      
      // Register with Empire Core
      await this.registerWithEmpire();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Start config polling
      this.startConfigPolling();
      
      this.config.status = 'active';
      console.log('✅ Neuron Federation OS initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Neuron Federation OS:', error);
      this.config.status = 'error';
      this.config.healthScore = 0;
    }
  }

  private async registerWithEmpire(): Promise<void> {
    try {
      // Register with local Empire Core database
      await storage.registerNeuron({
        neuronId: this.neuronId,
        name: this.config.name,
        type: this.config.type,
        url: this.config.url,
        status: this.config.status,
        healthScore: this.config.healthScore,
        supportedFeatures: this.config.supportedFeatures,
        apiKey: this.config.apiToken, // Use apiKey instead of apiToken
        niche: this.config.niche,
        version: "1.0.0",
        deployedAt: new Date(),
        lastCheckIn: new Date()
      });

      // Log federation event
      await storage.logFederationEvent({
        neuronId: this.neuronId,
        eventType: 'neuron_registered',
        eventData: {
          name: this.config.name,
          type: this.config.type,
          features: this.config.supportedFeatures
        },
        initiatedBy: 'system',
        success: true
      });

      console.log(`✅ Registered neuron ${this.config.name} with Empire Core`);
    } catch (error) {
      console.error('❌ Failed to register with Empire Core:', error);
      throw error;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
        this.config.healthScore = Math.max(0, this.config.healthScore - 10);
      }
    }, 60000); // Every 60 seconds
  }

  private async sendHeartbeat(): Promise<void> {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const healthData = {
      uptime,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      },
      status: this.config.status,
      healthScore: this.config.healthScore,
      timestamp: new Date()
    };

    await storage.updateNeuronStatus({
      neuronId: this.neuronId,
      status: this.config.status,
      healthScore: this.config.healthScore,
      uptime: Math.round(uptime),
      memoryUsage: memoryUsage.rss,
      responseTime: Date.now(), // Simple response time
      errorCount: 0,
      lastCheckIn: new Date(),
      metadata: healthData
    });
  }

  private startConfigPolling(): void {
    this.configPullInterval = setInterval(async () => {
      try {
        await this.pullConfigUpdates();
      } catch (error) {
        console.error('❌ Config pull failed:', error);
      }
    }, 300000); // Every 5 minutes
  }

  private async pullConfigUpdates(): Promise<void> {
    try {
      // Pull latest config from Empire Core
      const config = await storage.getActiveNeuronConfig(this.neuronId);
      
      if (config) {
        console.log('🔄 Pulling config updates from Empire Core');
        
        // Apply config updates (feature flags, experiments, etc.)
        await this.applyConfigUpdates(config);
        
        await storage.logFederationEvent({
          neuronId: this.neuronId,
          eventType: 'config_pulled',
          eventData: { configVersion: config.version },
          initiatedBy: 'system',
          success: true
        });
      }
    } catch (error) {
      console.error('❌ Failed to pull config updates:', error);
    }
  }

  private async applyConfigUpdates(config: any): Promise<void> {
    // Apply feature flags, experiments, and other config updates
    console.log('🔧 Applying config updates:', config.configName);
  }

  async reportAnalytics(eventType: string, eventData: any): Promise<void> {
    try {
      await storage.trackAnalyticsEvent({
        sessionId: eventData.sessionId || 'unknown',
        globalUserId: eventData.globalUserId,
        eventType,
        eventName: eventData.eventName || eventType,
        eventData,
        pageUrl: eventData.pageUrl,
        referrerUrl: eventData.referrerUrl,
        deviceType: eventData.deviceType || 'unknown',
        timestamp: new Date()
      });

      // Also update neuron-specific analytics
      await storage.updateNeuronAnalytics({
        neuronId: this.neuronId,
        date: new Date(),
        pageViews: eventType === 'page_view' ? 1 : 0,
        uniqueVisitors: eventData.isNewSession ? 1 : 0,
        conversions: eventType === 'conversion' ? 1 : 0,
        revenue: eventData.revenue || '0',
        engagementScore: eventData.engagementScore || 0,
        bounceRate: eventData.bounceRate || 0,
        avgSessionDuration: eventData.sessionDuration || 0,
        topPages: eventData.pageUrl ? [eventData.pageUrl] : [],
        trafficSources: eventData.source ? [eventData.source] : [],
        metadata: eventData
      });

    } catch (error) {
      console.error('❌ Failed to report analytics:', error);
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Neuron Federation OS...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.configPullInterval) {
      clearInterval(this.configPullInterval);
    }

    this.config.status = 'inactive';
    
    try {
      await storage.updateNeuronStatus({
        neuronId: this.neuronId,
        status: 'inactive',
        healthScore: 0,
        uptime: Math.round(process.uptime()),
        memoryUsage: process.memoryUsage().rss,
        responseTime: Date.now(),
        errorCount: 0,
        lastCheckIn: new Date(),
        metadata: { shutdown: true }
      });

      await storage.logFederationEvent({
        neuronId: this.neuronId,
        eventType: 'neuron_shutdown',
        eventData: { reason: 'graceful_shutdown' },
        initiatedBy: 'system',
        success: true
      });

    } catch (error) {
      console.error('❌ Failed to report shutdown:', error);
    }
    
    console.log('✅ Neuron Federation OS shutdown complete');
  }

  getNeuronId(): string {
    return this.neuronId;
  }

  getConfig(): NeuronConfig {
    return { ...this.config };
  }

  getHealthScore(): number {
    return this.config.healthScore;
  }

  async updateHealthScore(score: number): Promise<void> {
    this.config.healthScore = Math.max(0, Math.min(100, score));
  }
}

export const neuronOS = new NeuronFederationOS();