import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface PWAOfflineIndicatorProps {
  className?: string;
}

export const PWAOfflineIndicator: React.FC<PWAOfflineIndicatorProps> = ({
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show notice if we start offline
    if (!navigator.onLine) {
      setShowOfflineNotice(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineNotice) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may be limited.</span>
        <AlertCircle className="h-4 w-4" />
      </div>
    </div>
  );
};

export default PWAOfflineIndicator;