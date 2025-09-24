/**
 * Findawise Empire - PWA Manager
 * Enterprise-grade PWA management with AI-driven install prompts and federation integration
 */

interface PWAInstallData {
  userId?: string;
  sessionId: string;
  timestamp: number;
  source: 'manual' | 'auto' | 'quiz_complete' | 'ai_engagement' | 'offer_interest';
  userProfile?: any;
  conversionContext?: string;
}

interface NotificationPermissionData {
  permission: NotificationPermission;
  timestamp: number;
  source: 'onboarding' | 'feature_usage' | 'high_engagement' | 'manual';
  topics: string[];
}

interface PWAConfig {
  installPromptDelay: number;
  minEngagementScore: number;
  autoPromptEnabled: boolean;
  notificationTopics: string[];
  offlineContentPaths: string[];
  cacheStrategy: 'aggressive' | 'conservative' | 'intelligent';
}

export class PWAManager {
  private installPrompt: any = null;
  private serviceWorker: ServiceWorker | null = null;
  private config: PWAConfig;
  private engagementScore: number = 0;
  private installAttempts: number = 0;
  private isInstalled: boolean = false;

  constructor(config?: Partial<PWAConfig>) {
    this.config = {
      installPromptDelay: 2000, // 2 seconds after engagement threshold
      minEngagementScore: 30,
      autoPromptEnabled: true,
      notificationTopics: ['offers', 'ai_insights', 'new_content', 'personalized_alerts'],
      offlineContentPaths: ['/', '/quiz', '/tools', '/offers', '/intelligence'],
      cacheStrategy: 'intelligent',
      ...config
    };

    this.init();
  }

  private async init(): Promise<void> {
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.trackEngagement();
    this.checkInstallStatus();
    this.setupPeriodicSync();
  }

  /**
   * Register service worker with error handling and updates
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('[PWA] Service worker registered:', registration.scope);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          }
        });

        // Get active service worker
        if (registration.active) {
          this.serviceWorker = registration.active;
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    }
  }

  /**
   * Setup install prompt handling with intelligent timing
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      console.log('[PWA] Install prompt captured');

      // Track install prompt availability
      this.trackEvent('install_prompt_available', {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });

      // Auto-prompt based on engagement if enabled
      if (this.config.autoPromptEnabled && this.shouldShowInstallPrompt()) {
        setTimeout(() => {
          this.showInstallPrompt('auto');
        }, this.config.installPromptDelay);
      }
    });

    // Track successful install
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.trackEvent('app_installed', {
        method: 'browser_prompt',
        attempts: this.installAttempts,
        timestamp: Date.now()
      });
      console.log('[PWA] App installed successfully');
    });
  }

  /**
   * Track user engagement for intelligent install prompting
   */
  private trackEngagement(): void {
    // Page interactions
    const interactions = ['click', 'scroll', 'keydown', 'touchstart'];
    interactions.forEach(event => {
      document.addEventListener(event, () => {
        this.engagementScore += 1;
      }, { passive: true });
    });

    // Quiz completion
    document.addEventListener('quiz_completed', () => {
      this.engagementScore += 15;
      this.checkInstallPromptTrigger('quiz_complete');
    });

    // AI interactions
    document.addEventListener('ai_interaction', () => {
      this.engagementScore += 10;
      this.checkInstallPromptTrigger('ai_engagement');
    });

    // Offer interest
    document.addEventListener('offer_clicked', () => {
      this.engagementScore += 8;
      this.checkInstallPromptTrigger('offer_interest');
    });

    // Time-based engagement
    setInterval(() => {
      this.engagementScore += 2; // Passive engagement over time
    }, 30000); // Every 30 seconds
  }

  /**
   * Check if install prompt should be triggered
   */
  private checkInstallPromptTrigger(source: string): void {
    if (this.shouldShowInstallPrompt() && this.installPrompt && !this.isInstalled) {
      this.showInstallPrompt(source as any);
    }
  }

  /**
   * Determine if install prompt should be shown
   */
  private shouldShowInstallPrompt(): boolean {
    return (
      this.engagementScore >= this.config.minEngagementScore &&
      this.installAttempts < 3 &&
      !this.isInstalled &&
      !this.wasPromptDismissedRecently()
    );
  }

  /**
   * Check if prompt was recently dismissed
   */
  private wasPromptDismissedRecently(): boolean {
    const lastDismissal = localStorage.getItem('pwa_prompt_dismissed');
    if (!lastDismissal) return false;

    const dismissedAt = parseInt(lastDismissal);
    const daysSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSinceDismissal < 7; // Don't prompt again for 7 days
  }

  /**
   * Show install prompt with custom UI
   */
  public async showInstallPrompt(source: PWAInstallData['source'] = 'manual'): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    this.installAttempts++;

    try {
      // Show custom install UI first
      const userChoice = await this.showCustomInstallDialog(source);
      
      if (userChoice) {
        const result = await this.installPrompt.prompt();
        const outcome = await result.userChoice;

        this.trackEvent('install_prompt_shown', {
          source,
          outcome: outcome.outcome,
          engagementScore: this.engagementScore,
          attempts: this.installAttempts
        });

        if (outcome.outcome === 'accepted') {
          console.log('[PWA] User accepted install prompt');
          return true;
        } else {
          console.log('[PWA] User dismissed install prompt');
          localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
          return false;
        }
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }

    return false;
  }

