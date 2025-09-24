/**
 * Commission Junction (CJ Affiliate) Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class CommissionJunctionAdapter extends BaseAffiliateAdapter {
  public readonly name = "CJ Affiliate (Commission Junction)";
  public readonly slug = "commission-junction";
  public readonly type = "api" as const;
  public readonly description = "Commission Junction API integration for premium retail and e-commerce offers";
  public readonly supportedRegions = ["US", "UK", "DE", "FR", "CA", "AU"];
  public readonly supportedCategories = [
    "Fashion", "Electronics", "Travel", "Finance", "Software", 
    "Health", "Beauty", "Home", "Sports", "Automotive"
  ];

  protected getRequiredCredentials(): string[] {
    return ['apiKey', 'websiteId'];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.buildApiUrl('/v3/advertisers', {
        'page-limit': 1
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`CJ Affiliate connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      // Fetch active advertisers first
      const advertisersResponse = await fetch(this.buildApiUrl('/v3/advertisers', {
        'relationship-status': 'joined',
        'page-limit': 50
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.apiKey}`
        }
      });

      if (!advertisersResponse.ok) {
        throw new Error(`CJ Advertisers API error: ${advertisersResponse.status}`);
      }

      const advertisersData = await advertisersResponse.json();
      const advertisers = advertisersData.data || [];

      console.log(`📊 CJ: Found ${advertisers.length} joined advertisers`);

      // Fetch links from top advertisers
      for (const advertiser of advertisers.slice(0, 20)) { // Limit to top 20 to avoid rate limits
        try {
          await this.delay(500); // Rate limiting
          
          const linksResponse = await fetch(this.buildApiUrl('/v3/links', {
            'advertiser-ids': advertiser.id,
            'link-type': 'banner,text',
            'page-limit': 20
          }), {
            headers: {
              ...this.getDefaultHeaders(),
              'Authorization': `Bearer ${this.credentials.apiKey}`
            }
          });

          if (linksResponse.ok) {
            const linksData = await linksResponse.json();
            const links = linksData.data || [];
            
            allOffers.push(...links.map((link: any) => ({
              ...link,
              advertiserName: advertiser.name,
              advertiserCategory: advertiser['primary-category']?.name
            })));
          }
        } catch (error) {
          console.warn(`Failed to fetch links for advertiser ${advertiser.name}:`, error);
        }
      }

      console.log(`🔗 CJ: Fetched ${allOffers.length} total links`);
      return allOffers;

    } catch (error) {
      console.error('CJ Affiliate fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const offer = externalOffer;
    
    return {
      title: offer['link-name'] || `${offer.advertiserName} Offer`,
      slug: this.generateSlug(offer['link-name'], `cj-${offer.id}`),
      merchant: offer.advertiserName || "CJ Partner",
      price: 0, // CJ doesn't provide direct pricing in links API
      currency: "USD",
      category: this.mapCJCategory(offer.advertiserCategory),
      tags: [
        "cj-affiliate",
        offer.advertiserCategory?.toLowerCase().replace(/\s+/g, '-'),
        offer['link-type']
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: offer['click-url'] || offer.url,
      commissionEstimate: this.extractCommissionFromDescription(offer.description),
      meta: {
        cjLinkId: offer.id,
        advertiserId: offer['advertiser-id'],
        linkType: offer['link-type'],
        promotionType: offer['promotion-type'],
        description: offer.description,
        advertiserCategory: offer.advertiserCategory,
        creativeHeight: offer['creative-height'],
        creativeWidth: offer['creative-width']
      },
      region: "US", // CJ is primarily US-focused
      isActive: true,
      priority: this.calculateCJPriority(offer)
    };
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.merchant &&
      offer.meta && 
      (offer.meta as any).cjLinkId
    );
  }

  // ================================================
  // CJ-SPECIFIC METHODS
  // ================================================

  private buildApiUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = "https://link-search.api.cj.com";
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

  private mapCJCategory(cjCategory: string): string {
    if (!cjCategory) return "general";
    
    const categoryMap: Record<string, string> = {
      "Apparel & Accessories": "fashion",
      "Electronics": "electronics",
      "Travel": "travel",
      "Financial Services": "finance",
      "Software": "software",
      "Health & Beauty": "health",
      "Home & Garden": "home",
      "Sports & Fitness": "sports",
      "Automotive": "automotive"
    };
    
    return categoryMap[cjCategory] || cjCategory.toLowerCase().replace(/\s+/g, '-');
  }

  private extractCommissionFromDescription(description: string): number {
    if (!description) return 0;
    
    // Look for commission patterns like "5% commission", "$10 commission", etc.
    const percentMatch = description.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      const percentage = parseFloat(percentMatch[1]);
      return percentage; // Return as percentage for calculation later
    }
    
    const dollarMatch = description.match(/\$(\d+(?:\.\d+)?)/);
    if (dollarMatch) {
      return parseFloat(dollarMatch[1]);
    }
    
    return 0;
  }

  private calculateCJPriority(offer: any): number {
    let priority = 5; // Base priority
    
    // Boost high-value advertisers
    const premiumAdvertisers = ['amazon', 'walmart', 'target', 'best buy', 'macy'];
    if (premiumAdvertisers.some(advertiser => 
      offer.advertiserName?.toLowerCase().includes(advertiser)
    )) {
      priority += 3;
    }
    
    // Boost based on creative type
    if (offer['link-type'] === 'banner') {
      priority += 1; // Banners typically perform better
    }
    
    // Boost based on promotion type
    if (offer['promotion-type']?.includes('sale') || 
        offer['promotion-type']?.includes('discount')) {
      priority += 2;
    }
    
    return Math.min(10, priority);
  }
}