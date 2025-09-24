/**
 * Adapter Registry - Empire Grade Plugin Management System
 * Centralized registry for all affiliate network adapters
 */

import { BaseAffiliateAdapter } from './baseAdapter';
import { AmazonPartnerAdapter } from './amazonPartnerAdapter';
import { CommissionJunctionAdapter } from './commissionJunctionAdapter';
import { ShareASaleAdapter } from './shareASaleAdapter';
import { ClickBankAdapter } from './clickBankAdapter';
import { RakutenAdvertisingAdapter } from './rakutenAdvertisingAdapter';
import { ImpactAdapter } from './impactAdapter';
import { AwinAdapter } from './awinAdapter';
import { PartnerStackAdapter } from './partnerStackAdapter';
import { EbayPartnerAdapter } from './ebayPartnerAdapter';
import { OfferSource } from '@shared/schema';

export interface AdapterInfo {
  name: string;
  slug: string;
  type: 'api' | 'scraper' | 'manual';
  description: string;
  supportedRegions: string[];
  supportedCategories: string[];
  requiredCredentials: string[];
  isActive: boolean;
  lastHealthCheck?: Date;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy';
}

export class AdapterRegistry {
  private adapters: Map<string, typeof BaseAffiliateAdapter> = new Map();
  private instances: Map<string, BaseAffiliateAdapter> = new Map();
  private static instance: AdapterRegistry;

  constructor() {
    this.registerCoreAdapters();
  }

  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  // ================================================
  // CORE ADAPTER REGISTRATION
  // ================================================

  private registerCoreAdapters(): void {
    console.log('🔧 Registering billion-dollar empire grade affiliate adapters...');

    // Register all core adapters
    this.registerAdapter('amazon-partner', AmazonPartnerAdapter);
    this.registerAdapter('commission-junction', CommissionJunctionAdapter);
    this.registerAdapter('shareasale', ShareASaleAdapter);
    this.registerAdapter('clickbank', ClickBankAdapter);
    this.registerAdapter('rakuten-advertising', RakutenAdvertisingAdapter);
    this.registerAdapter('impact', ImpactAdapter);
    this.registerAdapter('awin', AwinAdapter);
    this.registerAdapter('partnerstack', PartnerStackAdapter);
    this.registerAdapter('ebay-partner', EbayPartnerAdapter);

    console.log(`✅ Registered ${this.adapters.size} billion-dollar affiliate network adapters`);
  }

  registerAdapter(slug: string, adapterClass: typeof BaseAffiliateAdapter): void {
    this.adapters.set(slug, adapterClass);
    console.log(`📌 Registered adapter: ${slug}`);
  }

  // ================================================
  // ADAPTER INSTANCE MANAGEMENT
  // ================================================

  async getAdapter(source: OfferSource): Promise<BaseAffiliateAdapter | null> {
    const instanceKey = `${source.slug}-${source.id}`;
    
    // Return existing instance if available
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    // Create new adapter instance
    const AdapterClass = this.adapters.get(source.slug);
    if (!AdapterClass) {
      console.error(`❌ No adapter found for source: ${source.slug}`);
      return null;
    }

    try {
      const adapter = new AdapterClass(source);
      const initialized = await adapter.initialize();
      
      if (initialized) {
        this.instances.set(instanceKey, adapter);
        console.log(`✅ Initialized adapter for ${source.name}`);
        return adapter;
      } else {
        console.error(`❌ Failed to initialize adapter for ${source.name}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error creating adapter for ${source.name}:`, error);
      return null;
    }
  }

  removeAdapter(source: OfferSource): void {
    const instanceKey = `${source.slug}-${source.id}`;
    this.instances.delete(instanceKey);
    console.log(`🗑️ Removed adapter instance for ${source.name}`);
  }

  // ================================================
  // ADAPTER DISCOVERY & INFORMATION
  // ================================================

  getAvailableAdapters(): AdapterInfo[] {
    const adapters: AdapterInfo[] = [];
    
    for (const [slug, AdapterClass] of this.adapters.entries()) {
      // Create temporary instance to get metadata
      const tempSource = {
        id: 0,
        slug,
        name: '',
        baseUrl: '',
        credentials: {},
        apiConfig: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        const tempAdapter = new AdapterClass(tempSource);
        
        adapters.push({
          name: tempAdapter.name,
          slug: tempAdapter.slug,
          type: tempAdapter.type,
          description: tempAdapter.description,
          supportedRegions: tempAdapter.supportedRegions,
          supportedCategories: tempAdapter.supportedCategories,
          requiredCredentials: (tempAdapter as any).getRequiredCredentials(),
          isActive: true
        });
      } catch (error) {
        console.warn(`⚠️ Failed to get info for adapter ${slug}:`, error);
      }
    }

    return adapters;
  }

  getAdapterInfo(slug: string): AdapterInfo | null {
    const adapters = this.getAvailableAdapters();
    return adapters.find(adapter => adapter.slug === slug) || null;
  }

  getSupportedCategories(): string[] {
    const categories = new Set<string>();
    
    for (const adapter of this.getAvailableAdapters()) {
      adapter.supportedCategories.forEach(category => categories.add(category));
    }

    return Array.from(categories).sort();
  }

  getSupportedRegions(): string[] {
    const regions = new Set<string>();
    
    for (const adapter of this.getAvailableAdapters()) {
      adapter.supportedRegions.forEach(region => regions.add(region));
    }

    return Array.from(regions).sort();
  }

  // ================================================
  // HEALTH MONITORING
  // ================================================

  async performHealthCheck(): Promise<Map<string, any>> {
    const healthResults = new Map<string, any>();
    
    console.log('🏥 Performing adapter health checks...');
    
    for (const [instanceKey, adapter] of this.instances.entries()) {
      try {
        const startTime = Date.now();
        const isHealthy = await adapter.performHealthCheck();
        const duration = Date.now() - startTime;
        
        healthResults.set(instanceKey, {
          isHealthy,
          duration,
          status: adapter.getStatus(),
          timestamp: new Date()
        });
      } catch (error) {
        healthResults.set(instanceKey, {
          isHealthy: false,
          duration: -1,
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    const healthyCount = Array.from(healthResults.values()).filter(r => r.isHealthy).length;
    const totalCount = healthResults.size;
    
    console.log(`🏥 Health check complete: ${healthyCount}/${totalCount} adapters healthy`);
    
    return healthResults;
  }

  async getActiveAdapterStats(): Promise<any> {
    const stats = {
      totalAdapters: this.adapters.size,
      activeInstances: this.instances.size,
      healthyInstances: 0,
      degradedInstances: 0,
      unhealthyInstances: 0,
      supportedNetworks: this.getAvailableAdapters().map(a => a.name),
      supportedCategories: this.getSupportedCategories(),
      supportedRegions: this.getSupportedRegions()
    };

    // Check health status of active instances
    for (const adapter of this.instances.values()) {
      const status = adapter.getStatus();
      switch (status.healthStatus) {
        case 'healthy':
          stats.healthyInstances++;
          break;
        case 'degraded':
          stats.degradedInstances++;
          break;
        case 'unhealthy':
          stats.unhealthyInstances++;
          break;
      }
    }

    return stats;
  }

  // ================================================
  // BULK OPERATIONS
  // ================================================

  async initializeAllAdapters(sources: OfferSource[]): Promise<BaseAffiliateAdapter[]> {
    console.log(`🚀 Initializing ${sources.length} adapter instances...`);
    
    const initialized: BaseAffiliateAdapter[] = [];
    
    for (const source of sources) {
      if (!source.isActive) continue;
      
      try {
        const adapter = await this.getAdapter(source);
        if (adapter) {
          initialized.push(adapter);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize adapter for ${source.name}:`, error);
      }
    }

    console.log(`✅ Successfully initialized ${initialized.length}/${sources.length} adapters`);
    return initialized;
  }

  async shutdownAllAdapters(): Promise<void> {
    console.log('🛑 Shutting down all adapter instances...');
    
    this.instances.clear();
    
    console.log('✅ All adapter instances shut down');
  }

  // ================================================
  // UTILITY METHODS
  // ================================================

  isAdapterSupported(slug: string): boolean {
    return this.adapters.has(slug);
  }

  getAdapterSlugs(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// Export singleton instance
export const adapterRegistry = AdapterRegistry.getInstance();