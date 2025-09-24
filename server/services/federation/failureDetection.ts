/**
 * Phase 3B: Failure Detection & Auto-Recovery System
 * 
 * Monitors neuron health, detects failures, and orchestrates recovery
 */

import { DatabaseStorage } from '../../storage';
import { WebSocketManager } from './webSocketManager';

export interface FailureEvent {
  neuronId: string;
  type: 'offline' | 'config_failure' | 'analytics_failure' | 'health_degraded' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: any;
  recovered?: boolean;
  recoveryAttempts?: number;
}

export interface NeuronHealthStatus {
  neuronId: string;
  isOnline: boolean;
  lastSeen: Date;
  healthScore: number;
  configVersion: number;
  errorCount: number;
  responseTime: number;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
}

export class FailureDetectionSystem {
  private storage: DatabaseStorage;
  private webSocketManager: WebSocketManager | null;
  private healthChecks: Map<string, NeuronHealthStatus> = new Map();
  private failures: Map<string, FailureEvent[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private recoveryQueue: Set<string> = new Set();

  // Configuration
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly OFFLINE_THRESHOLD = 120000; // 2 minutes
  private readonly MAX_RECOVERY_ATTEMPTS = 3;
  private readonly RESPONSE_TIMEOUT = 10000; // 10 seconds

  constructor(storage: DatabaseStorage, webSocketManager: WebSocketManager | null = null) {
    this.storage = storage;
    this.webSocketManager = webSocketManager;
    this.startMonitoring();
  }

  startMonitoring(): void {
    console.log('🔍 Starting failure detection system...');
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    console.log('✅ Failure detection system initialized');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 Failure detection system stopped');
  }

  async performHealthChecks(): Promise<void> {
    try {
      const neurons = await this.storage.getNeurons();
      const checkPromises = neurons.map(neuron => this.checkNeuronHealth(neuron.neuronId));
      await Promise.allSettled(checkPromises);
      
      // Process recovery queue
      this.processRecoveryQueue();
    } catch (error) {
      console.error('❌ Health check cycle failed:', error);
    }
  }

  async checkNeuronHealth(neuronId: string): Promise<void> {
    const startTime = Date.now();
    let healthStatus: NeuronHealthStatus;

    try {
      // Get current health status
      const existingStatus = this.healthChecks.get(neuronId);
      const neuron = await this.storage.getNeuronById(neuronId);
      
      if (!neuron) {
        // Neuron no longer exists
        this.healthChecks.delete(neuronId);
        return;
      }

      // Check WebSocket connection
      const isConnected = this.webSocketManager?.isNeuronConnected(neuronId) || false;
      const responseTime = Date.now() - startTime;

      healthStatus = {
        neuronId,
        isOnline: isConnected,
        lastSeen: isConnected ? new Date() : (existingStatus?.lastSeen || new Date(0)),
        healthScore: neuron.healthScore || 0,
        configVersion: neuron.configVersion || 1,
        errorCount: existingStatus?.errorCount || 0,
        responseTime,
        status: this.calculateHealthStatus(isConnected, neuron.healthScore || 0, existingStatus)
      };

      // Detect failures
      this.detectFailures(healthStatus, existingStatus);

      // Update health status
      this.healthChecks.set(neuronId, healthStatus);

      // Update database
      await this.updateNeuronHealthInDB(neuronId, healthStatus);

    } catch (error) {
      console.error(`❌ Health check failed for ${neuronId}:`, error);
      
      // Mark as failed health check
      healthStatus = {
        neuronId,
        isOnline: false,
        lastSeen: this.healthChecks.get(neuronId)?.lastSeen || new Date(0),
        healthScore: 0,
        configVersion: 0,
        errorCount: (this.healthChecks.get(neuronId)?.errorCount || 0) + 1,
        responseTime: Date.now() - startTime,
        status: 'critical'
      };

      this.healthChecks.set(neuronId, healthStatus);
      this.recordFailure(neuronId, 'timeout', 'high', `Health check timeout: ${error}`);
    }
  }

  private calculateHealthStatus(
    isOnline: boolean, 
    healthScore: number, 
    previousStatus?: NeuronHealthStatus
  ): 'healthy' | 'warning' | 'critical' | 'offline' {
    if (!isOnline) {
      const offlineTime = previousStatus?.lastSeen 
        ? Date.now() - previousStatus.lastSeen.getTime()
        : this.OFFLINE_THRESHOLD + 1;
      
      return offlineTime > this.OFFLINE_THRESHOLD ? 'offline' : 'critical';
    }

    if (healthScore >= 80) return 'healthy';
    if (healthScore >= 60) return 'warning';
    return 'critical';
  }

  private detectFailures(current: NeuronHealthStatus, previous?: NeuronHealthStatus): void {
    // Detect new offline state
    if (!current.isOnline && previous?.isOnline) {
      this.recordFailure(current.neuronId, 'offline', 'high', 'Neuron went offline');
    }

    // Detect health degradation
    if (previous && current.healthScore < previous.healthScore - 20) {
      this.recordFailure(
        current.neuronId, 
        'health_degraded', 
        current.healthScore < 30 ? 'critical' : 'medium',
        `Health score dropped from ${previous.healthScore} to ${current.healthScore}`
      );
    }

    // Detect response time issues
    if (current.responseTime > this.RESPONSE_TIMEOUT) {
      this.recordFailure(
        current.neuronId,
        'timeout',
        'medium',
        `Response time ${current.responseTime}ms exceeds threshold`
      );
    }

    // Detect excessive errors
    if (current.errorCount > 5) {
      this.recordFailure(
        current.neuronId,
        'analytics_failure',
        'high',
        `High error count: ${current.errorCount}`
      );
    }
  }

  recordFailure(
    neuronId: string, 
    type: FailureEvent['type'], 
    severity: FailureEvent['severity'], 
    message: string,
    metadata?: any
  ): void {
    const failure: FailureEvent = {
      neuronId,
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata,
      recovered: false,
      recoveryAttempts: 0
    };

    if (!this.failures.has(neuronId)) {
      this.failures.set(neuronId, []);
    }

    this.failures.get(neuronId)!.push(failure);

    // Log failure
    console.warn(`⚠️ Failure detected [${neuronId}]: ${type} - ${message}`);

    // Add to recovery queue for high/critical failures
    if (severity === 'high' || severity === 'critical') {
      this.recoveryQueue.add(neuronId);
    }

    // Store in database
    this.storeFederationEvent(neuronId, 'failure_detected', { failure });
  }

  private async processRecoveryQueue(): Promise<void> {
    for (const neuronId of this.recoveryQueue) {
      await this.attemptRecovery(neuronId);
    }
  }

  async attemptRecovery(neuronId: string): Promise<boolean> {
    try {
      console.log(`🔄 Attempting recovery for ${neuronId}...`);

      const failures = this.failures.get(neuronId) || [];
      const unrecoveredFailures = failures.filter(f => !f.recovered);
      
      if (unrecoveredFailures.length === 0) {
        this.recoveryQueue.delete(neuronId);
        return true;
      }

      // Check current health
      const currentHealth = this.healthChecks.get(neuronId);
      if (!currentHealth) {
        console.warn(`⚠️ No health data for ${neuronId}, skipping recovery`);
        return false;
      }

      let recoverySuccess = false;

      // Recovery strategies based on failure type
      for (const failure of unrecoveredFailures) {
        if (failure.recoveryAttempts! >= this.MAX_RECOVERY_ATTEMPTS) {
          console.error(`❌ Max recovery attempts reached for ${neuronId}:${failure.type}`);
          continue;
        }

        failure.recoveryAttempts = (failure.recoveryAttempts || 0) + 1;

        switch (failure.type) {
          case 'offline':
            recoverySuccess = await this.recoverOfflineNeuron(neuronId);
            break;
          case 'config_failure':
            recoverySuccess = await this.recoverConfigFailure(neuronId);
            break;
          case 'analytics_failure':
            recoverySuccess = await this.recoverAnalyticsFailure(neuronId);
            break;
          case 'health_degraded':
            recoverySuccess = await this.recoverHealthIssues(neuronId);
            break;
          case 'timeout':
            recoverySuccess = await this.recoverTimeoutIssues(neuronId);
            break;
        }

        if (recoverySuccess) {
          failure.recovered = true;
          console.log(`✅ Recovered ${neuronId} from ${failure.type}`);
          this.storeFederationEvent(neuronId, 'failure_recovered', { failure });
        }
      }

      // Remove from queue if all failures recovered
      if (unrecoveredFailures.every(f => f.recovered)) {
        this.recoveryQueue.delete(neuronId);
        return true;
      }

      return recoverySuccess;

    } catch (error) {
      console.error(`❌ Recovery failed for ${neuronId}:`, error);
      return false;
    }
  }

  private async recoverOfflineNeuron(neuronId: string): Promise<boolean> {
    // Attempt to ping neuron via WebSocket
    if (this.webSocketManager) {
      try {
        const pingSuccess = await this.webSocketManager.pingNeuron(neuronId);
        if (pingSuccess) {
          console.log(`🟢 ${neuronId} is back online`);
          return true;
        }
      } catch (error) {
        console.log(`🔄 Ping failed for ${neuronId}, will retry later`);
      }
    }
    
    return false;
  }

  private async recoverConfigFailure(neuronId: string): Promise<boolean> {
    try {
      // Attempt to push last known good configuration
      const configs = await this.storage.getNeuronConfigs(neuronId);
      const lastGoodConfig = configs.find(c => c.deploymentStatus === 'success');
      
      if (lastGoodConfig && this.webSocketManager) {
        const rollbackSuccess = await this.webSocketManager.pushConfigToNeuron(
          neuronId,
          lastGoodConfig.configData,
          'auto-recovery-system'
        );
        
        if (rollbackSuccess) {
          console.log(`🔄 Rolled back ${neuronId} to last good config`);
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Config recovery failed for ${neuronId}:`, error);
    }
    
    return false;
  }

  private async recoverAnalyticsFailure(neuronId: string): Promise<boolean> {
    // Reset error count and attempt analytics ping
    const healthStatus = this.healthChecks.get(neuronId);
    if (healthStatus) {
      healthStatus.errorCount = 0;
      this.healthChecks.set(neuronId, healthStatus);
      return true;
    }
    return false;
  }

  private async recoverHealthIssues(neuronId: string): Promise<boolean> {
    // Send health optimization suggestions
    if (this.webSocketManager) {
      try {
        await this.webSocketManager.sendHealthOptimizationSuggestions(neuronId);
        return true;
      } catch (error) {
        console.error(`❌ Health recovery failed for ${neuronId}:`, error);
      }
    }
    return false;
  }

  private async recoverTimeoutIssues(neuronId: string): Promise<boolean> {
    // Adjust timeout thresholds temporarily for this neuron
    const healthStatus = this.healthChecks.get(neuronId);
    if (healthStatus && healthStatus.responseTime < this.RESPONSE_TIMEOUT * 2) {
      // Consider recovered if response time is improving
      return true;
    }
    return false;
  }

  async updateNeuronHealthInDB(neuronId: string, health: NeuronHealthStatus): Promise<void> {
    try {
      await this.storage.updateNeuronHealth(neuronId, {
        healthScore: health.healthScore,
        status: health.status === 'offline' ? 'inactive' : 'active',
        lastCheckIn: health.lastSeen,
        responseTime: health.responseTime
      });
    } catch (error) {
      console.error(`❌ Failed to update health in DB for ${neuronId}:`, error);
    }
  }

  private async storeFederationEvent(neuronId: string, action: string, metadata: any): Promise<void> {
    try {
      await this.storage.createFederationEvent({
        neuronId,
        eventType: action,
        eventData: metadata,
        triggeredBy: 'failure-detection-system',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Failed to store federation event:', error);
    }
  }

  // Public API methods
  getNeuronHealth(neuronId: string): NeuronHealthStatus | null {
    return this.healthChecks.get(neuronId) || null;
  }

  getAllNeuronHealth(): NeuronHealthStatus[] {
    return Array.from(this.healthChecks.values());
  }

  getNeuronFailures(neuronId: string): FailureEvent[] {
    return this.failures.get(neuronId) || [];
  }

  getAllFailures(): Map<string, FailureEvent[]> {
    return new Map(this.failures);
  }

  getSystemHealthSummary(): {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    offline: number;
    failures: number;
    recovering: number;
  } {
    const health = this.getAllNeuronHealth();
    const summary = {
      total: health.length,
      healthy: health.filter(h => h.status === 'healthy').length,
      warning: health.filter(h => h.status === 'warning').length,
      critical: health.filter(h => h.status === 'critical').length,
      offline: health.filter(h => h.status === 'offline').length,
      failures: Array.from(this.failures.values()).reduce((sum, failures) => 
        sum + failures.filter(f => !f.recovered).length, 0),
      recovering: this.recoveryQueue.size
    };

    return summary;
  }

  async forceRecovery(neuronId: string): Promise<boolean> {
    console.log(`🚨 Force recovery initiated for ${neuronId}`);
    this.recoveryQueue.add(neuronId);
    return await this.attemptRecovery(neuronId);
  }

  clearFailures(neuronId: string): void {
    this.failures.delete(neuronId);
    this.recoveryQueue.delete(neuronId);
    console.log(`🧹 Cleared failures for ${neuronId}`);
  }

  shutdown(): void {
    this.stopMonitoring();
    this.healthChecks.clear();
    this.failures.clear();
    this.recoveryQueue.clear();
    console.log('✅ Failure detection system shutdown complete');
  }
}

export default FailureDetectionSystem;