import { z } from "zod";
import { randomUUID } from "crypto";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { db } from "../../db";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";
import { auditLogger } from "../audit/auditLogger";
import { cacheManager } from "../cache/cacheManager";
import { performanceMonitor } from "../monitoring/performanceMonitor";
import fs from "fs/promises";
import path from "path";

// ==========================================
// EMPIRE GRADE BLOG/CONTENT ENGINE
// ==========================================

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
  tags: string[];
  categories: string[];
  metadata: {
    readingTime: number;
    wordCount: number;
    seoScore: number;
    aiGenerated: boolean;
    version: string;
    contentBlocks: ContentBlock[];
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl?: string;
    openGraph: {
      title: string;
      description: string;
      image?: string;
      type: string;
    };
  };
  localization: {
    locale: string;
    translations: Record<string, string>;
  };
  analytics: {
    views: number;
    shares: number;
    avgTimeOnPage: number;
    bounceRate: number;
    conversionRate: number;
  };
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'cta' | 'quiz' | 'affiliate' | 'lead-magnet' | 'code' | 'table' | 'embed';
  order: number;
  content: any;
  config: Record<string, any>;
  visible: boolean;
}

export interface BlogVersion {
  id: string;
  postId: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
  createdBy?: string;
  changeDescription: string;
}

export interface ContentFilter {
  status?: string[];
  tags?: string[];
  categories?: string[];
  author?: string;
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
  contentType?: string[];
  minSeoScore?: number;
}

export interface AIContentRequest {
  topic: string;
  tone: 'professional' | 'casual' | 'technical' | 'friendly' | 'authoritative';
  length: 'short' | 'medium' | 'long' | 'comprehensive';
  audience: string;
  keywords: string[];
  includeBlocks: string[];
  customInstructions?: string;
}

export class BlogContentEngine {
  private contentCache: Map<string, BlogPost> = new Map();
  private versions: Map<string, BlogVersion[]> = new Map();
  private processors: Map<string, (content: BlogPost) => Promise<BlogPost>> = new Map();
  private aiProvider: any = null;

  constructor() {
    this.initializeProcessors();
    this.initializeMarked();
    logger.info('Blog Content Engine initialized', { component: 'BlogContentEngine' });
  }

  // ===== CONTENT PROCESSORS INITIALIZATION =====

  private initializeProcessors(): void {
    // SEO Processor
    this.processors.set('seo', async (post: BlogPost) => {
      const timerId = performanceMonitor.startTimer('seo_processing');
      
      try {
        const wordCount = this.calculateWordCount(post.content);
        const readingTime = Math.ceil(wordCount / 200); // 200 WPM average
        const seoScore = await this.calculateSEOScore(post);
        
        post.metadata.wordCount = wordCount;
        post.metadata.readingTime = readingTime;
        post.metadata.seoScore = seoScore;
        
        // Auto-generate SEO if missing
        if (!post.seo.metaTitle) {
          post.seo.metaTitle = post.title.length > 60 ? post.title.substring(0, 57) + '...' : post.title;
        }
        
        if (!post.seo.metaDescription) {
          post.seo.metaDescription = post.excerpt || this.generateExcerpt(post.content, 160);
        }
        
        performanceMonitor.endTimer(timerId);
        return post;
      } catch (error) {
        performanceMonitor.endTimer(timerId, { error: true });
        throw error;
      }
    });

    // Content Block Processor
    this.processors.set('blocks', async (post: BlogPost) => {
      const blocks = await this.extractContentBlocks(post.content);
      post.metadata.contentBlocks = blocks;
      return post;
    });

    // AI Enhancement Processor
    this.processors.set('ai-enhance', async (post: BlogPost) => {
      if (!this.aiProvider) return post;
      
      try {
        const enhancement = await this.aiProvider.enhanceContent({
          content: post.content,
          title: post.title,
          keywords: post.seo.keywords
        });
        
        if (enhancement.suggestions) {
          post.metadata.aiSuggestions = enhancement.suggestions;
        }
        
        return post;
      } catch (error) {
        logger.warn('AI enhancement failed', { 
          component: 'BlogContentEngine', 
          postId: post.id, 
          error: error.message 
        });
        return post;
      }
    });

    // Content Validation Processor
    this.processors.set('validation', async (post: BlogPost) => {
      const validation = this.validateContent(post);
      post.metadata.validationErrors = validation.errors;
      post.metadata.validationWarnings = validation.warnings;
      return post;
    });
  }

  private initializeMarked(): void {
    marked.setOptions({
      headerIds: true,
      gfm: true,
      breaks: true,
      sanitize: false // We'll use DOMPurify instead
    });
  }

  // ===== CORE CONTENT MANAGEMENT =====

  async createPost(data: Partial<BlogPost>): Promise<BlogPost> {
    const timerId = performanceMonitor.startTimer('create_post');
    
    try {
      const post: BlogPost = {
        id: randomUUID(),
        slug: data.slug || this.generateSlug(data.title || ''),
        title: data.title || '',
        content: data.content || '',
        excerpt: data.excerpt || this.generateExcerpt(data.content || ''),
        author: data.author || 'system',
        status: data.status || 'draft',
        publishedAt: data.status === 'published' ? new Date() : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: data.tags || [],
        categories: data.categories || [],
        metadata: {
          readingTime: 0,
          wordCount: 0,
          seoScore: 0,
          aiGenerated: false,
          version: '1.0.0',
          contentBlocks: [],
          ...data.metadata
        },
        seo: {
          metaTitle: '',
          metaDescription: '',
          keywords: [],
          openGraph: {
            title: data.title || '',
            description: '',
            type: 'article'
          },
          ...data.seo
        },
        localization: {
          locale: 'en-US',
          translations: {},
          ...data.localization
        },
        analytics: {
          views: 0,
          shares: 0,
          avgTimeOnPage: 0,
          bounceRate: 0,
          conversionRate: 0,
          ...data.analytics
        }
      };

      // Process the post through all processors
      const processedPost = await this.processContent(post);
      
      // Save to database
      await this.savePost(processedPost);
      
      // Cache the post
      this.contentCache.set(post.id, processedPost);
      
      // Create initial version snapshot
      await this.createVersion(post.id, 'Initial creation', 'system');
      
      auditLogger.log({
        component: 'BlogContentEngine',
        action: 'create_post',
        metadata: { postId: post.id, slug: post.slug, author: post.author },
        severity: 'info'
      });
      
      performanceMonitor.endTimer(timerId);
      return processedPost;
    } catch (error) {
      performanceMonitor.endTimer(timerId, { error: true });
      throw error;
    }
  }

  async updatePost(id: string, updates: Partial<BlogPost>, changeDescription: string = 'Content updated'): Promise<BlogPost> {
    const timerId = performanceMonitor.startTimer('update_post');
    
    try {
      const existingPost = await this.getPost(id);
      if (!existingPost) {
        throw new Error(`Post with ID ${id} not found`);
      }
      
      // Create version snapshot before update
      await this.createVersion(id, changeDescription, updates.author || 'system');
      
      const updatedPost: BlogPost = {
        ...existingPost,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };
      
      // Re-process content
      const processedPost = await this.processContent(updatedPost);
      
      // Save to database
      await this.savePost(processedPost);
      
      // Update cache
      this.contentCache.set(id, processedPost);
      
      auditLogger.log({
        component: 'BlogContentEngine',
        action: 'update_post',
        metadata: { postId: id, changes: changeDescription },
        severity: 'info'
      });
      
      performanceMonitor.endTimer(timerId);
      return processedPost;
    } catch (error) {
      performanceMonitor.endTimer(timerId, { error: true });
      throw error;
    }
  }

  async getPost(id: string): Promise<BlogPost | null> {
    // Check cache first
    const cached = this.contentCache.get(id);
    if (cached) {
      return cached;
    }
    
    // Load from database
    try {
      const post = await this.loadPost(id);
      if (post) {
        this.contentCache.set(id, post);
      }
      return post;
    } catch (error) {
      logger.error('Failed to load post', { 
        component: 'BlogContentEngine', 
        postId: id, 
        error: error.message 
      });
      return null;
    }
  }

