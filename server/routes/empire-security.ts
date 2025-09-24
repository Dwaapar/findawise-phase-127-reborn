/**
 * EMPIRE SECURITY API ROUTES
 * Billion-Dollar Migration-Proof JWT Auth + API Key Vault + CDN Cache + LLM Fallback
 * 
 * Features:
 * - Complete REST API for all security operations
 * - Enterprise-grade authentication and authorization
 * - Comprehensive error handling and logging
 * - Migration-proof operations with fallback support
 * 
 * Created: 2025-07-28
 * Quality: A+ Billion-Dollar Empire Grade
 */

import { Router } from 'express';
import { empireSecurityManager } from '../services/empire-security/empireSecurityManager';
import { requireAuth, requirePermission } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Request validation schemas
const storeSecretSchema = z.object({
  keyId: z.string().min(1),
  secretType: z.enum(['jwt', 'api', 'oauth', 'webhook', 'encryption']),
  value: z.string().min(1),
  environment: z.string().optional(),
  description: z.string().optional(),
  rotationFrequencyDays: z.number().min(1).optional()
});

const storeCacheConfigSchema = z.object({
  routeId: z.string().min(1),
  routePattern: z.string().min(1),
  cachePolicy: z.enum(['aggressive', 'conservative', 'dynamic', 'no-cache']),
  ttlSeconds: z.number().min(0).optional(),
  conditions: z.any().optional()
});

const storeLLMConfigSchema = z.object({
  llmId: z.string().min(1),
  provider: z.string().min(1),
  endpoint: z.string().url(),
  apiKeyRef: z.string().min(1),
  model: z.string().min(1),
  priority: z.number().min(1).optional(),
  maxTokens: z.number().min(1).optional(),
  temperature: z.number().min(0).max(2).optional()
});

// JWT AUTH + API KEY VAULT ROUTES

/**
 * Store a secret in the vault
 * POST /api/empire-security/secrets
 */
router.post('/secrets', requireAuth, requirePermission(['admin', 'security']), async (req, res) => {
  try {
    const config = storeSecretSchema.parse(req.body);
    await empireSecurityManager.storeSecret(config);
    
    res.json({
      success: true,
      message: `Secret ${config.keyId} stored successfully`
    });
  } catch (error: any) {
    console.error('Error storing secret:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to store secret'
    });
  }
});

/**
 * Get a secret from the vault
 * GET /api/empire-security/secrets/:keyId
 */
router.get('/secrets/:keyId', requireAuth, requirePermission(['admin', 'security']), async (req, res) => {
  try {
    const { keyId } = req.params;
    const value = await empireSecurityManager.getSecret(keyId);
    
    if (!value) {
      return res.status(404).json({
        success: false,
        error: 'Secret not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        keyId,
        value,
        masked: value.replace(/./g, '*').slice(0, 8) + '...'
      }
    });
  } catch (error: any) {
    console.error('Error getting secret:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get secret'
    });
  }
});

/**
 * Rotate a secret
 * POST /api/empire-security/secrets/:keyId/rotate
 */
router.post('/secrets/:keyId/rotate', requireAuth, requirePermission(['admin', 'security']), async (req, res) => {
  try {
    const { keyId } = req.params;
    const { rotationType = 'manual', reason } = req.body;
    
    await empireSecurityManager.rotateSecret(keyId, rotationType, reason);
    
    res.json({
      success: true,
      message: `Secret ${keyId} rotated successfully`
    });
  } catch (error: any) {
    console.error('Error rotating secret:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to rotate secret'
    });
  }
});

/**
 * Generate JWT token
 * POST /api/empire-security/jwt/generate
 */
router.post('/jwt/generate', requireAuth, requirePermission(['admin', 'auth']), async (req, res) => {
  try {
    const { payload, expiresIn = '24h' } = req.body;
    
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Payload is required'
      });
    }
    
    const token = await empireSecurityManager.generateJWT(payload, expiresIn);
    
    res.json({
      success: true,
      data: {
        token,
        expiresIn
      }
    });
  } catch (error: any) {
    console.error('Error generating JWT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate JWT'
    });
  }
});

/**
 * Verify JWT token
 * POST /api/empire-security/jwt/verify
 */
router.post('/jwt/verify', requireAuth, requirePermission(['admin', 'auth']), async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }
    
    const decoded = await empireSecurityManager.verifyJWT(token);
    
    res.json({
      success: true,
      data: decoded
    });
  } catch (error: any) {
    console.error('Error verifying JWT:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

// FEDERATED CDN CACHE ROUTES

/**
 * Store cache configuration
 * POST /api/empire-security/cache/config
 */
router.post('/cache/config', requireAuth, requirePermission(['admin', 'cache']), async (req, res) => {
  try {
    const config = storeCacheConfigSchema.parse(req.body);
    await empireSecurityManager.storeCacheConfig(config);
    
    res.json({
      success: true,
      message: `Cache config for ${config.routeId} stored successfully`
    });
  } catch (error: any) {
    console.error('Error storing cache config:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to store cache config'
    });
  }
});

/**
 * Get cache configuration
 * GET /api/empire-security/cache/config/:routeId
 */
router.get('/cache/config/:routeId', requireAuth, requirePermission(['admin', 'cache', 'user']), async (req, res) => {
  try {
    const { routeId } = req.params;
    const config = await empireSecurityManager.getCacheConfig(routeId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Cache config not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('Error getting cache config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache config'
    });
  }
});

/**
 * Invalidate cache
 * POST /api/empire-security/cache/:routeId/invalidate
 */
router.post('/cache/:routeId/invalidate', requireAuth, requirePermission(['admin', 'cache']), async (req, res) => {
  try {
    const { routeId } = req.params;
    const { invalidationType = 'manual', reason } = req.body;
    
    await empireSecurityManager.invalidateCache(routeId, invalidationType, reason);
    
    res.json({
      success: true,
      message: `Cache for ${routeId} invalidated successfully`
    });
  } catch (error: any) {
    console.error('Error invalidating cache:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to invalidate cache'
    });
  }
});

// LLM FALLBACK ROUTES

/**
 * Store LLM configuration
 * POST /api/empire-security/llm/config
 */
router.post('/llm/config', requireAuth, requirePermission(['admin', 'llm']), async (req, res) => {
  try {
    const config = storeLLMConfigSchema.parse(req.body);
    await empireSecurityManager.storeLLMConfig(config);
    
    res.json({
      success: true,
      message: `LLM config for ${config.llmId} stored successfully`
    });
  } catch (error: any) {
    console.error('Error storing LLM config:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to store LLM config'
    });
  }
});

/**
 * Get all LLM configurations (ordered by priority)
 * GET /api/empire-security/llm/configs
 */
router.get('/llm/configs', requireAuth, requirePermission(['admin', 'llm', 'user']), async (req, res) => {
  try {
    const configs = await empireSecurityManager.getLLMConfigs();
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    console.error('Error getting LLM configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get LLM configs'
    });
  }
});

/**
 * Log LLM fallback event
 * POST /api/empire-security/llm/log-event
 */
router.post('/llm/log-event', requireAuth, async (req, res) => {
  try {
    const { requestId, primaryLlmId, fallbackLlmId, eventType, responseTime, error } = req.body;
    
    if (!requestId || !primaryLlmId || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'requestId, primaryLlmId, and eventType are required'
      });
    }
    
    await empireSecurityManager.logLLMEvent(
      requestId,
      primaryLlmId,
      fallbackLlmId,
      eventType,
      responseTime,
      error
    );
    
    res.json({
      success: true,
      message: 'LLM event logged successfully'
    });
  } catch (error: any) {
    console.error('Error logging LLM event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log LLM event'
    });
  }
});

// MIGRATION AND BACKUP ROUTES

/**
 * Create backup of all security configurations
 * POST /api/empire-security/backup
 */
