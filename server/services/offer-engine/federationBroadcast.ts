import { webSocketManager } from "../federation/webSocketManager";
import { offerEngineCore } from "./offerEngineCore";
import { db } from "../../db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { 
  neurons, 
  offerFeed, 
  neuronOfferAssignments,
  type OfferFeed 
} from "@shared/schema";

export interface OfferBroadcastEvent {
  type: 'offer_update' | 'offer_new' | 'offer_expired' | 'offer_personalized';
  neuronId?: string;
  offers: OfferFeed[];
  metadata: {
    timestamp: string;
    source: string;
    emotion?: string;
    category?: string;
    region?: string;
  };
}

export class FederationBroadcast {
  
  // ================================================
  // REAL-TIME FEDERATION BROADCAST SYSTEM
  // ================================================

  async broadcastOfferUpdate(offerId: number, updateType: 'new' | 'updated' | 'expired'): Promise<void> {
    console.log(`📡 Broadcasting offer update: ${offerId} (${updateType})`);
    
    // Get the updated offer
    const offer = await db.select()
      .from(offerFeed)
      .where(eq(offerFeed.id, offerId))
      .limit(1);
    
    if (offer.length === 0) return;
    
    const offerData = offer[0];
    
    // Get all neurons that should receive this offer
    const targetNeurons = await this.getTargetNeurons(offerData);
    
    // Broadcast to each neuron
    for (const neuron of targetNeurons) {
      const broadcastEvent: OfferBroadcastEvent = {
        type: updateType === 'new' ? 'offer_new' : 'offer_update',
        neuronId: neuron.neuronId,
        offers: [offerData],
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'offer-engine',
          emotion: offerData.emotion || undefined,
          category: offerData.category,
          region: offerData.region
        }
      };
      
      // Send via WebSocket to neuron
      webSocketManager.sendToNeuron(neuron.neuronId, {
        type: 'OFFER_UPDATE',
        payload: broadcastEvent
      });
      
      console.log(`✅ Sent offer update to neuron: ${neuron.neuronId}`);
    }
    
    // Also broadcast to admin dashboards
    webSocketManager.broadcast({
      type: 'ADMIN_OFFER_UPDATE',
      payload: {
        offerId,
        updateType,
        offer: offerData,
        timestamp: new Date().toISOString()
      }
    });
  }

  async broadcastPersonalizedOffers(
    sessionId: string, 
    neuronId: string, 
    personalizedOffers: OfferFeed[]
  ): Promise<void> {
    console.log(`🎯 Broadcasting personalized offers to ${neuronId} for session ${sessionId}`);
    
    const broadcastEvent: OfferBroadcastEvent = {
      type: 'offer_personalized',
      neuronId,
      offers: personalizedOffers,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'personalization-engine'
      }
    };
    
    // Send personalized offers to specific neuron
    webSocketManager.sendToNeuron(neuronId, {
      type: 'PERSONALIZED_OFFERS',
      payload: broadcastEvent
    });
    
    // Track personalization event
    await offerEngineCore.trackOfferAnalytics({
      sessionId,
      neuronId,
      eventType: 'personalization',
      metadata: {
        offersCount: personalizedOffers.length,
        offerIds: personalizedOffers.map(o => o.id)
      }
    });
  }

  async broadcastCategoryUpdates(category: string): Promise<void> {
    console.log(`📦 Broadcasting category updates for: ${category}`);
    
    // Get active offers in this category
    const categoryOffers = await offerEngineCore.getOffersByCategory(category);
    
    if (categoryOffers.length === 0) return;
    
    // Get neurons that work with this category
    const targetNeurons = await db.select()
      .from(neuronOfferAssignments)
      .innerJoin(offerFeed, eq(neuronOfferAssignments.offerId, offerFeed.id))
      .where(and(
        eq(offerFeed.category, category),
        eq(neuronOfferAssignments.isActive, true)
      ));
    
    const uniqueNeuronIds = [...new Set(targetNeurons.map(n => n.neuron_offer_assignments.neuronId))];
    
    for (const neuronId of uniqueNeuronIds) {
      const broadcastEvent: OfferBroadcastEvent = {
        type: 'offer_update',
        neuronId,
        offers: categoryOffers,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'category-sync',
          category
        }
      };
      
      webSocketManager.sendToNeuron(neuronId, {
        type: 'CATEGORY_OFFERS_UPDATE',
        payload: broadcastEvent
      });
    }
  }

  async broadcastEmotionUpdates(emotion: string): Promise<void> {
    console.log(`💭 Broadcasting emotion-based offers for: ${emotion}`);
    
    // Get offers matching this emotion
    const emotionOffers = await offerEngineCore.getOffersByEmotion(emotion);
    
    if (emotionOffers.length === 0) return;
    
    // Broadcast to all active neurons - they can filter based on their needs
    const activeNeurons = await db.select()
      .from(neurons)
      .where(eq(neurons.isActive, true));
    
    for (const neuron of activeNeurons) {
      const broadcastEvent: OfferBroadcastEvent = {
        type: 'offer_update',
        neuronId: neuron.neuronId,
        offers: emotionOffers,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'emotion-sync',
          emotion
        }
      };
      
      webSocketManager.sendToNeuron(neuron.neuronId, {
        type: 'EMOTION_OFFERS_UPDATE',
        payload: broadcastEvent
      });
    }
  }

  async broadcastSyncCompletion(sourceSlug: string, stats: any): Promise<void> {
    console.log(`🔄 Broadcasting sync completion for source: ${sourceSlug}`);
    
    // Notify admin dashboards
    webSocketManager.broadcast({
      type: 'OFFER_SYNC_COMPLETED',
      payload: {
        sourceSlug,
        stats,
        timestamp: new Date().toISOString()
      }
    });
    
    // If new offers were added, trigger category/emotion broadcasts
    if (stats.offersAdded > 0) {
      // Get unique categories and emotions from recent offers
      const recentOffers = await db.select()
        .from(offerFeed)
        .where(eq(offerFeed.isActive, true))
        .orderBy(desc(offerFeed.syncedAt))
        .limit(stats.offersAdded);
      
      const categories = [...new Set(recentOffers.map(o => o.category))];
      const emotions = [...new Set(recentOffers.map(o => o.emotion).filter(Boolean))];
      
      // Broadcast category updates
      for (const category of categories) {
        await this.broadcastCategoryUpdates(category);
      }
      
      // Broadcast emotion updates
      for (const emotion of emotions) {
        await this.broadcastEmotionUpdates(emotion);
      }
    }
  }

  // ================================================
  // TARGETED NEURON SELECTION
  // ================================================

  private async getTargetNeurons(offer: OfferFeed): Promise<Array<{ neuronId: string }>> {
    // Get neurons that are configured to receive offers of this type
    const assignments = await db.select()
      .from(neuronOfferAssignments)
      .where(eq(neuronOfferAssignments.offerId, offer.id));
    
    if (assignments.length > 0) {
      return assignments.map(a => ({ neuronId: a.neuronId }));
    }
    
    // Auto-assign based on category and region
    const potentialNeurons = await db.select()
      .from(neurons)
      .where(eq(neurons.isActive, true));
    
    // Filter neurons based on category mapping
    const categoryNeuronMap: Record<string, string[]> = {
      'Finance': ['neuron-finance', 'neuron-personal-finance'],
      'Health': ['neuron-health', 'neuron-wellness'],
      'Travel': ['neuron-travel'],
      'Education': ['neuron-education'],
      'Technology': ['neuron-ai-tools', 'neuron-saas'],
      'SaaS': ['neuron-saas', 'neuron-ai-tools'],
      'Security': ['neuron-security', 'neuron-home-security']
    };
    
    const targetCategories = categoryNeuronMap[offer.category] || [];
    
    return potentialNeurons
      .filter(neuron => 
        targetCategories.length === 0 || 
        targetCategories.some(cat => neuron.neuronId.includes(cat))
      )
      .map(neuron => ({ neuronId: neuron.neuronId }));
  }

  // ================================================
  // BULK BROADCAST OPERATIONS
  // ================================================

  async broadcastBulkUpdate(offers: OfferFeed[], updateType: 'sync' | 'cleanup' | 'experiment'): Promise<void> {
    console.log(`📡 Broadcasting bulk update: ${offers.length} offers (${updateType})`);
    
    // Group offers by category and emotion for efficient broadcasting
    const offersByCategory = offers.reduce((acc, offer) => {
      if (!acc[offer.category]) acc[offer.category] = [];
      acc[offer.category].push(offer);
      return acc;
    }, {} as Record<string, OfferFeed[]>);
    
    const offersByEmotion = offers.reduce((acc, offer) => {
      if (!offer.emotion) return acc;
      if (!acc[offer.emotion]) acc[offer.emotion] = [];
      acc[offer.emotion].push(offer);
      return acc;
    }, {} as Record<string, OfferFeed[]>);
    
    // Broadcast category-wise updates
    for (const [category, categoryOffers] of Object.entries(offersByCategory)) {
      await this.broadcastCategoryUpdates(category);
    }
    
    // Broadcast emotion-wise updates
    for (const [emotion, emotionOffers] of Object.entries(offersByEmotion)) {
      await this.broadcastEmotionUpdates(emotion);
    }
    
    // Send admin notification
    webSocketManager.broadcast({
      type: 'BULK_OFFERS_UPDATE',
      payload: {
        updateType,
        offersCount: offers.length,
        categories: Object.keys(offersByCategory),
        emotions: Object.keys(offersByEmotion),
        timestamp: new Date().toISOString()
      }
    });
  }

  // ================================================
  // MANUAL TRIGGER ENDPOINTS
  // ================================================

  async triggerNeuronRefresh(neuronId: string): Promise<void> {
    console.log(`🔄 Triggering manual refresh for neuron: ${neuronId}`);
    
    // Get all offers assigned to this neuron
    const neuronOffers = await offerEngineCore.getOffersByNeuron(neuronId);
    
    const broadcastEvent: OfferBroadcastEvent = {
      type: 'offer_update',
      neuronId,
      offers: neuronOffers,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'manual-refresh'
      }
    };
    
    webSocketManager.sendToNeuron(neuronId, {
      type: 'NEURON_REFRESH',
      payload: broadcastEvent
    });
  }

  async triggerGlobalRefresh(): Promise<void> {
    console.log(`🌍 Triggering global offer refresh`);
    
    // Get all active offers
    const allOffers = await offerEngineCore.getOffers({
      isActive: true,
      isExpired: false,
      limit: 1000
    });
    
    // Broadcast to all active neurons
    const activeNeurons = await db.select()
      .from(neurons)
      .where(eq(neurons.isActive, true));
    
    for (const neuron of activeNeurons) {
      // Get offers specific to this neuron
      const neuronOffers = await offerEngineCore.getOffersByNeuron(neuron.neuronId);
      
      const broadcastEvent: OfferBroadcastEvent = {
        type: 'offer_update',
        neuronId: neuron.neuronId,
        offers: neuronOffers,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'global-refresh'
        }
      };
      
      webSocketManager.sendToNeuron(neuron.neuronId, {
        type: 'GLOBAL_REFRESH',
        payload: broadcastEvent
      });
    }
    
    // Notify admin
    webSocketManager.broadcast({
      type: 'GLOBAL_OFFERS_REFRESH',
      payload: {
        neuronCount: activeNeurons.length,
        offersCount: allOffers.length,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export singleton instance
export const federationBroadcast = new FederationBroadcast();