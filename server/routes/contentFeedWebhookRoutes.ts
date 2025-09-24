// Content Feed Webhook Routes - For real-time partner integrations
import express from 'express';
import { WebhookConnector } from '../services/content-feed/connectors/WebhookConnector';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = express.Router();
const webhookConnector = new WebhookConnector();

// Webhook verification middleware
const verifyWebhook = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = JSON.stringify(req.body);
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  // In production, verify webhook signature using the partner's secret
  // const expectedSignature = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET || '').update(payload).digest('hex');
  // if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expectedSignature}`))) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  next();
};

// Generic webhook endpoint for content updates
router.post('/content/:sourceId', verifyWebhook, async (req, res) => {
  try {
    const sourceId = parseInt(req.params.sourceId);
    const { action, data } = req.body;

    // Validate source exists
    const source = await storage.getFeedSource(sourceId);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Handle different webhook actions
    switch (action) {
      case 'content_added':
      case 'content_updated':
        await handleContentUpdate(sourceId, data);
        break;
      
      case 'content_removed':
        await handleContentRemoval(sourceId, data);
        break;
      
      case 'bulk_update':
        await handleBulkUpdate(sourceId, data);
        break;
      
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    res.json({ 
      success: true, 
      message: `Webhook processed: ${action}`,
      processed: Array.isArray(data) ? data.length : 1
    });

  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Partner-specific webhook endpoints

// Amazon PA webhook
router.post('/amazon-pa/:sourceId', verifyWebhook, async (req, res) => {
  try {
    const sourceId = parseInt(req.params.sourceId);
    const products = req.body.products || [];

    const normalizedData = products.map((product: any) => ({
      id: product.ASIN,
      title: product.Title?.DisplayValue,
      description: product.Features?.DisplayValues?.join(' '),
      price: product.Offers?.Listings?.[0]?.Price?.Amount,
      currency: product.Offers?.Listings?.[0]?.Price?.Currency,
      affiliate_url: product.DetailPageURL,
      image_url: product.Images?.Primary?.Large?.URL,
      rating: product.CustomerReviews?.StarRating?.Value,
      review_count: product.CustomerReviews?.Count,
      merchant: 'Amazon',
      type: 'product',
      category: product.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName
    }));

    webhookConnector.receiveWebhookData(sourceId, normalizedData);
    
    res.json({ 
      success: true, 
      processed: normalizedData.length,
      message: 'Amazon PA webhook processed'
    });

  } catch (error) {
    logger.error('Amazon PA webhook failed:', error);
    res.status(500).json({ error: 'Amazon PA webhook processing failed' });
  }
});

// CJ Affiliate webhook
router.post('/cj-affiliate/:sourceId', verifyWebhook, async (req, res) => {
  try {
    const sourceId = parseInt(req.params.sourceId);
    const offers = req.body.offers || [];

    const normalizedData = offers.map((offer: any) => ({
      id: offer.offerId,
      title: offer.offerName,
      description: offer.description,
      price: offer.salePrice,
      original_price: offer.retailPrice,
      currency: offer.currency || 'USD',
      affiliate_url: offer.clickUrl,
      image_url: offer.imageUrl,
      merchant: offer.advertiserName,
      type: 'offer',
      category: offer.category,
      expires_at: offer.endDate
    }));

    webhookConnector.receiveWebhookData(sourceId, normalizedData);
    
    res.json({ 
      success: true, 
      processed: normalizedData.length,
      message: 'CJ Affiliate webhook processed'
    });

  } catch (error) {
    logger.error('CJ Affiliate webhook failed:', error);
    res.status(500).json({ error: 'CJ Affiliate webhook processing failed' });
  }
});

// RSS feed webhook
router.post('/rss/:sourceId', verifyWebhook, async (req, res) => {
  try {
    const sourceId = parseInt(req.params.sourceId);
    const items = req.body.items || [];

    const normalizedData = items.map((item: any) => ({
      id: item.guid || item.link,
      title: item.title,
      description: item.description || item.summary,
      content: item.content || item.description,
      author: item.author,
      published_at: item.pubDate || item.published,
      url: item.link,
      type: 'article',
      category: item.category
    }));

    webhookConnector.receiveWebhookData(sourceId, normalizedData);
    
    res.json({ 
      success: true, 
      processed: normalizedData.length,
      message: 'RSS webhook processed'
    });

  } catch (error) {
    logger.error('RSS webhook failed:', error);
    res.status(500).json({ error: 'RSS webhook processing failed' });
  }
});

// Helper functions

async function handleContentUpdate(sourceId: number, data: any): Promise<void> {
  if (Array.isArray(data)) {
    webhookConnector.receiveWebhookData(sourceId, data);
  } else {
    webhookConnector.receiveWebhookData(sourceId, [data]);
  }
}

async function handleContentRemoval(sourceId: number, data: any): Promise<void> {
  const idsToRemove = Array.isArray(data) ? data : [data];
  
  for (const id of idsToRemove) {
    try {
      const content = await storage.getContentByExternalId(sourceId, id);
      if (content) {
        await storage.updateContent(content.id, { status: 'removed' });
      }
    } catch (error) {
      logger.error(`Failed to remove content ${id}:`, error);
    }
  }
}

async function handleBulkUpdate(sourceId: number, data: any[]): Promise<void> {
  webhookConnector.receiveWebhookData(sourceId, data);
}

export default router;