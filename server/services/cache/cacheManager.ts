import { logger } from "../../utils/logger";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number;
  namespace?: string;
}

class CacheManager {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private maxSize = 10000;

  set(key: string, value: any, options: CacheOptions = {}): void {
    const ttl = options.ttl || 3600; // 1 hour default
    const expires = Date.now() + (ttl * 1000);
    
    const cacheKey = options.namespace ? `${options.namespace}:${key}` : key;
    
    // Cleanup if at max size
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(cacheKey, { value, expires });
    logger.debug('Cache set', { component: 'CacheManager', key: cacheKey });
  }

  get(key: string, namespace?: string): any | null {
    const cacheKey = namespace ? `${namespace}:${key}` : key;
    const item = this.cache.get(cacheKey);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return item.value;
  }

  delete(key: string, namespace?: string): boolean {
    const cacheKey = namespace ? `${namespace}:${key}` : key;
    return this.cache.delete(cacheKey);
  }

  clear(namespace?: string): void {
    if (namespace) {
      const keys = Array.from(this.cache.keys()).filter(k => k.startsWith(`${namespace}:`));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    logger.debug('Cache cleanup completed', { 
      component: 'CacheManager', 
      expiredCount: expiredKeys.length 
    });
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const cacheManager = new CacheManager();