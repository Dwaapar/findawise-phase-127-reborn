/**
 * Amazon Product Advertising API 5.0 Adapter
 * Billion-Dollar Empire Grade Implementation
 */

import crypto from 'crypto';
import { BaseAffiliateAdapter, SyncResult } from './baseAdapter';
import { InsertOfferFeed } from '@shared/schema';

export class AmazonPartnerAdapter extends BaseAffiliateAdapter {
  public readonly name = "Amazon Product Advertising API";
  public readonly slug = "amazon-partner";
  public readonly type = "api" as const;
  public readonly description = "Official Amazon Product Advertising API 5.0 integration for millions of products worldwide";
  public readonly supportedRegions = ["US", "UK", "DE", "FR", "IT", "ES", "CA", "AU", "JP", "IN", "BR", "MX"];
  public readonly supportedCategories = [
    "Electronics", "Books", "Home & Kitchen", "Sports & Outdoors", 
    "Tools & Home Improvement", "Toys & Games", "Automotive", 
    "Health & Personal Care", "Beauty", "Clothing", "Software"
  ];

  protected getRequiredCredentials(): string[] {
    return ['accessKey', 'secretKey', 'partnerTag'];
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple search request
      const testPayload = {
        Keywords: "test",
        SearchIndex: "All",
        ItemCount: 1,  
        Resources: ["ItemInfo.Title"]
      };

      const response = await this.makeApiRequest("SearchItems", testPayload);
      return response.SearchResult?.Items?.length >= 0; // Even 0 results indicate successful connection
    } catch (error) {
      console.error(`Amazon PA-API connection test failed:`, error);
      return false;
    }
  }

  async fetchOffers(): Promise<any[]> {
    const allOffers: any[] = [];
    
    // Fetch from multiple high-value categories
    const categories = ["Electronics", "Books", "Software", "Tools"];
    const searchTerms = ["bestseller", "new release", "premium", "professional"];
    
    for (const category of categories) {
      for (const term of searchTerms) {
        try {
          const payload = {
            Keywords: term,
            SearchIndex: category,
            ItemCount: 10,
            Resources: [
              "ItemInfo.Title",
              "ItemInfo.Features", 
              "Offers.Listings.Price",
              "Offers.Listings.SavingBasis",
              "Images.Primary.Large",
              "CustomerReviews.StarRating",
              "CustomerReviews.Count",
              "BrowseNodeInfo.BrowseNodes"
            ]
          };

          const response = await this.makeApiRequest("SearchItems", payload);
          
          if (response.SearchResult?.Items) {
            allOffers.push(...response.SearchResult.Items.map((item: any) => ({
              ...item,
              searchCategory: category,
              searchTerm: term
            })));
          }

          // Rate limiting - Amazon allows 1 request per second for PA-API
          await this.delay(1100);
          
        } catch (error) {
          console.warn(`Failed to fetch from ${category} with term "${term}":`, error);
        }
      }
    }

    console.log(`🛒 Amazon: Fetched ${allOffers.length} products across ${categories.length} categories`);
    return allOffers;
  }

  transformOffer(externalOffer: any): InsertOfferFeed {
    const item = externalOffer;
    const listing = item.Offers?.Listings?.[0];
    const price = listing?.Price?.Amount || 0;
    const savingBasis = listing?.SavingBasis?.Amount || 0;
    
    return {
      title: item.ItemInfo?.Title?.DisplayValue || "Amazon Product",
      slug: this.generateSlug(item.ItemInfo?.Title?.DisplayValue, item.ASIN),
      merchant: "Amazon",
      price: price / 100, // Amazon returns price in cents
      oldPrice: savingBasis > price ? savingBasis / 100 : undefined,
      currency: listing?.Price?.Currency || "USD",
      category: this.mapAmazonCategory(externalOffer.searchCategory),
      tags: [
        "amazon",
        externalOffer.searchCategory?.toLowerCase(),
        ...(item.ItemInfo?.Features?.DisplayValues || []).slice(0, 3)
      ].filter(Boolean),
      sourceType: "api",
      clickTrackingUrl: `https://amazon.com/dp/${item.ASIN}?tag=${this.credentials.partnerTag}`,
      commissionEstimate: this.calculateAmazonCommission(price / 100, externalOffer.searchCategory),
      meta: {
        asin: item.ASIN,
        features: item.ItemInfo?.Features?.DisplayValues || [],
        imageUrl: item.Images?.Primary?.Large?.URL,
        customerRating: item.CustomerReviews?.StarRating?.Value,
        reviewCount: item.CustomerReviews?.Count?.Value,
        searchCategory: externalOffer.searchCategory,
        browseNodes: item.BrowseNodeInfo?.BrowseNodes || []
      },
      region: "US", // TODO: Make this configurable per credentials
      isActive: true,
      priority: this.calculateAmazonPriority(item)
    };
  }

  validateOffer(offer: InsertOfferFeed): boolean {
    return !!(
      offer.title && 
      offer.clickTrackingUrl && 
      offer.merchant === "Amazon" &&
      offer.meta && 
      (offer.meta as any).asin
    );
  }

  // ================================================
  // AMAZON-SPECIFIC METHODS
  // ================================================

  private async makeApiRequest(operation: string, payload: any): Promise<any> {
    const region = "us-east-1";
    const service = "ProductAdvertisingAPI";
    const host = "webservices.amazon.com";
    const endpoint = "/paapi5/searchitems";
    
    const requestPayload = {
      PartnerTag: this.credentials.partnerTag,
      PartnerType: "Associates",
      Marketplace: "www.amazon.com",
      ...payload
    };

    const headers = {
      ...this.getDefaultHeaders(),
      'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
      'Host': host
    };

    // AWS4 Signature
    const canonicalRequest = this.createCanonicalRequest(
      'POST', endpoint, '', headers, JSON.stringify(requestPayload)
    );
    
    const signature = this.createSignature(canonicalRequest, region, service);
    headers['Authorization'] = this.createAuthorizationHeader(signature, region, service);

    const response = await fetch(`https://${host}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`Amazon PA-API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private createCanonicalRequest(method: string, uri: string, query: string, headers: any, payload: string): string {
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n');
    
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');

    return [method, uri, query, canonicalHeaders, '', signedHeaders, hashedPayload].join('\n');
  }

  private createSignature(canonicalRequest: string, region: string, service: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const datetime = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
    
    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${datetime}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;
    
    const dateKey = crypto.createHmac('sha256', `AWS4${this.credentials.secretKey}`).update(date).digest();
    const regionKey = crypto.createHmac('sha256', dateKey).update(region).digest();
    const serviceKey = crypto.createHmac('sha256', regionKey).update(service).digest();
    const signingKey = crypto.createHmac('sha256', serviceKey).update('aws4_request').digest();
    
    return crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  }

  private createAuthorizationHeader(signature: string, region: string, service: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    
    return `AWS4-HMAC-SHA256 Credential=${this.credentials.accessKey}/${credentialScope}, SignedHeaders=host;x-amz-target, Signature=${signature}`;
  }

  private mapAmazonCategory(searchCategory: string): string {
    const categoryMap: Record<string, string> = {
      "Electronics": "electronics",
      "Books": "books", 
      "Software": "software",
      "Tools": "tools",
      "Sports": "sports",
      "Home": "home"
    };
    
    return categoryMap[searchCategory] || searchCategory?.toLowerCase() || "general";
  }

  private calculateAmazonCommission(price: number, category: string): number {
    // Amazon commission rates vary by category
    const commissionRates: Record<string, number> = {
      "Electronics": 0.025,  // 2.5%
      "Books": 0.045,        // 4.5%
      "Software": 0.085,     // 8.5%
      "Tools": 0.085,        // 8.5%
      "Sports": 0.085,       // 8.5%
      "Home": 0.085          // 8.5%
    };
    
    const rate = commissionRates[category] || 0.04; // Default 4%
    return price * rate;
  }

  private calculateAmazonPriority(item: any): number {
    let priority = 5; // Base priority
    
    // High customer rating
    const rating = item.CustomerReviews?.StarRating?.Value;
    if (rating >= 4.5) priority += 3;
    else if (rating >= 4.0) priority += 2;
    else if (rating >= 3.5) priority += 1;
    
    // High review count
    const reviewCount = item.CustomerReviews?.Count?.Value || 0;
    if (reviewCount > 1000) priority += 2;
    else if (reviewCount > 100) priority += 1;
    
    // Discount available
    const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
    const savingBasis = item.Offers?.Listings?.[0]?.SavingBasis?.Amount || 0;
    if (savingBasis > price) priority += 2;
    
    return Math.min(10, priority);
  }
}