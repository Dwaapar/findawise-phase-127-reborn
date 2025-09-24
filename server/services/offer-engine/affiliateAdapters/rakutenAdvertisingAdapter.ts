/**
 * Rakuten Advertising (formerly LinkShare) Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import { BaseAffiliateAdapter } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class RakutenAdvertisingAdapter extends BaseAffiliateAdapter {
  public readonly name = "Rakuten Advertising";
  public readonly slug = "rakuten-advertising";
  public readonly type = "api" as const;
  public readonly description = "Rakuten Advertising API integration for premium brand partnerships and global offers";
  public readonly supportedRegions = ["US", "UK", "DE", "FR", "IT", "ES", "CA", "AU", "JP"];
  public readonly supportedCategories = [
    "Fashion & Accessories", "Electronics", "Home & Garden", "Sports & Outdoors",
    "Health & Beauty", "Travel", "Automotive", "Business Services", "Software"
  ];

  protected getRequiredCredentials(): string[] {
    return ['token', 'publisherId'];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.buildApiUrl('/coupon/1.0'), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.token}`
        }
      });

      return response.status !== 401; // Any response other than unauthorized means connection works
    } catch (error) {
      console.error(`Rakuten Advertising connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    try {
      // Fetch coupons and deals
      const couponsResponse = await fetch(this.buildApiUrl('/coupon/1.0', {
        publisherid: this.credentials.publisherId,
        network: '1',
        resultsmaxnum: '100'
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.token}`
        }
      });

      if (couponsResponse.ok) {
        const couponsData = await couponsResponse.text();
        const coupons = this.parseRakutenXML(couponsData);
        allOffers.push(...coupons);
      }

      await this.delay(1000); // Rate limiting

      // Fetch product catalog
      const productsResponse = await fetch(this.buildApiUrl('/productsearch/1.0', {
        publisherid: this.credentials.publisherId,
        network: '1',
        max: '50',
        keyword: 'bestseller'
      }), {
        headers: {
          ...this.getDefaultHeaders(),
          'Authorization': `Bearer ${this.credentials.token}`
        }
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.text();
        const products = this.parseRakutenXML(productsData);
        allOffers.push(...products);
      }

      console.log(`🛍️ Rakuten: Fetched ${allOffers.length} offers and products`);
      return allOffers;

    } catch (error) {
      console.error('Rakuten Advertising fetchOffers error:', error);
      return [];
    }
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const offer = externalOffer;
    const isCoupon = offer.offertype === 'coupon' || offer.couponcode;
    
    return {
      title: offer.offerdescription || offer.productname || `${offer.advertisername} Offer`,
      slug: this.generateSlug(offer.offerdescription, `rakuten-${offer.offerid || offer.mid}`),
      merchant: offer.advertisername || "Rakuten Partner",
      price: parseFloat(offer.saleprice || offer.price || 0),
      oldPrice: offer.retailprice ? parseFloat(offer.retailprice) : undefined,
      currency: offer.currency || "USD",
      couponCode: isCoupon ? offer.couponcode : undefined,
      discountType: isCoupon ? "coupon" : undefined,
      discountValue: this.extractDiscountValue(offer.offerdescription),
      validTill: offer.offerenddate ? new Date(offer.offerenddate) : undefined,
      category: this.mapRakutenCategory(offer.category),
      tags: [
        "rakuten",
        offer.category?.toLowerCase().replace(/\s+/g, '-'),
        isCoupon ? "coupon" : "product",
        ...(offer.keywords?.split(',') || []).slice(0, 3)
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: offer.clickurl || offer.linkurl,
      commissionEstimate: this.calculateRakutenCommission(offer),
      meta: {
        offerId: offer.offerid,
        advertiserId: offer.advertiserid,
        mid: offer.mid,
        category: offer.category,
        network: offer.network,
        offertype: offer.offertype,
        sku: offer.sku,
        upc: offer.upc,
        imageurl: offer.imageurl,
        brand: offer.brand
      },
      region: this.mapRakutenRegion(offer.network),
      emotion: isCoupon ? "urgent" : "trusted",
      isActive: true,
      priority: this.calculateRakutenPriority(offer)
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
  // RAKUTEN-SPECIFIC METHODS
  // ================================================

  private buildApiUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = "https://api.rakutenadvertising.com";
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

  private parseRakutenXML(xmlData: string): any[] {
    // Simple XML parsing for Rakuten's response format
    // In production, use a proper XML parser like xml2js
    const items: any[] = [];
    
    try {
      // Extract items between <item> tags
      const itemMatches = xmlData.match(/<item[^>]*>([\s\S]*?)<\/item>/g);
      
      if (itemMatches) {
        for (const itemXml of itemMatches) {
          const item: any = {};
          
          // Extract common fields
          const fields = [
            'offerid', 'offerdescription', 'advertisername', 'advertiserid',
            'couponcode', 'offerstartdate', 'offerenddate', 'clickurl',
            'saleprice', 'retailprice', 'currency', 'category', 'offertype',
            'productname', 'sku', 'upc', 'brand', 'imageurl', 'linkurl'
          ];
          
          for (const field of fields) {
            const regex = new RegExp(`<${field}[^>]*>([^<]*)<\/${field}>`, 'i');
            const match = itemXml.match(regex);
            if (match) {
              item[field] = match[1];
            }
          }
          
          if (item.offerid || item.sku) {
            items.push(item);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing Rakuten XML:', error);
    }
    
    return items;
  }

  private mapRakutenCategory(category: string): string {
    if (!category) return "general";
    
    const categoryMap: Record<string, string> = {
      "Apparel & Accessories": "fashion",
      "Electronics": "electronics",
      "Home & Garden": "home",
      "Sports & Outdoors": "sports",
      "Health & Beauty": "health",
      "Travel": "travel",
      "Automotive": "automotive",
      "Business Services": "business"
    };
    
    return categoryMap[category] || category.toLowerCase().replace(/\s+/g, '-');
  }

  private mapRakutenRegion(network: string): string {
    // Rakuten network IDs map to regions
    const networkMap: Record<string, string> = {
      '1': 'US',
      '2': 'UK', 
      '3': 'CA',
      '4': 'DE',
      '5': 'FR'
    };
    
    return networkMap[network] || 'US';
  }

  private extractDiscountValue(description: string): number {
    if (!description) return 0;
    
    const percentMatch = description.match(/(\d+)%\s*off/i);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    
    const dollarMatch = description.match(/\$(\d+)\s*off/i);
    if (dollarMatch) {
      return parseFloat(dollarMatch[1]);
    }
    
    return 0;
  }

  private calculateRakutenCommission(offer: any): number {
    // Rakuten commission rates are typically network/advertiser specific
    // Default estimation based on category
    const price = parseFloat(offer.saleprice || offer.price || 0);
    const category = offer.category?.toLowerCase() || '';
    
    let rate = 0.05; // Default 5%
    
    if (category.includes('fashion')) rate = 0.08;
    else if (category.includes('electronics')) rate = 0.03;
    else if (category.includes('travel')) rate = 0.04;
    else if (category.includes('software')) rate = 0.15;
    
    return price * rate;
  }

  private calculateRakutenPriority(offer: any): number {
    let priority = 5; // Base priority
    
    // Premium advertisers get boost
    const premiumAdvertisers = ['macy', 'nordstrom', 'sephora', 'nike', 'best buy'];
    if (premiumAdvertisers.some(advertiser => 
      offer.advertisername?.toLowerCase().includes(advertiser)
    )) {
      priority += 2;
    }
    
    // Coupons get higher priority
    if (offer.couponcode) {
      priority += 2;
    }
    
    // Time-sensitive offers
    if (offer.offerenddate) {
      const endDate = new Date(offer.offerenddate);
      const now = new Date();
      const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysLeft < 7) {
        priority += 1;
      }
    }
    
    return Math.min(10, priority);
  }
}