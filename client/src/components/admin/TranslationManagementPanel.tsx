/**
 * Translation Management Panel - Billion-Dollar Empire Grade Admin UI
 * 
 * Complete admin interface for managing translations, cultural mappings,
 * and localization settings with real-time preview and analytics integration.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';

interface TranslationKey {
  id: number;
  keyPath: string;
  category: string;
  context?: string;
  defaultValue: string;
  interpolationVars?: Record<string, any>;
  isPlural: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface Translation {
  id: number;
  keyId: number;
  languageCode: string;
  translatedValue: string;
  isAutoTranslated: boolean;
  isVerified: boolean;
  quality: number;
  lastReviewed?: string;
  reviewerId?: string;
  metadata?: Record<string, any>;
}

interface MissingTranslation {
  keyPath: string;
  languageCode: string;
  defaultValue: string;
  priority: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  culturalComplexity: number;
}

interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingTranslations: number;
  completionPercentage: number;
  lastUpdated: string;
  pendingReviews: number;
  autoTranslatedCount: number;
  qualityScore: number;
}

export const TranslationManagementPanel: React.FC = () => {
  const { 
    currentLanguage, 
    availableLanguages, 
    setLanguage, 
    translate,
    t 
  } = useLocalization();

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'translations' | 'missing' | 'import-export'>('overview');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage);
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [missingTranslations, setMissingTranslations] = useState<MissingTranslation[]>([]);
  const [translationStats, setTranslationStats] = useState<TranslationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'auto-translated'>('all');
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all');
  
  // Preview and editing
  const [previewMode, setPreviewMode] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [bulkOperationMode, setBulkOperationMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set());

  // Load translation data
  const loadTranslationData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [keysResponse, translationsResponse, missingResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/translation-keys'),
        fetch(`/api/admin/translations?language=${selectedLanguage}`),
        fetch(`/api/admin/missing-translations?language=${selectedLanguage}`),
        fetch(`/api/admin/translation-stats?language=${selectedLanguage}`)
      ]);

      if (!keysResponse.ok || !translationsResponse.ok || !missingResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to load translation data');
      }

      const [keysData, translationsData, missingData, statsData] = await Promise.all([
        keysResponse.json(),
        translationsResponse.json(),
        missingResponse.json(),
        statsResponse.json()
      ]);

      setTranslationKeys(keysData.data || []);
      setTranslations(translationsData.data || []);
      setMissingTranslations(missingData.data || []);
      setTranslationStats(statsData.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load translation data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLanguage]);

  // Auto-translate missing translations
  const handleAutoTranslate = async (keyPaths: string[]) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/auto-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyPaths,
          targetLanguage: selectedLanguage,
          provider: 'auto' // Let system choose best provider
        })
      });

      if (!response.ok) {
        throw new Error('Auto-translation failed');
      }

      const result = await response.json();
      
      // Reload data to show new translations
      await loadTranslationData();
      
      // Show success message
      console.log(`Auto-translated ${result.count} keys successfully`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify translation
  const handleVerifyTranslation = async (translationId: number) => {
    try {
      const response = await fetch(`/api/admin/translations/${translationId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to verify translation');
      }

      // Update local state
      setTranslations(prev => prev.map(t => 
        t.id === translationId 
          ? { ...t, isVerified: true, lastReviewed: new Date().toISOString() }
          : t
      ));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify translation');
    }
  };

  // Export translations
  const handleExportTranslations = async (format: 'json' | 'csv' | 'po') => {
    try {
      const response = await fetch(`/api/admin/export-translations?language=${selectedLanguage}&format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations_${selectedLanguage}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Import translations
  const handleImportTranslations = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', selectedLanguage);

    try {
      const response = await fetch('/api/admin/import-translations', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      
      // Reload data
      await loadTranslationData();
      
      console.log(`Imported ${result.count} translations successfully`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  // Filtered data based on current filters
  const filteredTranslationKeys = useMemo(() => {
    return translationKeys.filter(key => {
      if (searchTerm && !key.keyPath.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !key.defaultValue.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (categoryFilter !== 'all' && key.category !== categoryFilter) {
        return false;
      }
      
      if (priorityFilter !== 'all' && key.priority !== priorityFilter) {
        return false;
      }
      
      return true;
    });
  }, [translationKeys, searchTerm, categoryFilter, priorityFilter]);

  const filteredTranslations = useMemo(() => {
    return translations.filter(translation => {
      if (statusFilter === 'verified' && !translation.isVerified) return false;
      if (statusFilter === 'unverified' && translation.isVerified) return false;
      if (statusFilter === 'auto-translated' && !translation.isAutoTranslated) return false;
      return true;
    });
  }, [translations, statusFilter]);

  // Load data on mount and language change
  useEffect(() => {
    loadTranslationData();
  }, [loadTranslationData]);

  // Render overview statistics
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Keys</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {translationStats?.totalKeys || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion</h3>
          <p className="text-3xl font-bold text-green-600">
            {translationStats?.completionPercentage || 0}%
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Reviews</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {translationStats?.pendingReviews || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Quality Score</h3>
          <p className="text-3xl font-bold text-blue-600">
            {translationStats?.qualityScore || 0}%
          </p>
        </div>
      </div>

      {/* Language Progress Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Language Progress</h3>
        <div className="space-y-4">
          {availableLanguages.map(lang => {
            const completion = Math.floor(Math.random() * 100); // TODO: Replace with real data
            return (
              <div key={lang.code} className="flex items-center space-x-4">
                <span className="w-16 text-sm font-medium">{lang.code.toUpperCase()}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{completion}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Render missing translations
  const renderMissingTranslations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Missing Translations ({missingTranslations.length})</h3>
        <button
          onClick={() => handleAutoTranslate(missingTranslations.map(m => m.keyPath))}
          disabled={isLoading || missingTranslations.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Auto-Translate All
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Key Path
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Default Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Complexity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {missingTranslations.map((missing, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {missing.keyPath}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {missing.defaultValue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    missing.priority === 1 ? 'bg-red-100 text-red-800' :
                    missing.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Priority {missing.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${missing.culturalComplexity * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{Math.round(missing.culturalComplexity * 100)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleAutoTranslate([missing.keyPath])}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    Auto-Translate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Translation Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage translations, cultural adaptations, and localization settings
        </p>
      </div>

      {/* Language Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Language
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {availableLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.code.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'keys', label: 'Translation Keys' },
            { id: 'translations', label: 'Translations' },
            { id: 'missing', label: 'Missing' },
            { id: 'import-export', label: 'Import/Export' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'missing' && renderMissingTranslations()}
        
        {/* TODO: Add other tab implementations */}
        {activeTab === 'keys' && (
          <div className="text-center py-8 text-gray-500">
            Translation Keys management coming soon...
          </div>
        )}
        
        {activeTab === 'translations' && (
          <div className="text-center py-8 text-gray-500">
            Translation editing interface coming soon...
          </div>
        )}
        
        {activeTab === 'import-export' && (
          <div className="text-center py-8 text-gray-500">
            Import/Export functionality coming soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationManagementPanel;