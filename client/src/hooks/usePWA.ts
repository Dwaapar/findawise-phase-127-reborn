import { useState, useEffect } from 'react';
import { pwaManager } from '../services/pwaManager';

interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  installPromptAvailable: boolean;
  notificationPermission: NotificationPermission;
  engagementScore: number;
  canInstall: boolean;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: navigator.onLine,
    installPromptAvailable: false,
    notificationPermission: 'default',
    engagementScore: 0,
    canInstall: false
  });

  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Initial status check
    updateStatus();

    // Setup event listeners
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();
    const handlePWAUpdate = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('pwa-update-available', handlePWAUpdate);
    document.addEventListener('pwa-installed', handlePWAUpdate);
    
    // Check status periodically
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('pwa-update-available', handlePWAUpdate);
      document.removeEventListener('pwa-installed', handlePWAUpdate);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = () => {
    const pwaStatus = pwaManager.getStatus();
    setStatus({
      isInstalled: pwaStatus.isInstalled,
      isOnline: navigator.onLine,
      installPromptAvailable: pwaStatus.installPromptAvailable,
      notificationPermission: 'Notification' in window ? Notification.permission : 'denied',
      engagementScore: pwaStatus.engagementScore,
      canInstall: pwaStatus.installPromptAvailable && !pwaStatus.isInstalled
    });
  };

  const install = async (): Promise<boolean> => {
    if (!status.canInstall || isInstalling) {
      return false;
    }

    setIsInstalling(true);
    try {
      const result = await pwaManager.forceInstallPrompt();
      updateStatus();
      return result;
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    const permission = await pwaManager.requestNotificationPermission('manual');
    updateStatus();
    return permission;
  };

  const clearCache = async (): Promise<void> => {
    await pwaManager.clearData();
    updateStatus();
  };

  return {
    status,
    isInstalling,
    install,
    requestNotificationPermission,
    clearCache,
    updateStatus
  };
}

export default usePWA;