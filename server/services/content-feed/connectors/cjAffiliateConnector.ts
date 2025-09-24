// CJ Affiliate Connector - Commission Junction affiliate network integration
import { BaseConnector, ConnectorFetchOptions, NormalizedContentItem, ConnectorConfig } from "./baseConnector";
import { ContentFeedSource } from "../../../../shared/contentFeedTables";
import axios from "axios";

interface CJAffiliateConfig {
  apiKey: string;
  websiteId: string;
}

interface CJProduct {
  'advertiser-id': string;
  'advertiser-name': string;
  'catalog-id': string;
  sku: string;
  name: string;
  keywords: string;
  description: string;
  price: string;
  'sale-price': string;
  currency: string;
  'image-url': string;
  'buy-url': string;
  'advertiser-category': string;
  'in-stock': string;
  availability: string;
  'manufacturer-name': string;
  'manufacturer-sku': string;
  upc: string;
  isbn: string;
  'retail-price': string;
}

interface CJLink {
  'advertiser-id': string;
  'advertiser-name': string;
  'link-code-html': string;
  'link-code-javascript': string;
  'link-id': string;
  'link-name': string;
  'link-type': string;
  'seven-day-epc': string;
  'three-month-epc': string;
  'clickable-link-url': string;
  'creative-height': string;
  'creative-width': string;
  'promotion-type': string;
  'promotion-start-date': string;
  'promotion-end-date': string;
}

export class CJAffiliateConnector extends BaseConnector {
  constructor() {
    const config: ConnectorConfig = {
      name: "CJ Affiliate (Commission Junction)",
      version: "1.0.0",
      supportedContentTypes: ["product", "offer", "deal"],
      requiredAuth: ["apiKey", "websiteId"],
      rateLimits: {
        requestsPerMinute: 100, // CJ Affiliate generous limits
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000
      }
    };

    super(config);
  }

  async fetchContent(source: ContentFeedSource, options: ConnectorFetchOptions = { syncType: 'manual' }): Promise<any[]> {
    try {
      console.log(`🔄 Fetching CJ Affiliate content`);

      const authConfig = this.validateAuthConfig(source.authConfig);
      const searchParams = this.buildSearchParams(source, options);

      // Fetch both products and promotional links
      const [products, links] = await Promise.all([
        this.makeRequest(() => this.fetchProducts(authConfig, searchParams)),
        this.makeRequest(() => this.fetchPromotionalLinks(authConfig, searchParams))
      ]);

      const normalizedItems: NormalizedContentItem[] = [];

      // Process products
      for (const product of products) {
        try {
          const normalizedItem = this.normalizeProduct(product, source);
          normalizedItems.push(normalizedItem);

          if (options.maxItems && normalizedItems.length >= options.maxItems) {
            break;
          }
        } catch (itemError) {
          console.warn('Error processing CJ product:', itemError);
          continue;
        }
      }

      // Process promotional links as offers
      for (const link of links) {
        try {
          if (options.maxItems && normalizedItems.length >= options.maxItems) {
            break;
          }

          const normalizedItem = this.normalizePromotionalLink(link, source);
          normalizedItems.push(normalizedItem);
        } catch (itemError) {
          console.warn('Error processing CJ promotional link:', itemError);
          continue;
        }
      }

      console.log(`✅ Successfully processed ${normalizedItems.length} CJ Affiliate items`);
      return [...products, ...links];

    } catch (error) {
      console.error('Error fetching CJ Affiliate content:', error);
      throw error;
    }
  }

  private validateAuthConfig(authConfig: any): CJAffiliateConfig {
    if (!authConfig || typeof authConfig !== 'object') {
      throw new Error('CJ Affiliate authentication config is required');
    }

    const { apiKey, websiteId } = authConfig;

    if (!apiKey || !websiteId) {
      throw new Error('CJ Affiliate requires: apiKey, websiteId');
    }

    return { apiKey, websiteId };
  }

  private buildSearchParams(source: ContentFeedSource, options: ConnectorFetchOptions): any {
    const settings = (source.settings as any) || {};
    
    return {
      keywords: settings.keywords || settings.searchTerms || '',
      advertiserIds: settings.advertiserIds || '', // Comma-separated list
      lowPrice: settings.minPrice || '',
      highPrice: settings.maxPrice || '',
      currency: settings.currency || 'USD',
      recordsPerPage: Math.min(options.maxItems || 50, 1000), // CJ max per request
      pageNumber: 1,
      linkType: settings.linkType || 'Text Link', // Text Link, Banner, Product Catalog, etc.
      promotionType: settings.promotionType || '', // Coupon, Sale, etc.
      advertiserCategory: settings.category || ''
    };
  }

