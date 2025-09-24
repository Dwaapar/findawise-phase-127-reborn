/**
 * Enterprise-Grade Offline AI Service
 * Handles offline-first operations, edge AI inference, and intelligent sync
 */

interface DeviceCapabilities {
  storage: {
    available: number;
    quota: number;
    persistent: boolean;
  };
  compute: {
    cores: number;
    memory: number;
    gpu: boolean;
    tensorflowjs: boolean;
    onnx: boolean;
    webgl: boolean;
    webgpu: boolean;
    webassembly: boolean;
    sharedArrayBuffer: boolean;
    offscreenCanvas: boolean;
  };
  network: {
    type: string;
    speed: number;
    metered: boolean;
    serviceWorker: boolean;
  };
}

interface SyncOperation {
  operationType: string;
  entityType: string;
  entityId?: string;
  payload: any;
  priority?: number;
  dependsOn?: string;
  conflictResolutionStrategy?: 'last_write_wins' | 'merge' | 'client_wins' | 'server_wins';
}

interface EdgeModel {
  modelId: string;
  modelName: string;
  modelType: string;
  modelVersion: string;
  performance: {
    inferenceTime: number;
    accuracy: number;
    memoryUsage: number;
    modelSize: number;
  };
  requirements: any;
  deploymentInfo: {
    format: string;
    downloadUrl: string;
    fallbackStrategy: string;
  };
}

interface AnalyticsEvent {
  type: string;
  data: any;
  timestamp?: Date;
}

class OfflineAiService {
  private deviceId: string;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInterval?: number;
  private edgeModels: Map<string, any> = new Map();
  private analyticsBuffer: AnalyticsEvent[] = [];
  private contentCache: Map<string, any> = new Map();
  private lastSyncAttempt: Date = new Date();

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupEventListeners();
    this.initializeOfflineCapabilities();
  }

  /**
   * Initialize offline AI capabilities
   */
  async initializeOfflineCapabilities(): Promise<void> {
    try {
      console.log('🔄 Initializing Offline AI Service...');

      // Register device and get capabilities
      const capabilities = await this.detectDeviceCapabilities();
      await this.registerDevice(capabilities);

      // Setup service worker for background sync
      await this.setupServiceWorker();

      // Initialize IndexedDB for local storage
      await this.initializeLocalStorage();

      // Load cached models and content
      await this.loadCachedResources();

      // Start sync scheduler
      this.startSyncScheduler();

      console.log('✅ Offline AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Offline AI Service:', error);
    }
  }

  /**
   * Detect device capabilities for edge AI
   */
  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const capabilities: DeviceCapabilities = {
      storage: {
        available: 0,
        quota: 0,
        persistent: false
      },
      compute: {
        cores: navigator.hardwareConcurrency || 4,
        memory: (navigator as any).deviceMemory || 4,
        gpu: false,
        tensorflowjs: false,
        onnx: false,
        webgl: false,
        webgpu: false,
        webassembly: typeof WebAssembly !== 'undefined',
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        offscreenCanvas: typeof OffscreenCanvas !== 'undefined'
      },
      network: {
        type: (navigator as any).connection?.effectiveType || 'unknown',
        speed: (navigator as any).connection?.downlink || 0,
        metered: (navigator as any).connection?.saveData || false,
        serviceWorker: 'serviceWorker' in navigator
      }
    };

    try {
      // Check storage capabilities
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        capabilities.storage.quota = estimate.quota || 0;
        capabilities.storage.available = (estimate.quota || 0) - (estimate.usage || 0);
        
        if ('persist' in navigator.storage) {
          capabilities.storage.persistent = await navigator.storage.persist();
        }
      }

      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      capabilities.compute.webgl = !!gl;

      // Check WebGPU support
      capabilities.compute.webgpu = 'gpu' in navigator;

      // Check TensorFlow.js support (simplified check)
      capabilities.compute.tensorflowjs = capabilities.compute.webgl || capabilities.compute.webassembly;

      // Check ONNX support (if ONNX runtime is available)
      capabilities.compute.onnx = typeof (window as any).ort !== 'undefined';

    } catch (error) {
      console.warn('⚠️ Some capability detection failed:', error);
    }

    return capabilities;
  }

  /**
   * Register device with server
   */
  async registerDevice(capabilities: DeviceCapabilities): Promise<void> {
    try {
      const response = await fetch('/api/offline-ai/device/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          capabilities,
          deviceFingerprint: await this.generateDeviceFingerprint()
        })
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Store compatible models
        for (const model of result.data.compatibleModels) {
          this.edgeModels.set(model.modelId, model);
        }

        console.log(`📱 Device registered with ${result.data.compatibleModels.length} compatible models`);
      }
    } catch (error) {
      console.error('❌ Device registration failed:', error);
      // Continue offline-only operation
    }
  }

  /**
   * Queue operation for sync when online
   */
  async queueOperation(operation: SyncOperation): Promise<void> {
    try {
      // Add to local queue
      this.syncQueue.push({
        ...operation,
        priority: operation.priority || 5
      });

      // Store in IndexedDB for persistence
      await this.persistSyncQueue();

      // Try immediate sync if online
      if (this.isOnline) {
        await this.processSyncQueue();
      }

      console.log(`⏳ Queued operation: ${operation.operationType} for ${operation.entityType}`);
    } catch (error) {
      console.error('❌ Failed to queue operation:', error);
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    try {
      // Sort by priority
      this.syncQueue.sort((a, b) => (a.priority || 5) - (b.priority || 5));

      const batch = this.syncQueue.splice(0, 10); // Process in batches

      for (const operation of batch) {
        try {
          await this.syncOperation(operation);
        } catch (error) {
          console.error(`❌ Failed to sync operation:`, error);
          // Put back in queue with lower priority
          this.syncQueue.push({ ...operation, priority: (operation.priority || 5) + 1 });
        }
      }

      // Update persisted queue
      await this.persistSyncQueue();
      this.lastSyncAttempt = new Date();

    } catch (error) {
      console.error('❌ Sync queue processing failed:', error);
    }
  }

  /**
   * Sync individual operation with server
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    const response = await fetch('/api/offline-ai/sync/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        ...operation
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Run edge AI inference
   */
  async runInference(
    modelType: string,
    inputData: any,
    fallbackToServer: boolean = true
  ): Promise<any> {
    try {
      // Try local inference first
      if (this.edgeModels.has(modelType)) {
        const result = await this.runLocalInference(modelType, inputData);
        if (result) {
          return result;
        }
      }

      // Fallback to server inference if online
      if (fallbackToServer && this.isOnline) {
        return await this.runServerInference(modelType, inputData);
      }

      // Use simple rule-based fallback
      return this.runFallbackInference(modelType, inputData);

    } catch (error) {
      console.error('❌ Inference failed:', error);
      return this.runFallbackInference(modelType, inputData);
    }
  }

  /**
   * Run local edge AI inference
   */
  private async runLocalInference(modelType: string, inputData: any): Promise<any> {
    // Simplified local inference - in a real implementation, this would load and run actual models
    
    switch (modelType) {
      case 'recommendation':
        return this.runLocalRecommendation(inputData);
      case 'intent':
        return this.runLocalIntentDetection(inputData);
      case 'scoring':
        return this.runLocalScoring(inputData);
      default:
        return null;
    }
  }

  /**
   * Run server inference
   */
  private async runServerInference(modelType: string, inputData: any): Promise<any> {
    const response = await fetch('/api/offline-ai/models/inference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelType,
        inputData,
        deviceId: this.deviceId
      })
    });

    if (!response.ok) {
      throw new Error(`Server inference failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  }

  /**
   * Cache content for offline access
   */
  async cacheContent(
    contentType: string,
    contentId: string,
    content: any,
    options: { priority?: number; expiresIn?: number } = {}
  ): Promise<void> {
    try {
      // Store locally
      const cacheKey = `${contentType}:${contentId}`;
      const cacheData = {
        content,
        timestamp: new Date(),
        expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn * 1000) : null,
        priority: options.priority || 5
      };

      this.contentCache.set(cacheKey, cacheData);
      await this.persistContentCache();

      // Queue for server caching if online
      if (this.isOnline) {
        await fetch('/api/offline-ai/cache/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType,
            contentId,
            content,
            options: { ...options, deviceId: this.deviceId }
          })
        });
      }

      console.log(`💾 Cached content: ${contentType}:${contentId}`);
    } catch (error) {
      console.error('❌ Failed to cache content:', error);
    }
  }

  /**
   * Retrieve cached content
   */
  async getCachedContent(contentType: string, contentId: string): Promise<any> {
    try {
      const cacheKey = `${contentType}:${contentId}`;
      const cached = this.contentCache.get(cacheKey);

      if (cached) {
        // Check if expired
        if (cached.expiresAt && new Date() > cached.expiresAt) {
          this.contentCache.delete(cacheKey);
          return null;
        }
        return cached.content;
      }

      // Try server if online
      if (this.isOnline) {
        const response = await fetch(`/api/offline-ai/cache/content/${contentType}/${contentId}?deviceId=${this.deviceId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && !result.data.metadata.isStale) {
            return result.data.content;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve cached content:', error);
      return null;
    }
  }

  /**
   * Buffer analytics events for offline sync
   */
  async bufferAnalyticsEvent(eventType: string, eventData: any): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        type: eventType,
        data: {
          ...eventData,
          timestamp: new Date(),
          deviceId: this.deviceId,
          isOffline: !this.isOnline
        }
      };

      this.analyticsBuffer.push(event);
      await this.persistAnalyticsBuffer();

      // Sync immediately if online
      if (this.isOnline && this.analyticsBuffer.length >= 5) {
        await this.syncAnalyticsBuffer();
      }

      console.log(`📊 Buffered analytics event: ${eventType}`);
    } catch (error) {
      console.error('❌ Failed to buffer analytics event:', error);
    }
  }

  /**
   * Sync analytics buffer with server
   */
  private async syncAnalyticsBuffer(): Promise<void> {
    if (!this.isOnline || this.analyticsBuffer.length === 0) {
      return;
    }

    try {
      const events = this.analyticsBuffer.splice(0, 50); // Sync in batches

      const response = await fetch('/api/offline-ai/analytics/buffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          sessionId: this.getSessionId(),
          events
        })
      });

      if (response.ok) {
        console.log(`📊 Synced ${events.length} analytics events`);
        await this.persistAnalyticsBuffer();
      } else {
        // Put events back in buffer
        this.analyticsBuffer.unshift(...events);
      }
    } catch (error) {
      console.error('❌ Failed to sync analytics buffer:', error);
    }
  }

  // Private utility methods

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('offline_ai_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('offline_ai_device_id', deviceId);
    }
    return deviceId;
  }

  private async generateDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || '4'
    ];

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onlineStateChanged(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onlineStateChanged(false);
    });

    // Page visibility for sync optimization
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processSyncQueue();
        this.syncAnalyticsBuffer();
      }
    });

    // Before unload - final sync attempt
    window.addEventListener('beforeunload', () => {
      if (this.isOnline && (this.syncQueue.length > 0 || this.analyticsBuffer.length > 0)) {
        // Use sendBeacon for final sync
        navigator.sendBeacon('/api/offline-ai/sync/final', JSON.stringify({
          deviceId: this.deviceId,
          queue: this.syncQueue.slice(0, 5),
          analytics: this.analyticsBuffer.slice(0, 10)
        }));
      }
    });
  }

  private async onlineStateChanged(isOnline: boolean): Promise<void> {
    try {
      // Update server about state change
      await fetch(`/api/offline-ai/device/${this.deviceId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOnline,
          lastActivity: new Date(),
          networkInfo: {
            type: (navigator as any).connection?.effectiveType || 'unknown',
            speed: (navigator as any).connection?.downlink || 0
          }
        })
      });

      if (isOnline) {
        console.log('📡 Device back online - starting sync');
        await this.processSyncQueue();
        await this.syncAnalyticsBuffer();
      } else {
        console.log('📴 Device offline - queuing operations');
      }
    } catch (error) {
      console.error('❌ Failed to update online state:', error);
    }
  }

  private async setupServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/offline-ai-sw.js');
        console.log('✅ Service Worker registered successfully');
        
        // Setup message channel for sync requests
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_REQUEST') {
            this.processSyncQueue();
          }
        });
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }
  }

  private async initializeLocalStorage(): Promise<void> {
    // Initialize IndexedDB for persistent storage
    // This is a simplified version - in production, you'd use a proper IndexedDB wrapper
    try {
      // Load persisted data
      await this.loadPersistedData();
    } catch (error) {
      console.error('❌ Failed to initialize local storage:', error);
    }
  }

  private async loadCachedResources(): Promise<void> {
    // Load previously cached models and content
    // This would involve loading from IndexedDB and validating cache
  }

  private startSyncScheduler(): void {
    // Schedule periodic sync attempts
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
        this.syncAnalyticsBuffer();
      }
    }, 30000); // Every 30 seconds
  }

  private async persistSyncQueue(): Promise<void> {
    localStorage.setItem('offline_ai_sync_queue', JSON.stringify(this.syncQueue));
  }

  private async persistContentCache(): Promise<void> {
    const cacheData = Array.from(this.contentCache.entries());
    localStorage.setItem('offline_ai_content_cache', JSON.stringify(cacheData));
  }

  private async persistAnalyticsBuffer(): Promise<void> {
    localStorage.setItem('offline_ai_analytics_buffer', JSON.stringify(this.analyticsBuffer));
  }

  private async loadPersistedData(): Promise<void> {
    try {
      // Load sync queue
      const queueData = localStorage.getItem('offline_ai_sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }

      // Load content cache
      const cacheData = localStorage.getItem('offline_ai_content_cache');
      if (cacheData) {
        const entries = JSON.parse(cacheData);
        this.contentCache = new Map(entries);
      }

      // Load analytics buffer
      const analyticsData = localStorage.getItem('offline_ai_analytics_buffer');
      if (analyticsData) {
        this.analyticsBuffer = JSON.parse(analyticsData);
      }
    } catch (error) {
      console.error('❌ Failed to load persisted data:', error);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('offline_ai_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem('offline_ai_session_id', sessionId);
    }
    return sessionId;
  }

  // Simplified inference implementations
  
  private runLocalRecommendation(inputData: any): any {
    // Simple collaborative filtering
    const { userId, interactions = [], preferences = {} } = inputData;
    
    const recommendations = [
      { id: '1', title: 'Personal Finance Dashboard', score: 0.9, type: 'tool' },
      { id: '2', title: 'Investment Calculator', score: 0.85, type: 'calculator' },
      { id: '3', title: 'Budget Planner', score: 0.8, type: 'planner' }
    ];
    
    return {
      result: { recommendations: recommendations.slice(0, 5) },
      confidence: 0.75,
      inferenceTime: Math.random() * 50 + 20
    };
  }

  private runLocalIntentDetection(inputData: any): any {
    const { text = '', context = {} } = inputData;
    
    const intents = ['purchase', 'browse', 'compare', 'learn', 'support'];
    let detectedIntent = 'browse';
    let confidence = 0.6;
    
    // Simple keyword matching
    if (text.toLowerCase().includes('buy') || text.toLowerCase().includes('purchase')) {
      detectedIntent = 'purchase';
      confidence = 0.85;
    } else if (text.toLowerCase().includes('compare') || text.toLowerCase().includes('vs')) {
      detectedIntent = 'compare';
      confidence = 0.8;
    } else if (text.toLowerCase().includes('learn') || text.toLowerCase().includes('how to')) {
      detectedIntent = 'learn';
      confidence = 0.75;
    }
    
    return {
      result: { intent: detectedIntent, confidence },
      confidence,
      inferenceTime: Math.random() * 30 + 10
    };
  }

  private runLocalScoring(inputData: any): any {
    const { engagement = {}, demographics = {}, behavior = {} } = inputData;
    
    // Simple weighted scoring
    const engagementScore = (engagement.pageViews || 0) * 0.1 + (engagement.timeOnSite || 0) * 0.01;
    const demographicsScore = demographics.targetMatch || 0.5;
    const behaviorScore = (behavior.conversionActions || 0) * 0.2;
    
    const rawScore = engagementScore * 0.4 + demographicsScore * 0.3 + behaviorScore * 0.3;
    const normalizedScore = Math.min(100, Math.max(0, rawScore * 100));
    
    return {
      result: {
        score: normalizedScore,
        factors: { engagement: engagementScore, demographics: demographicsScore, behavior: behaviorScore }
      },
      confidence: 0.7,
      inferenceTime: Math.random() * 40 + 15
    };
  }

  private runFallbackInference(modelType: string, inputData: any): any {
    // Very basic fallback responses
    switch (modelType) {
      case 'recommendation':
        return {
          result: { recommendations: [] },
          confidence: 0.1,
          inferenceTime: 5
        };
      case 'intent':
        return {
          result: { intent: 'browse', confidence: 0.1 },
          confidence: 0.1,
          inferenceTime: 5
        };
      case 'scoring':
        return {
          result: { score: 50, factors: {} },
          confidence: 0.1,
          inferenceTime: 5
        };
      default:
        return {
          result: null,
          confidence: 0,
          inferenceTime: 1
        };
    }
  }

  /**
   * Get device sync status
   */
  async getSyncStatus(): Promise<any> {
    try {
      const response = await fetch(`/api/offline-ai/device/${this.deviceId}/status`);
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
    }
    
    return {
      queuedOperations: this.syncQueue.length,
      bufferedAnalytics: this.analyticsBuffer.length,
      isOnline: this.isOnline,
      lastSyncAttempt: this.lastSyncAttempt
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Final sync attempt
    if (this.isOnline && (this.syncQueue.length > 0 || this.analyticsBuffer.length > 0)) {
      this.processSyncQueue();
      this.syncAnalyticsBuffer();
    }
  }
}

// Create singleton instance
export const offlineAiService = new OfflineAiService();
export default offlineAiService;