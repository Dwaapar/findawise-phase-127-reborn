import { db } from "../../db";
import { offerFeed, neuronOfferAssignments } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { WebSocketManager } from "../websocket/WebSocketManager";

export interface FederationEvent {
  type: 'offer_new' | 'offer_updated' | 'offer_expired' | 'offer_assignment';
  offerId: number;
  neuronIds?: string[];
  data?: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class OfferFederationBroadcast {
  private wsManager: WebSocketManager;
  
  constructor() {
    this.wsManager = WebSocketManager.getInstance();
  }
  
  // Broadcast offer updates to all connected neurons
  async broadcastOfferUpdate(offerId: number, updateType: 'new' | 'updated' | 'expired'): Promise<void> {
    try {
      const [offer] = await db.select().from(offerFeed).where(eq(offerFeed.id, offerId));
      
      if (!offer) {
        console.error(`❌ Offer not found for broadcast: ${offerId}`);
        return;
      }
      
      const event: FederationEvent = {
        type: `offer_${updateType}` as any,
        offerId,
        data: {
          offer,
          updateType
        },
        timestamp: new Date(),
        priority: updateType === 'expired' ? 'high' : 'medium'
      };
      
      // Broadcast to all connected neurons
      this.wsManager.broadcast('federation', {
        event: 'offer_update',
        data: event
      });
      
      // Get specific neuron assignments for targeted updates
      const assignments = await db.select()
        .from(neuronOfferAssignments)
        .where(and(
          eq(neuronOfferAssignments.offerId, offerId),
          eq(neuronOfferAssignments.isActive, true)
        ));
      
      // Send targeted updates to assigned neurons
      for (const assignment of assignments) {
        this.wsManager.sendToUser(assignment.neuronId, {
          event: 'assigned_offer_update',
          data: {
            ...event,
            assignment: {
              position: assignment.position,
              context: assignment.context,
              emotionMatch: assignment.emotionMatch,
              intentMatch: assignment.intentMatch
            }
          }
        });
      }
      
      console.log(`📡 Broadcasted ${updateType} for offer ${offerId} to ${assignments.length} assigned neurons`);
      
    } catch (error) {
      console.error(`❌ Federation broadcast failed for offer ${offerId}:`, error);
    }
  }
  
  // Broadcast new offer assignments to specific neurons
  async broadcastOfferAssignment(offerId: number, neuronId: string, assignmentData: any): Promise<void> {
    try {
      const [offer] = await db.select().from(offerFeed).where(eq(offerFeed.id, offerId));
      
      if (!offer) {
        console.error(`❌ Offer not found for assignment broadcast: ${offerId}`);
        return;
      }
      
      const event: FederationEvent = {
        type: 'offer_assignment',
        offerId,
        neuronIds: [neuronId],
        data: {
          offer,
          assignment: assignmentData
        },
        timestamp: new Date(),
        priority: 'medium'
      };
      
      this.wsManager.sendToUser(neuronId, {
        event: 'new_offer_assignment',
        data: event
      });
      
      console.log(`📡 Broadcasted new offer assignment: offer ${offerId} → neuron ${neuronId}`);
      
    } catch (error) {
      console.error(`❌ Assignment broadcast failed:`, error);
    }
  }
  
  // Broadcast bulk offer updates (for sync operations)
  async broadcastBulkOfferUpdate(
    offers: any[], 
    updateType: 'sync_complete' | 'batch_update'
  ): Promise<void> {
    try {
      const event: FederationEvent = {
        type: 'offer_updated',
        offerId: 0, // Bulk update
        data: {
          offers: offers.length,
          updateType,
          summary: {
            categories: [...new Set(offers.map(o => o.category))],
            merchants: [...new Set(offers.map(o => o.merchant))],
            totalRevenuePotential: offers.reduce((sum, o) => sum + (o.commissionEstimate || 0), 0)
          }
        },
        timestamp: new Date(),
        priority: 'low'
      };
      
      this.wsManager.broadcast('federation', {
        event: 'bulk_offer_update',
        data: event
      });
      
      console.log(`📡 Broadcasted bulk update: ${offers.length} offers updated`);
      
    } catch (error) {
      console.error(`❌ Bulk broadcast failed:`, error);
    }
  }
  
  // Send personalized offer recommendations to specific users
  async sendPersonalizedOffers(
    sessionId: string, 
    userId: string | undefined,
    offers: any[],
    context: any
  ): Promise<void> {
    try {
      const event = {
        event: 'personalized_offers',
        data: {
          sessionId,
          userId,
          offers,
          context,
          timestamp: new Date()
        }
      };
      
      // Send to session if user is connected
      if (userId) {
        this.wsManager.sendToUser(userId, event);
      } else {
        // Send to session-based connection
        this.wsManager.sendToSession(sessionId, event);
      }
      
      console.log(`📡 Sent personalized offers to session ${sessionId}: ${offers.length} offers`);
      
    } catch (error) {
      console.error(`❌ Personalized offer broadcast failed:`, error);
    }
  }
  
  // Emergency broadcast for compliance issues
  async emergencyBroadcast(
    type: 'compliance_violation' | 'security_alert' | 'system_maintenance',
    data: any
  ): Promise<void> {
    try {
      const event: FederationEvent = {
        type: 'offer_expired', // Use existing type for compatibility
        offerId: 0,
        data: {
          emergency: true,
          alertType: type,
          message: data
        },
        timestamp: new Date(),
        priority: 'critical'
      };
      
      this.wsManager.broadcast('federation', {
        event: 'emergency_alert',
        data: event
      });
      
      console.log(`🚨 Emergency broadcast sent: ${type}`);
      
    } catch (error) {
      console.error(`❌ Emergency broadcast failed:`, error);
    }
  }
  
  // Get federation statistics
  async getFederationStats(): Promise<any> {
    try {
      const totalOffers = await db.select().from(offerFeed).where(eq(offerFeed.isActive, true));
      const totalAssignments = await db.select().from(neuronOfferAssignments).where(eq(neuronOfferAssignments.isActive, true));
      
      const connectedNeurons = this.wsManager.getConnectedUserCount();
      
      return {
        totalActiveOffers: totalOffers.length,
        totalAssignments: totalAssignments.length,
        connectedNeurons,
        averageOffersPerNeuron: totalAssignments.length > 0 ? (totalOffers.length / totalAssignments.length).toFixed(2) : 0,
        lastBroadcast: new Date(),
        systemHealth: 'operational'
      };
      
    } catch (error) {
      console.error('❌ Federation stats error:', error);
      return {
        totalActiveOffers: 0,
        totalAssignments: 0,
        connectedNeurons: 0,
        averageOffersPerNeuron: 0,
        lastBroadcast: new Date(),
        systemHealth: 'error'
      };
    }
  }
}

// Export singleton instance
export const offerFederationBroadcast = new OfferFederationBroadcast();