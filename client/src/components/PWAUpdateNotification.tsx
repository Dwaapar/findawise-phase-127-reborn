import React, { useState, useEffect } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

interface PWAUpdateNotificationProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  onUpdate,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    version?: string;
    features?: string[];
    critical?: boolean;
  }>({});

  useEffect(() => {
    const handleUpdateAvailable = (event: CustomEvent) => {
      setUpdateInfo(event.detail || {});
      setIsVisible(true);
    };

    // Listen for update events from service worker
    document.addEventListener('pwa-update-available', handleUpdateAvailable as EventListener);

    // Check for existing updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          setIsVisible(true);
        }
      });
    }

    return () => {
      document.removeEventListener('pwa-update-available', handleUpdateAvailable as EventListener);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Wait for the new service worker to take control
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    if (!updateInfo.critical) {
      setIsVisible(false);
      onDismiss?.();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${
        updateInfo.critical ? 'border-red-500' : 'border-blue-500'
      } overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${
              updateInfo.critical ? 'text-red-500' : 'text-blue-500'
            }`}>
              {updateInfo.critical ? (
                <AlertCircle className="h-6 w-6" />
              ) : (
                <RefreshCw className="h-6 w-6" />
              )}
            </div>
            
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {updateInfo.critical ? 'Critical Update Available' : 'Update Available'}
                </h3>
                {!updateInfo.critical && (
                  <button
                    onClick={handleDismiss}
                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="mt-1">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {updateInfo.critical 
                    ? 'A critical security update is available and must be installed.'
                    : 'A new version of the app is available with improvements and new features.'
                  }
                </p>
                
                {updateInfo.version && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Version {updateInfo.version}
                  </p>
                )}
                
                {updateInfo.features && updateInfo.features.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      What's New:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      {updateInfo.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {feature}
                        </li>
                      ))}
                      {updateInfo.features.length > 3 && (
                        <li className="text-gray-500">
                          +{updateInfo.features.length - 3} more improvements
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                    updateInfo.critical 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isUpdating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Updating...
                    </div>
                  ) : (
                    updateInfo.critical ? 'Install Now' : 'Update Now'
                  )}
                </button>
                
                {!updateInfo.critical && (
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Later
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PWAOfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineFeatures, setShowOfflineFeatures] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="bg-yellow-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                You're offline - Limited functionality available
              </span>
            </div>
            
            <button
              onClick={() => setShowOfflineFeatures(!showOfflineFeatures)}
              className="text-xs hover:underline"
            >
              What works offline?
            </button>
          </div>
          
          {showOfflineFeatures && (
            <div className="mt-2 pt-2 border-t border-yellow-500">
              <div className="text-xs space-y-1">
                <p>✓ Browse cached content and tools</p>
                <p>✓ Take quizzes (results saved for sync)</p>
                <p>✓ View saved AI insights</p>
                <p>✓ Access offline calculator tools</p>
                <p className="text-yellow-200 mt-2">
                  Your actions will sync automatically when you're back online.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};