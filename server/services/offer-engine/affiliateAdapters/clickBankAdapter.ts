/**
 * ClickBank Digital Products Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import crypto from 'crypto';
import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class ClickBankAdapter extends BaseAffiliateAdapter {
  public readonly name = "ClickBank Digital Marketplace";
  public readonly slug = "clickbank";
  public readonly type = "api" as const;
  public readonly description = "ClickBank API integration for high-commission digital products and courses";
  public readonly supportedRegions = ["US", "UK", "CA", "AU", "DE", "FR"];
  public readonly supportedCategories = [
    "Business & Investing", "Health & Fitness", "Home & Garden",
    "Computing & Internet", "Arts & Entertainment", "E-business & E-marketing",
    "Education", "Languages", "Green Products", "Sports", "Travel", "Self-Help"
  ];

  protected getRequiredCredentials(): string[] {
    return ['developerKey', 'clerkKey'];
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with accounts API
      const response = await this.makeClickBankRequest('accounts', 'GET');
      return response && typeof response === 'object';
    } catch (error) {
      console.error(`ClickBank connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      // Fetch top products from multiple categories
      const categories = ['business-investing', 'health-fitness', 'e-business-e-marketing', 'education'];
      
      for (const category of categories) {
        try {
          await this.delay(1000); // Rate limiting
          
          // Fetch marketplace products
          const products = await this.makeClickBankRequest(`products?category=${category}&sort=popularity&limit=25`, 'GET');
          
          if (products && products.results) {
            allOffers.push(...products.results.map((product: any) => ({
              ...product,
              searchCategory: category
            })));
          }

        } catch (error) {
          console.warn(`Failed to fetch ClickBank products for category ${category}:`, error);
        }
      }

      console.log(`💎 ClickBank: Fetched ${allOffers.length} digital products`);
      return allOffers;

    } catch (error) {
      console.error('ClickBank fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const product = externalOffer;
    
    return {
      title: product.title || `ClickBank ${product.nickname || 'Product'}`,
      slug: this.generateSlug(product.title, `cb-${product.id || product.nickname}`),
      merchant: product.vendor?.nickname || "ClickBank Vendor",
      price: parseFloat(product.price?.display || 0),
      currency: "USD",
      category: this.mapClickBankCategory(product.category || externalOffer.searchCategory),
      tags: [
        "clickbank",
        "digital-product",
        product.category?.toLowerCase().replace(/\s+/g, '-'),
        ...(product.keywords || []).slice(0, 3)
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: this.buildHopLink(product.nickname, product.id),
      commissionEstimate: this.calculateClickBankCommission(product),
      meta: {
        nickname: product.nickname,
        vendorNickname: product.vendor?.nickname,
        gravity: product.gravity,
        popularity: product.popularity,
        commission: product.commission,
        rebillAmount: product.rebillAmount,
        hasRecurring: product.hasRecurring,
        category: product.category,
        languages: product.languages,
        mobileReady: product.mobileReady,
        refundRate: product.refundRate
      },
      region: "US", // ClickBank is global but primarily US-based
      emotion: this.inferClickBankEmotion(product),
      isActive: true,
      priority: this.calculateClickBankPriority(product)
    };
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.meta && 
      (offer.meta as any).nickname
    );
  }

  // ================================================
  // CLICKBANK-SPECIFIC METHODS
  // ================================================

  private async makeClickBankRequest(endpoint: string, method: 'GET' | 'POST' = 'GET'): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseUrl = 'https://api.clickbank.com/rest/1.3';
    
    // Create signature for authentication
    const stringToSign = `${this.credentials.developerKey}:${method}:${endpoint}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.credentials.clerkKey)
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();

    const headers = {
      ...this.getDefaultHeaders(),
      'Authorization': `${this.credentials.developerKey}:${timestamp}:${signature}`,
      'Accept': 'application/json'
    };

    const url = `${baseUrl}/${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers
    });

    if (!response.ok) {
      throw new Error(`ClickBank API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private buildHopLink(nickname: string, productId: string): string {
    // ClickBank hop links format
    return `https://${nickname}.${productId}.hop.clickbank.net/`;
  }

  private mapClickBankCategory(category: string): string {
    if (!category) return "digital-products";
    
    const categoryMap: Record<string, string> = {
      "business-investing": "business",
      "health-fitness": "health", 
      "e-business-e-marketing": "marketing",
      "computing-internet": "technology",
      "arts-entertainment": "entertainment",
      "education": "education",
      "self-help": "self-help",
      "sports": "sports",
      "travel": "travel"
    };
    
    return categoryMap[category] || category.toLowerCase().replace(/\s+/g, '-');
  }

  private calculateClickBankCommission(product: any): number {
    if (product.commission && product.price) {
      // ClickBank commission is a percentage
      const commissionRate = parseFloat(product.commission) / 100;
      const price = parseFloat(product.price?.display || 0);
      return price * commissionRate;
    }
    
    return 0;
  }

  private inferClickBankEmotion(product: any): string {
    const title = product.title?.toLowerCase() || '';
    const category = product.category?.toLowerCase() || '';
    
    // Money-making/business products tend to be aspirational
    if (category.includes('business') || category.includes('investing') || 
        title.includes('money') || title.includes('profit') || title.includes('income')) {
      return 'exclusive';
    }
    
    // Health and fitness products tend to be urgent
    if (category.includes('health') || category.includes('fitness') ||
        title.includes('lose') || title.includes('burn') || title.includes('fast')) {
      return 'urgent';
    }
    
    // High gravity products are popular
    if (product.gravity && parseFloat(product.gravity) > 50) {
      return 'popular';
    }
    
    return 'trusted';
  }

  private calculateClickBankPriority(product: any): number {
    let priority = 5; // Base priority
    
    // High gravity products (more affiliates promoting = proven sellers)
    const gravity = parseFloat(product.gravity || 0);
    if (gravity > 100) priority += 3;
    else if (gravity > 50) priority += 2;
    else if (gravity > 20) priority += 1;
    
    // High commission rate
    const commission = parseFloat(product.commission || 0);
    if (commission > 70) priority += 2;
    else if (commission > 50) priority += 1;
    
    // Low refund rate
    const refundRate = parseFloat(product.refundRate || 0);
    if (refundRate < 5) priority += 1;
    
    // Mobile ready products
    if (product.mobileReady) priority += 1;
    
    // Recurring commissions
    if (product.hasRecurring) priority += 1;
    
    return Math.min(10, priority);
  }
}