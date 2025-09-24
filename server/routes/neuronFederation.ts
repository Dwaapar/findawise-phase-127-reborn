import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { 
  insertApiOnlyNeuronSchema, 
  insertApiNeuronHeartbeatSchema,
  insertApiNeuronAnalyticsSchema
} from '@shared/schema';
import { storage } from '../storage';

const router = Router();

// JWT secret for API-only neurons
const API_NEURON_JWT_SECRET = process.env.API_NEURON_JWT_SECRET || 'api-neuron-secret-key';

// Extended Request interface for API neuron authentication
interface AuthenticatedRequest extends Request {
  neuronId?: string;
  neuronName?: string;
}

// Middleware to verify API neuron JWT token
const verifyApiNeuronToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

// ===========================================
// FEDERATION COMPLIANCE ENDPOINTS
// Phase 4 Audit Specification: /api/neuron/* paths
// ===========================================

// 📘 Federation endpoint: Register new API-only neuron
// Required by Phase 4 audit: POST /api/neuron/register
router.post('/register', async (req, res) => {
  try {
    const registrationData = {
      ...req.body,
      neuronId: req.body.neuronId || `api-neuron-${Date.now()}`,
      apiKey: req.body.apiKey || `api-key-${Date.now()}`,
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

    console.log(`✅ API neuron registered: ${neuron.name} (${neuron.neuronId})`);

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
          config: 'POST /api/neuron/update-config for configuration updates'
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to register API neuron:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'Neuron ID already exists' 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to register API neuron' });
  }
});

// 📘 Federation endpoint: Submit heartbeat/status from API neuron  
// Required by Phase 4 audit: POST /api/neuron/status
router.post('/status', verifyApiNeuronToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const heartbeatData = {
      neuronId: req.neuronId,
      timestamp: new Date(),
      ...req.body,
      // Ensure all numeric fields are properly converted to integers
      healthScore: Math.floor(Number(req.body.healthScore) || 100),
      uptime: Math.floor(Number(req.body.uptime) || 0),
      // Convert any other potentially problematic fields
      cpuUsage: req.body.cpuUsage ? Math.floor(Number(req.body.cpuUsage)) : undefined,
      memoryUsage: req.body.memoryUsage ? Math.floor(Number(req.body.memoryUsage)) : undefined,
      errorCount: req.body.errorCount ? Math.floor(Number(req.body.errorCount)) : undefined
    };

    const validatedData = insertApiNeuronHeartbeatSchema.parse(heartbeatData);
    const heartbeat = await storage.recordApiNeuronHeartbeat(validatedData);

    // Update neuron status based on heartbeat
    await storage.updateApiNeuron(req.neuronId!, {
      status: heartbeatData.status || 'active',
      lastHeartbeat: new Date(),
      healthScore: Math.floor(Number(heartbeatData.healthScore) || 100),
      uptime: Math.floor(Number(heartbeatData.uptime) || 0),
      errorCount: 0 // Reset error count on successful heartbeat
    });

    console.log(`💓 Heartbeat received from ${req.neuronName} (${req.neuronId})`);

    res.json({ 
      success: true, 
      data: heartbeat,
      nextHeartbeat: 60 // seconds
    });
  } catch (error) {
    console.error(`❌ Failed to process heartbeat for ${req.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to process heartbeat' });
  }
});

// 📘 Federation endpoint: Update neuron configuration 
// Required by Phase 4 audit: POST /api/neuron/update-config
router.post('/update-config', verifyApiNeuronToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { config, experiment, command } = req.body;
    
    // Apply configuration update
    if (config) {
      await storage.updateApiNeuron(req.neuronId!, {
        metadata: { ...((await storage.getApiNeuronById(req.neuronId!))?.metadata || {}), config },
        version: config.version || Date.now().toString()
      });
      
      console.log(`⚙️ Configuration updated for ${req.neuronName} (${req.neuronId})`);
    }
    
    // Apply experiment settings
    if (experiment) {
      await storage.logFederationEvent({
        neuronId: req.neuronId!,
        eventType: 'experiment_applied',
        eventData: { experiment },
        initiatedBy: 'federation',
        success: true
      });
      
      console.log(`🧪 Experiment applied to ${req.neuronName} (${req.neuronId})`);
    }
    
    // Execute command
    if (command) {
      await storage.issueApiNeuronCommand({
        neuronId: req.neuronId!,
        commandId: `cmd-${Date.now()}`,
        commandType: command.type,
        commandData: command.data,
        issuedBy: 'federation',
        status: 'sent'
      });
      
      console.log(`📋 Command issued to ${req.neuronName} (${req.neuronId}): ${command.type}`);
    }

    res.json({ 
      success: true,
      message: 'Configuration update processed successfully',
      applied: {
        config: !!config,
        experiment: !!experiment, 
        command: !!command
      }
    });
  } catch (error) {
    console.error(`❌ Failed to update config for ${req.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to update configuration' });
  }
});

// 📘 Federation endpoint: Get current configuration for neuron
// Additional endpoint for neuron to fetch its current config
router.get('/config', verifyApiNeuronToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const neuron = await storage.getApiNeuronById(req.neuronId!);
    
    if (!neuron) {
      return res.status(404).json({ success: false, error: 'Neuron not found' });
    }

    res.json({ 
      success: true, 
      data: {
        config: (neuron.metadata as any)?.config || {},
        configVersion: neuron.version || '1.0.0',
        status: neuron.status,
        lastUpdate: neuron.updatedAt
      }
    });
  } catch (error) {
    console.error(`❌ Failed to get config for ${req.neuronId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
  }
});

// ===========================================
// AUTO-RETIREMENT SYSTEM
// Phase 4 Audit Requirement: Auto-retire on failed heartbeats
// ===========================================

// Function to check for stale neurons and auto-retire them
export const checkAndRetireStaleNeurons = async () => {
  try {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    
    const neurons = await storage.getAllApiNeurons();
    
    for (const neuron of neurons) {
      if (neuron.status === 'active' && neuron.lastHeartbeat) {
        const timeSinceLastHeartbeat = now.getTime() - new Date(neuron.lastHeartbeat).getTime();
        
        if (timeSinceLastHeartbeat > staleThreshold) {
          // Auto-retire the neuron
          await storage.updateApiNeuron(neuron.neuronId, {
            status: 'inactive',
            errorCount: (neuron.errorCount || 0) + 1,
            lastError: 'Auto-retired due to missing heartbeat'
          });
          
          // Log the auto-retirement event
          await storage.logFederationEvent({
            neuronId: neuron.neuronId,
            eventType: 'auto_retirement',
            eventData: { 
              reason: 'Missing heartbeat',
              lastHeartbeat: neuron.lastHeartbeat,
              timeSinceLastHeartbeat: timeSinceLastHeartbeat
            },
            initiatedBy: 'system',
            success: true
          });
          
          console.log(`🚫 Auto-retired neuron ${neuron.name} (${neuron.neuronId}) - no heartbeat for ${Math.round(timeSinceLastHeartbeat / 60000)} minutes`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in auto-retirement check:', error);
  }
};

export default router;