  /**
   * Show custom install dialog with benefits
   */
  private async showCustomInstallDialog(source: PWAInstallData['source']): Promise<boolean> {
    return new Promise((resolve) => {
      // Create custom dialog
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      dialog.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Install Findawise Empire</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">Get the full AI-powered experience</p>
            </div>
          </div>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-sm text-gray-700 dark:text-gray-200">Offline access to AI tools & quizzes</span>
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-sm text-gray-700 dark:text-gray-200">Instant push notifications for deals</span>
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-sm text-gray-700 dark:text-gray-200">Faster performance & app-like experience</span>
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-sm text-gray-700 dark:text-gray-200">Personalized AI insights & recommendations</span>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button id="install-btn" class="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors">
              Install App
            </button>
            <button id="dismiss-btn" class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
              Maybe Later
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      // Handle button clicks
      const installBtn = dialog.querySelector('#install-btn');
      const dismissBtn = dialog.querySelector('#dismiss-btn');

      installBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(true);
      });

      dismissBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
        resolve(false);
      });

      // Close on backdrop click
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog);
          resolve(false);
        }
      });
    });
  }

  /**
   * Check if app is already installed
   */
  private checkInstallStatus(): void {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] App is running in standalone mode');
    }

    // Check for iOS Safari standalone
    if ((window.navigator as any).standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] App is running in iOS standalone mode');
    }
  }

  /**
   * Request notification permissions with intelligent timing
   */
  public async requestNotificationPermission(source: string = 'manual'): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      
      this.trackEvent('notification_permission_requested', {
        source,
        permission,
        timestamp: Date.now()
      });

      if (permission === 'granted') {
        await this.subscribeToNotifications();
      }

      return permission;
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToNotifications(): Promise<void> {
    if (!this.serviceWorker) {
      console.log('[PWA] Service worker not available for notifications');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await this.getVAPIDKey()
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          topics: this.config.notificationTopics
        })
      });

      console.log('[PWA] Push notification subscription successful');
    } catch (error) {
      console.error('[PWA] Push notification subscription failed:', error);
    }
  }

  /**
   * Get VAPID key for push notifications
   */
  private async getVAPIDKey(): Promise<string> {
    try {
      const response = await fetch('/api/notifications/vapid-key');
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('[PWA] Failed to get VAPID key:', error);
      // Fallback to environment variable or default
      return 'BDd0_tgJPjlpgYhPRSMQB0QFj-W_FO_YXHjI8RqF4lX2vC8qGlJbN3VZtKwXEYHjYxVrNBqGNWxkVhW3QdJ8uY4';
    }
  }

  /**
   * Setup periodic background sync
   */
  private setupPeriodicSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register periodic sync for data updates
        if ('periodicSync' in registration) {
          (registration as any).periodicSync.register('federation-sync', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          }).catch(console.error);
        }
      });
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        this.showCacheUpdateNotification();
        break;
      case 'OFFLINE_READY':
        this.showOfflineReadyNotification();
        break;
      case 'NEW_VERSION_AVAILABLE':
        this.showUpdateAvailable();
        break;
    }
  }

  /**
   * Show cache update notification
   */
  private showCacheUpdateNotification(): void {
    this.showToast('Content updated and ready for offline use', 'success');
  }

  /**
   * Show offline ready notification
   */
  private showOfflineReadyNotification(): void {
    this.showToast('App is ready to work offline', 'info');
  }

  /**
   * Show update available notification
   */
  private showUpdateAvailable(): void {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Update Available</p>
          <p class="text-sm opacity-90">A new version is ready to install</p>
        </div>
        <button id="update-btn" class="ml-3 bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    notification.querySelector('#update-btn')?.addEventListener('click', () => {
      this.updateServiceWorker();
      document.body.removeChild(notification);
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 10000);
  }

  /**
   * Update service worker
   */
  private updateServiceWorker(): void {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      info: 'bg-blue-600'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-4 ${colors[type]} text-white p-3 rounded-lg shadow-lg z-50 transform transition-transform translate-y-full`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-full');
    });

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-y-full');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Track PWA events for analytics
   */
  private trackEvent(eventType: string, data: any): void {
    // Send to analytics service
    if (window.analyticsSync) {
      (window as any).analyticsSync.track(eventType, {
        category: 'pwa',
        ...data
      });
    }
  }

  /**
   * Get PWA status and metrics
   */
  public getStatus(): any {
    return {
      isInstalled: this.isInstalled,
      engagementScore: this.engagementScore,
      installAttempts: this.installAttempts,
      notificationPermission: Notification.permission,
      serviceWorkerReady: !!this.serviceWorker,
      installPromptAvailable: !!this.installPrompt
    };
  }

  /**
   * Force install prompt (for testing/admin)
   */
  public forceInstallPrompt(): Promise<boolean> {
    return this.showInstallPrompt('manual');
  }

  /**
   * Clear PWA data and caches
   */
  public async clearData(): Promise<void> {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'CLEAR_CACHE' });
    }

    // Clear localStorage PWA data
    const pwaKeys = Object.keys(localStorage).filter(key => key.startsWith('pwa_'));
    pwaKeys.forEach(key => localStorage.removeItem(key));

    console.log('[PWA] All PWA data cleared');
  }
}

// Global PWA manager instance
export const pwaManager = new PWAManager();