/**
 * Language Switcher Component - Billion-Dollar Empire Grade
 * 
 * Complete language switching UI with:
 * - Auto-detection and manual override
 * - Cultural flag icons and native names
 * - Real-time content adaptation
 * - Analytics tracking
 * - Accessibility compliance
 * 
 * @version 2.0.0 - Billion-Dollar Empire Grade
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { cn } from '../../utils/cn';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  flag: string;
  region: string;
}

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'flags' | 'minimal';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showFlags?: boolean;
  showNativeNames?: boolean;
  onLanguageChange?: (languageCode: string) => void;
  className?: string;
}

const FLAG_ICONS: Record<string, string> = {
  'en': '🇺🇸',
  'es': '🇪🇸', 
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'hi': '🇮🇳',
  'zh': '🇨🇳',
  'ja': '🇯🇵',
  'pt': '🇧🇷',
  'ru': '🇷🇺',
  'ar': '🇸🇦',
  'it': '🇮🇹',
  'ko': '🇰🇷',
  'nl': '🇳🇱',
  'pl': '🇵🇱',
  'sv': '🇸🇪'
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  position = 'top-right',
  showFlags = true,
  showNativeNames = true,
  onLanguageChange,
  className
}) => {
  const { 
    currentLanguage, 
    setLanguage, 
    availableLanguages, 
    isLoading 
  } = useLocalization();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-detect language on mount
  useEffect(() => {
    const autoDetectLanguage = async () => {
      try {
        const response = await fetch('/api/localization/auto-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            sessionId: generateSessionId()
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.detectedLanguage !== currentLanguage) {
            setLanguage(data.data.detectedLanguage);
            setIsAutoDetected(true);
            
            // Track auto-detection
            trackLanguageEvent('auto_detected', data.data.detectedLanguage);
          }
        }
      } catch (error) {
        console.warn('Language auto-detection failed:', error);
      }
    };

    if (!isLoading && availableLanguages.length > 0) {
      autoDetectLanguage();
    }
  }, [isLoading, availableLanguages, currentLanguage, setLanguage]);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) return;

    try {
      // Update language
      setLanguage(languageCode);
      setIsOpen(false);
      setIsAutoDetected(false);

      // Track manual selection
      await trackLanguageEvent('manual_selection', languageCode);

      // Trigger callback
      onLanguageChange?.(languageCode);

      // Show success feedback
      showLanguageChangeNotification(languageCode);

    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const trackLanguageEvent = async (eventType: string, languageCode: string) => {
    try {
      await fetch('/api/localization/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: generateSessionId(),
          languageCode,
          eventType,
          metadata: {
            previousLanguage: currentLanguage,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.warn('Failed to track language event:', error);
    }
  };

  const showLanguageChangeNotification = (languageCode: string) => {
    const language = availableLanguages.find(lang => lang.code === languageCode);
    if (language) {
      // You could integrate with a toast notification system here
      console.log(`Language changed to ${language.nativeName}`);
    }
  };

  const generateSessionId = (): string => {
    return sessionStorage.getItem('sessionId') || 
           (sessionStorage.setItem('sessionId', Math.random().toString(36).substring(2)), 
            sessionStorage.getItem('sessionId')!);
  };

  const getCurrentLanguage = () => {
    return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];
  };

  if (isLoading || availableLanguages.length <= 1) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // Minimal variant - just flags
  if (variant === 'minimal') {
    return (
      <div className={cn(
        'flex items-center space-x-2',
        className
      )}>
        {availableLanguages.slice(0, 5).map(language => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-200',
              'hover:scale-110 hover:shadow-md',
              language.code === currentLanguage 
                ? 'ring-2 ring-blue-500 shadow-md' 
                : 'opacity-70 hover:opacity-100'
            )}
            title={language.nativeName}
            aria-label={`Switch to ${language.name}`}
          >
            {FLAG_ICONS[language.code] || '🌐'}
          </button>
        ))}
      </div>
    );
  }

  // Flags variant - horizontal list
  if (variant === 'flags') {
    return (
      <div className={cn(
        'inline-flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1',
        className
      )}>
        {availableLanguages.map(language => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              language.code === currentLanguage
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : 'text-gray-700 dark:text-gray-300'
            )}
            title={language.nativeName}
            aria-label={`Switch to ${language.name}`}
          >
            {showFlags && (
              <span className="text-base">{FLAG_ICONS[language.code] || '🌐'}</span>
            )}
            {showNativeNames && (
              <span className="hidden sm:inline">{language.nativeName}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  const currentLang = getCurrentLanguage();
  
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Auto-detection notification */}
      {isAutoDetected && (
        <div className="absolute -top-12 left-0 right-0 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-md shadow-sm">
          Language auto-detected
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
          'rounded-lg shadow-sm hover:shadow-md transition-all duration-200',
          'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          isOpen && 'ring-2 ring-blue-500 border-blue-500'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        {showFlags && currentLang && (
          <span className="text-base">{FLAG_ICONS[currentLang.code] || '🌐'}</span>
        )}
        <span className="text-sm font-medium">
          {currentLang ? (showNativeNames ? currentLang.nativeName : currentLang.name) : 'Language'}
        </span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
          'max-h-64 overflow-y-auto',
          position.includes('right') ? 'right-0' : 'left-0'
        )}>
          <div className="py-1" role="listbox">
            {availableLanguages.map(language => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  'w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors duration-150',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  language.code === currentLanguage
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'text-gray-700 dark:text-gray-300'
                )}
                role="option"
                aria-selected={language.code === currentLanguage}
              >
                {showFlags && (
                  <span className="text-lg flex-shrink-0">
                    {FLAG_ICONS[language.code] || '🌐'}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {language.nativeName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {language.name}
                  </div>
                </div>
                {language.code === currentLanguage && (
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Footer with language settings link */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to language settings
                window.location.href = '/admin/localization';
              }}
              className="w-full text-left px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Manage languages →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;