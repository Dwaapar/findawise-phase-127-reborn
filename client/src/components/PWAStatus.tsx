import React, { useState, useEffect } from 'react';
import { pwaManager, PWAStats } from '../lib/pwa/PWAManager';

interface PWAStatusProps {
  className?: string;
  showDetails?: boolean;
}

const PWAStatus: React.FC<PWAStatusProps> = ({ className = '', showDetails = false }) => {
  const [stats, setStats] = useState<PWAStats | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Get initial stats
    setStats(pwaManager.getStats());

    // Listen for network changes
    const handleNetworkChange = (data: { isOnline: boolean }) => {
      setIsOnline(data.isOnline);
    };

    // Listen for updates
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    // Listen for service worker activation
    const handleServiceWorkerActivated = () => {
      setStats(pwaManager.getStats());
      setUpdateAvailable(false);
    };

    pwaManager.on('networkStatusChanged', handleNetworkChange);
    pwaManager.on('updateAvailable', handleUpdateAvailable);
    pwaManager.on('serviceWorkerActivated', handleServiceWorkerActivated);

    // Update stats periodically
    const interval = setInterval(() => {
      setStats(pwaManager.getStats());
    }, 30000);

    return () => {
      pwaManager.off('networkStatusChanged', handleNetworkChange);
      pwaManager.off('updateAvailable', handleUpdateAvailable);
      pwaManager.off('serviceWorkerActivated', handleServiceWorkerActivated);
      clearInterval(interval);
    };
  }, []);

  const handleUpdate = async () => {
    await pwaManager.updateServiceWorker();
    window.location.reload();
  };

  if (!stats) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <span className="text-xl">📱</span>
            <span>App Status</span>
          </h3>
          <div className="flex items-center space-x-2">
            {/* Installation Status */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              stats.isInstalled 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {stats.isInstalled ? 'Installed' : 'Browser'}
            </div>
            
            {/* Network Status */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
              isOnline 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Update Available Banner */}
        {updateAvailable && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 dark:text-blue-400">🔄</span>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  App update available
                </span>
              </div>
              <button
                onClick={handleUpdate}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {/* Main Status Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl ${stats.isStandalone ? 'text-green-500' : 'text-gray-400'}`}>
              📱
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stats.isStandalone ? 'Standalone' : 'Browser Tab'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl ${stats.features.notifications ? 'text-blue-500' : 'text-gray-400'}`}>
              🔔
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stats.features.notifications ? 'Notifications' : 'No Notifications'}
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Features</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className={stats.features.offlineSupport ? 'text-green-500' : 'text-red-500'}>
                    {stats.features.offlineSupport ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">Offline Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={stats.features.backgroundSync ? 'text-green-500' : 'text-red-500'}>
                    {stats.features.backgroundSync ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">Background Sync</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={stats.features.installable ? 'text-green-500' : 'text-red-500'}>
                    {stats.features.installable ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">Installable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={stats.features.notifications ? 'text-green-500' : 'text-red-500'}>
                    {stats.features.notifications ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">Push Notifications</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Cache Status</h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Version: {stats.cacheStatus.version}</div>
                <div>Cached URLs: {stats.cacheStatus.cachedUrls}</div>
                <div>Last Updated: {new Date(stats.cacheStatus.lastUpdated).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Offline Mode Badge */}
        {!isOnline && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Working offline - Limited functionality
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAStatus;