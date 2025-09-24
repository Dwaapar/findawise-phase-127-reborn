/**
 * ContentFetcher - Auto-scrape/crawl 3rd party edu/blog sources for new content
 * AI-powered content aggregation and generation system
 */

import { apiRequest } from '@/lib/queryClient';

export interface ContentSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scrape';
  category: string;
  credibility: number; // 1-10 score
  updateFrequency: 'hourly' | 'daily' | 'weekly';
  lastFetched?: string;
  isActive: boolean;
  apiKey?: string;
  selectors?: {
    title: string;
    content: string;
    author: string;
    date: string;
  };
}

export interface FetchedContent {
  sourceId: string;
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  publishedAt: string;
  originalUrl: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  quality: number; // 1-10 AI-determined quality score
  uniqueness: number; // 1-10 uniqueness score
  isProcessed: boolean;
}

export interface ContentGenerationRequest {
  topic: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  wordCount: number;
  tone: 'educational' | 'conversational' | 'professional' | 'inspiring';
  includeExamples: boolean;
  includeQuiz: boolean;
  targetArchetype?: string;
  keywords?: string[];
}

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  readingTime: number;
  quiz?: {
    questions: Array<{
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }>;
  };
  sources: string[];
  qualityScore: number;
}

class ContentFetcherService {
  private sources: ContentSource[] = [];
  private fetchInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeDefaultSources();
  }

  private initializeDefaultSources() {
    this.sources = [
      // Educational RSS Feeds
      {
        id: 'coursera-blog',
        name: 'Coursera Blog',
        url: 'https://blog.coursera.org/feed/',
        type: 'rss',
        category: 'general',
        credibility: 9,
        updateFrequency: 'daily',
        isActive: true,
      },
      {
        id: 'edx-blog',
        name: 'edX Blog',
        url: 'https://blog.edx.org/feed',
        type: 'rss',
        category: 'general',
        credibility: 9,
        updateFrequency: 'daily',
        isActive: true,
      },
      {
        id: 'khan-academy-blog',
        name: 'Khan Academy Blog',
        url: 'https://blog.khanacademy.org/feed/',
        type: 'rss',
        category: 'general',
        credibility: 10,
        updateFrequency: 'weekly',
        isActive: true,
      },
      // Programming & Tech
      {
        id: 'freecodecamp',
        name: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news/rss/',
        type: 'rss',
        category: 'programming',
        credibility: 9,
        updateFrequency: 'daily',
        isActive: true,
      },
      {
        id: 'dev-to',
        name: 'DEV Community',
        url: 'https://dev.to/feed',
        type: 'rss',
        category: 'programming',
        credibility: 7,
        updateFrequency: 'hourly',
        isActive: true,
      },
      // Language Learning
      {
        id: 'babbel-magazine',
        name: 'Babbel Magazine',
        url: 'https://www.babbel.com/en/magazine/feed',
        type: 'rss',
        category: 'languages',
        credibility: 8,
        updateFrequency: 'daily',
        isActive: true,
      },
      // Business & Career
      {
        id: 'harvard-business-review',
        name: 'Harvard Business Review',
        url: 'https://feeds.hbr.org/harvardbusiness',
        type: 'rss',
        category: 'business',
        credibility: 10,
        updateFrequency: 'daily',
        isActive: true,
      },
      // Test Prep
      {
        id: 'kaplan-test-prep',
        name: 'Kaplan Test Prep Blog',
        url: 'https://www.kaptest.com/blog/feed/',
        type: 'rss',
        category: 'test-prep',
        credibility: 8,
        updateFrequency: 'weekly',
        isActive: true,
      },
    ];
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Fetch latest content from all active sources
      await this.fetchFromAllSources();
      
      // Start scheduled fetching
      this.startScheduledFetching();
      
      this.isInitialized = true;
      console.log('ContentFetcher initialized with', this.sources.length, 'sources');
    } catch (error) {
      console.error('Failed to initialize ContentFetcher:', error);
    }
  }

  private startScheduledFetching() {
    // Run every hour to check for updates
    this.fetchInterval = setInterval(async () => {
      await this.fetchFromAllSources();
    }, 60 * 60 * 1000); // 1 hour
  }

  public async fetchFromAllSources(): Promise<FetchedContent[]> {
    const allContent: FetchedContent[] = [];
    
    for (const source of this.sources.filter(s => s.isActive)) {
      try {
        const shouldFetch = this.shouldFetchFromSource(source);
        if (!shouldFetch) continue;

        const content = await this.fetchFromSource(source);
        allContent.push(...content);
        
        // Update last fetched time
        source.lastFetched = new Date().toISOString();
      } catch (error) {
        console.error(`Failed to fetch from ${source.name}:`, error);
      }
    }

    // Process and store content
    if (allContent.length > 0) {
      await this.processAndStoreContent(allContent);
    }

    return allContent;
  }

  private shouldFetchFromSource(source: ContentSource): boolean {
    if (!source.lastFetched) return true;

    const lastFetch = new Date(source.lastFetched);
    const now = new Date();
    const hoursSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

    switch (source.updateFrequency) {
      case 'hourly':
        return hoursSinceLastFetch >= 1;
      case 'daily':
        return hoursSinceLastFetch >= 24;
      case 'weekly':
        return hoursSinceLastFetch >= 168;
      default:
        return true;
    }
  }

  private async fetchFromSource(source: ContentSource): Promise<FetchedContent[]> {
    switch (source.type) {
      case 'rss':
        return this.fetchFromRSS(source);
      case 'api':
        return this.fetchFromAPI(source);
      case 'scrape':
        return this.fetchFromScraping(source);
      default:
        return [];
    }
  }

  private async fetchFromRSS(source: ContentSource): Promise<FetchedContent[]> {
    try {
      // Use server-side RSS parsing to avoid CORS issues
      const response = await apiRequest('/api/content/fetch-rss', {
        method: 'POST',
        body: { url: source.url, sourceId: source.id }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch RSS');
      }

      return response.data.map((item: any) => this.processRSSItem(item, source));
    } catch (error) {
      console.error(`RSS fetch error for ${source.name}:`, error);
      return [];
    }
  }

  private processRSSItem(item: any, source: ContentSource): FetchedContent {
    return {
      sourceId: source.id,
      title: item.title || 'Untitled',
      content: item.content || item.description || '',
      excerpt: this.generateExcerpt(item.content || item.description || ''),
      author: item.author,
      publishedAt: item.pubDate || new Date().toISOString(),
      originalUrl: item.link || '',
      category: source.category,
      tags: this.extractTags(item.content || item.description || ''),
      difficulty: this.determineDifficulty(item.content || item.description || ''),
      estimatedReadTime: this.calculateReadTime(item.content || item.description || ''),
      quality: this.assessQuality(item, source),
      uniqueness: 7, // Default, will be assessed later
      isProcessed: false,
    };
  }

  private async fetchFromAPI(source: ContentSource): Promise<FetchedContent[]> {
    // Implementation for API-based content fetching
    // This would depend on the specific API (e.g., Medium API, Dev.to API)
    return [];
  }

  private async fetchFromScraping(source: ContentSource): Promise<FetchedContent[]> {
    try {
      // Use server-side scraping to avoid CORS and client-side limitations
      const response = await apiRequest('/api/content/scrape', {
        method: 'POST',
        body: { 
          url: source.url, 
          sourceId: source.id,
          selectors: source.selectors 
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to scrape content');
      }

      return response.data.map((item: any) => this.processScrapedItem(item, source));
    } catch (error) {
      console.error(`Scraping error for ${source.name}:`, error);
      return [];
    }
  }

  private processScrapedItem(item: any, source: ContentSource): FetchedContent {
    return {
      sourceId: source.id,
      title: item.title || 'Untitled',
      content: item.content || '',
      excerpt: this.generateExcerpt(item.content || ''),
      author: item.author,
      publishedAt: item.date || new Date().toISOString(),
      originalUrl: item.url || '',
      category: source.category,
      tags: this.extractTags(item.content || ''),
      difficulty: this.determineDifficulty(item.content || ''),
      estimatedReadTime: this.calculateReadTime(item.content || ''),
      quality: this.assessQuality(item, source),
      uniqueness: 7,
      isProcessed: false,
    };
  }

  // AI Content Generation
  public async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const response = await apiRequest('/api/content/generate', {
        method: 'POST',
        body: request
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate content');
      }

      return response.data;
    } catch (error) {
      console.error('Content generation error:', error);
      throw error;
    }
  }

  // Batch content generation for multiple topics
  public async generateBatchContent(requests: ContentGenerationRequest[]): Promise<GeneratedContent[]> {
    const results: GeneratedContent[] = [];
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.generateContent(request));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error('Batch generation error:', error);
      }
      
      // Small delay between batches
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  // Content enhancement and rewriting
  public async enhanceContent(contentId: string, enhancements: {
    improveReadability?: boolean;
    addExamples?: boolean;
    addQuiz?: boolean;
    updateTone?: string;
    addSEO?: boolean;
  }): Promise<GeneratedContent> {
    try {
      const response = await apiRequest('/api/content/enhance', {
        method: 'POST',
        body: { contentId, enhancements }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to enhance content');
      }

      return response.data;
    } catch (error) {
      console.error('Content enhancement error:', error);
      throw error;
    }
  }

  // Utility methods
  private generateExcerpt(content: string, maxLength = 200): string {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= maxLength) return plainText;
    
    const excerpt = plainText.substring(0, maxLength);
    const lastSpace = excerpt.lastIndexOf(' ');
    return excerpt.substring(0, lastSpace) + '...';
  }

  private extractTags(content: string): string[] {
    // Simple keyword extraction - in practice, this would use NLP
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    // Get word frequencies
    const frequencies: Record<string, number> = {};
    words.forEach(word => {
      frequencies[word] = (frequencies[word] || 0) + 1;
    });
    
    // Return top 5 most frequent words as tags
    return Object.entries(frequencies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private determineDifficulty(content: string): 'beginner' | 'intermediate' | 'advanced' {
    // Simple heuristic based on readability
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence < 15) return 'beginner';
    if (avgWordsPerSentence < 25) return 'intermediate';
    return 'advanced';
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  private assessQuality(item: any, source: ContentSource): number {
    let score = source.credibility; // Base score from source credibility
    
    // Adjust based on content characteristics
    if (item.title && item.title.length > 20) score += 1;
    if (item.content && item.content.length > 1000) score += 1;
    if (item.author) score += 0.5;
    
    return Math.min(10, Math.max(1, score));
  }

  private async processAndStoreContent(content: FetchedContent[]): Promise<void> {
    try {
      // Filter out duplicate content
      const uniqueContent = this.removeDuplicates(content);
      
      // Store in database
      await apiRequest('/api/education/content/batch', {
        method: 'POST',
        body: { content: uniqueContent }
      });
      
      console.log(`Processed and stored ${uniqueContent.length} new pieces of content`);
    } catch (error) {
      console.error('Failed to process and store content:', error);
    }
  }

  private removeDuplicates(content: FetchedContent[]): FetchedContent[] {
    const seen = new Set<string>();
    return content.filter(item => {
      const key = `${item.title}-${item.originalUrl}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Public API methods
  public getSources(): ContentSource[] {
    return [...this.sources];
  }

  public addSource(source: ContentSource): void {
    this.sources.push(source);
  }

  public removeSource(sourceId: string): void {
    this.sources = this.sources.filter(s => s.id !== sourceId);
  }

  public updateSource(sourceId: string, updates: Partial<ContentSource>): void {
    const index = this.sources.findIndex(s => s.id === sourceId);
    if (index > -1) {
      this.sources[index] = { ...this.sources[index], ...updates };
    }
  }

  public async getContentSuggestions(category: string, limit = 10): Promise<string[]> {
    try {
      const response = await apiRequest('/api/content/suggestions', {
        method: 'POST',
        body: { category, limit }
      });

      return response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to get content suggestions:', error);
      return [];
    }
  }

  public destroy(): void {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
    }
    this.sources = [];
    this.isInitialized = false;
  }
}

// Singleton instance
export const contentFetcher = new ContentFetcherService();

// React hook
export const useContentFetcher = () => {
  return {
    fetchFromAllSources: contentFetcher.fetchFromAllSources.bind(contentFetcher),
    generateContent: contentFetcher.generateContent.bind(contentFetcher),
    generateBatchContent: contentFetcher.generateBatchContent.bind(contentFetcher),
    enhanceContent: contentFetcher.enhanceContent.bind(contentFetcher),
    getSources: contentFetcher.getSources.bind(contentFetcher),
    addSource: contentFetcher.addSource.bind(contentFetcher),
    removeSource: contentFetcher.removeSource.bind(contentFetcher),
    updateSource: contentFetcher.updateSource.bind(contentFetcher),
    getContentSuggestions: contentFetcher.getContentSuggestions.bind(contentFetcher),
  };
};

export default contentFetcher;