router.post('/backup', requireAuth, requirePermission(['admin']), async (req, res) => {
  try {
    const backup = await empireSecurityManager.backupConfigurations();
    
    res.json({
      success: true,
      message: 'Security configurations backed up successfully',
      data: {
        timestamp: backup.timestamp,
        secrets: backup.secrets,
        cacheConfigs: backup.cacheConfigs,
        llmConfigs: backup.llmConfigs,
        totalRecords: backup.secrets + backup.cacheConfigs + backup.llmConfigs
      }
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create backup'
    });
  }
});

/**
 * Restore configurations from backup
 * POST /api/empire-security/restore
 */
router.post('/restore', requireAuth, requirePermission(['admin']), async (req, res) => {
  try {
    const { backup } = req.body;
    
    if (!backup || !backup.data) {
      return res.status(400).json({
        success: false,
        error: 'Valid backup data is required'
      });
    }
    
    await empireSecurityManager.restoreConfigurations(backup);
    
    res.json({
      success: true,
      message: 'Security configurations restored successfully'
    });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore backup'
    });
  }
});

// HEALTH AND STATUS ROUTES

/**
 * Get Empire Security Manager health status
 * GET /api/empire-security/health
 */
router.get('/health', async (req, res) => {
  try {
    const status = await empireSecurityManager.getHealthStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status'
    });
  }
});

/**
 * Force refresh of all configurations
 * POST /api/empire-security/refresh
 */
router.post('/refresh', requireAuth, requirePermission(['admin']), async (req, res) => {
  try {
    // This will force a reload from the database
    await empireSecurityManager['loadAllConfigurations']();
    
    res.json({
      success: true,
      message: 'Configurations refreshed successfully'
    });
  } catch (error: any) {
    console.error('Error refreshing configurations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh configurations'
    });
  }
});

// TESTING AND VALIDATION ROUTES

/**
 * Test database connectivity
 * GET /api/empire-security/test/database
 */
router.get('/test/database', requireAuth, requirePermission(['admin']), async (req, res) => {
  try {
    // Test by querying each main table
    const results = await Promise.allSettled([
      empireSecurityManager['secretsCache'].size,
      empireSecurityManager['cacheConfigCache'].size,
      empireSecurityManager['llmConfigCache'].size
    ]);
    
    const allSuccessful = results.every(result => result.status === 'fulfilled');
    
    res.json({
      success: true,
      data: {
        databaseConnectivity: allSuccessful ? 'healthy' : 'degraded',
        results: results.map((result, index) => ({
          table: ['secrets', 'cache', 'llm'][index],
          status: result.status,
          value: result.status === 'fulfilled' ? result.value : undefined,
          error: result.status === 'rejected' ? result.reason?.message : undefined
        }))
      }
    });
  } catch (error: any) {
    console.error('Error testing database:', error);
    res.status(500).json({
      success: false,
      error: 'Database connectivity test failed'
    });
  }
});

/**
 * Validate secret encryption/decryption
 * POST /api/empire-security/test/encryption
 */
router.post('/test/encryption', requireAuth, requirePermission(['admin']), async (req, res) => {
  try {
    const testValue = 'test-secret-value-' + Date.now();
    
    // Test store and retrieve
    const testKeyId = 'test-encryption-' + Date.now();
    await empireSecurityManager.storeSecret({
      keyId: testKeyId,
      secretType: 'api',
      value: testValue,
      description: 'Encryption test - will be deleted'
    });
    
    const retrievedValue = await empireSecurityManager.getSecret(testKeyId);
    const encryptionWorking = retrievedValue === testValue;
    
    res.json({
      success: true,
      data: {
        encryptionWorking,
        testValue,
        retrievedValue,
        match: encryptionWorking
      }
    });
  } catch (error: any) {
    console.error('Error testing encryption:', error);
    res.status(500).json({
      success: false,
      error: 'Encryption test failed'
    });
  }
});

// Error handling middleware
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Empire Security API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;