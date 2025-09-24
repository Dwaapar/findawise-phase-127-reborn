/**
 * Impact (formerly Impact Radius) Affiliate Network Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class ImpactAdapter extends BaseAffiliateAdapter {
  public readonly name = "Impact Affiliate Network";
  public readonly slug = "impact";
  public readonly type = "api" as const;
  public readonly description = "Impact API integration for enterprise brand partnerships and high-value affiliate programs";
  public readonly supportedRegions = ["US", "UK", "CA", "AU", "DE", "FR", "IT", "ES", "NL"];
  public readonly supportedCategories = [
    "Technology", "Fashion", "Travel", "Finance", "Health", "Home",
    "Entertainment", "Education", "Business Services", "Automotive"
  ];

  protected getRequiredCredentials(): string[] {
    return ['accountSid', 'authToken'];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.buildApiUrl('/Mediapartners'), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Basic ${Buffer.from(`${this.credentials.accountSid}:${this.credentials.authToken}`).toString('base64')}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`Impact connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      // Get campaigns (advertisers) first
      const campaignsResponse = await fetch(this.buildApiUrl('/Campaigns', {
        PageSize: 50
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Basic ${Buffer.from(`${this.credentials.accountSid}:${this.credentials.authToken}`).toString('base64')}`
        }
      });

      if (!campaignsResponse.ok) {
        throw new Error(`Impact Campaigns API error: ${campaignsResponse.status}`);
      }

      const campaignsData = await campaignsResponse.json();
      const campaigns = campaignsData.Campaigns || [];

      console.log(`🏢 Impact: Found ${campaigns.length} active campaigns`);

      // Fetch promotions from campaigns
      for (const campaign of campaigns.slice(0, 20)) {
        try {
          await this.delay(500); // Rate limiting
          
          const promotionsResponse = await fetch(this.buildApiUrl(`/Campaigns/${campaign.Id}/Promotions`, {
            PageSize: 20
          }), {
            headers: {
              ...this.getDefaultHeaders(),
              'Authorization': `Basic ${Buffer.from(`${this.credentials.accountSid}:${this.credentials.authToken}`).toString('base64')}`
            }
          });

          if (promotionsResponse.ok) {
            const promotionsData = await promotionsResponse.json();
            const promotions = promotionsData.Promotions || [];
            
            allOffers.push(...promotions.map((promotion: any) => ({
              ...promotion,
              CampaignName: campaign.Name,
              CampaignId: campaign.Id,
              CampaignCategory: campaign.Category
            })));
          }
        } catch (error) {
          console.warn(`Failed to fetch promotions for campaign ${campaign.Name}:`, error);
        }
      }

      console.log(`🎯 Impact: Fetched ${allOffers.length} total promotions`);
      return allOffers;

    } catch (error) {
      console.error('Impact fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const promotion = externalOffer;
    
    return {
      title: promotion.Name || `${promotion.CampaignName} Promotion`,
      slug: this.generateSlug(promotion.Name, `impact-${promotion.Id}`),
      merchant: promotion.CampaignName || "Impact Partner",
      price: 0, // Impact promotions don't have specific prices
      currency: "USD",
      couponCode: promotion.PromoCode,
      discountType: this.mapImpactDiscountType(promotion.Type),
      discountValue: this.extractDiscountValue(promotion.Description),
      validTill: promotion.EndDate ? new Date(promotion.EndDate) : undefined,
      category: this.mapImpactCategory(promotion.CampaignCategory),
      tags: [
        "impact",
        promotion.CampaignCategory?.toLowerCase().replace(/\s+/g, '-'),
        promotion.Type?.toLowerCase(),
        promotion.PromoCode ? "coupon" : "deal"
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: promotion.TrackingUrl || this.buildTrackingUrl(promotion.CampaignId, promotion.Id),
      commissionEstimate: this.parseCommissionStructure(promotion.PayoutStructure),
      meta: {
        promotionId: promotion.Id,
        campaignId: promotion.CampaignId,
        campaignName: promotion.CampaignName,
        type: promotion.Type,
        status: promotion.Status,
        startDate: promotion.StartDate,
        endDate: promotion.EndDate,
        description: promotion.Description,
        terms: promotion.Terms,
        payoutStructure: promotion.PayoutStructure
      },
      region: "US", // Impact is primarily US-focused but has global reach
      emotion: this.inferImpactEmotion(promotion),
      isActive: promotion.Status === 'ACTIVE',
      priority: this.calculateImpactPriority(promotion)
    };
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.merchant &&
      offer.meta && 
      (offer.meta as any).promotionId
    );
  }

  // ================================================
  // IMPACT-SPECIFIC METHODS
  // ================================================

  private buildApiUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = "https://api.impact.com/Advertisers";
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

  private buildTrackingUrl(campaignId: string, promotionId: string): string {
    return `https://impact.com/campaign-promo-click/${campaignId}/${promotionId}`;
  }

  private mapImpactCategory(category: string): string {
    if (!category) return "general";
    
    const categoryMap: Record<string, string> = {
      "Technology": "technology",
      "Fashion": "fashion",
      "Travel": "travel",
      "Finance": "finance",
      "Health": "health",
      "Home": "home",
      "Entertainment": "entertainment",
      "Education": "education",
      "Business Services": "business",
      "Automotive": "automotive"
    };
    
    return categoryMap[category] || category.toLowerCase().replace(/\s+/g, '-');
  }

  private mapImpactDiscountType(type: string): string {
    if (!type) return "deal";
    
    const typeMap: Record<string, string> = {
      "COUPON": "coupon",
      "DEAL": "deal",
      "PERCENTAGE": "percentage",
      "FIXED": "fixed",
      "CASHBACK": "cashback"
    };
    
    return typeMap[type.toUpperCase()] || "deal";
  }

  private extractDiscountValue(description: string): number {
    if (!description) return 0;
    
    // Look for percentage discounts
    const percentMatch = description.match(/(\d+)%\s*off/i);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    
    // Look for dollar amounts
    const dollarMatch = description.match(/\$(\d+(?:\.\d+)?)\s*off/i);
    if (dollarMatch) {
      return parseFloat(dollarMatch[1]);
    }
    
    return 0;
  }

  private parseCommissionStructure(payoutStructure: any): number {
    if (!payoutStructure) return 0;
    
    try {
      if (typeof payoutStructure === 'string') {
        // Parse string format like "5% commission" or "$10 flat"
        const percentMatch = payoutStructure.match(/(\d+(?:\.\d+)?)%/);
        if (percentMatch) {
          return parseFloat(percentMatch[1]);
        }
        
        const dollarMatch = payoutStructure.match(/\$(\d+(?:\.\d+)?)/);
        if (dollarMatch) {
          return parseFloat(dollarMatch[1]);
        }
      } else if (typeof payoutStructure === 'object') {
        // Parse object format
        if (payoutStructure.percentage) {
          return parseFloat(payoutStructure.percentage);
        }
        if (payoutStructure.flatRate) {
          return parseFloat(payoutStructure.flatRate);
        }
      }
    } catch (error) {
      console.warn('Error parsing Impact payout structure:', error);
    }
    
    return 0;
  }

  private inferImpactEmotion(promotion: any): string {
    const name = promotion.Name?.toLowerCase() || '';
    const description = promotion.Description?.toLowerCase() || '';
    const text = `${name} ${description}`;
    
    // Urgent indicators
    if (text.includes('limited') || text.includes('flash') || text.includes('expires') ||
        text.includes('hurry') || text.includes('ends soon')) {
      return 'urgent';
    }
    
    // Exclusive indicators  
    if (text.includes('exclusive') || text.includes('vip') || text.includes('premium') ||
        text.includes('special') || text.includes('invite only')) {
      return 'exclusive';
    }
    
    // Popular indicators
    if (text.includes('bestseller') || text.includes('popular') || text.includes('trending') ||
        text.includes('top choice') || text.includes('recommended')) {
      return 'popular';
    }
    
    return 'trusted';
  }

  private calculateImpactPriority(promotion: any): number {
    let priority = 5; // Base priority
    
    // High-value campaigns get boost
    const premiumKeywords = ['enterprise', 'premium', 'professional', 'business'];
    if (premiumKeywords.some(keyword => 
      promotion.CampaignName?.toLowerCase().includes(keyword)
    )) {
      priority += 2;
    }
    
    // Coupons typically perform better
    if (promotion.PromoCode) {
      priority += 2;
    }
    
    // Time-sensitive promotions
    if (promotion.EndDate) {
      const endDate = new Date(promotion.EndDate);
      const now = new Date();
      const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysLeft < 7) {
        priority += 2; // Urgency boost
      } else if (daysLeft < 30) {
        priority += 1;
      }
    }
    
    // Active status required
    if (promotion.Status !== 'ACTIVE') {
      priority = Math.max(1, priority - 3);
    }
    
    return Math.min(10, priority);
  }
}