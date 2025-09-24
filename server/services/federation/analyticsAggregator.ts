import { storage } from '../../storage';

// ===========================================
// ANALYTICS AGGREGATOR
// ===========================================

class AnalyticsAggregator {
  private initialized = false;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();

  /**
   * Initialize analytics aggregator
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('📊 Initializing Analytics Aggregator...');

    try {
      this.initialized = true;
      console.log('✅ Analytics Aggregator initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Analytics Aggregator:', error);
      throw error;
    }
  }

  /**
   * Get aggregated analytics for all neurons
   */
  async getAggregatedAnalytics(): Promise<any> {
    const cacheKey = 'aggregated_analytics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const neurons = await storage.getNeurons();
      
      const analytics = {
        totalNeurons: neurons.length,
        activeNeurons: neurons.filter(n => n.status === 'active').length,
        averageHealthScore: this.calculateAverageHealth(neurons),
        totalUptime: this.calculateTotalUptime(neurons),
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, analytics, 300000); // 5 minutes
      return analytics;
    } catch (error) {
      console.error('❌ Failed to get aggregated analytics:', error);
      return {
        totalNeurons: 0,
        activeNeurons: 0,
        averageHealthScore: 0,
        totalUptime: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to fetch analytics'
      };
    }
  }

  /**
   * Get analytics for specific neuron
   */
  async getNeuronAnalytics(neuronId: string): Promise<any> {
    const cacheKey = `neuron_analytics_${neuronId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const neuron = await storage.getNeuronById(neuronId);
      
      if (!neuron) {
        return {
          error: 'Neuron not found',
          neuronId
        };
      }

      const analytics = {
        neuronId,
        name: neuron.name,
        status: neuron.status,
        healthScore: neuron.healthScore || 0,
        uptime: neuron.uptime || 0,
        lastCheckIn: neuron.lastCheckIn,
        pageViews: Math.floor(Math.random() * 10000), // Mock data
        conversions: Math.floor(Math.random() * 100),
        revenue: Math.floor(Math.random() * 5000),
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, analytics, 60000); // 1 minute
      return analytics;
    } catch (error) {
      console.error(`❌ Failed to get analytics for ${neuronId}:`, error);
      return {
        error: 'Failed to fetch neuron analytics',
        neuronId
      };
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🗑️ Analytics cache cleared');
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private calculateAverageHealth(neurons: any[]): number {
    if (neurons.length === 0) return 0;
    
    const totalHealth = neurons.reduce((sum, neuron) => sum + (neuron.healthScore || 0), 0);
    return Math.round(totalHealth / neurons.length);
  }

  private calculateTotalUptime(neurons: any[]): number {
    return neurons.reduce((sum, neuron) => sum + (neuron.uptime || 0), 0);
  }

  private getFromCache(key: string): any | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  private setCache(key: string, value: any, ttl: number): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  /**
   * Shutdown analytics aggregator
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Analytics Aggregator...');
    this.clearCache();
    this.initialized = false;
    console.log('✅ Analytics Aggregator shutdown complete');
  }
}

export const analyticsAggregator = new AnalyticsAggregator();