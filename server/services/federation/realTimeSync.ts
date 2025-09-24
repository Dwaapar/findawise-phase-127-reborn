import { storage } from '../../storage';
import { webSocketManager } from './webSocketManager';

// ===========================================
// REAL-TIME SYNC MANAGER
// ===========================================

class RealTimeSyncManager {
  private initialized = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize real-time sync manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔄 Initializing Real-Time Sync Manager...');

    try {
      this.startSyncInterval();
      this.initialized = true;
      console.log('✅ Real-Time Sync Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Real-Time Sync Manager:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { total: number; by_neuron: Record<string, number> } {
    return webSocketManager.getConnectionStatus();
  }

  /**
   * Get connected neurons
   */
  async getConnectedNeurons(): Promise<string[]> {
    return webSocketManager.getConnectedNeurons();
  }

  /**
   * Sync data to all neurons
   */
  async syncToAll(data: any, syncType: string = 'general'): Promise<void> {
    const message = {
      type: 'data_sync',
      syncType,
      data,
      timestamp: new Date().toISOString()
    };

    await webSocketManager.broadcast(message);
  }

  /**
   * Sync configuration to specific neuron
   */
  async syncConfigToNeuron(neuronId: string, config: any): Promise<boolean> {
    const result = await webSocketManager.sendToNeuron(neuronId, {
      type: 'config_sync',
      config,
      timestamp: new Date().toISOString()
    });

    return result.success;
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private startSyncInterval(): void {
    this.syncInterval = setInterval(async () => {
      try {
        // Perform periodic sync operations
        await this.performPeriodicSync();
      } catch (error) {
        console.error('❌ Periodic sync error:', error);
      }
    }, 300000); // Every 5 minutes
  }

  private async performPeriodicSync(): Promise<void> {
    // Get all neurons and perform health sync
    const neurons = await storage.getNeurons();
    const healthData = {
      totalNeurons: neurons.length,
      activeNeurons: neurons.filter(n => n.status === 'active').length,
      timestamp: new Date().toISOString()
    };

    await this.syncToAll(healthData, 'health_update');
  }

  /**
   * Shutdown sync manager
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Real-Time Sync Manager...');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.initialized = false;
    console.log('✅ Real-Time Sync Manager shutdown complete');
  }
}

export const realTimeSyncManager = new RealTimeSyncManager();