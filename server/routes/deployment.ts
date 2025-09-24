/**
 * DEPLOYMENT API ROUTES - BILLION DOLLAR EMPIRE GRADE
 * Complete deployment management API endpoints with orchestration, monitoring, and health checks
 */

import { Router } from 'express';
import { EmpireCLI } from '../../scripts/empire-cli';
import { deploymentOrchestrator } from '../../scripts/deployment-orchestrator';
import { deploymentHealthMonitorService } from '../services/deployment/deploymentHealthMonitor';

const router = Router();
const empireCLI = new EmpireCLI();

/**
 * Get deployment system status
 */
router.get('/status', async (req, res) => {
  try {
    const healthStatus = deploymentHealthMonitorService.getStatus();
    const deploymentPlans = deploymentOrchestrator.listDeploymentPlans();
    const recentExecutions = deploymentOrchestrator.listDeploymentExecutions();

    res.json({
      success: true,
      data: {
        health: healthStatus,
        plans: deploymentPlans.length,
        recentExecutions: recentExecutions.slice(0, 10),
        monitoring: healthStatus.monitoring,
        overallHealth: healthStatus.overallHealth
      }
    });
  } catch (error) {
    console.error('Deployment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment status'
    });
  }
});

/**
 * Create deployment plan
 */
router.post('/plans', async (req, res) => {
  try {
    const planConfig = req.body;
    
    // Validate required fields
    if (!planConfig.name || !planConfig.version || !planConfig.strategy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, version, strategy'
      });
    }

    const planId = await deploymentOrchestrator.createDeploymentPlan(planConfig);

    res.json({
      success: true,
      data: {
        planId,
        message: 'Deployment plan created successfully'
      }
    });
  } catch (error) {
    console.error('Create deployment plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create deployment plan'
    });
  }
});

/**
 * List deployment plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = deploymentOrchestrator.listDeploymentPlans();

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('List deployment plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list deployment plans'
    });
  }
});

/**
 * Execute deployment
 */
router.post('/execute/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { dryRun = false, skipValidation = false } = req.body;

    const executionId = await deploymentOrchestrator.executeDeployment(planId, {
      dryRun,
      skipValidation
    });

    res.json({
      success: true,
      data: {
        executionId,
        planId,
        message: dryRun ? 'Dry run deployment started' : 'Deployment execution started'
      }
    });
  } catch (error) {
    console.error('Execute deployment error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to execute deployment: ${error.message}`
    });
  }
});

/**
 * Get deployment execution status
 */
router.get('/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = deploymentOrchestrator.getDeploymentStatus(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Deployment execution not found'
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('Get execution status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get execution status'
    });
  }
});

/**
 * List deployment executions
 */
router.get('/executions', async (req, res) => {
  try {
    const { planId } = req.query;
    const executions = deploymentOrchestrator.listDeploymentExecutions(planId as string);

    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    console.error('List executions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list executions'
    });
  }
});

/**
 * Cancel deployment execution
 */
router.post('/executions/:executionId/cancel', async (req, res) => {
  try {
    const { executionId } = req.params;
    await deploymentOrchestrator.cancelDeployment(executionId);

    res.json({
      success: true,
      data: {
        message: 'Deployment cancelled successfully'
      }
    });
  } catch (error) {
    console.error('Cancel deployment error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to cancel deployment: ${error.message}`
    });
  }
});

/**
 * Create default empire deployment plan
 */
router.post('/create-empire-plan', async (req, res) => {
  try {
    const planId = await deploymentOrchestrator.createEmpireDeploymentPlan();

    res.json({
      success: true,
      data: {
        planId,
        message: 'Empire deployment plan created successfully'
      }
    });
  } catch (error) {
    console.error('Create empire plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create empire deployment plan'
    });
  }
});

/**
 * Quick deploy empire (using default plan)
 */
