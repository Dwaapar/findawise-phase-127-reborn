/**
 * Awin (formerly Affiliate Window) Network Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class AwinAdapter extends BaseAffiliateAdapter {
  public readonly name = "Awin Affiliate Network";
  public readonly slug = "awin";
  public readonly type = "api" as const;
  public readonly description = "Awin API integration for European and global affiliate partnerships";
  public readonly supportedRegions = ["US", "UK", "DE", "FR", "IT", "ES", "NL", "SE", "NO", "DK", "AU"];
  public readonly supportedCategories = [
    "Fashion & Clothing", "Travel & Tourism", "Technology", "Finance",
    "Health & Beauty", "Home & Garden", "Sports & Fitness", "Entertainment"
  ];

  protected getRequiredCredentials(): string[] {
    return ['oAuthToken', 'publisherId'];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.buildApiUrl('/publishers'), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.oAuthToken}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`Awin connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      // Fetch deals and vouchers
      const dealsResponse = await fetch(this.buildApiUrl('/publishers/deals', {
        advertiserId: '',
        region: 'US',
        limit: 100
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.oAuthToken}`
        }
      });

      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        allOffers.push(...(dealsData.deals || []));
      }

      await this.delay(1000);

      // Fetch commission groups (product categories)
      const commissionsResponse = await fetch(this.buildApiUrl('/publishers/commissiongroups', {
        publisherId: this.credentials.publisherId
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.oAuthToken}`
        }
      });

      if (commissionsResponse.ok) {
        const commissionsData = await commissionsResponse.json();
        const advertisers = commissionsData.commissionGroups || [];
        
        // Fetch creative links for top advertisers
        for (const advertiser of advertisers.slice(0, 15)) {
          try {
            await this.delay(500);
            
            const creativeResponse = await fetch(this.buildApiUrl('/publishers/creative/links', {
              advertiserId: advertiser.advertiserId,
              limit: 10
            }), {
              headers: {
                ...this.getDefaultHeaders(),
                'Authorization': `Bearer ${this.credentials.oAuthToken}`
              }
            });

            if (creativeResponse.ok) {
              const creativeData = await creativeResponse.json();
              const links = creativeData.links || [];
              
              allOffers.push(...links.map((link: any) => ({
                ...link,
                advertiserName: advertiser.advertiserName,
                commissionGroup: advertiser.groupName
              })));
            }
          } catch (error) {
            console.warn(`Failed to fetch creatives for advertiser ${advertiser.advertiserId}:`, error);
          }
        }
      }

      console.log(`🌟 Awin: Fetched ${allOffers.length} offers and creatives`);
      return allOffers;

    } catch (error) {
      console.error('Awin fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const offer = externalOffer;
    const isDeal = offer.type === 'voucher' || offer.voucherCode;
    
    return {
      title: offer.title || offer.description || `${offer.advertiserName} Offer`,
      slug: this.generateSlug(offer.title, `awin-${offer.id || offer.dealId}`),
      merchant: offer.advertiserName || "Awin Partner",
      price: 0, // Awin doesn't provide direct pricing
      currency: offer.currency || "USD",
      couponCode: isDeal ? offer.voucherCode : undefined,
      discountType: isDeal ? this.mapDiscountType(offer.type) : undefined,
      discountValue: this.extractDiscountValue(offer.description || offer.title),
      validTill: offer.endDate ? new Date(offer.endDate) : undefined,
      category: this.mapAwinCategory(offer.commissionGroup || offer.category),
      tags: [
        "awin",
        offer.commissionGroup?.toLowerCase().replace(/\s+/g, '-'),
        isDeal ? "voucher" : "link",
        offer.region?.toLowerCase()
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: offer.clickUrl || offer.deepLink,
      commissionEstimate: this.parseCommissionRate(offer.commissionRate),
      meta: {
        dealId: offer.dealId || offer.id,
        advertiserId: offer.advertiserId,
        advertiserName: offer.advertiserName,
        commissionGroup: offer.commissionGroup,
        type: offer.type,
        description: offer.description,
        terms: offer.terms,
        startDate: offer.startDate,
        endDate: offer.endDate,
        region: offer.region
      },
      region: offer.region || "US",
      emotion: isDeal ? "urgent" : "trusted",
      isActive: offer.status !== 'expired',
      priority: this.calculateAwinPriority(offer)
    };
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.merchant
    );
  }

  // ================================================
  // AWIN-SPECIFIC METHODS
  // ================================================

  private buildApiUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = "https://api.awin.com";
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

  private mapAwinCategory(category: string): string {
    if (!category) return "general";
    
    const categoryMap: Record<string, string> = {
      "Fashion & Clothing": "fashion",
      "Travel & Tourism": "travel",
      "Technology": "technology",
      "Finance": "finance",
      "Health & Beauty": "health",
      "Home & Garden": "home",
      "Sports & Fitness": "sports",
      "Entertainment": "entertainment"
    };
    
    return categoryMap[category] || category.toLowerCase().replace(/\s+/g, '-');
  }

  private mapDiscountType(type: string): string {
    if (!type) return "coupon";
    
    const typeMap: Record<string, string> = {
      "voucher": "coupon",
      "discount": "percentage",
      "cashback": "cashback",
      "deal": "deal"
    };
    
    return typeMap[type.toLowerCase()] || "coupon";
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
    
    const euroMatch = text.match(/€(\d+)\s*off/i);
    if (euroMatch) {
      return parseFloat(euroMatch[1]);
    }
    
    return 0;
  }

  private parseCommissionRate(commissionRate: any): number {
    if (!commissionRate) return 0;
    
    if (typeof commissionRate === 'string') {
      const match = commissionRate.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    return typeof commissionRate === 'number' ? commissionRate : 0;
  }

  private calculateAwinPriority(offer: any): number {
    let priority = 5; // Base priority
    
    // Premium advertisers boost
    const premiumAdvertisers = ['booking', 'expedia', 'nike', 'adidas', 'zalando'];
    if (premiumAdvertisers.some(advertiser => 
      offer.advertiserName?.toLowerCase().includes(advertiser)
    )) {
      priority += 2;
    }
    
    // Voucher codes get higher priority
    if (offer.voucherCode) {
      priority += 2;
    }
    
    // Time-sensitive offers
    if (offer.endDate) {
      const endDate = new Date(offer.endDate);
      const now = new Date();
      const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysLeft < 7) {
        priority += 2;
      } else if (daysLeft < 30) {
        priority += 1;
      }
    }
    
    // High commission rates
    const commission = this.parseCommissionRate(offer.commissionRate);
    if (commission > 10) {
      priority += 1;
    }
    
    return Math.min(10, priority);
  }
}