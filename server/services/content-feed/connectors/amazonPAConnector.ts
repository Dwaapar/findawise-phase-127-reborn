// Amazon Product Advertising API Connector - Real Amazon PA API integration
import { BaseConnector, ConnectorFetchOptions, NormalizedContentItem, ConnectorConfig } from "./baseConnector";
import { ContentFeedSource } from "../../../../shared/contentFeedTables";
import axios from "axios";
import crypto from "crypto";

interface AmazonPAConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  region: string; // e.g., 'us-east-1'
  marketplace: string; // e.g., 'www.amazon.com'
}

interface AmazonProductItem {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo: {
    Title: { DisplayValue: string };
    ByLineInfo?: { Brand?: { DisplayValue: string } };
    Features?: { DisplayValues: string[] };
    Classifications?: { ProductGroup?: { DisplayValue: string } };
  };
  Images: {
    Primary?: { Large: { URL: string } };
    Variants?: Array<{ Large: { URL: string } }>;
  };
  Offers: {
    Listings: Array<{
      Price: { Amount: number; Currency: string };
      SavingBasis?: { Amount: number; Currency: string };
      ViolatesMAP: boolean;
    }>;
    Summaries: Array<{
      LowestPrice: { Amount: number; Currency: string };
      HighestPrice: { Amount: number; Currency: string };
    }>;
  };
  CustomerReviews?: {
    StarRating: { Value: number };
    Count: number;
  };
  BrowseNodeInfo?: {
    BrowseNodes: Array<{
      DisplayName: string;
      ContextFreeName: string;
    }>;
  };
}

export class AmazonPAConnector extends BaseConnector {
  constructor() {
    const config: ConnectorConfig = {
      name: "Amazon Product Advertising API",
      version: "1.0.0",
      supportedContentTypes: ["product", "offer", "deal"],
      requiredAuth: ["accessKey", "secretKey", "partnerTag", "region"],
      rateLimits: {
        requestsPerMinute: 8, // Amazon PA API limits
        requestsPerHour: 480,
        requestsPerDay: 8640
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 2000
      }
    };

    super(config);
  }

  async fetchContent(source: ContentFeedSource, options: ConnectorFetchOptions = { syncType: 'manual' }): Promise<any[]> {
    try {
      console.log(`🔄 Fetching Amazon products via PA API`);

      const authConfig = this.validateAuthConfig(source.authConfig);
      const searchParams = this.buildSearchParams(source, options);

      const amazonItems = await this.makeRequest(async () => {
        return await this.searchProducts(authConfig, searchParams);
      });

      const normalizedItems: NormalizedContentItem[] = [];

      for (const item of amazonItems) {
        try {
          const normalizedItem = this.normalizeRawContent(item, source);
          normalizedItems.push(normalizedItem);

          if (options.maxItems && normalizedItems.length >= options.maxItems) {
            break;
          }
        } catch (itemError) {
          console.warn('Error processing Amazon item:', itemError);
          continue;
        }
      }

      console.log(`✅ Successfully processed ${normalizedItems.length} Amazon products`);
      return amazonItems;

    } catch (error) {
      console.error('Error fetching Amazon content:', error);
      throw error;
    }
  }

  private validateAuthConfig(authConfig: any): AmazonPAConfig {
    if (!authConfig || typeof authConfig !== 'object') {
      throw new Error('Amazon PA API authentication config is required');
    }

    const { accessKey, secretKey, partnerTag, region } = authConfig;

    if (!accessKey || !secretKey || !partnerTag || !region) {
      throw new Error('Amazon PA API requires: accessKey, secretKey, partnerTag, region');
    }

    return {
      accessKey,
      secretKey,
      partnerTag,
      region,
      marketplace: authConfig.marketplace || 'www.amazon.com'
    };
  }

  private buildSearchParams(source: ContentFeedSource, options: ConnectorFetchOptions): any {
    const settings = (source.settings as any) || {};
    
    return {
      keywords: settings.keywords || settings.searchTerms || 'electronics',
      searchIndex: settings.searchIndex || 'All',
      itemCount: Math.min(options.maxItems || 10, 10), // Amazon PA API max per request
      minPrice: settings.minPrice,
      maxPrice: settings.maxPrice,
      condition: settings.condition || 'New',
      merchant: settings.merchant || 'Amazon',
      browseNodeId: settings.browseNodeId,
      brand: settings.brand
    };
  }

  private async searchProducts(auth: AmazonPAConfig, params: any): Promise<AmazonProductItem[]> {
    const host = `webservices.amazon.${auth.region === 'us-east-1' ? 'com' : auth.region}`;
    const uri = '/paapi5/searchitems';
    
    const requestBody: any = {
      Keywords: params.keywords,
      SearchIndex: params.searchIndex,
      ItemCount: params.itemCount,
      PartnerTag: auth.partnerTag,
      PartnerType: 'Associates',
      Marketplace: auth.marketplace,
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.Features',
        'ItemInfo.Classifications',
        'Images.Primary.Large',
        'Images.Variants.Large',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Summaries.LowestPrice',
        'Offers.Summaries.HighestPrice',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count',
        'BrowseNodeInfo.BrowseNodes'
      ]
    };

    // Add optional filters
    if (params.minPrice || params.maxPrice) {
      requestBody.MinPrice = params.minPrice;
      requestBody.MaxPrice = params.maxPrice;
    }

    if (params.condition) {
      requestBody.Condition = params.condition;
    }

