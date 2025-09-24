import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { 
  insertApiOnlyNeuronSchema, 
  insertApiNeuronHeartbeatSchema,
  insertApiNeuronCommandSchema,
  insertApiNeuronAnalyticsSchema,
  type ApiOnlyNeuron
} from '@shared/schema';
import { apiNeuronMonitoring } from '../services/apiNeuronMonitoring';

const router = Router();

// JWT secret for API-only neurons (in production, use environment variable)
const API_NEURON_JWT_SECRET = process.env.API_NEURON_JWT_SECRET || 'api-neuron-secret-key';

// ===========================================
// AUTHENTICATION MIDDLEWARE
// ===========================================

// Custom request interface for authenticated API neuron requests
interface AuthenticatedRequest extends Request {
  neuronId: string;
  neuronName: string;
}

// Middleware to verify API neuron JWT token
const verifyApiNeuronToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, API_NEURON_JWT_SECRET) as any;
      req.neuronId = decoded.neuronId;
      req.neuronName = decoded.name;
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

// Middleware to verify admin access for management operations
const verifyAdminAccess = (req: any, res: any, next: any) => {
  const adminKey = req.headers['x-admin-key'];
  const validAdminKey = process.env.ADMIN_API_KEY || 'admin-secret-key';
  
  if (!adminKey || adminKey !== validAdminKey) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  
  next();
};

// ===========================================
// NEURON REGISTRATION & MANAGEMENT
// ===========================================

// ===========================================
// FEDERATION COMPLIANCE ENDPOINTS
// ===========================================