  async getPosts(filter: ContentFilter = {}, pagination: { page: number; limit: number } = { page: 1, limit: 20 }): Promise<{ posts: BlogPost[]; total: number; pages: number }> {
    const timerId = performanceMonitor.startTimer('get_posts');
    
    try {
      const result = await this.queryPosts(filter, pagination);
      performanceMonitor.endTimer(timerId);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(timerId, { error: true });
      throw error;
    }
  }

  async deletePost(id: string): Promise<boolean> {
    try {
      const post = await this.getPost(id);
      if (!post) return false;
      
      // Archive instead of hard delete
      await this.updatePost(id, { status: 'archived' }, 'Post archived');
      
      // Remove from cache
      this.contentCache.delete(id);
      
      auditLogger.log({
        component: 'BlogContentEngine',
        action: 'delete_post',
        metadata: { postId: id },
        severity: 'warn'
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete post', { 
        component: 'BlogContentEngine', 
        postId: id, 
        error: error.message 
      });
      return false;
    }
  }

  // ===== AI CONTENT GENERATION =====

  async generateContent(request: AIContentRequest): Promise<BlogPost> {
    const timerId = performanceMonitor.startTimer('ai_generate_content');
    
    try {
      if (!this.aiProvider) {
        throw new Error('AI provider not configured');
      }
      
      const aiContent = await this.aiProvider.generateBlogPost(request);
      
      const post = await this.createPost({
        title: aiContent.title,
        content: aiContent.content,
        excerpt: aiContent.excerpt,
        author: 'AI Generator',
        tags: request.keywords,
        categories: [request.topic],
        metadata: {
          aiGenerated: true,
          generationPrompt: request
        },
        seo: {
          keywords: request.keywords,
          metaTitle: aiContent.title,
          metaDescription: aiContent.excerpt
        }
      });
      
      performanceMonitor.endTimer(timerId);
      return post;
    } catch (error) {
      performanceMonitor.endTimer(timerId, { error: true });
      throw error;
    }
  }

  // ===== CONTENT VERSIONING =====

  async createVersion(postId: string, description: string, author: string = 'system'): Promise<BlogVersion> {
    const post = await this.getPost(postId);
    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }
    
    const version: BlogVersion = {
      id: randomUUID(),
      postId,
      content: post.content,
      metadata: { ...post.metadata },
      createdAt: new Date(),
      createdBy: author,
      changeDescription: description
    };
    
    // Store version
    const versions = this.versions.get(postId) || [];
    versions.push(version);
    this.versions.set(postId, versions);
    
    // Also save to database
    await this.saveVersion(version);
    
