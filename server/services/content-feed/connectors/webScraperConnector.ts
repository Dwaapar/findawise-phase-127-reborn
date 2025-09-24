// Web Scraper Connector - Generic web scraping for content extraction
import { BaseConnector, ConnectorFetchOptions, NormalizedContentItem, ConnectorConfig } from "./baseConnector";
import { ContentFeedSource } from "../../../../shared/contentFeedTables";
import axios from "axios";

interface ScrapingRule {
  selector: string;
  attribute?: string;
  transform?: string; // text, html, href, src, etc.
}

interface ScrapingConfig {
  baseUrl: string;
  listSelector: string; // CSS selector for item containers
  fields: {
    title: ScrapingRule;
    description?: ScrapingRule;
    content?: ScrapingRule;
    price?: ScrapingRule;
    originalPrice?: ScrapingRule;
    imageUrl?: ScrapingRule;
    linkUrl?: ScrapingRule;
    category?: ScrapingRule;
    rating?: ScrapingRule;
    author?: ScrapingRule;
    publishedAt?: ScrapingRule;
  };
  pagination?: {
    nextPageSelector?: string;
    maxPages?: number;
  };
  rateLimitMs?: number;
}

export class WebScraperConnector extends BaseConnector {
  constructor() {
    const config: ConnectorConfig = {
      name: "Web Scraper Connector",
      version: "1.0.0",
      supportedContentTypes: ["article", "product", "offer", "blog_post", "news"],
      requiredAuth: [], // Typically no auth required for public scraping
      rateLimits: {
        requestsPerMinute: 10, // Conservative for scraping
        requestsPerHour: 200,
        requestsPerDay: 1000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 3,
        initialDelayMs: 2000
      }
    };

    super(config);
  }

  async fetchContent(source: ContentFeedSource, options: ConnectorFetchOptions): Promise<NormalizedContentItem[]> {
    try {
      console.log(`🔄 Web scraping content from: ${source.apiEndpoint}`);

      if (!source.apiEndpoint) {
        throw new Error('Target URL is required in apiEndpoint for web scraping');
      }

      const scrapingConfig = this.validateScrapingConfig(source.settings);
      const normalizedItems: NormalizedContentItem[] = [];

      let currentUrl = source.apiEndpoint;
      let pageCount = 0;
      const maxPages = scrapingConfig.pagination?.maxPages || 1;

      while (currentUrl && pageCount < maxPages) {
        try {
          console.log(`📄 Scraping page ${pageCount + 1}: ${currentUrl}`);

          const pageItems = await this.makeRequest(async () => {
            return await this.scrapePage(currentUrl, scrapingConfig, source);
          });

          // Add items from this page
          for (const item of pageItems) {
            normalizedItems.push(item);
            
            if (options.maxItems && normalizedItems.length >= options.maxItems) {
              return normalizedItems;
            }
          }

          // Check for next page
          if (scrapingConfig.pagination?.nextPageSelector) {
            currentUrl = await this.getNextPageUrl(currentUrl, scrapingConfig);
          } else {
            break;
          }

          pageCount++;

          // Rate limiting between pages
          if (scrapingConfig.rateLimitMs) {
            await this.sleep(scrapingConfig.rateLimitMs);
          }

        } catch (pageError) {
          console.warn(`Error scraping page ${pageCount + 1}:`, pageError);
          break;
        }
      }

      console.log(`✅ Successfully scraped ${normalizedItems.length} items from ${pageCount + 1} pages`);
      return normalizedItems;

    } catch (error) {
      console.error('Error in web scraping:', error);
      throw error;
    }
  }

  private validateScrapingConfig(settings: any): ScrapingConfig {
    if (!settings || !settings.scraping) {
      throw new Error('Scraping configuration is required in source settings');
    }

    const scraping = settings.scraping;

    if (!scraping.listSelector || !scraping.fields?.title) {
      throw new Error('listSelector and fields.title are required for scraping');
    }

    return scraping as ScrapingConfig;
  }

