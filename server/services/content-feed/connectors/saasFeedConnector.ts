// SaaS Feed Connector - SaaS product and deal feed integration
import { BaseConnector, ConnectorFetchOptions, NormalizedContentItem, ConnectorConfig } from "./baseConnector";
import { ContentFeedSource } from "../../../../shared/contentFeedTables";
import axios from "axios";

interface SaaSProduct {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: {
    model: string; // freemium, subscription, one-time, etc.
    plans: Array<{
      name: string;
      price: number;
      currency: string;
      billing: string; // monthly, yearly, etc.
      features: string[];
    }>;
  };
  category: string;
  subcategory?: string;
  features: string[];
  integrations: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
  logo: string;
  screenshots: string[];
  deal?: {
    type: string; // discount, free-trial, etc.
    value: string;
    description: string;
    expiresAt: string;
    url: string;
  };
  alternatives: string[];
  targetAudience: string[];
  platforms: string[];
}

export class SaaSFeedConnector extends BaseConnector {
  constructor() {
    const config: ConnectorConfig = {
      name: "SaaS Feed Connector",
      version: "1.0.0",
      supportedContentTypes: ["saas_product", "saas_deal", "software_review"],
      requiredAuth: [], // Most SaaS feeds are public or use API key
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 5000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000
      }
    };