// Register new API-only neuron (Federation compliance endpoint)
router.post('/register', async (req, res) => {
  try {
    const registrationData = {
      ...req.body,
      neuronId: req.body.neuronId || `api-neuron-${Date.now()}`,
      apiKey: randomUUID(),
      status: 'inactive',
      registeredAt: new Date()
    };

    const validatedData = insertApiOnlyNeuronSchema.parse(registrationData);
    const neuron = await storage.registerApiNeuron(validatedData);
    
    // Generate JWT token for the neuron
    const token = jwt.sign(
      { 
        neuronId: neuron.neuronId, 
        name: neuron.name,
        type: neuron.type,
        capabilities: neuron.capabilities
      },
      API_NEURON_JWT_SECRET,
      { expiresIn: '365d' } // Long-lived token for API neurons
    );

    // Log registration event
    await storage.logFederationEvent({
      neuronId: neuron.neuronId,
      eventType: 'api_neuron_register',
      eventData: { 
        neuronName: neuron.name, 
        type: neuron.type,
        language: neuron.language
      },
      initiatedBy: 'system',
      success: true
    });

    res.status(201).json({ 
      success: true, 
      data: {
        neuron: {
          neuronId: neuron.neuronId,
          name: neuron.name,
          type: neuron.type,
          status: neuron.status,
          healthcheckEndpoint: neuron.healthcheckEndpoint,
          apiEndpoints: neuron.apiEndpoints
        },
        token,
        instructions: {
          heartbeat: 'POST /api/neuron/status every 60 seconds',
          analytics: 'POST /api/analytics/report for metrics',
          commands: 'GET /api/api-neurons/commands/pending to fetch commands',
          config: 'POST /api/neuron/update-config for configuration updates'
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to register API neuron:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to register API neuron' });
  }
});

// Get all API neurons (admin only)
router.get('/all', verifyAdminAccess, async (req, res) => {
  try {
    const neurons = await storage.getAllApiNeurons();
    const neuronsWithStatus = await Promise.all(
      neurons.map(async (neuron: any) => {
        const recentHeartbeat = await storage.getLatestApiNeuronHeartbeat(neuron.neuronId);
        const analytics = await storage.getApiNeuronAnalyticsSummary(neuron.neuronId);
        
        return {
          ...neuron,
          lastHeartbeat: recentHeartbeat?.timestamp,
          isOnline: recentHeartbeat ? 
            (Date.now() - new Date(recentHeartbeat.timestamp).getTime()) < 120000 : false, // 2 minutes
          analytics
        };
      })
    );

    res.json({ 
      success: true, 
      data: neuronsWithStatus,
      total: neuronsWithStatus.length,
      online: neuronsWithStatus.filter((n: any) => n.isOnline).length
    });
  } catch (error) {
    console.error('❌ Failed to get API neurons:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch API neurons' });
  }
});

// Get specific API neuron details (admin only)
router.get('/:neuronId', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const neuron = await storage.getApiNeuronById(neuronId);
    
    if (!neuron) {
      return res.status(404).json({ success: false, error: 'API neuron not found' });
    }

    const heartbeatHistory = await storage.getApiNeuronHeartbeatHistory(neuronId, 24);
    const analytics = await storage.getApiNeuronAnalytics(neuronId, 7);
    const pendingCommands = await storage.getPendingApiNeuronCommands(neuronId);

    res.json({ 
      success: true, 
      data: {
        ...neuron,
        heartbeatHistory,
        analytics,
        pendingCommands
      }
    });
  } catch (error) {
    console.error(`❌ Failed to get API neuron ${req.params.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch API neuron details' });
  }
});

// Update API neuron configuration (admin only)
router.put('/:neuronId', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const updates = req.body;
    
    const updatedNeuron = await storage.updateApiNeuron(neuronId, updates);
    
    if (!updatedNeuron) {
      return res.status(404).json({ success: false, error: 'API neuron not found' });
    }

    // Log update event
    await storage.logFederationEvent({
      neuronId,
      eventType: 'api_neuron_update',
      eventData: { updates },
      initiatedBy: Array.isArray(req.headers['x-user-id']) ? req.headers['x-user-id'][0] || 'admin' : req.headers['x-user-id'] || 'admin',
      success: true
    });

    res.json({ success: true, data: updatedNeuron });
  } catch (error) {
    console.error(`❌ Failed to update API neuron ${req.params.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to update API neuron' });
  }
});

// Deactivate API neuron (admin only)
router.delete('/:neuronId', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const { reason } = req.body;
    
    await storage.updateApiNeuron(neuronId, { 
      status: 'inactive', 
      isActive: false 
    });
    
    // Log deactivation event
    await storage.logFederationEvent({
      neuronId,
      eventType: 'api_neuron_deactivate',
      eventData: { reason },
      initiatedBy: Array.isArray(req.headers['x-user-id']) ? req.headers['x-user-id'][0] || 'admin' : req.headers['x-user-id'] || 'admin',
      success: true
    });

    res.json({ success: true, message: 'API neuron deactivated successfully' });
  } catch (error) {
    console.error(`❌ Failed to deactivate API neuron ${req.params.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to deactivate API neuron' });
  }
});

// ===========================================
// HEARTBEAT & STATUS MONITORING
// ===========================================

// Receive heartbeat from API neuron
router.post('/heartbeat', verifyApiNeuronToken, async (req, res) => {
  try {
    const heartbeatData = {
      neuronId: req.neuronId,
      ...req.body,
      // Ensure uptime is integer (convert float to integer)
      uptime: req.body.uptime ? Math.round(req.body.uptime) : 0,
      // Ensure healthScore is integer
      healthScore: req.body.healthScore ? Math.round(req.body.healthScore) : 100,
      timestamp: new Date()
    };

    const validatedData = insertApiNeuronHeartbeatSchema.parse(heartbeatData);
    const heartbeat = await storage.recordApiNeuronHeartbeat(validatedData);

    // Update neuron's last heartbeat and status
    await storage.updateApiNeuron(req.neuronId, {
      lastHeartbeat: new Date(),
      status: heartbeatData.status || 'active',
      healthScore: Math.round(heartbeatData.healthScore || 100),
      uptime: Math.round(heartbeatData.uptime || 0)
    });

    // Check for pending commands
    const pendingCommands = await storage.getPendingApiNeuronCommands(req.neuronId);

    res.json({ 
      success: true, 
      data: { 
        heartbeatId: heartbeat.id,
        pendingCommands: pendingCommands.length,
        timestamp: heartbeat.timestamp
      }
    });
  } catch (error) {
    console.error(`❌ Failed to record heartbeat for ${req.neuronId}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to record heartbeat' });
  }
});

// Get neuron configuration (for the neuron itself)
router.get('/config', verifyApiNeuronToken, async (req, res) => {
  try {
    const neuron = await storage.getApiNeuronById(req.neuronId);
    
    if (!neuron) {
      return res.status(404).json({ success: false, error: 'Neuron not found' });
    }

    // Get the latest configuration
    const config = await storage.getActiveNeuronConfig(req.neuronId);

    res.json({ 
      success: true, 
      data: {
        neuronInfo: {
          neuronId: neuron.neuronId,
          name: neuron.name,
          type: neuron.type,
          version: neuron.version
        },
        config: config?.configData || {},
        lastUpdated: config?.deployedAt
      }
    });
  } catch (error) {
    console.error(`❌ Failed to get config for ${req.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
  }
});

// ===========================================
// COMMAND SYSTEM
// ===========================================

// Get pending commands for neuron
router.get('/commands/pending', verifyApiNeuronToken, async (req, res) => {
  try {
    const commands = await storage.getPendingApiNeuronCommands(req.neuronId);
    res.json({ success: true, data: commands });
  } catch (error) {
    console.error(`❌ Failed to get pending commands for ${req.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending commands' });
  }
});

// Acknowledge command receipt
router.post('/commands/:commandId/acknowledge', verifyApiNeuronToken, async (req, res) => {
  try {
    const { commandId } = req.params;
    const command = await storage.acknowledgeApiNeuronCommand(commandId, req.neuronId);
    
    if (!command) {
      return res.status(404).json({ success: false, error: 'Command not found' });
    }

    res.json({ success: true, data: command });
  } catch (error) {
    console.error(`❌ Failed to acknowledge command ${req.params.commandId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to acknowledge command' });
  }
});

// Report command completion
router.post('/commands/:commandId/complete', verifyApiNeuronToken, async (req, res) => {
  try {
    const { commandId } = req.params;
    const { success, response, errorMessage } = req.body;
    
    const command = await storage.completeApiNeuronCommand(
      commandId, 
      req.neuronId, 
      success, 
      response, 
      errorMessage
    );
    
    if (!command) {
      return res.status(404).json({ success: false, error: 'Command not found' });
    }

    res.json({ success: true, data: command });
  } catch (error) {
    console.error(`❌ Failed to complete command ${req.params.commandId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to complete command' });
  }
});

// Issue command to neuron (admin only)
router.post('/:neuronId/commands', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const commandData = {
      commandId: randomUUID(),
      neuronId,
      ...req.body,
      issuedBy: Array.isArray(req.headers['x-user-id']) ? req.headers['x-user-id'][0] || 'admin' : req.headers['x-user-id'] || 'admin'
    };

    const validatedData = insertApiNeuronCommandSchema.parse(commandData);
    const command = await storage.issueApiNeuronCommand(validatedData);

    res.status(201).json({ success: true, data: command });
  } catch (error) {
    console.error(`❌ Failed to issue command to ${req.params.neuronId}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to issue command' });
  }
});

// ===========================================
// ANALYTICS & REPORTING
// ===========================================

// Report analytics from API neuron
router.post('/analytics/report', verifyApiNeuronToken, async (req, res) => {
  try {
    const analyticsData = {
      neuronId: req.neuronId,
      date: new Date().toISOString().split('T')[0], // Today's date
      ...req.body
    };

    const validatedData = insertApiNeuronAnalyticsSchema.parse(analyticsData);
    const analytics = await storage.updateApiNeuronAnalytics(validatedData);

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error(`❌ Failed to report analytics for ${req.neuronId}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to report analytics' });
  }
});

// Get analytics for specific neuron (admin only)
router.get('/:neuronId/analytics', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const { days = '7' } = req.query;
    
    const analytics = await storage.getApiNeuronAnalytics(neuronId, parseInt(days as string));
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error(`❌ Failed to get analytics for ${req.params.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Get aggregated analytics for all API neurons (admin only)
router.get('/analytics/overview', verifyAdminAccess, async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const analytics = await storage.getApiNeuronsAnalyticsOverview(parseInt(days as string));
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('❌ Failed to get API neurons analytics overview:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics overview' });
  }
});

// ===========================================
// HEALTH & MONITORING
// ===========================================

// Get health overview of all API neurons (admin only)
router.get('/health/overview', verifyAdminAccess, async (req, res) => {
  try {
    const neurons = await storage.getAllApiNeurons();
    const now = Date.now();
    const healthData = {
      total: neurons.length,
      online: 0,
      offline: 0,
      warning: 0,
      critical: 0,
      averageHealthScore: 0,
      averageUptime: 0
    };

    let totalHealthScore = 0;
    let totalUptime = 0;

    for (const neuron of neurons) {
      const lastHeartbeat = await storage.getLatestApiNeuronHeartbeat(neuron.neuronId);
      const isOnline = lastHeartbeat ? 
        (now - new Date(lastHeartbeat.timestamp).getTime()) < 120000 : false;
      
      if (isOnline) {
        if (neuron.healthScore >= 80) healthData.online++;
        else if (neuron.healthScore >= 60) healthData.warning++;
        else healthData.critical++;
      } else {
        healthData.offline++;
      }

      totalHealthScore += neuron.healthScore || 0;
      totalUptime += neuron.uptime || 0;
    }

    if (neurons.length > 0) {
      healthData.averageHealthScore = Math.round(totalHealthScore / neurons.length);
      healthData.averageUptime = Math.round(totalUptime / neurons.length);
    }

    res.json({ success: true, data: healthData });
  } catch (error) {
    console.error('❌ Failed to get health overview:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch health overview' });
  }
});

// ===========================================
// ADVANCED MONITORING & ALERTING
// ===========================================

// Get monitoring dashboard data (admin only)
router.get('/monitoring/dashboard', verifyAdminAccess, async (req, res) => {
  try {
    const healthStatus = await apiNeuronMonitoring.getHealthStatusOverview();
    const activeAlerts = apiNeuronMonitoring.getActiveAlerts();
    const alertHistory = apiNeuronMonitoring.getAlertHistory(20);
    
    // Calculate summary metrics
    const totalNeurons = healthStatus.length;
    const healthyNeurons = healthStatus.filter(h => h.status === 'healthy').length;
    const degradedNeurons = healthStatus.filter(h => h.status === 'degraded').length;
    const criticalNeurons = healthStatus.filter(h => h.status === 'critical').length;
    const offlineNeurons = healthStatus.filter(h => h.status === 'offline').length;
    
    const avgHealthScore = healthStatus.length > 0 ? 
      Math.round(healthStatus.reduce((sum, h) => sum + h.healthScore, 0) / healthStatus.length) : 0;
    
    // Group alerts by severity
    const alertsBySeverity = activeAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        summary: {
          totalNeurons,
          healthyNeurons,
          degradedNeurons,
          criticalNeurons,
          offlineNeurons,
          avgHealthScore,
          activeAlerts: activeAlerts.length
        },
        healthStatus,
        alerts: {
          active: activeAlerts,
          bySeverity: alertsBySeverity,
          recent: alertHistory.slice(0, 10)
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to get monitoring dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monitoring dashboard' });
  }
});

// Get detailed health status for specific neuron (admin only)
router.get('/:neuronId/monitoring/health', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const healthStatus = await apiNeuronMonitoring.getHealthStatusOverview();
    const neuronHealth = healthStatus.find(h => h.neuronId === neuronId);
    
    if (!neuronHealth) {
      return res.status(404).json({ success: false, error: 'Neuron health data not found' });
    }

    // Get recent analytics for context
    const analytics = await storage.getApiNeuronAnalytics(neuronId, 1);
    const heartbeats = await storage.getApiNeuronHeartbeatHistory(neuronId, 24);
    
    res.json({
      success: true,
      data: {
        health: neuronHealth,
        recentAnalytics: analytics,
        recentHeartbeats: heartbeats.slice(0, 10)
      }
    });
  } catch (error) {
    console.error(`❌ Failed to get health details for ${req.params.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch health details' });
  }
});

// Start monitoring service (admin only)
router.post('/monitoring/start', verifyAdminAccess, async (req, res) => {
  try {
    await apiNeuronMonitoring.start();
    res.json({ 
      success: true, 
      message: 'API neuron monitoring service started successfully' 
    });
  } catch (error) {
    console.error('❌ Failed to start monitoring service:', error);
    res.status(500).json({ success: false, error: 'Failed to start monitoring service' });
  }
});

// Stop monitoring service (admin only)
router.post('/monitoring/stop', verifyAdminAccess, async (req, res) => {
  try {
    apiNeuronMonitoring.stop();
    res.json({ 
      success: true, 
      message: 'API neuron monitoring service stopped successfully' 
    });
  } catch (error) {
    console.error('❌ Failed to stop monitoring service:', error);
    res.status(500).json({ success: false, error: 'Failed to stop monitoring service' });
  }
});

// Get SLA compliance report (admin only)
router.get('/:neuronId/monitoring/sla', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const { days = '7' } = req.query;
    
    const slaReport = await apiNeuronMonitoring.getSLAComplianceReport(
      neuronId, 
      parseInt(days as string)
    );
    
    res.json({ success: true, data: slaReport });
  } catch (error) {
    console.error(`❌ Failed to get SLA report for ${req.params.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch SLA report' });
  }
});

// Set SLA targets for neuron (admin only)
router.post('/:neuronId/monitoring/sla/targets', verifyAdminAccess, async (req, res) => {
  try {
    const { neuronId } = req.params;
    const { availability, responseTime, errorRate, throughput } = req.body;
    
    if (!availability || !responseTime || !errorRate || !throughput) {
      return res.status(400).json({
        success: false,
        error: 'All SLA targets are required: availability, responseTime, errorRate, throughput'
      });
    }
    
    const targets = {
      neuronId,
      availability,
      responseTime,
      errorRate,
      throughput
    };
    
    apiNeuronMonitoring.setSLATargets(neuronId, targets);
    
    res.json({ 
      success: true, 
      message: 'SLA targets set successfully',
      data: targets
    });
  } catch (error) {
    console.error(`❌ Failed to set SLA targets for ${req.params.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to set SLA targets' });
  }
});

export default router;