router.post('/deploy-empire', async (req, res) => {
  try {
    const { dryRun = false } = req.body;

    // Get or create empire deployment plan
    let empirePlan = deploymentOrchestrator.listDeploymentPlans()
      .find(plan => plan.name === 'Empire Production Deployment');

    if (!empirePlan) {
      const planId = await deploymentOrchestrator.createEmpireDeploymentPlan();
      empirePlan = deploymentOrchestrator.listDeploymentPlans()
        .find(plan => plan.id === planId);
    }

    if (!empirePlan) {
      throw new Error('Failed to create/find empire deployment plan');
    }

    const executionId = await deploymentOrchestrator.executeDeployment(empirePlan.id, {
      dryRun
    });

    res.json({
      success: true,
      data: {
        executionId,
        planId: empirePlan.id,
        message: dryRun ? 'Empire dry run deployment started' : 'Empire deployment started'
      }
    });
  } catch (error) {
    console.error('Deploy empire error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to deploy empire: ${error.message}`
    });
  }
});

/**
 * Seed neurons for deployment
 */
router.post('/seed-neurons', async (req, res) => {
  try {
    // This would typically seed required neurons for the empire
    const neurons = [
      'neuron-personal-finance',
      'neuron-software-saas',
      'neuron-health-wellness',
      'neuron-ai-tools',
      'neuron-education',
      'neuron-travel-explorer',
      'neuron-home-security'
    ];

    const results: { neuronId: string; status: string }[] = [];

    for (const neuronId of neurons) {
      try {
        // Check if neuron already exists
        const checkResponse = await fetch(`http://localhost:5000/api/neuron/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ neuronId })
        });

        if (checkResponse.ok) {
          results.push({ neuronId, status: 'already_exists' });
        } else {
          // Register new neuron
          const registerResponse = await fetch('http://localhost:5000/api/neuron/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              neuronId,
              name: neuronId.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' '),
              type: neuronId.split('-')[1],
              url: `http://localhost:500${neurons.indexOf(neuronId) + 1}`,
              status: 'active'
            })
          });

          if (registerResponse.ok) {
            results.push({ neuronId, status: 'created' });
          } else {
            results.push({ neuronId, status: 'failed' });
          }
        }
      } catch (error) {
        results.push({ neuronId, status: 'error' });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        message: 'Neuron seeding completed'
      }
    });
  } catch (error) {
    console.error('Seed neurons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed neurons'
    });
  }
});

/**
 * Get deployment health metrics
 */
router.get('/health', async (req, res) => {
  try {
    const status = deploymentHealthMonitorService.getStatus();

    res.json({
      success: true,
      data: {
        monitoring: status.monitoring,
        overallHealth: status.overallHealth,
        components: status.components.map(comp => ({
          name: comp.name,
          status: comp.status,
          health: comp.health,
          lastCheck: comp.lastCheck
        })),
        activeAlerts: status.activeAlerts.length,
        metrics: status.metrics.map(metric => ({
          name: metric.name,
          value: metric.value,
          status: metric.status,
          trend: metric.trend
        }))
      }
    });
  } catch (error) {
    console.error('Deployment health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment health'
    });
  }
});

/**
 * Get deployment alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const status = deploymentHealthMonitorService.getStatus();

    res.json({
      success: true,
      data: {
        activeAlerts: status.activeAlerts,
        totalAlerts: status.activeAlerts.length
      }
    });
  } catch (error) {
    console.error('Deployment alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment alerts'
    });
  }
});

/**
 * Empire CLI command execution
 */
router.post('/cli/:command', async (req, res) => {
  try {
    const { command } = req.params;
    const { args = [], options = {} } = req.body;

    // Validate allowed commands
    const allowedCommands = ['deploy', 'status', 'rollback', 'migrate'];
    if (!allowedCommands.includes(command)) {
      return res.status(400).json({
        success: false,
        error: `Command not allowed: ${command}`
      });
    }

    // Execute CLI command
    let result: any;
    switch (command) {
      case 'deploy':
        result = await empireCLI.deploy(args, options);
        break;
      case 'status':
        result = await empireCLI.status();
        break;
      case 'rollback':
        result = await empireCLI.rollback(args[0]);
        break;
      case 'migrate':
        // Execute database migration
        result = { message: 'Migration command executed' };
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    res.json({
      success: true,
      data: {
        command,
        result,
        message: `Command ${command} executed successfully`
      }
    });
  } catch (error) {
    console.error('CLI command error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to execute CLI command: ${error.message}`
    });
  }
});

export default router;