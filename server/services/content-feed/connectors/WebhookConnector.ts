// Webhook Connector - For real-time content updates from partners
import { FeedConnector } from '../ContentFeedEngine';
import { ContentFeedSource, InsertContentFeed } from '@shared/contentFeedTables';
import { logger } from '../../../utils/logger';

export class WebhookConnector implements FeedConnector {
  sourceType = 'webhook';
  private webhookData: Map<number, any[]> = new Map();

  async connect(): Promise<void> {
    logger.info('Webhook connector connected');
  }

  async fetchContent(source: ContentFeedSource, lastSync?: Date): Promise<any[]> {
    // Return any webhook data received for this source
    const data = this.webhookData.get(source.id) || [];
    this.webhookData.delete(source.id); // Clear after fetching
    return data;
  }

  normalizeContent(rawData: any, source: ContentFeedSource): Partial<InsertContentFeed> {
    return {
      externalId: rawData.id || rawData.external_id,
      contentType: rawData.type || 'offer',
      title: rawData.title || rawData.name,
      description: rawData.description,
      content: rawData.content || rawData.body,
      category: rawData.category,
      price: rawData.price ? parseFloat(rawData.price) : undefined,
      originalPrice: rawData.original_price ? parseFloat(rawData.original_price) : undefined,
      currency: rawData.currency || 'USD',
      affiliateUrl: rawData.affiliate_url || rawData.url,
      merchantName: rawData.merchant || rawData.brand,
      imageUrl: rawData.image_url || rawData.image,
      rating: rawData.rating ? parseFloat(rawData.rating) : undefined,
      reviewCount: rawData.review_count ? parseInt(rawData.review_count) : undefined,
      publishedAt: rawData.published_at ? new Date(rawData.published_at) : new Date(),
      expiresAt: rawData.expires_at ? new Date(rawData.expires_at) : undefined,
      tags: rawData.tags || [],
      status: rawData.status || 'active'
    };
  }

  async disconnect(): Promise<void> {
    logger.info('Webhook connector disconnected');
  }

  // Method to receive webhook data
  receiveWebhookData(sourceId: number, data: any[]): void {
    if (!this.webhookData.has(sourceId)) {
      this.webhookData.set(sourceId, []);
    }
    this.webhookData.get(sourceId)!.push(...data);
    logger.info(`Received ${data.length} items via webhook for source ${sourceId}`);
  }
}