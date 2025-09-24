// Base Connector - Abstract class for all content feed connectors
import { ContentFeedSource } from "../../../../shared/contentFeedTables";

export interface ConnectorFetchOptions {
  syncType: 'full' | 'incremental' | 'manual';
  lastSyncAt?: Date | null;
  maxItems?: number;
  categories?: string[];
  testMode?: boolean;
}

export interface NormalizedContentItem {
  externalId: string;
  contentType: string;
  title: string;
  description?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  
  // Offer/Product fields
  price?: number;
  originalPrice?: number;
  currency?: string;
  discount?: number;
  couponCode?: string;
  affiliateUrl?: string;
  merchantName?: string;
  
  // Content metadata
  author?: string;
  publishedAt?: Date;
  imageUrl?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  
  // Status and expiry
  status?: string;
  expiresAt?: Date;
  qualityScore?: number;
}

export interface ConnectorConfig {
  name: string;
  version: string;
  supportedContentTypes: string[];
  requiredAuth: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected lastRequestTime: number = 0;
  protected requestCount: { minute: number; hour: number; day: number } = { minute: 0, hour: 0, day: 0 };
  protected rateLimitResetTimes = {
    minute: Date.now() + 60000,
    hour: Date.now() + 3600000,
    day: Date.now() + 86400000
  };

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  // FeedConnector interface implementation
  get sourceType(): string {
    return this.config.name.toLowerCase().replace(/\s+/g, '_');
  }

  async connect(): Promise<void> {
    // Default implementation - can be overridden
  }

  async disconnect(): Promise<void> {
    // Default implementation - can be overridden
  }

  // Convert NormalizedContentItem to Partial<InsertContentFeed>
  normalizeContent(rawData: any, source: ContentFeedSource): any {
    const normalized = this.normalizeRawContent(rawData, source);
    return {
      externalId: normalized.externalId,
      contentType: normalized.contentType,
      title: normalized.title,
      description: normalized.description,
      content: normalized.content,
      excerpt: normalized.excerpt,
      category: normalized.category,
      tags: normalized.tags,
      price: normalized.price?.toString(),
      originalPrice: normalized.originalPrice?.toString(),
      currency: normalized.currency,
      discount: normalized.discount?.toString(),
      couponCode: normalized.couponCode,
      affiliateUrl: normalized.affiliateUrl,
      merchantName: normalized.merchantName,
      author: normalized.author,
      publishedAt: normalized.publishedAt,
      imageUrl: normalized.imageUrl,
      images: normalized.images,
      rating: normalized.rating?.toString(),
      reviewCount: normalized.reviewCount,
      status: normalized.status || 'active',
      expiresAt: normalized.expiresAt,
      qualityScore: normalized.qualityScore?.toString()
    };
  }

  // Abstract methods that must be implemented by connectors
  abstract fetchContent(source: ContentFeedSource, options?: ConnectorFetchOptions): Promise<any[]>;
  abstract normalizeRawContent(rawData: any, source: ContentFeedSource): NormalizedContentItem;
  abstract validateAuth(authConfig: any): Promise<boolean>;
  abstract healthCheck(): Promise<boolean>;

  // Rate limiting and retry logic
  protected async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counters if time windows have passed
    if (now > this.rateLimitResetTimes.minute) {
      this.requestCount.minute = 0;
      this.rateLimitResetTimes.minute = now + 60000;
    }
    if (now > this.rateLimitResetTimes.hour) {
      this.requestCount.hour = 0;
      this.rateLimitResetTimes.hour = now + 3600000;
    }
    if (now > this.rateLimitResetTimes.day) {
      this.requestCount.day = 0;
      this.rateLimitResetTimes.day = now + 86400000;
    }

    // Check rate limits
    if (this.requestCount.minute >= this.config.rateLimits.requestsPerMinute) {
      const waitTime = this.rateLimitResetTimes.minute - now;
      await this.sleep(waitTime);
    }
    if (this.requestCount.hour >= this.config.rateLimits.requestsPerHour) {
      const waitTime = this.rateLimitResetTimes.hour - now;
      await this.sleep(waitTime);
    }
    if (this.requestCount.day >= this.config.rateLimits.requestsPerDay) {
      const waitTime = this.rateLimitResetTimes.day - now;
      await this.sleep(waitTime);
    }

    // Increment counters
    this.requestCount.minute++;
    this.requestCount.hour++;
    this.requestCount.day++;
    this.lastRequestTime = now;
  }

  protected async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    let retries = 0;
    let lastError: Error;

    while (retries <= this.config.retryPolicy.maxRetries) {
      try {
        await this.enforceRateLimit();
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        retries++;

        if (retries <= this.config.retryPolicy.maxRetries) {
          const delay = this.config.retryPolicy.initialDelayMs * Math.pow(this.config.retryPolicy.backoffMultiplier, retries - 1);
          console.warn(`Request failed, retrying in ${delay}ms (attempt ${retries}/${this.config.retryPolicy.maxRetries}):`, error);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for content normalization
  protected normalizePrice(priceStr: string | number): number | undefined {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return undefined;
    
    const cleanPrice = priceStr.toString().replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? undefined : price;
  }

  protected normalizeDate(dateStr: string | Date): Date | undefined {
    if (dateStr instanceof Date) return dateStr;
    if (!dateStr) return undefined;
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  }

  protected extractImages(imageData: any): string[] {
    if (!imageData) return [];
    
    if (typeof imageData === 'string') {
      return [imageData];
    }
    
    if (Array.isArray(imageData)) {
      return imageData.filter(img => typeof img === 'string');
    }
    
    if (typeof imageData === 'object') {
      // Handle complex image objects (common in product APIs)
      const images = [];
      if (imageData.primary) images.push(imageData.primary);
      if (imageData.variants) images.push(...imageData.variants);
      if (imageData.gallery) images.push(...imageData.gallery);
      return images.filter(img => typeof img === 'string');
    }
    
    return [];
  }

  protected calculateDiscount(originalPrice: number, currentPrice: number): number {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  protected cleanHtml(html: string): string {
    if (!html) return '';
    
    // Basic HTML cleaning (you might want to use a proper HTML sanitizer)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  protected generateExcerpt(content: string, maxLength: number = 150): string {
    if (!content) return '';
    
    const cleaned = this.cleanHtml(content);
    if (cleaned.length <= maxLength) return cleaned;
    
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  // Getters for connector information
  getConfig(): ConnectorConfig {
    return this.config;
  }

  getName(): string {
    return this.config.name;
  }

  getVersion(): string {
    return this.config.version;
  }

  getSupportedContentTypes(): string[] {
    return this.config.supportedContentTypes;
  }

  getRequiredAuth(): string[] {
    return this.config.requiredAuth;
  }
}