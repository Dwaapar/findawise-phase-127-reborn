/**
 * PWA Manager - Empire-Grade Progressive Web App Management
 * Handles installation, notifications, offline functionality, and native features
 */

export interface PWAInstallPrompt {
  canInstall: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  showPrompt: () => Promise<boolean>;
  dismiss: () => void;
}

export interface PWANotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string; icon?: string }[];
  data?: any;
}

export interface PWAStats {
  isInstalled: boolean;
  isStandalone: boolean;
  isOffline: boolean;
  cacheStatus: {
    version: string;
    cachedUrls: number;
    lastUpdated: number;
  };
  features: {
    notifications: boolean;
    backgroundSync: boolean;
    offlineSupport: boolean;
    installable: boolean;
  };
}

class PWAManager {
  private installPrompt: any = null;
  private isInstalled = false;
  private pushSubscription: PushSubscription | null = null;
  private serviceWorker: ServiceWorker | null = null;
  private notificationPermission: NotificationPermission = 'default';
  
  // Event listeners
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Detect if running as PWA
      this.detectInstallationStatus();
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup install prompt handling
      this.setupInstallPrompt();
      
      // Initialize notification system
      await this.initializeNotifications();
      
      // Setup offline detection
      this.setupOfflineDetection();
      
      // Start background sync monitoring
      this.startBackgroundSync();
      
      console.log('🚀 PWA Manager initialized successfully');
      this.emit('initialized', { isInstalled: this.isInstalled });
    } catch (error) {
      console.error('❌ PWA Manager initialization failed:', error);
    }
  }

  private detectInstallationStatus(): void {
    // Check if running in standalone mode
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true ||
                     document.referrer.includes('android-app://');
    
    console.log('📱 PWA Installation Status:', this.isInstalled ? 'Installed' : 'Browser');
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.emit('updateAvailable', { registration });
            }
          });
        }
      });

      // Get active service worker
      if (registration.active) {
        this.serviceWorker = registration.active;
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event;
      this.emit('installPromptReady', { canInstall: true });
      console.log('📱 Install prompt ready');
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      this.emit('installed', { timestamp: Date.now() });
      this.trackInstallation();
      console.log('✅ PWA installed successfully');
    });
  }

  private async initializeNotifications(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported');
      return;
    }

    this.notificationPermission = Notification.permission;
    
    // Setup push subscription if permission granted
    if (this.notificationPermission === 'granted') {
      await this.setupPushSubscription();
    }
  }

  private setupOfflineDetection(): void {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      this.emit('networkStatusChanged', { isOnline });
      
      if (isOnline) {
        console.log('🌐 Connection restored');
        this.syncOfflineData();
      } else {
        console.log('📱 Working offline');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  private startBackgroundSync(): void {
    // Monitor for background sync events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if ('sync' in registration) {
          console.log('🔄 Background sync available');
        }
      });
    }
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'SW_ACTIVATED':
        console.log('✅ Service Worker activated:', data.version);
        this.emit('serviceWorkerActivated', data);
        break;
      case 'CACHE_STATUS':
        this.emit('cacheStatusUpdated', data.payload);
        break;
      case 'SYNC_COMPLETE':
        this.emit('syncComplete', data.payload);
        break;
      default:
        console.log('📨 SW Message:', data);
    }
  }

  // Public API Methods

  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      const result = await this.installPrompt.prompt();
      const accepted = result.outcome === 'accepted';
      
      if (accepted) {
        this.installPrompt = null;
      }
      
      return accepted;
    } catch (error) {
      console.error('❌ Install prompt failed:', error);
      return false;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.notificationPermission = permission;
    
    if (permission === 'granted') {
      await this.setupPushSubscription();
    }
    
    this.emit('notificationPermissionChanged', { permission });
    return permission;
  }

  async showNotification(options: PWANotificationOptions): Promise<void> {
    if (this.notificationPermission !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        tag: options.tag || 'empire-notification',
        requireInteraction: options.requireInteraction || false,
        // actions: options.actions || [], // Commented out due to TypeScript compatibility
        data: options.data
      });
    } else {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png'
      });
    }
  }

  async setupPushSubscription(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('⚠️ Push messaging not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription
      this.pushSubscription = await registration.pushManager.getSubscription();
      
      if (!this.pushSubscription) {
        // Subscribe to push notifications
        const vapidPublicKey = await this.getVapidPublicKey();
        
        this.pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
        
        // Send subscription to server
        await this.sendSubscriptionToServer(this.pushSubscription);
      }
      
      console.log('📬 Push subscription ready');
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
    }
  }

  async cacheContent(content: any): Promise<void> {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'CACHE_CONTENT',
        payload: content
      });
    }
  }

  async storeOfflineData(data: any): Promise<void> {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'STORE_OFFLINE_DATA',
        payload: data
      });
    }
  }

  async getCacheStatus(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.serviceWorker) {
        resolve(null);
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATUS') {
          resolve(event.data.payload);
        }
      };

      this.serviceWorker.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [channel.port2]
      );
    });
  }

  async syncOfflineData(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if ('sync' in registration) {
        try {
          await (registration as any).sync.register('background-sync');
          console.log('🔄 Background sync registered');
        } catch (error) {
          console.error('❌ Background sync failed:', error);
        }
      }
    }
  }

  async updateServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    }
  }

  getInstallPrompt(): PWAInstallPrompt {
    const platform = this.detectPlatform();
    
    return {
      canInstall: !!this.installPrompt,
      platform,
      showPrompt: () => this.showInstallPrompt(),
      dismiss: () => {
        this.installPrompt = null;
        this.emit('installPromptDismissed', { platform });
      }
    };
  }

  getStats(): PWAStats {
    return {
      isInstalled: this.isInstalled,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isOffline: !navigator.onLine,
      cacheStatus: {
        version: '2.0.0',
        cachedUrls: 0,
        lastUpdated: Date.now()
      },
      features: {
        notifications: 'Notification' in window,
        backgroundSync: 'serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype,
        offlineSupport: 'serviceWorker' in navigator,
        installable: !!this.installPrompt
      }
    };
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Utility methods
  private detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  private async getVapidPublicKey(): Promise<string> {
    try {
      const response = await fetch('/api/pwa/vapid-key');
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('❌ Failed to get VAPID key:', error);
      return '';
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/pwa/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          topics: ['general', 'offers', 'security']
        })
      });
      console.log('✅ Push subscription sent to server');
    } catch (error) {
      console.error('❌ Failed to send subscription to server:', error);
    }
  }

  private async trackInstallation(): Promise<void> {
    try {
      await fetch('/api/pwa/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: this.detectPlatform(),
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('❌ Failed to track installation:', error);
    }
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).pwaManager = pwaManager;
}