  private async scrapePage(url: string, config: ScrapingConfig, source: ContentFeedSource): Promise<NormalizedContentItem[]> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });

    const html = response.data;
    const items: NormalizedContentItem[] = [];

    // Simple HTML parsing - in production, use a proper HTML parser like cheerio
    const itemElements = this.extractElements(html, config.listSelector);

    for (let i = 0; i < itemElements.length; i++) {
      try {
        const itemHtml = itemElements[i];
        const normalizedItem = this.extractItemData(itemHtml, config, source, url, i);
        items.push(normalizedItem);
      } catch (itemError) {
        console.warn(`Error extracting item ${i}:`, itemError);
        continue;
      }
    }

    return items;
  }

  private extractElements(html: string, selector: string): string[] {
    // Simplified element extraction - in production, use cheerio or similar
    // This is a basic implementation for demonstration
    
    // For now, return mock elements to demonstrate the concept
    // In a real implementation, you'd use a proper HTML parser
    const mockElements = [];
    
    // Simple regex-based extraction (very basic, use cheerio in production)
    const elementPattern = new RegExp(`<[^>]*class="[^"]*${selector.replace('.', '')}[^"]*"[^>]*>[\\s\\S]*?</[^>]+>`, 'gi');
    const matches = html.match(elementPattern) || [];
    
    return matches.slice(0, 20); // Limit to 20 items per page
  }

  private extractItemData(itemHtml: string, config: ScrapingConfig, source: ContentFeedSource, baseUrl: string, index: number): NormalizedContentItem {
    const extractField = (rule: ScrapingRule): string | undefined => {
      if (!rule) return undefined;

      // Basic extraction using regex (in production, use cheerio)
      const selectorPattern = rule.selector.replace('.', '\\.').replace('#', '\\#');
      const pattern = new RegExp(`<[^>]*class="[^"]*${selectorPattern}[^"]*"[^>]*>([\\s\\S]*?)</[^>]+>`, 'i');
      const match = itemHtml.match(pattern);
      
      if (match) {
        let value = match[1].trim();
        
        // Apply transformations
        if (rule.transform === 'text') {
          value = this.cleanHtml(value);
        } else if (rule.transform === 'href') {
          const hrefMatch = value.match(/href="([^"]*)"/);
          value = hrefMatch ? hrefMatch[1] : '';
        } else if (rule.transform === 'src') {
          const srcMatch = value.match(/src="([^"]*)"/);
          value = srcMatch ? srcMatch[1] : '';
        }
        
        return value;
      }
      
      return undefined;
    };

    // Extract basic fields
    const title = extractField(config.fields.title) || `Scraped Item ${index + 1}`;
    const description = extractField(config.fields.description);
    const content = extractField(config.fields.content);
    const priceStr = extractField(config.fields.price);
    const originalPriceStr = extractField(config.fields.originalPrice);
    const imageUrl = extractField(config.fields.imageUrl);
    const linkUrl = extractField(config.fields.linkUrl);
    const category = extractField(config.fields.category);
    const ratingStr = extractField(config.fields.rating);
    const author = extractField(config.fields.author);
    const publishedAtStr = extractField(config.fields.publishedAt);

    // Process extracted data
    const price = this.normalizePrice(priceStr || '');
    const originalPrice = this.normalizePrice(originalPriceStr || '');
    const rating = ratingStr ? parseFloat(ratingStr) : undefined;
    const publishedAt = this.normalizeDate(publishedAtStr || '');

    // Build absolute URLs
    const absoluteImageUrl = imageUrl ? this.makeAbsoluteUrl(imageUrl, baseUrl) : undefined;
    const absoluteLinkUrl = linkUrl ? this.makeAbsoluteUrl(linkUrl, baseUrl) : baseUrl;

    // Determine content type based on source settings or extracted data
    let contentType = source.settings?.defaultContentType || 'article';
    if (price) {
      contentType = 'product';
    } else if (category?.toLowerCase().includes('news')) {
      contentType = 'news';
    } else if (category?.toLowerCase().includes('blog')) {
      contentType = 'blog_post';
    }

    // Generate external ID
    const externalId = `scraper_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate discount if both prices available
    const discount = originalPrice && price ? this.calculateDiscount(originalPrice, price) : undefined;

    return {
      externalId,
      contentType,
      title: this.cleanHtml(title),
      description: description ? this.cleanHtml(description) : undefined,
      content: content ? this.cleanHtml(content) : undefined,
      excerpt: description ? this.generateExcerpt(this.cleanHtml(description)) : undefined,
      category: category?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      tags: [category, source.settings?.defaultTag].filter(Boolean),
      price,
      originalPrice,
      currency: source.settings?.defaultCurrency || 'USD',
      discount,
      affiliateUrl: absoluteLinkUrl,
      merchantName: source.settings?.merchantName || new URL(baseUrl).hostname,
      author,
      publishedAt,
      imageUrl: absoluteImageUrl,
      rating,
      status: 'active'
    };
  }

  private makeAbsoluteUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    
    try {
      const base = new URL(baseUrl);
      if (url.startsWith('/')) {
        return `${base.protocol}//${base.host}${url}`;
      } else {
        return `${base.protocol}//${base.host}${base.pathname}/${url}`;
      }
    } catch (error) {
      return url;
    }
  }

  private async getNextPageUrl(currentUrl: string, config: ScrapingConfig): Promise<string | null> {
    if (!config.pagination?.nextPageSelector) {
      return null;
    }

    try {
      // This would require another request to get the next page URL
      // For now, return null to avoid infinite loops
      return null;
    } catch (error) {
      return null;
    }
  }

  async validateAuth(authConfig: any): Promise<boolean> {
    // Web scraping typically doesn't require authentication
    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test basic HTTP connectivity
      const testUrl = 'https://httpbin.org/get';
      const response = await axios.get(testUrl, { timeout: 10000 });
      return response.status === 200;
    } catch (error) {
      console.error('Web scraper connector health check failed:', error);
      return false;
    }
  }

  // Helper method to test scraping configuration
  async testScraping(url: string, config: any): Promise<{ success: boolean; itemCount: number; sampleTitles?: string[]; error?: string }> {
    try {
      if (!config.scraping) {
        throw new Error('Scraping configuration required');
      }

      const mockSource: ContentFeedSource = {
        id: 0,
        name: 'Test',
        sourceType: 'web_scraper',
        apiEndpoint: url,
        authConfig: null,
        refreshInterval: 3600,
        isActive: true,
        lastSyncAt: null,
        nextSyncAt: null,
        settings: config,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const items = await this.scrapePage(url, config.scraping, mockSource);
      const sampleTitles = items.slice(0, 5).map(item => item.title);

      return {
        success: true,
        itemCount: items.length,
        sampleTitles
      };

    } catch (error) {
      return {
        success: false,
        itemCount: 0,
        error: (error as Error).message
      };
    }
  }

  // Helper to analyze a page and suggest selectors
  async analyzePage(url: string): Promise<{
    suggestedSelectors: {
      listContainer?: string[];
      title?: string[];
      description?: string[];
      price?: string[];
      image?: string[];
    };
    pageInfo: {
      title: string;
      hasStructuredData: boolean;
      commonClasses: string[];
    };
  }> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const html = response.data;
      
      // Extract page title
      const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : 'Unknown';

      // Check for structured data
      const hasStructuredData = html.includes('application/ld+json') || html.includes('schema.org');

      // Extract common class patterns (simplified)
      const classMatches = html.match(/class="([^"]*)"/g) || [];
      const allClasses = classMatches
        .map(match => match.replace(/class="/g, '').replace(/"/g, ''))
        .join(' ')
        .split(' ')
        .filter(cls => cls.length > 2)
        .reduce((acc, cls) => {
          acc[cls] = (acc[cls] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const commonClasses = Object.entries(allClasses)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([cls]) => cls);

      // Suggest common selectors based on patterns
      const suggestedSelectors = {
        listContainer: commonClasses.filter(cls => 
          ['item', 'product', 'article', 'post', 'card', 'list'].some(pattern => cls.includes(pattern))
        ).slice(0, 5),
        title: ['.title', 'h1', 'h2', 'h3', '.name', '.product-name', '.article-title'],
        description: ['.description', '.summary', '.excerpt', 'p', '.content'],
        price: ['.price', '.cost', '.amount', '.value', '.pricing'],
        image: ['img', '.image', '.photo', '.picture', '.thumbnail']
      };

      return {
        suggestedSelectors,
        pageInfo: {
          title: pageTitle,
          hasStructuredData,
          commonClasses
        }
      };

    } catch (error) {
      console.error('Error analyzing page:', error);
      throw error;
    }
  }
}