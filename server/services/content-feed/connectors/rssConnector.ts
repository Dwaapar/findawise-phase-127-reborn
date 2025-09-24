// RSS Connector - Real RSS feed connector for content ingestion
import { BaseConnector, ConnectorFetchOptions, NormalizedContentItem, ConnectorConfig } from "./baseConnector";
import { ContentFeedSource } from "../../../../shared/contentFeedTables";
import axios from "axios";

interface RSSItem {
  title: string;
  description?: string;
  link: string;
  pubDate?: string;
  author?: string;
  category?: string[];
  guid?: string;
  enclosure?: {
    url: string;
    type: string;
  };
  contentEncoded?: string;
}

interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

export class RSSConnector extends BaseConnector {
  constructor() {
    const config: ConnectorConfig = {
      name: "RSS Feed Connector",
      version: "1.0.0",
      supportedContentTypes: ["article", "blog_post", "news", "content"],
      requiredAuth: [], // RSS feeds typically don't require auth
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 2000
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
      console.log(`🔄 Fetching RSS content from: ${source.apiEndpoint}`);

      if (!source.apiEndpoint) {
        throw new Error('RSS feed URL is required in apiEndpoint');
      }

      const rssData = await this.makeRequest(async () => {
        const response = await axios.get(source.apiEndpoint!, {
          headers: {
            'User-Agent': 'Findawise-Empire-Content-Feed/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          },
          timeout: 30000
        });

        return this.parseRSS(response.data);
      });

      const normalizedItems: NormalizedContentItem[] = [];

      // Process each RSS item
      for (const item of rssData.items) {
        try {
          // Skip items older than last sync if incremental
          if (options.syncType === 'incremental' && options.lastSyncAt && item.pubDate) {
            const itemDate = new Date(item.pubDate);
            if (itemDate <= options.lastSyncAt) {
              continue;
            }
          }

          const normalizedItem = this.normalizeRawContent(item, source);
          normalizedItems.push(normalizedItem);

          // Respect maxItems limit
          if (options.maxItems && normalizedItems.length >= options.maxItems) {
            break;
          }

        } catch (itemError) {
          console.warn('Error processing RSS item:', itemError);
          continue;
        }
      }

      console.log(`✅ Successfully processed ${normalizedItems.length} RSS items`);
      return normalizedItems;

    } catch (error) {
      console.error('Error fetching RSS content:', error);
      throw error;
    }
  }

  private parseRSS(xmlData: string): RSSFeed {
    // Simple XML parsing - in production, you'd use a proper XML parser like xml2js
    try {
      // This is a simplified parser for demonstration
      // In a real implementation, use xml2js or similar library
      const items: RSSItem[] = [];
      
      // Extract items using regex (simplified approach)
      const itemMatches = xmlData.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
      
      for (const itemXml of itemMatches) {
        const item: RSSItem = {
          title: this.extractXmlValue(itemXml, 'title') || 'Untitled',
          description: this.extractXmlValue(itemXml, 'description'),
          link: this.extractXmlValue(itemXml, 'link') || '',
          pubDate: this.extractXmlValue(itemXml, 'pubDate'),
          author: this.extractXmlValue(itemXml, 'author') || this.extractXmlValue(itemXml, 'dc:creator'),
          guid: this.extractXmlValue(itemXml, 'guid'),
          contentEncoded: this.extractXmlValue(itemXml, 'content:encoded')
        };

        // Extract categories
        const categoryMatches = itemXml.match(/<category[^>]*>(.*?)<\/category>/gi) || [];
        if (categoryMatches.length > 0) {
          item.category = categoryMatches.map(cat => 
            cat.replace(/<[^>]*>/g, '').trim()
          );
        }

        // Extract enclosure (images/media)
        const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="([^"]*)"[^>]*\/>/);
        if (enclosureMatch) {
          item.enclosure = {
            url: enclosureMatch[1],
            type: enclosureMatch[2]
          };
        }

        items.push(item);
      }

      return {
        title: this.extractXmlValue(xmlData, 'title') || 'RSS Feed',
        description: this.extractXmlValue(xmlData, 'description') || '',
        link: this.extractXmlValue(xmlData, 'link') || '',
        items
      };

    } catch (error) {
      console.error('Error parsing RSS XML:', error);
      throw new Error('Invalid RSS format');
    }
  }

  private extractXmlValue(xml: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    
    if (match && match[1]) {
      // Decode HTML entities and clean up
      return match[1]
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .trim();
    }
    
    return undefined;
  }

  normalizeRawContent(item: RSSItem, source: ContentFeedSource): NormalizedContentItem {
    const settings = (source.settings as any) || {};
    
    // Determine content type based on source settings or item characteristics
    let contentType = 'article';
    if (settings.defaultContentType) {
      contentType = settings.defaultContentType;
    } else if (item.category?.some(cat => cat.toLowerCase().includes('news'))) {
      contentType = 'news';
    } else if (item.category?.some(cat => cat.toLowerCase().includes('blog'))) {
      contentType = 'blog_post';
    }

    // Generate external ID
    const externalId = item.guid || item.link || `rss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use content:encoded if available, otherwise description
    const content = item.contentEncoded || item.description || '';
    const description = item.description || this.generateExcerpt(content);
    const excerpt = this.generateExcerpt(content, 200);

    // Extract images
    const images: string[] = [];
    
    // From enclosure
    if (item.enclosure?.url && item.enclosure.type.startsWith('image/')) {
      images.push(item.enclosure.url);
    }
    
    // From content (basic image extraction)
    const imgMatches = content.match(/<img[^>]+src="([^">]+)"/gi) || [];
    for (const match of imgMatches) {
      const srcMatch = match.match(/src="([^">]+)"/);
      if (srcMatch && srcMatch[1]) {
        images.push(srcMatch[1]);
      }
    }

    // Determine category
    let category = settings.defaultCategory;
    if (item.category && item.category.length > 0) {
      category = item.category[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    // Create tags from categories
    const tags = item.category || [];
    
    // Add source-specific tags
    if (settings.additionalTags) {
      tags.push(...settings.additionalTags);
    }

    return {
      externalId,
      contentType,
      title: this.cleanHtml(item.title),
      description: this.cleanHtml(description),
      content: content,
      excerpt: this.cleanHtml(excerpt),
      category,
      tags: [...new Set(tags)], // Remove duplicates
      author: item.author,
      publishedAt: item.pubDate ? this.normalizeDate(item.pubDate) : undefined,
      imageUrl: images[0] || undefined,
      images: images.length > 0 ? images : undefined,
      status: 'active'
    };
  }

  async validateAuth(authConfig: any): Promise<boolean> {
    // RSS feeds typically don't require authentication
    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test with a known working RSS feed
      const testUrl = 'https://feeds.feedburner.com/TechCrunch/';
      
      const response = await axios.get(testUrl, {
        headers: {
          'User-Agent': 'Findawise-Empire-Content-Feed/1.0'
        },
        timeout: 10000
      });

      return response.status === 200 && response.data.includes('<rss');
    } catch (error) {
      console.error('RSS connector health check failed:', error);
      return false;
    }
  }

  // Helper method to test RSS feed URL
  async testRSSFeed(feedUrl: string): Promise<{ success: boolean; itemCount: number; title?: string; error?: string }> {
    try {
      const response = await axios.get(feedUrl, {
        headers: {
          'User-Agent': 'Findawise-Empire-Content-Feed/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        timeout: 15000
      });

      const feedData = this.parseRSS(response.data);

      return {
        success: true,
        itemCount: feedData.items.length,
        title: feedData.title
      };

    } catch (error) {
      return {
        success: false,
        itemCount: 0,
        error: (error as Error).message
      };
    }
  }
}