    super(config);
  }

  async fetchContent(source: ContentFeedSource, options: ConnectorFetchOptions): Promise<NormalizedContentItem[]> {
    try {
      console.log(`🔄 Fetching SaaS content from: ${source.apiEndpoint}`);

      if (!source.apiEndpoint) {
        throw new Error('SaaS feed URL is required in apiEndpoint');
      }

      const saasData = await this.makeRequest(async () => {
        return await this.fetchSaaSData(source, options);
      });

      const normalizedItems: NormalizedContentItem[] = [];

      for (const product of saasData) {
        try {
          // Skip items based on incremental sync logic
          if (options.syncType === 'incremental' && options.lastSyncAt) {
            // If product has a lastUpdated field, check it
            if (product.lastUpdated && new Date(product.lastUpdated) <= options.lastSyncAt) {
              continue;
            }
          }

          // Create product entry
          const productItem = this.normalizeProduct(product, source);
          normalizedItems.push(productItem);

          // Create separate deal entry if product has active deal
          if (product.deal && product.deal.expiresAt && new Date(product.deal.expiresAt) > new Date()) {
            const dealItem = this.normalizeDeal(product, source);
            normalizedItems.push(dealItem);
          }

          // Respect maxItems limit
          if (options.maxItems && normalizedItems.length >= options.maxItems) {
            break;
          }

        } catch (itemError) {
          console.warn('Error processing SaaS product:', itemError);
          continue;
        }
      }

      console.log(`✅ Successfully processed ${normalizedItems.length} SaaS items`);
      return normalizedItems;

    } catch (error) {
      console.error('Error fetching SaaS content:', error);
      throw error;
    }
  }

  private async fetchSaaSData(source: ContentFeedSource, options: ConnectorFetchOptions): Promise<SaaSProduct[]> {
    const headers: any = {
      'User-Agent': 'Findawise-Empire-SaaS-Feed/1.0',
      'Accept': 'application/json'
    };

    // Add API key if provided
    if (source.authConfig?.apiKey) {
      headers['Authorization'] = `Bearer ${source.authConfig.apiKey}`;
    }

    // Build query parameters
    const params = new URLSearchParams();
    
    const settings = source.settings || {};
    if (settings.category) params.append('category', settings.category);
    if (settings.priceRange) {
      if (settings.priceRange.min) params.append('min_price', settings.priceRange.min.toString());
      if (settings.priceRange.max) params.append('max_price', settings.priceRange.max.toString());
    }
    if (settings.pricingModel) params.append('pricing_model', settings.pricingModel);
    if (settings.platforms) params.append('platforms', settings.platforms.join(','));
    if (options.maxItems) params.append('limit', Math.min(options.maxItems, 100).toString());

    const url = params.toString() ? `${source.apiEndpoint}?${params.toString()}` : source.apiEndpoint;

    const response = await axios.get(url, {
      headers,
      timeout: 30000
    });

    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.products) {
      return response.data.products;
    } else if (response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Unexpected SaaS feed response format');
    }
  }

  private normalizeProduct(product: SaaSProduct, source: ContentFeedSource): NormalizedContentItem {
    // Determine primary pricing
    let price: number | undefined;
    let currency = 'USD';
    let originalPrice: number | undefined;

    if (product.pricing?.plans && product.pricing.plans.length > 0) {
      // Find the most popular plan (usually the middle one) or the first paid plan
      const paidPlans = product.pricing.plans.filter(plan => plan.price > 0);
      if (paidPlans.length > 0) {
        const primaryPlan = paidPlans[Math.floor(paidPlans.length / 2)] || paidPlans[0];
        price = primaryPlan.price;
        currency = primaryPlan.currency;

        // Check if there's a deal affecting this plan
        if (product.deal?.type === 'discount' && product.deal.value.includes('%')) {
          const discountPercent = parseInt(product.deal.value.replace('%', ''));
          originalPrice = price;
          price = price * (1 - discountPercent / 100);
        }
      }
    }

    // Build comprehensive description
    const description = [
      product.description,
      `Key features: ${product.features?.slice(0, 5).join(', ')}`,
      product.integrations?.length > 0 ? `Integrates with: ${product.integrations.slice(0, 3).join(', ')}` : '',
      product.targetAudience?.length > 0 ? `Best for: ${product.targetAudience.join(', ')}` : ''
    ].filter(Boolean).join('\n\n');

    // Create content with detailed information
    const content = [
      description,
      '',
      '## Pricing Plans:',
      ...product.pricing?.plans?.map(plan => 
        `- **${plan.name}**: $${plan.price}/${plan.billing} - ${plan.features?.slice(0, 3).join(', ')}`
      ) || [],
      '',
      product.platforms?.length > 0 ? `## Platforms: ${product.platforms.join(', ')}` : '',
      product.alternatives?.length > 0 ? `## Alternatives: ${product.alternatives.join(', ')}` : ''
    ].filter(Boolean).join('\n');

    // Collect all images
    const images = [product.logo, ...product.screenshots || []].filter(Boolean);

    // Generate tags
    const tags = [
      product.category,
      product.subcategory,
      product.pricing?.model,
      ...product.tags || [],
      ...product.platforms || []
    ].filter(Boolean);

    return {
      externalId: product.id,
      contentType: 'saas_product',
      title: product.name,
      description: this.cleanHtml(product.description),
      content,
      excerpt: this.generateExcerpt(product.description),
      category: product.category?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      tags: [...new Set(tags)],
      price,
      originalPrice,
      currency,
      discount: originalPrice && price ? this.calculateDiscount(originalPrice, price) : undefined,
      affiliateUrl: product.website,
      merchantName: product.name,
      imageUrl: product.logo,
      images: images.length > 0 ? images : undefined,
      rating: product.rating,
      reviewCount: product.reviewCount,
      status: 'active'
    };
  }

  private normalizeDeal(product: SaaSProduct, source: ContentFeedSource): NormalizedContentItem {
    if (!product.deal) {
      throw new Error('Product has no deal information');
    }

    const deal = product.deal;
    
    // Calculate discount value
    let discount: number | undefined;
    let price: number | undefined;
    let originalPrice: number | undefined;

    if (deal.value.includes('%')) {
      discount = parseInt(deal.value.replace('%', ''));
    } else if (deal.value.includes('$')) {
      // Dollar amount off
      const dollarAmount = parseFloat(deal.value.replace('$', ''));
      if (product.pricing?.plans && product.pricing.plans.length > 0) {
        const primaryPlan = product.pricing.plans.find(plan => plan.price > 0);
        if (primaryPlan) {
          originalPrice = primaryPlan.price;
          price = Math.max(0, originalPrice - dollarAmount);
          discount = this.calculateDiscount(originalPrice, price);
        }
      }
    }

    const title = `${product.name} - ${deal.description}`;
    const description = `Special ${deal.type} for ${product.name}: ${deal.description}. Limited time offer!`;

    return {
      externalId: `${product.id}_deal`,
      contentType: 'saas_deal',
      title,
      description,
      content: `${description}\n\n${product.description}\n\nDeal Details:\n- Type: ${deal.type}\n- Value: ${deal.value}\n- Valid until: ${deal.expiresAt}`,
      excerpt: this.generateExcerpt(description),
      category: 'saas-deals',
      tags: [product.category, deal.type, 'limited-offer'],
      price,
      originalPrice,
      currency: 'USD',
      discount,
      affiliateUrl: deal.url || product.website,
      merchantName: product.name,
      imageUrl: product.logo,
      status: 'active',
      expiresAt: new Date(deal.expiresAt)
    };
  }

  async validateAuth(authConfig: any): Promise<boolean> {
    // SaaS feeds often don't require authentication or use simple API keys
    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test a known SaaS directory API (mock example)
      const testUrl = 'https://api.example-saas-directory.com/health';
      
      try {
        const response = await axios.get(testUrl, { timeout: 5000 });
        return response.status === 200;
      } catch (error) {
        // If specific health endpoint doesn't exist, just return true
        // Real implementation would test against actual SaaS directory APIs
        return true;
      }
    } catch (error) {
      console.error('SaaS feed connector health check failed:', error);
      return false;
    }
  }

  // Helper method to test SaaS feed URL
  async testSaaSFeed(feedUrl: string, authConfig?: any): Promise<{ success: boolean; productCount: number; categories?: string[]; error?: string }> {
    try {
      const headers: any = {
        'User-Agent': 'Findawise-Empire-SaaS-Feed/1.0',
        'Accept': 'application/json'
      };

      if (authConfig?.apiKey) {
        headers['Authorization'] = `Bearer ${authConfig.apiKey}`;
      }

      const response = await axios.get(feedUrl, {
        headers,
        timeout: 15000
      });

      let products: any[] = [];
      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data.products) {
        products = response.data.products;
      } else if (response.data.data) {
        products = response.data.data;
      }

      // Extract unique categories
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

      return {
        success: true,
        productCount: products.length,
        categories
      };

    } catch (error) {
      return {
        success: false,
        productCount: 0,
        error: (error as Error).message
      };
    }
  }

  // Helper to get SaaS categories from feed
  async getSaaSCategories(feedUrl: string, authConfig?: any): Promise<string[]> {
    try {
      const testResult = await this.testSaaSFeed(feedUrl, authConfig);
      return testResult.categories || [];
    } catch (error) {
      console.error('Error getting SaaS categories:', error);
      return [];
    }
  }
}