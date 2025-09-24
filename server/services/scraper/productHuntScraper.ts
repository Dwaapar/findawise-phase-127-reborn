import axios from 'axios';
import { db } from '../../db';
import { saasTools, saasCategories } from '../../../shared/saasTables';
import { eq } from 'drizzle-orm';

export interface ProductHuntTool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
  featuredAt: string;
  categories: string[];
  pricing?: string;
  logo?: string;
}

export class ProductHuntScraper {
  private baseUrl = 'https://api.producthunt.com/v2/api/graphql';
  private apiKey = process.env.PRODUCTHUNT_API_KEY;

  async scrapeLatestTools(limit: number = 50): Promise<ProductHuntTool[]> {
    if (!this.apiKey) {
      console.warn('ProductHunt API key not configured');
      return [];
    }

    try {
      const query = `
        query {
          posts(first: ${limit}, order: VOTES) {
            edges {
              node {
                id
                name
                tagline
                description
                url
                votesCount
                commentsCount
                createdAt
                featuredAt
                productLinks {
                  type
                  url
                }
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
                thumbnail {
                  url
                }
              }
            }
          }
        }
      `;

      const response = await axios.post(this.baseUrl, 
        { query },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.errors) {
        console.error('ProductHunt API errors:', response.data.errors);
        return [];
      }

      const tools: ProductHuntTool[] = response.data.data.posts.edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        tagline: edge.node.tagline,
        description: edge.node.description,
        url: edge.node.url,
        votesCount: edge.node.votesCount,
        commentsCount: edge.node.commentsCount,
        createdAt: edge.node.createdAt,
        featuredAt: edge.node.featuredAt,
        categories: edge.node.topics.edges.map((topic: any) => topic.node.name),
        logo: edge.node.thumbnail?.url
      }));

      console.log(`✅ Scraped ${tools.length} tools from ProductHunt`);
      return tools;
    } catch (error) {
      console.error('❌ ProductHunt scraping failed:', error);
      return [];
    }
  }

  async categorizeAndSaveTools(tools: ProductHuntTool[]): Promise<void> {
    const categoryMapping: Record<string, string> = {
      'productivity': 'productivity',
      'saas': 'saas-tools',
      'marketing': 'marketing',
      'design': 'design',
      'developer tools': 'development',
      'analytics': 'analytics',
      'collaboration': 'communication',
      'finance': 'finance',
      'artificial intelligence': 'ai-tools',
      'no-code': 'no-code'
    };

    for (const tool of tools) {
      try {
        // Check if tool already exists
        const existingTool = await db.select()
          .from(saasTools)
          .where(eq(saasTools.slug, this.generateSlug(tool.name)))
          .limit(1);

        if (existingTool.length > 0) {
          console.log(`Tool ${tool.name} already exists, skipping`);
          continue;
        }

        // Determine category
        const category = this.determineCategory(tool.categories, categoryMapping);
        
        // Ensure category exists
        await this.ensureCategoryExists(category);

        // Create tool entry
        const newTool = {
          name: tool.name,
          slug: this.generateSlug(tool.name),
          description: tool.description || tool.tagline,
          category,
          websiteUrl: tool.url,
          affiliateUrl: this.generateAffiliateUrl(tool.url),
          pricing: this.extractPricing(tool.description),
          features: JSON.stringify(this.extractFeatures(tool.description)),
          tags: JSON.stringify(tool.categories.slice(0, 5)),
          rating: this.calculateRating(tool.votesCount),
          reviewCount: tool.commentsCount,
          logo: tool.logo,
          isActive: true,
          isFeatured: tool.votesCount > 100,
          affiliateCommission: 0.15, // Default 15%
          lastUpdated: new Date(),
          createdAt: new Date()
        };

        await db.insert(saasTools).values(newTool);
        console.log(`✅ Added tool: ${tool.name}`);

      } catch (error) {
        console.error(`❌ Error saving tool ${tool.name}:`, error);
      }
    }
  }

  private generateSlug(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private determineCategory(categories: string[], mapping: Record<string, string>): string {
    for (const category of categories) {
      const mapped = mapping[category.toLowerCase()];
      if (mapped) return mapped;
    }
    return 'saas-tools'; // Default category
  }

  private async ensureCategoryExists(categorySlug: string): Promise<void> {
    const existing = await db.select()
      .from(saasCategories)
      .where(eq(saasCategories.slug, categorySlug))
      .limit(1);

    if (existing.length === 0) {
      const categoryName = categorySlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      await db.insert(saasCategories).values({
        name: categoryName,
        slug: categorySlug,
        description: `Tools and software for ${categoryName.toLowerCase()}`,
        icon: this.getCategoryIcon(categorySlug),
        isActive: true,
        sortOrder: 999,
        createdAt: new Date()
      });
    }
  }

  private getCategoryIcon(categorySlug: string): string {
    const icons: Record<string, string> = {
      'productivity': '⚡',
      'saas-tools': '🛠️',
      'marketing': '📈',
      'design': '🎨',
      'development': '💻',
      'analytics': '📊',
      'communication': '💬',
      'finance': '💰',
      'ai-tools': '🤖',
      'no-code': '🔧'
    };
    return icons[categorySlug] || '📱';
  }

  private generateAffiliateUrl(originalUrl: string): string {
    // Basic affiliate URL generation - should be enhanced with actual affiliate networks
    const affiliateId = process.env.AFFILIATE_ID || 'findawise-01';
    return `${originalUrl}?ref=${affiliateId}&utm_source=findawise&utm_medium=affiliate&utm_campaign=saas-discovery`;
  }

  private extractPricing(description: string): any {
    const pricingPatterns = [
      /\$(\d+)\/month/i,
      /\$(\d+) per month/i,
      /starting at \$(\d+)/i,
      /free/i
    ];

    for (const pattern of pricingPatterns) {
      const match = description.match(pattern);
      if (match) {
        if (pattern.source.includes('free')) {
          return { type: 'free', monthly: 0 };
        }
        return { type: 'paid', monthly: parseInt(match[1]) };
      }
    }

    return { type: 'unknown', monthly: null };
  }

  private extractFeatures(description: string): string[] {
    const features: string[] = [];
    const featureKeywords = [
      'automation', 'integration', 'collaboration', 'analytics', 
      'reporting', 'dashboard', 'mobile app', 'API', 'security',
      'customization', 'templates', 'workflow', 'real-time'
    ];

    for (const keyword of featureKeywords) {
      if (description.toLowerCase().includes(keyword)) {
        features.push(keyword);
      }
    }

    return features.slice(0, 5); // Limit to 5 features
  }

  private calculateRating(votesCount: number): number {
    // Convert votes to 5-star rating (simple algorithm)
    if (votesCount >= 1000) return 4.8;
    if (votesCount >= 500) return 4.5;
    if (votesCount >= 200) return 4.2;
    if (votesCount >= 100) return 4.0;
    if (votesCount >= 50) return 3.8;
    return 3.5;
  }

  async runDailyScrape(): Promise<void> {
    console.log('🚀 Starting ProductHunt daily scrape...');
    
    const tools = await this.scrapeLatestTools(100);
    if (tools.length > 0) {
      await this.categorizeAndSaveTools(tools);
      console.log(`✅ ProductHunt scrape completed: ${tools.length} tools processed`);
    } else {
      console.log('⚠️ No tools scraped from ProductHunt');
    }
  }
}

export const productHuntScraper = new ProductHuntScraper();