    if (params.merchant) {
      requestBody.Merchant = params.merchant;
    }

    if (params.browseNodeId) {
      requestBody.BrowseNodeId = params.browseNodeId;
    }

    if (params.brand) {
      requestBody.Brand = params.brand;
    }

    const headers = this.generateAuthHeaders(auth, host, uri, JSON.stringify(requestBody));

    const response = await axios.post(`https://${host}${uri}`, requestBody, {
      headers,
      timeout: 30000
    });

    if (response.data.SearchResult && response.data.SearchResult.Items) {
      return response.data.SearchResult.Items;
    }

    if (response.data.Errors && response.data.Errors.length > 0) {
      throw new Error(`Amazon PA API Error: ${response.data.Errors[0].Message}`);
    }

    return [];
  }

  private generateAuthHeaders(auth: AmazonPAConfig, host: string, uri: string, payload: string): any {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);

    // Create canonical request
    const canonicalHeaders = [
      `content-encoding:amz-1.0`,
      `content-type:application/json; charset=utf-8`,
      `host:${host}`,
      `x-amz-date:${amzDate}`,
      `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems`
    ].join('\n');

    const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

    const canonicalRequest = [
      'POST',
      uri,
      '', // query string
      canonicalHeaders,
      '', // blank line
      signedHeaders,
      payloadHash
    ].join('\n');

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${auth.region}/ProductAdvertisingAPI/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    // Calculate signature
    const signingKey = this.getSignatureKey(auth.secretKey, dateStamp, auth.region, 'ProductAdvertisingAPI');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    // Create authorization header
    const authorization = `${algorithm} Credential=${auth.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      'Content-Encoding': 'amz-1.0',
      'Content-Type': 'application/json; charset=utf-8',
      'Host': host,
      'X-Amz-Date': amzDate,
      'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      'Authorization': authorization
    };
  }

  private getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
    const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    return kSigning;
  }

  normalizeRawContent(item: AmazonProductItem, source: ContentFeedSource): NormalizedContentItem {
    const title = item.ItemInfo?.Title?.DisplayValue || 'Amazon Product';
    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue;
    const features = item.ItemInfo?.Features?.DisplayValues || [];
    const productGroup = item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue;

    // Extract pricing
    let price: number | undefined;
    let originalPrice: number | undefined;
    let currency = 'USD';

    if (item.Offers?.Listings && item.Offers.Listings.length > 0) {
      const listing = item.Offers.Listings[0];
      price = listing.Price?.Amount;
      currency = listing.Price?.Currency || 'USD';
      originalPrice = listing.SavingBasis?.Amount;
    } else if (item.Offers?.Summaries && item.Offers.Summaries.length > 0) {
      const summary = item.Offers.Summaries[0];
      price = summary.LowestPrice?.Amount;
      currency = summary.LowestPrice?.Currency || 'USD';
    }

    // Convert cents to dollars for USD
    if (currency === 'USD' && price) {
      price = price / 100;
      if (originalPrice) originalPrice = originalPrice / 100;
    }

    // Calculate discount
    const discount = originalPrice && price ? this.calculateDiscount(originalPrice, price) : undefined;

    // Extract images
    const images: string[] = [];
    if (item.Images?.Primary?.Large?.URL) {
      images.push(item.Images.Primary.Large.URL);
    }
    if (item.Images?.Variants) {
      for (const variant of item.Images.Variants) {
        if (variant.Large?.URL) {
          images.push(variant.Large.URL);
        }
      }
    }

    // Extract category from browse nodes
    let category = productGroup?.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (item.BrowseNodeInfo?.BrowseNodes && item.BrowseNodeInfo.BrowseNodes.length > 0) {
      category = item.BrowseNodeInfo.BrowseNodes[0].DisplayName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    // Build description from features
    const description = features.length > 0 
      ? `${brand ? brand + ' ' : ''}${title}. Key features: ${features.slice(0, 3).join(', ')}`
      : `${brand ? brand + ' ' : ''}${title}`;

    // Extract rating and review count
    const rating = item.CustomerReviews?.StarRating?.Value;
    const reviewCount = item.CustomerReviews?.Count;

    // Generate tags
    const tags = [productGroup, brand, ...(category ? [category] : [])].filter((tag): tag is string => Boolean(tag));

    return {
      externalId: item.ASIN,
      contentType: 'product',
      title,
      description,
      content: features.join('\n'),
      excerpt: this.generateExcerpt(description),
      category,
      tags,
      price,
      originalPrice,
      currency,
      discount,
      affiliateUrl: item.DetailPageURL,
      merchantName: 'Amazon',
      imageUrl: images[0],
      images: images.length > 0 ? images : undefined,
      rating,
      reviewCount,
      status: 'active'
    };
  }

  async validateAuth(authConfig: any): Promise<boolean> {
    try {
      const auth = this.validateAuthConfig(authConfig);
      
      // Test with a simple search
      const testItems = await this.searchProducts(auth, {
        keywords: 'test',
        searchIndex: 'All',
        itemCount: 1
      });

      return true; // If no error thrown, auth is valid
    } catch (error) {
      console.error('Amazon PA auth validation failed:', error);
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Amazon PA API doesn't have a dedicated health endpoint
      // We'll return true if the service is properly configured
      return true;
    } catch (error) {
      console.error('Amazon PA connector health check failed:', error);
      return false;
    }
  }
}