    return version;
  }

  async getVersions(postId: string): Promise<BlogVersion[]> {
    const cached = this.versions.get(postId);
    if (cached) return cached;
    
    const versions = await this.loadVersions(postId);
    this.versions.set(postId, versions);
    return versions;
  }

  async revertToVersion(postId: string, versionId: string): Promise<BlogPost> {
    const versions = await this.getVersions(postId);
    const version = versions.find(v => v.id === versionId);
    
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }
    
    return await this.updatePost(postId, {
      content: version.content,
      metadata: version.metadata
    }, `Reverted to version ${versionId}`);
  }

  // ===== SEARCH & FILTERING =====

  async searchContent(query: string, options: { 
    includeContent?: boolean; 
    fuzzy?: boolean; 
    categories?: string[]; 
    tags?: string[] 
  } = {}): Promise<BlogPost[]> {
    const timerId = performanceMonitor.startTimer('search_content');
    
    try {
      const results = await this.performSearch(query, options);
      performanceMonitor.endTimer(timerId);
      return results;
    } catch (error) {
      performanceMonitor.endTimer(timerId, { error: true });
      throw error;
    }
  }

  // ===== CONTENT EXPORT/IMPORT =====

  async exportContent(format: 'json' | 'markdown' | 'html' = 'json', filter: ContentFilter = {}): Promise<string> {
    const posts = await this.getPosts(filter, { page: 1, limit: 1000 });
    
    switch (format) {
      case 'json':
        return JSON.stringify(posts.posts, null, 2);
      case 'markdown':
        return posts.posts.map(post => this.postToMarkdown(post)).join('\n\n---\n\n');
      case 'html':
        return posts.posts.map(post => this.postToHtml(post)).join('\n\n');
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async importContent(data: string, format: 'json' | 'markdown' = 'json'): Promise<{ created: number; errors: string[] }> {
    const timerId = performanceMonitor.startTimer('import_content');
    const errors: string[] = [];
    let created = 0;
    
    try {
      let posts: Partial<BlogPost>[] = [];
      
      if (format === 'json') {
        posts = JSON.parse(data);
      } else if (format === 'markdown') {
        posts = this.parseMarkdownBulk(data);
      }
      
      for (const postData of posts) {
        try {
          await this.createPost(postData);
          created++;
        } catch (error) {
          errors.push(`Failed to import post "${postData.title}": ${error.message}`);
        }
      }
      
      performanceMonitor.endTimer(timerId);
      return { created, errors };
    } catch (error) {
      performanceMonitor.endTimer(timerId, { error: true });
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  private async processContent(post: BlogPost): Promise<BlogPost> {
    let processedPost = { ...post };
    
    // Run through all processors
    for (const [name, processor] of this.processors) {
      try {
        processedPost = await processor(processedPost);
      } catch (error) {
        logger.warn(`Processor ${name} failed`, { 
          component: 'BlogContentEngine', 
          postId: post.id, 
          error: error.message 
        });
      }
    }
    
    return processedPost;
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  private generateExcerpt(content: string, maxLength: number = 300): string {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*`]/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength).trim() + '...'
      : plainText;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async calculateSEOScore(post: BlogPost): Promise<number> {
    let score = 0;
    
    // Title optimization (0-25 points)
    if (post.title.length >= 30 && post.title.length <= 60) score += 15;
    if (post.seo.keywords.some(kw => post.title.toLowerCase().includes(kw.toLowerCase()))) score += 10;
    
    // Content optimization (0-30 points)
    const wordCount = this.calculateWordCount(post.content);
    if (wordCount >= 300) score += 10;
    if (wordCount >= 1000) score += 10;
    if (post.seo.keywords.some(kw => post.content.toLowerCase().includes(kw.toLowerCase()))) score += 10;
    
    // Meta description (0-20 points)
    if (post.seo.metaDescription && post.seo.metaDescription.length >= 120 && post.seo.metaDescription.length <= 160) {
      score += 20;
    }
    
    // Content structure (0-25 points)
    const hasHeaders = /#{1,6}\s/.test(post.content);
    const hasList = /^[\s]*[-*+]\s|^[\s]*\d+\.\s/m.test(post.content);
    if (hasHeaders) score += 15;
    if (hasList) score += 10;
    
    return Math.min(score, 100);
  }

  private async extractContentBlocks(content: string): Promise<ContentBlock[]> {
    const blocks: ContentBlock[] = [];
    let order = 0;
    
    // Extract images
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      blocks.push({
        id: randomUUID(),
        type: 'image',
        order: order++,
        content: { alt: match[1], src: match[2] },
        config: {},
        visible: true
      });
    }
    
    // Extract code blocks
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    while ((match = codeRegex.exec(content)) !== null) {
      blocks.push({
        id: randomUUID(),
        type: 'code',
        order: order++,
        content: { language: match[1] || 'text', code: match[2] },
        config: {},
        visible: true
      });
    }
    
    return blocks;
  }

  private validateContent(post: BlogPost): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields
    if (!post.title.trim()) errors.push('Title is required');
    if (!post.content.trim()) errors.push('Content is required');
    if (!post.slug.trim()) errors.push('Slug is required');
    
    // SEO warnings
    if (post.title.length > 60) warnings.push('Title is too long for SEO (>60 chars)');
    if (post.seo.metaDescription.length > 160) warnings.push('Meta description is too long (>160 chars)');
    if (post.metadata.wordCount < 300) warnings.push('Content is too short for SEO (<300 words)');
    
    // Content quality
    if (!post.seo.keywords.length) warnings.push('No keywords defined');
    if (!post.categories.length) warnings.push('No categories assigned');
    
    return { errors, warnings };
  }

  private postToMarkdown(post: BlogPost): string {
    return `---
title: ${post.title}
slug: ${post.slug}
author: ${post.author}
date: ${post.createdAt.toISOString()}
tags: [${post.tags.join(', ')}]
categories: [${post.categories.join(', ')}]
---

# ${post.title}

${post.content}`;
  }

  private postToHtml(post: BlogPost): string {
    return `<article>
  <header>
    <h1>${DOMPurify.sanitize(post.title)}</h1>
    <meta>By ${DOMPurify.sanitize(post.author)} on ${post.createdAt.toDateString()}</meta>
  </header>
  <main>
    ${marked(DOMPurify.sanitize(post.content))}
  </main>
</article>`;
  }

  private parseMarkdownBulk(data: string): Partial<BlogPost>[] {
    const posts: Partial<BlogPost>[] = [];
    const sections = data.split(/^---$/gm);
    
    for (const section of sections) {
      if (section.trim()) {
        try {
          const post = this.parseMarkdownPost(section);
          posts.push(post);
        } catch (error) {
          logger.warn('Failed to parse markdown section', { 
            component: 'BlogContentEngine', 
            error: error.message 
          });
        }
      }
    }
    
    return posts;
  }

  private parseMarkdownPost(markdown: string): Partial<BlogPost> {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);
    
    if (!match) {
      throw new Error('Invalid markdown format');
    }
    
    const frontmatter = match[1];
    const content = match[2];
    
    // Parse frontmatter (simplified YAML parsing)
    const metadata: any = {};
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[key] = value.slice(1, -1).split(',').map(s => s.trim());
        } else {
          metadata[key] = value;
        }
      }
    }
    
    return {
      title: metadata.title,
      slug: metadata.slug,
      author: metadata.author,
      content: content.trim(),
      tags: metadata.tags || [],
      categories: metadata.categories || []
    };
  }

  // ===== DATABASE OPERATIONS (PLACEHOLDER) =====

  private async savePost(post: BlogPost): Promise<void> {
    // Implementation would save to actual database
    logger.debug('Saving post to database', { 
      component: 'BlogContentEngine', 
      postId: post.id 
    });
  }

  private async loadPost(id: string): Promise<BlogPost | null> {
    // Implementation would load from actual database
    logger.debug('Loading post from database', { 
      component: 'BlogContentEngine', 
      postId: id 
    });
    return null;
  }

  private async queryPosts(filter: ContentFilter, pagination: { page: number; limit: number }): Promise<{ posts: BlogPost[]; total: number; pages: number }> {
    // Implementation would query actual database
    return { posts: [], total: 0, pages: 0 };
  }

  private async saveVersion(version: BlogVersion): Promise<void> {
    // Implementation would save to actual database
    logger.debug('Saving version to database', { 
      component: 'BlogContentEngine', 
      versionId: version.id 
    });
  }

  private async loadVersions(postId: string): Promise<BlogVersion[]> {
    // Implementation would load from actual database
    return [];
  }

  private async performSearch(query: string, options: any): Promise<BlogPost[]> {
    // Implementation would perform actual search
    return [];
  }

  // ===== AI PROVIDER INTEGRATION =====

  setAIProvider(provider: any): void {
    this.aiProvider = provider;
    logger.info('AI provider configured', { component: 'BlogContentEngine' });
  }

  // ===== PROCESSOR MANAGEMENT =====

  addProcessor(name: string, processor: (content: BlogPost) => Promise<BlogPost>): void {
    this.processors.set(name, processor);
    logger.info('Content processor added', { 
      component: 'BlogContentEngine', 
      processor: name 
    });
  }

  removeProcessor(name: string): boolean {
    return this.processors.delete(name);
  }

  // ===== ANALYTICS & REPORTING =====

  async getContentAnalytics(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    avgSeoScore: number;
    totalViews: number;
    avgReadingTime: number;
    topCategories: Array<{ category: string; count: number }>;
    topTags: Array<{ tag: string; count: number }>;
  }> {
    // Implementation would analyze actual data
    return {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      avgSeoScore: 0,
      totalViews: 0,
      avgReadingTime: 0,
      topCategories: [],
      topTags: []
    };
  }
}