/**
 * eBay Partner Network Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class EbayPartnerAdapter extends BaseAffiliateAdapter {
  public readonly name = "eBay Partner Network";
  public readonly slug = "ebay-partner";
  public readonly type = "api" as const;
  public readonly description = "eBay Partner Network API integration for marketplace deals and auctions";
  public readonly supportedRegions = ["US", "UK", "DE", "AU", "CA", "FR", "IT", "ES"];
  public readonly supportedCategories = [
    "Electronics", "Fashion", "Home & Garden", "Collectibles", "Motors",
    "Sports", "Toys", "Books", "Music", "Health & Beauty", "Business"
  ];

  protected getRequiredCredentials(): string[] {
    return ['clientId', 'clientSecret', 'campaignId'];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.buildApiUrl('/buy/browse/v1/item_summary/search', {
        q: 'test',
        limit: 1
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`eBay Partner connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to obtain eBay access token');
      }

      // Search popular categories for deals
      const categories = [
        'Electronics',
        'Fashion',
        'Home & Garden',
        'Sports',
        'Toys & Hobbies'
      ];

      for (const category of categories) {
        try {
          await this.delay(500);
          
          const response = await fetch(this.buildApiUrl('/buy/browse/v1/item_summary/search', {
            category_ids: this.getCategoryId(category),
            sort: 'price',
            filter: 'conditionIds:{1000|1500|2000|2500|3000|4000|5000}', // New to Acceptable
            limit: 20,
            offset: 0
          }), {
            headers: {
              ...this.getDefaultHeaders(),
              'Authorization': `Bearer ${accessToken}`,
              'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const items = data.itemSummaries || [];
            
            allOffers.push(...items.map((item: any) => ({
              ...item,
              categoryName: category
            })));
          }

        } catch (error) {
          console.warn(`Failed to fetch eBay items for category ${category}:`, error);
        }
      }

      // Also fetch daily deals if available
      try {
        await this.delay(500);
        
        const dealsResponse = await fetch(this.buildApiUrl('/buy/deal/v1/deal_item', {
          limit: 30
        }), {
          headers: {
            ...this.getDefaultHeaders(),
            'Authorization': `Bearer ${accessToken}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          }
        });

        if (dealsResponse.ok) {
          const dealsData = await dealsResponse.json();
          const deals = dealsData.dealItems || [];
          
          allOffers.push(...deals.map((deal: any) => ({
            ...deal,
            isDeal: true,
            categoryName: 'Daily Deals'
          })));
        }

      } catch (error) {
        console.warn('Failed to fetch eBay daily deals:', error);
      }

      console.log(`🛒 eBay Partner: Fetched ${allOffers.length} marketplace items`);
      return allOffers;

    } catch (error) {
      console.error('eBay Partner fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const offer = externalOffer;
    const isDeal = offer.isDeal || offer.originalPrice;
    
    return {
      title: offer.title || "eBay Marketplace Item",
      slug: this.generateSlug(offer.title, `ebay-${offer.itemId}`),
      merchant: "eBay",
      price: this.parsePrice(offer.price?.value),
      oldPrice: isDeal ? this.parsePrice(offer.originalPrice?.value) : undefined,
      currency: offer.price?.currency || "USD",
      discountType: isDeal ? "percentage" : undefined,
      discountValue: this.calculateDiscountPercentage(offer),
      category: this.mapEbayCategory(offer.categoryName || offer.categories?.[0]?.categoryName),
      tags: [
        "ebay",
        "marketplace",
        offer.condition?.toLowerCase().replace(/\s+/g, '-'),
        offer.categoryName?.toLowerCase().replace(/\s+/g, '-'),
        isDeal ? "deal" : "regular"
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: this.buildAffiliateUrl(offer.itemWebUrl || offer.itemAffiliateWebUrl),
      commissionEstimate: this.calculateEbayCommission(offer),
      meta: {
        itemId: offer.itemId,
        categoryId: offer.categoryId,
        condition: offer.condition,
        conditionId: offer.conditionId,
        seller: offer.seller?.username,
        sellerFeedbackScore: offer.seller?.feedbackScore,
        sellerFeedbackPercentage: offer.seller?.feedbackPercentage,
        shipping: offer.shippingOptions,
        location: offer.itemLocation,
        buyItNowAvailable: offer.buyItNowAvailable,
        originalPrice: offer.originalPrice,
        isDeal: isDeal,
        image: offer.image?.imageUrl,
        galleryImages: offer.additionalImages
      },
      region: "US",
      emotion: this.inferEbayEmotion(offer),
      isActive: true,
      priority: this.calculateEbayPriority(offer)
    };
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.price &&
      offer.meta && 
      (offer.meta as any).itemId
    );
  }

  // ================================================
  // EBAY-SPECIFIC METHODS
  // ================================================

  private async getAccessToken(): Promise<string | null> {
    try {
      const credentials = Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`).toString('base64');
      
      const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get eBay access token:', error);
      return null;
    }
  }

  private buildApiUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = "https://api.ebay.com";
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

  private buildAffiliateUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    
    // Add eBay Partner Network campaign ID to the URL
    const url = new URL(originalUrl);
    url.searchParams.set('campid', this.credentials.campaignId);
    url.searchParams.set('toolid', '10001');
    
    return url.toString();
  }

  private getCategoryId(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      'Electronics': '58058',
      'Fashion': '11450',
      'Home & Garden': '11700',
      'Sports': '888',
      'Toys & Hobbies': '220',
      'Collectibles': '1',
      'Motors': '6000',
      'Books': '267',
      'Music': '11233',
      'Health & Beauty': '26395',
      'Business': '12576'
    };
    
    return categoryMap[categoryName] || '58058'; // Default to Electronics
  }

  private mapEbayCategory(categoryName: string): string {
    if (!categoryName) return "general";
    
    const categoryMap: Record<string, string> = {
      "Electronics": "electronics",
      "Fashion": "fashion",
      "Home & Garden": "home",
      "Sports": "sports",
      "Toys & Hobbies": "toys",
      "Collectibles": "collectibles",
      "Motors": "automotive",
      "Books": "books",
      "Music": "music",
      "Health & Beauty": "health",
      "Business": "business",
      "Daily Deals": "deals"
    };
    
    return categoryMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
  }

  private parsePrice(priceValue: any): number {
    if (typeof priceValue === 'number') return priceValue;
    if (typeof priceValue === 'string') {
      const match = priceValue.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    return 0;
  }

  private calculateDiscountPercentage(offer: any): number {
    if (!offer.originalPrice || !offer.price) return 0;
    
    const original = this.parsePrice(offer.originalPrice.value);
    const current = this.parsePrice(offer.price.value);
    
    if (original <= current) return 0;
    
    return Math.round(((original - current) / original) * 100);
  }

  private calculateEbayCommission(offer: any): number {
    // eBay Partner Network commission rates vary by category
    const categoryCommissions: Record<string, number> = {
      'Electronics': 2.0,
      'Fashion': 4.0,
      'Home & Garden': 3.0,
      'Sports': 3.0,
      'Toys & Hobbies': 4.0,
      'Collectibles': 3.0,
      'Motors': 1.0,
      'Books': 4.0,
      'Music': 4.0,
      'Health & Beauty': 4.0,
      'Business': 2.0
    };
    
    const category = offer.categoryName || 'Electronics';
    const commissionRate = categoryCommissions[category] || 2.0;
    const price = this.parsePrice(offer.price?.value) || 0;
    
    return (price * commissionRate) / 100;
  }

  private inferEbayEmotion(offer: any): string {
    const title = (offer.title || '').toLowerCase();
    
    // Deal detection
    if (offer.isDeal || offer.originalPrice || 
        title.includes('sale') || title.includes('deal')) {
      return 'urgent';
    }
    
    // Popular items
    if (title.includes('popular') || title.includes('bestseller') ||
        (offer.seller?.feedbackScore && offer.seller.feedbackScore > 10000)) {
      return 'popular';
    }
    
    // Exclusive/rare items
    if (title.includes('rare') || title.includes('limited') || 
        title.includes('exclusive') || title.includes('vintage')) {
      return 'exclusive';
    }
    
    return 'trusted';
  }

  private calculateEbayPriority(offer: any): number {
    let priority = 4; // Base priority for eBay items
    
    // Deal items get higher priority
    if (offer.isDeal || offer.originalPrice) {
      priority += 2;
    }
    
    // High-rated sellers
    if (offer.seller?.feedbackPercentage && offer.seller.feedbackPercentage >= 98) {
      priority += 1;
    }
    
    // High feedback score sellers
    if (offer.seller?.feedbackScore && offer.seller.feedbackScore > 1000) {
      priority += 1;
    }
    
    // New condition items
    if (offer.condition && offer.condition.toLowerCase().includes('new')) {
      priority += 1;
    }
    
    // Free shipping
    if (offer.shippingOptions?.some((option: any) => 
      option.shippingCost?.value === 0 || option.type === 'FREE'
    )) {
      priority += 1;
    }
    
    // Buy It Now available
    if (offer.buyItNowAvailable) {
      priority += 1;
    }
    
    return Math.min(10, priority);
  }
}