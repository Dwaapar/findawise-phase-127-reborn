import React, { useState, useEffect } from 'react';
import { pwaManager } from '../lib/pwa/PWAManager';

interface PWAInstallPromptProps {
  className?: string;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className = '' }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<string>('unknown');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Listen for install prompt ready
    const handleInstallPromptReady = () => {
      const prompt = pwaManager.getInstallPrompt();
      setShowPrompt(prompt.canInstall);
      setPlatform(prompt.platform);
    };

    const handleInstalled = () => {
      setShowPrompt(false);
      setIsInstalling(false);
    };

    pwaManager.on('installPromptReady', handleInstallPromptReady);
    pwaManager.on('installed', handleInstalled);
    pwaManager.on('installPromptDismissed', () => setShowPrompt(false));

    // Check initial state
    const prompt = pwaManager.getInstallPrompt();
    setShowPrompt(prompt.canInstall);
    setPlatform(prompt.platform);

    return () => {
      pwaManager.off('installPromptReady', handleInstallPromptReady);
      pwaManager.off('installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const prompt = pwaManager.getInstallPrompt();
    const installed = await prompt.showPrompt();
    
    if (!installed) {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    const prompt = pwaManager.getInstallPrompt();
    prompt.dismiss();
    setShowPrompt(false);
  };

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          icon: '🍎',
          title: 'Install Findawise Empire',
          instructions: [
            'Tap the Share button at the bottom of Safari',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install the app'
          ]
        };
      case 'android':
        return {
          icon: '🤖',
          title: 'Install Findawise Empire',
          instructions: [
            'Tap "Install" to add to your home screen',
            'Enjoy native app experience with offline support'
          ]
        };
      default:
        return {
          icon: '💻',
          title: 'Install Findawise Empire',
          instructions: [
            'Click "Install" to add to your desktop',
            'Access the app directly from your taskbar'
          ]
        };
    }
  };

  if (!showPrompt) {
    return null;
  }

  const installInfo = getInstallInstructions();

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl border border-white/20 backdrop-blur-md z-50 ${className}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{installInfo.icon}</div>
            <div>
              <h3 className="font-bold text-lg">{installInfo.title}</h3>
              <p className="text-blue-100 text-sm">Get the full app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Dismiss install prompt"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-sm">Benefits:</h4>
          <ul className="text-sm text-blue-100 space-y-1">
            <li className="flex items-center space-x-2">
              <span className="text-green-300">✓</span>
              <span>Works offline</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-300">✓</span>
              <span>Push notifications</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-300">✓</span>
              <span>Faster loading</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-300">✓</span>
              <span>Native app feel</span>
            </li>
          </ul>
        </div>

        {platform === 'ios' ? (
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-sm">How to install:</h4>
            <ol className="text-sm text-blue-100 space-y-1 list-decimal list-inside">
              {installInfo.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-white text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Installing...</span>
                </span>
              ) : (
                '📱 Install App'
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-white/80 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        )}
      </div>

      {/* Progress indicator for iOS */}
      {platform === 'ios' && (
        <div className="px-6 pb-4">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-blue-200">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
              <span>Follow the steps above to install</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAInstallPrompt;