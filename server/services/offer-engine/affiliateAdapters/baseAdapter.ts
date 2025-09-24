/**
 * Base Adapter Class - Empire Grade Foundation
 * All affiliate network adapters inherit from this base class
 */

import { z } from "zod";
import { OfferSource, InsertOfferFeed } from "@shared/schema";

export interface SyncResult {
  success: boolean;
  offersProcessed: number;
  offersAdded: number;
  offersUpdated: number;
  offersRemoved: number;
  errors: string[];
  batchId: string;
  timestamp: Date;
  sourceStats?: {
    totalAvailable?: number;
    rateLimit?: {
      remaining: number;
      resetTime: Date;
    };
    connectionLatency?: number;
  };
}

export interface AdapterCredentials {
  [key: string]: string;
}

export interface AdapterConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  supportedRegions?: string[];
  supportedCategories?: string[];
}

export abstract class BaseAffiliateAdapter {
  public abstract readonly name: string;
  public abstract readonly slug: string;
  public abstract readonly type: 'api' | 'scraper' | 'manual';
  public abstract readonly description: string;
  public abstract readonly supportedRegions: string[];
  public abstract readonly supportedCategories: string[];

  protected credentials: AdapterCredentials = {};
  protected config: AdapterConfig = {};
  protected isInitialized = false;
  protected lastHealthCheck: Date | null = null;
  protected healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';

  constructor(protected source: OfferSource) {
    this.config = (source.apiConfig as AdapterConfig) || {};
    this.credentials = this.decryptCredentials(source.credentials);
  }

  // ================================================
  // INITIALIZATION & HEALTH MANAGEMENT
  // ================================================

