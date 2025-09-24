/**
 * ShareASale Affiliate Network Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import crypto from 'crypto';
import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class ShareASaleAdapter extends BaseAffiliateAdapter {
  public readonly name = "ShareASale Affiliate Network";
  public readonly slug = "shareasale";
  public readonly type = "api" as const;
  public readonly description = "ShareASale API integration for diverse merchant offers and affiliate programs";
  public readonly supportedRegions = ["US", "CA", "UK"];
  public readonly supportedCategories = [
    "Business Services", "Computers & Electronics", "Education", 
    "Fashion", "Food & Beverages", "Health & Fitness", "Home & Garden",
    "Internet Services", "Travel", "Software"
  ];

  protected getRequiredCredentials(): string[] {
    return ['affiliateId', 'token', 'secretKey'];
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with merchant list API
      const response = await this.makeShareASaleRequest('getMerchantList', {
        merchantstatus: 'joined',
        limit: 1
      });

      return Array.isArray(response);
    } catch (error) {
      console.error(`ShareASale connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      // First, get list of joined merchants
      const merchants = await this.makeShareASaleRequest('getMerchantList', {
        merchantstatus: 'joined',
        limit: 50
      });

      console.log(`🏪 ShareASale: Found ${merchants.length} joined merchants`);

      // Get deals/coupons from merchants
      const dealsData = await this.makeShareASaleRequest('getDeals', {
        format: 'json',
        limit: 100
      });

      if (Array.isArray(dealsData)) {
        allOffers.push(...dealsData);
      }

      // Get product feeds from top merchants
      for (const merchant of merchants.slice(0, 10)) {
        try {
          await this.delay(1000); // Rate limiting - ShareASale is strict
          
          const products = await this.makeShareASaleRequest('getProducts', {
            merchantId: merchant.merchantid,
            limit: 20,
            category: 'bestsellers'
          });

          if (Array.isArray(products)) {
            allOffers.push(...products.map((product: any) => ({
              ...product,
              merchantInfo: merchant,
              isProduct: true
            })));
          }
        } catch (error) {
          console.warn(`Failed to fetch products for merchant ${merchant.name}:`, error);
        }
      }

      console.log(`🛍️ ShareASale: Fetched ${allOffers.length} total offers`);
      return allOffers;

    } catch (error) {
      console.error('ShareASale fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const offer = externalOffer;
    const isProduct = offer.isProduct;
    const merchant = offer.merchantInfo || {};
    
    if (isProduct) {
      // Transform product data
      return {
        title: offer.name || offer.productname || "ShareASale Product",
        slug: this.generateSlug(offer.name, `sas-${offer.sku}`),
        merchant: merchant.name || offer.merchant || "ShareASale Partner",
        price: parseFloat(offer.price || offer.saleprice || 0),
        oldPrice: offer.regularprice ? parseFloat(offer.regularprice) : undefined,
        currency: "USD",
        category: this.mapShareASaleCategory(offer.category),
        tags: [
          "shareasale",
          offer.category?.toLowerCase(),
          ...(offer.keywords?.split(',') || []).slice(0, 3)
        ].filter(Boolean),
        sourceType: "api",
        clickTrackingUrl: this.buildTrackingUrl(offer.sku, merchant.merchantid),
        commissionEstimate: this.calculateCommission(offer.price, merchant.commission),
        meta: {
          sku: offer.sku,
          merchantId: merchant.merchantid,
          category: offer.category,
          brand: offer.brand,
          description: offer.description,
          imageUrl: offer.thumb,
          upc: offer.upc,
          isbn: offer.isbn
        },
        region: "US",
        isActive: true,
        priority: this.calculateProductPriority(offer, merchant)
      };
    } else {
      // Transform deal/coupon data
      return {
        title: offer.title || `${offer.merchant} Deal`,
        slug: this.generateSlug(offer.title, `sas-deal-${offer.dealid}`),
        merchant: offer.merchant || "ShareASale Partner",
        price: 0, // Deals don't have specific prices
        currency: "USD",
        couponCode: offer.couponcode,
        discountType: offer.couponcode ? "coupon" : "deal",
        discountValue: this.extractDiscountValue(offer.title || offer.description),
        validTill: offer.enddate ? new Date(offer.enddate) : undefined,
        category: this.mapShareASaleCategory(offer.category),
        tags: [
          "shareasale",
          "deal",
          offer.category?.toLowerCase(),
          offer.couponcode ? "coupon" : "sale"
        ].filter(Boolean),
        sourceType: "api",
        clickTrackingUrl: offer.landingpageurl || offer.affiliateurl,
        commissionEstimate: this.extractCommissionFromDescription(offer.description),
        meta: {
          dealId: offer.dealid,
          merchantId: offer.merchantid,
          startDate: offer.startdate,
          endDate: offer.enddate,
          description: offer.description,
          restrictions: offer.restrictions,
          dealType: offer.dealtype
        },
        region: "US",
        emotion: "urgent", // Deals are typically urgent
        isActive: true,
        priority: this.calculateDealPriority(offer)
      };
    }
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.merchant &&
      offer.meta
    );
  }

  // ================================================
  // SHAREASALE-SPECIFIC METHODS  
  // ================================================

  private async makeShareASaleRequest(action: string, params: any = {}): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseParams = {
      affiliateId: this.credentials.affiliateId,
      token: this.credentials.token,
      format: 'json',
      version: '2.3',
      timestamp,
      ...params
    };

    // Create signature
    const queryString = Object.keys(baseParams)
      .sort()
      .map(key => `${key}=${baseParams[key]}`)
      .join('&');
    
    const signature = crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `https://shareasale.com/x.cfm?action=${action}&${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      headers: this.getDefaultHeaders()
    });

    if (!response.ok) {
      throw new Error(`ShareASale API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    try {
      return JSON.parse(text);
    } catch {
      // ShareASale sometimes returns pipe-delimited data
      return this.parsePipeDelimitedData(text);
    }
  }

  private parsePipeDelimitedData(text: string): any[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split('|');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('|');
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.toLowerCase()] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  }

  private buildTrackingUrl(sku: string, merchantId: string): string {
    return `https://shareasale.com/r.cfm?b=${sku}&u=${this.credentials.affiliateId}&m=${merchantId}`;
  }

  private mapShareASaleCategory(category: string): string {
    if (!category) return "general";
    
    const categoryMap: Record<string, string> = {
      "Business Services": "business",
      "Computers & Electronics": "electronics", 
      "Education": "education",
      "Fashion": "fashion",
      "Food & Beverages": "food",
      "Health & Fitness": "health",
      "Home & Garden": "home",
      "Internet Services": "software",
      "Travel": "travel"
    };
    
    return categoryMap[category] || category.toLowerCase().replace(/\s+/g, '-');
  }

  private extractDiscountValue(text: string): number {
    if (!text) return 0;
    
    const percentMatch = text.match(/(\d+)%\s*off/i);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    
    const dollarMatch = text.match(/\$(\d+)\s*off/i);
    if (dollarMatch) {
      return parseFloat(dollarMatch[1]);
    }
    
    return 0;
  }

  private extractCommissionFromDescription(description: string): number {
    if (!description) return 0;
    
    const commissionMatch = description.match(/(\d+(?:\.\d+)?)%\s*commission/i);
    if (commissionMatch) {
      return parseFloat(commissionMatch[1]);
    }
    
    return 0;
  }

  private calculateCommission(price: string | number, merchantCommission: string): number {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    const commissionRate = parseFloat(merchantCommission || '0') / 100;
    
    return priceNum * commissionRate;
  }

  private calculateProductPriority(product: any, merchant: any): number {
    let priority = 5; // Base priority
    
    // High-value merchants
    if (merchant.commission && parseFloat(merchant.commission) > 10) {
      priority += 2;
    }
    
    // Products with good imagery
    if (product.thumb || product.imageurl) {
      priority += 1;
    }
    
    // Branded products
    if (product.brand && product.brand !== 'Generic') {
      priority += 1;
    }
    
    return Math.min(10, priority);
  }

  private calculateDealPriority(deal: any): number {
    let priority = 6; // Base priority for deals
    
    // Deals with coupon codes
    if (deal.couponcode) {
      priority += 2;
    }
    
    // Time-sensitive deals
    if (deal.enddate) {
      const endDate = new Date(deal.enddate);
      const now = new Date();
      const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysLeft < 7) {
        priority += 2; // Urgent deals get higher priority
      }
    }
    
    return Math.min(10, priority);
  }
}