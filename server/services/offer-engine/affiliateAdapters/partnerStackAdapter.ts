/**
 * PartnerStack B2B SaaS Affiliate Network Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class PartnerStackAdapter extends BaseAffiliateAdapter {
  public readonly name = "PartnerStack B2B Network";
  public readonly slug = "partnerstack";
  public readonly type = "api" as const;
  public readonly description = "PartnerStack API integration for high-value B2B SaaS partnerships and enterprise deals";
  public readonly supportedRegions = ["US", "UK", "CA", "EU", "AU"];
  public readonly supportedCategories = [
    "SaaS", "Enterprise Software", "DevTools", "Analytics", "CRM",
    "Marketing Automation", "Project Management", "Security", "AI/ML Tools"
  ];

  protected getRequiredCredentials(): string[] {
    return ['apiKey', 'partnerId'];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.buildApiUrl('/v2/partnerships'), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'X-Partner-ID': this.credentials.partnerId
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`PartnerStack connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      // Fetch active partnerships
      const partnershipsResponse = await fetch(this.buildApiUrl('/v2/partnerships', {
        status: 'active',
        limit: 50
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'X-Partner-ID': this.credentials.partnerId
        }
      });

      if (!partnershipsResponse.ok) {
        throw new Error(`PartnerStack Partnerships API error: ${partnershipsResponse.status}`);
      }

      const partnershipsData = await partnershipsResponse.json();
      const partnerships = partnershipsData.data || [];

      console.log(`🤝 PartnerStack: Found ${partnerships.length} active partnerships`);

      // Fetch deals and promotions for each partnership
      for (const partnership of partnerships.slice(0, 20)) {
        try {
          await this.delay(500);
          
          const dealsResponse = await fetch(this.buildApiUrl(`/v2/partnerships/${partnership.id}/deals`, {
            status: 'active'
          }), {
            headers: {
              ...this.getDefaultHeaders(),
              'Authorization': `Bearer ${this.credentials.apiKey}`,
              'X-Partner-ID': this.credentials.partnerId
            }
          });

          if (dealsResponse.ok) {
            const dealsData = await dealsResponse.json();
            const deals = dealsData.data || [];
            
            allOffers.push(...deals.map((deal: any) => ({
              ...deal,
              partnershipName: partnership.name,
              partnershipId: partnership.id,
              vendorName: partnership.vendor?.name,
              category: partnership.category
            })));
          }

          // Also fetch promotional materials
          const promoResponse = await fetch(this.buildApiUrl(`/v2/partnerships/${partnership.id}/promotions`), {
            headers: {
              ...this.getDefaultHeaders(),
              'Authorization': `Bearer ${this.credentials.apiKey}`,
              'X-Partner-ID': this.credentials.partnerId
            }
          });

          if (promoResponse.ok) {
            const promoData = await promoResponse.json();
            const promotions = promoData.data || [];
            
            allOffers.push(...promotions.map((promo: any) => ({
              ...promo,
              partnershipName: partnership.name,
              partnershipId: partnership.id,
              vendorName: partnership.vendor?.name,
              category: partnership.category,
              isPromotion: true
            })));
          }

        } catch (error) {
          console.warn(`Failed to fetch deals for partnership ${partnership.name}:`, error);
        }
      }

      console.log(`💼 PartnerStack: Fetched ${allOffers.length} B2B deals and promotions`);
      return allOffers;

    } catch (error) {
      console.error('PartnerStack fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const offer = externalOffer;
    const isPromotion = offer.isPromotion;
    
    return {
      title: offer.title || offer.name || `${offer.vendorName} Partnership Deal`,
      slug: this.generateSlug(offer.title, `ps-${offer.id}`),
      merchant: offer.vendorName || offer.partnershipName || "PartnerStack Partner",
      price: parseFloat(offer.dealValue || offer.monthlyValue || 0),
      currency: offer.currency || "USD",
      couponCode: offer.promoCode || offer.couponCode,
      discountType: this.mapPartnerStackDiscountType(offer.type),
      discountValue: this.extractDiscountValue(offer.description || offer.title),
      validTill: offer.expiryDate ? new Date(offer.expiryDate) : undefined,
      category: this.mapPartnerStackCategory(offer.category),
      tags: [
        "partnerstack",
        "b2b",
        "saas",
        offer.category?.toLowerCase().replace(/\s+/g, '-'),
        isPromotion ? "promotion" : "deal",
        offer.type?.toLowerCase()
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: offer.trackingUrl || offer.partnerUrl,
      commissionEstimate: this.calculatePartnerStackCommission(offer),
      meta: {
        dealId: offer.id,
        partnershipId: offer.partnershipId,
        partnershipName: offer.partnershipName,
        vendorName: offer.vendorName,
        type: offer.type,
        dealValue: offer.dealValue,
        recurringValue: offer.recurringValue,
        payoutStructure: offer.payoutStructure,
        terms: offer.terms,
        description: offer.description,
        targetAudience: offer.targetAudience,
        isEnterprise: offer.isEnterprise
      },
      region: "US", // PartnerStack is primarily US-focused
      emotion: this.inferPartnerStackEmotion(offer),
      isActive: offer.status === 'active',
      priority: this.calculatePartnerStackPriority(offer)
    };
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.merchant &&
      offer.meta && 
      (offer.meta as any).dealId
    );
  }

  // ================================================
  // PARTNERSTACK-SPECIFIC METHODS
  // ================================================

  private buildApiUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = "https://api.partnerstack.com";
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

  private mapPartnerStackCategory(category: string): string {
    if (!category) return "saas";
    
    const categoryMap: Record<string, string> = {
      "SaaS": "saas",
      "Enterprise Software": "enterprise",
      "DevTools": "development",
      "Analytics": "analytics",
      "CRM": "crm",
      "Marketing Automation": "marketing",
      "Project Management": "productivity",
      "Security": "security",
      "AI/ML Tools": "ai-tools"
    };
    
    return categoryMap[category] || category.toLowerCase().replace(/\s+/g, '-');
  }

  private mapPartnerStackDiscountType(type: string): string {
    if (!type) return "deal";
    
    const typeMap: Record<string, string> = {
      "discount": "percentage",
      "credit": "credit",
      "free_trial": "trial",
      "upgrade": "upgrade",
      "cashback": "cashback"
    };
    
    return typeMap[type.toLowerCase()] || "deal";
  }

  private extractDiscountValue(text: string): number {
    if (!text) return 0;
    
    // Look for percentage discounts
    const percentMatch = text.match(/(\d+)%\s*off/i);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    
    // Look for dollar amounts
    const dollarMatch = text.match(/\$(\d+(?:,\d{3})*)\s*off/i);
    if (dollarMatch) {
      return parseFloat(dollarMatch[1].replace(/,/g, ''));
    }
    
    // Look for credit amounts
    const creditMatch = text.match(/\$(\d+(?:,\d{3})*)\s*credit/i);
    if (creditMatch) {
      return parseFloat(creditMatch[1].replace(/,/g, ''));
    }
    
    return 0;
  }

  private calculatePartnerStackCommission(offer: any): number {
    // PartnerStack typically has high B2B commission rates
    const dealValue = parseFloat(offer.dealValue || offer.monthlyValue || 0);
    const recurringValue = parseFloat(offer.recurringValue || 0);
    
    // Default B2B SaaS commission rate (typically 20-30%)
    let commissionRate = 0.25;
    
    // Parse commission from payout structure if available
    if (offer.payoutStructure) {
      const commissionMatch = offer.payoutStructure.match(/(\d+(?:\.\d+)?)%/);
      if (commissionMatch) {
        commissionRate = parseFloat(commissionMatch[1]) / 100;
      }
    }
    
    // Calculate total commission (one-time + recurring)
    const oneTimeCommission = dealValue * commissionRate;
    const recurringCommission = recurringValue * commissionRate * 12; // Annual recurring
    
    return oneTimeCommission + recurringCommission;
  }

  private inferPartnerStackEmotion(offer: any): string {
    const title = (offer.title || offer.name || '').toLowerCase();
    const description = (offer.description || '').toLowerCase();
    const text = `${title} ${description}`;
    
    // Enterprise/exclusive deals
    if (text.includes('enterprise') || text.includes('exclusive') || 
        text.includes('premium') || offer.isEnterprise) {
      return 'exclusive';
    }
    
    // Limited time offers
    if (text.includes('limited') || text.includes('expires') || 
        offer.expiryDate) {
      return 'urgent';
    }
    
    // Popular/trending tools
    if (text.includes('popular') || text.includes('bestseller') || 
        text.includes('top choice')) {
      return 'popular';
    }
    
    return 'trusted';
  }

  private calculatePartnerStackPriority(offer: any): number {
    let priority = 6; // Base priority for B2B deals
    
    // High-value deals
    const dealValue = parseFloat(offer.dealValue || 0);
    if (dealValue > 10000) priority += 3;
    else if (dealValue > 1000) priority += 2;
    else if (dealValue > 100) priority += 1;
    
    // Recurring revenue deals
    if (offer.recurringValue && parseFloat(offer.recurringValue) > 0) {
      priority += 2;
    }
    
    // Enterprise deals
    if (offer.isEnterprise) {
      priority += 2;
    }
    
    // Time-sensitive offers
    if (offer.expiryDate) {
      const expiryDate = new Date(offer.expiryDate);
      const now = new Date();
      const daysLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysLeft < 30) {
        priority += 1;
      }
    }
    
    // Popular categories
    const popularCategories = ['ai/ml tools', 'devtools', 'analytics'];
    if (popularCategories.includes((offer.category || '').toLowerCase())) {
      priority += 1;
    }
    
    return Math.min(10, priority);
  }
}