  async initialize(): Promise<boolean> {
    try {
      console.log(`🔧 Initializing ${this.name} adapter...`);
      
      if (!this.validateCredentials()) {
        console.error(`❌ Invalid credentials for ${this.name}`);
        return false;
      }

      const isHealthy = await this.performHealthCheck();
      this.isInitialized = isHealthy;
      
      if (isHealthy) {
        console.log(`✅ ${this.name} adapter initialized successfully`);
      } else {
        console.error(`❌ ${this.name} adapter health check failed`);
      }
      
      return isHealthy;
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.name}:`, error);
      this.isInitialized = false;
      return false;
    }
  }

  async performHealthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const isHealthy = await this.testConnection();
      const latency = Date.now() - startTime;
      
      this.lastHealthCheck = new Date();
      this.healthStatus = isHealthy ? (latency > 5000 ? 'degraded' : 'healthy') : 'unhealthy';
      
      console.log(`🏥 ${this.name} health check: ${this.healthStatus} (${latency}ms)`);
      return isHealthy;
    } catch (error) {
      console.error(`🏥 ${this.name} health check failed:`, error);
      this.healthStatus = 'unhealthy';
      return false;
    }
  }

  // ================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ================================================

  abstract testConnection(): Promise<boolean>;
  abstract fetchOffers(): Promise<any[]>;
  abstract transformOffer(externalOffer: any): InsertOfferFeed;
  abstract validateOffer(offer: InsertOfferFeed): boolean;

  // ================================================
  // CORE SYNC LOGIC (Common to all adapters)
  // ================================================

  async syncOffers(): Promise<SyncResult> {
    const batchId = `${this.slug}-${Date.now()}`;
    const startTime = new Date();
    
    console.log(`🔄 Starting offer sync for ${this.name}...`);
    
    const result: SyncResult = {
      success: true,
      offersProcessed: 0,
      offersAdded: 0,
      offersUpdated: 0,
      offersRemoved: 0,
      errors: [],
      batchId,
      timestamp: startTime
    };

    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error(`Failed to initialize ${this.name} adapter`);
        }
      }

      // Fetch offers with retry logic
      let rawOffers: any[] = [];
      for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
        try {
          rawOffers = await this.fetchOffers();
          break;
        } catch (error) {
          console.warn(`⚠️ ${this.name} fetch attempt ${attempt} failed:`, error);
          if (attempt === (this.config.retryAttempts || 3)) {
            throw error;
          }
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }

      console.log(`📥 Fetched ${rawOffers.length} raw offers from ${this.name}`);

      // Process each offer
      for (const rawOffer of rawOffers) {
        try {
          const transformedOffer = this.transformOffer(rawOffer);
          
          if (!this.validateOffer(transformedOffer)) {
            result.errors.push(`Invalid offer: ${transformedOffer.title || 'Unknown'}`);
            continue;
          }

          // Enhanced offer data
          transformedOffer.sourceId = this.source.id;
          transformedOffer.syncedAt = startTime;
          transformedOffer.apiSource = this.slug;
          
          // Quality and emotion scoring
          transformedOffer.qualityScore = this.calculateQualityScore(rawOffer, transformedOffer);
          transformedOffer.emotion = transformedOffer.emotion || this.inferEmotion(transformedOffer);
          
          result.offersProcessed++;
          // Note: Actual database operations handled by sync engine
          
        } catch (error) {
          result.errors.push(`Error processing offer: ${error}`);
          console.error(`❌ Error processing offer from ${this.name}:`, error);
        }
      }

      const duration = Date.now() - startTime.getTime();
      console.log(`✅ ${this.name} sync completed: ${result.offersProcessed} processed in ${duration}ms`);

    } catch (error) {
      result.success = false;
      result.errors.push(`${this.name} sync error: ${error}`);
      console.error(`❌ ${this.name} sync failed:`, error);
    }

    return result;
  }

  // ================================================
  // UTILITY METHODS
  // ================================================

  protected validateCredentials(): boolean {
    const requiredCredentials = this.getRequiredCredentials();
    return requiredCredentials.every(key => this.credentials[key]);
  }

  protected abstract getRequiredCredentials(): string[];

  protected decryptCredentials(encryptedCredentials: any): AdapterCredentials {
    // In a real implementation, this would decrypt stored credentials
    // For now, return as-is since we're using env variables
    return (encryptedCredentials as AdapterCredentials) || {};
  }

  protected generateSlug(title: string, fallback?: string): string {
    if (!title && !fallback) return `${this.slug}-offer-${Date.now()}`;
    
    const baseTitle = title || fallback || '';
    return `${this.slug}-${baseTitle.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80)}`;
  }

  protected inferEmotion(offer: InsertOfferFeed): string {
    const title = offer.title?.toLowerCase() || '';
    const tags = (offer.tags as string[])?.join(' ').toLowerCase() || '';
    const text = `${title} ${tags}`;
    
    // Urgent emotion triggers
    if (/limited|flash|deal|save|discount|% off|urgent|hurry|expires?|now/i.test(text)) {
      return 'urgent';
    }
    
    // Exclusive emotion triggers
    if (/premium|luxury|exclusive|vip|professional|elite|advanced/i.test(text)) {
      return 'exclusive';
    }
    
    // Popular emotion triggers
    if (/bestseller|popular|trending|top rated|favorite|choice|recommended/i.test(text)) {
      return 'popular';
    }
    
    // Default to trusted
    return 'trusted';
  }

  protected calculateQualityScore(rawOffer: any, transformedOffer: InsertOfferFeed): number {
    let score = 40; // Base score
    
    // Price signals
    if (transformedOffer.price && transformedOffer.price > 0) {
      score += 10;
      if (transformedOffer.oldPrice && transformedOffer.oldPrice > transformedOffer.price) {
        score += 15; // Discount available
      }
    }
    
    // Merchant reputation
    const knownMerchants = ['amazon', 'apple', 'microsoft', 'adobe', 'shopify', 'clickfunnels'];
    if (knownMerchants.some(merchant => 
      transformedOffer.merchant?.toLowerCase().includes(merchant)
    )) {
      score += 20;
    }
    
    // Category specificity
    if (transformedOffer.category && transformedOffer.category !== 'general') {
      score += 10;
    }
    
    // Rich metadata
    if (transformedOffer.tags && (transformedOffer.tags as string[]).length > 2) {
      score += 5;
    }
    
    // Commission estimate
    if (transformedOffer.commissionEstimate && transformedOffer.commissionEstimate > 5) {
      score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected buildApiUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = this.config.baseUrl || this.source.baseUrl || '';
    let url = `${baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    return url;
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': `FindaWise-Empire-Bot/1.0 (+https://findawise.ai/affiliate-bot)`,
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    };
  }

  // ================================================
  // STATUS & MONITORING
  // ================================================

  getStatus() {
    return {
      name: this.name,
      slug: this.slug,
      isInitialized: this.isInitialized,
      healthStatus: this.healthStatus,
      lastHealthCheck: this.lastHealthCheck,
      supportedRegions: this.supportedRegions,
      supportedCategories: this.supportedCategories
    };
  }
}