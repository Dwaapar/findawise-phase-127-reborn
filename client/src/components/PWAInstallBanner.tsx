import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Zap, Bell, Wifi } from 'lucide-react';
import { pwaManager } from '../services/pwaManager';

interface PWAInstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  autoShow?: boolean;
  className?: string;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onInstall,
  onDismiss,
  autoShow = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pwaStatus, setPWAStatus] = useState<any>({});
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const checkPWAStatus = () => {
      const status = pwaManager.getStatus();
      setPWAStatus(status);

      // Show banner if conditions are met
      if (autoShow && 
          status.installPromptAvailable && 
          !status.isInstalled && 
          status.engagementScore >= 20) {
        setIsVisible(true);
      }
    };

    // Check immediately
    checkPWAStatus();

    // Listen for PWA events
    const handlePWAEvent = () => checkPWAStatus();
    document.addEventListener('quiz_completed', handlePWAEvent);
    document.addEventListener('ai_interaction', handlePWAEvent);
    document.addEventListener('offer_clicked', handlePWAEvent);

    return () => {
      document.removeEventListener('quiz_completed', handlePWAEvent);
      document.removeEventListener('ai_interaction', handlePWAEvent);
      document.removeEventListener('offer_clicked', handlePWAEvent);
    };
  }, [autoShow]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await pwaManager.forceInstallPrompt();
      if (installed) {
        setIsVisible(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || pwaStatus.isInstalled) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Install Findawise Empire App
                </p>
                <p className="text-xs opacity-90">
                  Get offline access, push notifications, and faster performance
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isInstalling ? (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isInstalling ? 'Installing...' : 'Install'}</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PWAFeatureHighlight: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  const features = [
    {
      icon: <Wifi className="h-5 w-5" />,
      title: 'Offline Access',
      description: 'Use AI tools and take quizzes even without internet'
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: 'Smart Notifications',
      description: 'Get alerts for price drops, new content, and AI insights'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Lightning Fast',
      description: 'Native app performance with instant loading'
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: 'App-like Experience',
      description: 'Full screen, home screen shortcuts, and native feel'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Install as App
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
        >
          {showDetails ? 'Hide' : 'Learn More'}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Transform your browser experience into a native app with enhanced performance and features.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => pwaManager.forceInstallPrompt()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              Install Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};