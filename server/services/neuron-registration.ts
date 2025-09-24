import { storage } from "../storage";
import { randomUUID } from "crypto";

export class NeuronRegistrationService {
  private registrationInterval: NodeJS.Timeout | null = null;
  
  constructor() {}

  async registerSaaSNeuron() {
    try {
      const neuronData = {
        name: "neuron-software-saas",
        url: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000",
        type: "software-saas",
        slug: "neuron-software-saas", 
        supportedFeatures: JSON.stringify([
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
          "saas-recommendations",
          "roi-calculator",
          "stack-builder",
          "tool-comparison",
          "gamification",
          "ai-chatbot",
          "deal-tracker",
          "review-engine",
          "pricing-comparison"
        ]),
        apiToken: process.env.SAAS_NEURON_API_TOKEN || randomUUID(),
        niche: "software-saas",
        status: "active",
        healthScore: 95,
        lastHeartbeat: new Date()
      };

      // Register with Empire Core using existing API
      const response = await fetch(`${neuronData.url}/api/neuron/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${neuronData.apiToken}`
        },
        body: JSON.stringify(neuronData)
      });

      if (response.ok) {
        console.log('✅ SaaS Neuron registered successfully with Empire Core');
        this.startHeartbeat(neuronData);
      } else {
        console.warn('⚠️ Failed to register SaaS Neuron with Empire Core');
      }

      return neuronData;
    } catch (error) {
      console.error('❌ Error registering SaaS Neuron:', error);
      throw error;
    }
  }

  private startHeartbeat(neuronData: any) {
    // Send heartbeat every 60 seconds
    this.registrationInterval = setInterval(async () => {
      try {
        const heartbeatData = {
          neuronId: neuronData.name,
          status: "active",
          healthScore: this.calculateHealthScore(),
          uptime: process.uptime(),
          lastActivity: new Date(),
          analytics: await this.gatherAnalytics()
        };

        const response = await fetch(`${neuronData.url}/api/neuron/status`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${neuronData.apiToken}`
          },
          body: JSON.stringify(heartbeatData)
        });

        if (response.ok) {
          console.log('💓 SaaS Neuron heartbeat sent successfully');
        }
      } catch (error) {
        console.warn('⚠️ Heartbeat failed:', error);
      }
    }, 60000); // 60 seconds
  }

  private calculateHealthScore(): number {
    // Simple health calculation based on uptime and memory usage
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const memoryScore = Math.max(0, 100 - (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    const uptimeScore = Math.min(100, uptime / 3600 * 10); // 10 points per hour, max 100
    
    return Math.round((memoryScore + uptimeScore) / 2);
  }

  private async gatherAnalytics() {
    try {
      // Gather SaaS-specific analytics
      const stats = await storage.getSaaSStats();
      return {
        timestamp: new Date(),
        totalTools: stats.totalTools,
        totalCategories: stats.totalCategories, 
        totalDeals: stats.totalDeals,
        activeUsers: stats.totalUsers,
        performance: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          health: this.calculateHealthScore()
        }
      };
    } catch (error) {
      console.warn('Analytics gathering failed:', error);
      return {
        timestamp: new Date(),
        error: 'Analytics gathering failed'
      };
    }
  }

  async pullConfiguration() {
    try {
      const neuronUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000";
      const response = await fetch(`${neuronUrl}/api/neuron/update-config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SAAS_NEURON_API_TOKEN || 'default-token'}`
        }
      });

      if (response.ok) {
        const config = await response.json();
        console.log('📥 Configuration update received:', config);
        return config;
      }
    } catch (error) {
      console.warn('Configuration pull failed:', error);
    }
    return null;
  }

  async reportAnalytics(eventData: any) {
    try {
      const neuronUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000";
      const response = await fetch(`${neuronUrl}/api/analytics/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SAAS_NEURON_API_TOKEN || 'default-token'}`
        },
        body: JSON.stringify({
          neuronId: "neuron-software-saas",
          eventType: eventData.type,
          eventData: eventData.data,
          timestamp: new Date(),
          sessionId: eventData.sessionId,
          userId: eventData.userId
        })
      });

      if (response.ok) {
        console.log('📊 Analytics reported successfully');
      }
    } catch (error) {
      console.warn('Analytics reporting failed:', error);
    }
  }

  stop() {
    if (this.registrationInterval) {
      clearInterval(this.registrationInterval);
      this.registrationInterval = null;
    }
  }
}

export const saasNeuronService = new NeuronRegistrationService();