  private async fetchProducts(auth: CJAffiliateConfig, params: any): Promise<CJProduct[]> {
    const baseUrl = 'https://product-search.api.cj.com/v2/product-search';
    
    const queryParams = new URLSearchParams({
      'website-id': auth.websiteId,
      'records-per-page': params.recordsPerPage.toString(),
      'page-number': params.pageNumber.toString()
    });

    if (params.keywords) queryParams.append('keywords', params.keywords);
    if (params.advertiserIds) queryParams.append('advertiser-ids', params.advertiserIds);
    if (params.lowPrice) queryParams.append('low-price', params.lowPrice);
    if (params.highPrice) queryParams.append('high-price', params.highPrice);
    if (params.currency) queryParams.append('currency', params.currency);
    if (params.advertiserCategory) queryParams.append('advertiser-category', params.advertiserCategory);

    const response = await axios.get(`${baseUrl}?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${auth.apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    return response.data.products || [];
  }

  private async fetchPromotionalLinks(auth: CJAffiliateConfig, params: any): Promise<CJLink[]> {
    const baseUrl = 'https://link-search.api.cj.com/v2/link-search';
    
    const queryParams = new URLSearchParams({
      'website-id': auth.websiteId,
      'records-per-page': Math.min(params.recordsPerPage, 100).toString(), // Links have lower limit
      'page-number': params.pageNumber.toString(),
      'link-type': params.linkType
    });

    if (params.keywords) queryParams.append('keywords', params.keywords);
    if (params.advertiserIds) queryParams.append('advertiser-ids', params.advertiserIds);
    if (params.promotionType) queryParams.append('promotion-type', params.promotionType);
    if (params.advertiserCategory) queryParams.append('advertiser-category', params.advertiserCategory);

    const response = await axios.get(`${baseUrl}?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${auth.apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    return response.data.links || [];
  }

  normalizeRawContent(item: CJProduct | CJLink, source: ContentFeedSource): NormalizedContentItem {
    // Check if this is a CJProduct or CJLink
    if ('sku' in item) {
      return this.normalizeProduct(item as CJProduct, source);
    } else {
      return this.normalizePromotionalLink(item as CJLink, source);
    }
  }

  private normalizeProduct(product: CJProduct, source: ContentFeedSource): NormalizedContentItem {
    const price = this.normalizePrice(product.price || product['sale-price']);
    const originalPrice = product['retail-price'] ? this.normalizePrice(product['retail-price']) : undefined;
    const salePrice = product['sale-price'] ? this.normalizePrice(product['sale-price']) : undefined;

    // Determine best price and original price
    const finalPrice = salePrice || price;
    const finalOriginalPrice = (salePrice && price && price > salePrice) ? price : originalPrice;

    const discount = finalOriginalPrice && finalPrice ? this.calculateDiscount(finalOriginalPrice, finalPrice) : undefined;

    // Clean up category
    const category = product['advertiser-category']?.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Generate tags from various fields
    const tags = [
      product['advertiser-name'],
      product['manufacturer-name'],
      category
    ].filter(Boolean);

    // Create description
    const description = product.description || `${product.name} from ${product['advertiser-name']}`;

    return {
      externalId: `cj_${product['advertiser-id']}_${product.sku}`,
      contentType: 'product',
      title: product.name,
      description: this.cleanHtml(description),
      content: `${description}\n\nKeywords: ${product.keywords}\nManufacturer: ${product['manufacturer-name'] || 'N/A'}\nSKU: ${product.sku}`,
      excerpt: this.generateExcerpt(description),
      category,
      tags,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      currency: product.currency || 'USD',
      discount,
      affiliateUrl: product['buy-url'],
      merchantName: product['advertiser-name'],
      imageUrl: product['image-url'],
      images: product['image-url'] ? [product['image-url']] : undefined,
      status: product['in-stock'] === 'yes' ? 'active' : 'out_of_stock'
    };
  }

  private normalizePromotionalLink(link: CJLink, source: ContentFeedSource): NormalizedContentItem {
    const isPromotion = link['promotion-type'] && link['promotion-type'] !== '';
    const expiresAt = link['promotion-end-date'] ? new Date(link['promotion-end-date']) : undefined;

    // Extract discount percentage from link name if available
    const discountMatch = link['link-name'].match(/(\d+)%/);
    const discount = discountMatch ? parseInt(discountMatch[1]) : undefined;

    // Determine content type
    let contentType = 'offer';
    if (link['link-type']?.toLowerCase().includes('banner')) {
      contentType = 'banner';
    } else if (isPromotion) {
      contentType = 'deal';
    }

    // Create description
    const description = `${link['link-name']} from ${link['advertiser-name']}${isPromotion ? ` - ${link['promotion-type']}` : ''}`;

    return {
      externalId: `cj_link_${link['link-id']}`,
      contentType,
      title: link['link-name'],
      description,
      content: `${description}\n\nEPC (7-day): $${link['seven-day-epc'] || '0'}\nEPC (3-month): $${link['three-month-epc'] || '0'}`,
      excerpt: this.generateExcerpt(description),
      category: 'affiliate-promotion',
      tags: [link['advertiser-name'], link['promotion-type']].filter(Boolean),
      discount,
      affiliateUrl: link['clickable-link-url'],
      merchantName: link['advertiser-name'],
      status: 'active',
      expiresAt
    };
  }

  async validateAuth(authConfig: any): Promise<boolean> {
    try {
      const auth = this.validateAuthConfig(authConfig);
      
      // Test with a simple product search
      const testProducts = await this.fetchProducts(auth, {
        keywords: 'test',
        recordsPerPage: 1,
        pageNumber: 1
      });

      return true; // If no error thrown, auth is valid
    } catch (error) {
      console.error('CJ Affiliate auth validation failed:', error);
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test the CJ API endpoints availability
      const testUrl = 'https://developers.cj.com/docs/getting-started';
      const response = await axios.head(testUrl, { timeout: 10000 });
      return response.status === 200;
    } catch (error) {
      console.error('CJ Affiliate connector health check failed:', error);
      return false;
    }
  }

  // Helper method to get available advertisers
  async getAdvertisers(auth: CJAffiliateConfig): Promise<Array<{ id: string; name: string; category: string }>> {
    try {
      const baseUrl = 'https://advertiser-lookup.api.cj.com/v3/advertiser-lookup';
      
      const queryParams = new URLSearchParams({
        'website-id': auth.websiteId,
        'records-per-page': '100',
        'page-number': '1'
      });

      const response = await axios.get(`${baseUrl}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${auth.apiKey}`,
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      return (response.data.advertisers || []).map((adv: any) => ({
        id: adv['advertiser-id'],
        name: adv['advertiser-name'],
        category: adv['primary-category']
      }));

    } catch (error) {
      console.error('Error fetching CJ advertisers:', error);
      return [];
    }
  }
}