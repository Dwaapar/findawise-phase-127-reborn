import { Router } from 'express';
import { validateRequest, requireAuth } from '../middleware/auth.js';
import { ctaRenderingEngine } from '../services/cta-renderer/ctaRenderingEngine.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Developer Tools API Endpoints
 */

// Run device/persona simulation
router.post('/developer-tools/simulate', async (req, res) => {
  try {
    const { instanceId, device, persona, emotion, testType } = req.body;
    
    if (!instanceId || !device || !persona || !emotion) {
      return res.status(400).json({ 
        error: 'Missing required fields: instanceId, device, persona, emotion' 
      });
    }

    // Simulate device context
    const deviceContext = await ctaRenderingEngine.simulateDeviceContext(device);
    
    // Simulate user persona and emotion
    const userContext = await ctaRenderingEngine.simulateUserContext(persona, emotion);
    
    // Generate personalization vector
    const personalizationVector = await ctaRenderingEngine.generatePersonaVector({
      instanceId,
      deviceCapabilities: deviceContext,
      behaviorData: userContext.persona,
      contextData: { emotion: userContext.emotion }
    });

    // Select optimal rendering pipeline
    const renderingPipeline = await ctaRenderingEngine.selectOptimalRenderingPipeline(
      deviceContext,
      { instanceId }
    );

    // Calculate performance score
    const performanceScore = calculatePerformanceScore(deviceContext, renderingPipeline);
    
    // Generate optimization suggestions
    const optimizations = generateOptimizationSuggestions(deviceContext, renderingPipeline);

    const results = {
      instanceId,
      simulation: {
        device: device,
        persona: persona,
        emotion: emotion
      },
      deviceContext,
      userContext,
      personalizationVector,
      pipeline: renderingPipeline.pipeline,
      fallbackChain: renderingPipeline.fallbackChain,
      performanceScore,
      optimizations,
      expectedEngagement: calculateExpectedEngagement(userContext),
      optimizationLevel: getOptimizationLevel(performanceScore),
      estimatedFPS: estimateFPS(deviceContext, renderingPipeline),
      memoryUsage: estimateMemoryUsage(deviceContext),
      recommendations: generateRecommendations(deviceContext, userContext, performanceScore)
    };

    logger.info(`🧪 Developer simulation completed for ${instanceId}`, {
      device,
      persona,
      emotion,
      performanceScore
    });

    res.json(results);
  } catch (error) {
    logger.error('❌ Developer simulation failed:', error);
    res.status(500).json({ error: 'Simulation failed', details: error.message });
  }
});

// Cross-platform testing
router.post('/developer-tools/cross-platform-test', async (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId is required' });
    }

    const devices = ['desktop_high', 'mobile_ios', 'mobile_android', 'vr_quest', 'ar_vision', 'low_end_mobile'];
    const results = {};

    for (const device of devices) {
      const deviceContext = await ctaRenderingEngine.simulateDeviceContext(device);
      const renderingPipeline = await ctaRenderingEngine.selectOptimalRenderingPipeline(
        deviceContext,
        { instanceId }
      );
      
      results[device] = {
        deviceContext,
        pipeline: renderingPipeline.pipeline,
        fallbackChain: renderingPipeline.fallbackChain,
        performanceScore: calculatePerformanceScore(deviceContext, renderingPipeline),
        estimatedFPS: estimateFPS(deviceContext, renderingPipeline),
        memoryUsage: estimateMemoryUsage(deviceContext),
        compatibility: assessCompatibility(deviceContext, renderingPipeline)
      };
    }

    res.json({
      instanceId,
      crossPlatformResults: results,
      summary: generateCrossPlatformSummary(results)
    });
  } catch (error) {
    logger.error('❌ Cross-platform testing failed:', error);
    res.status(500).json({ error: 'Cross-platform testing failed', details: error.message });
  }
});

// Performance benchmarking
router.post('/developer-tools/benchmark', async (req, res) => {
  try {
    const { instanceId, deviceType } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId is required' });
    }

    const deviceContext = deviceType 
      ? await ctaRenderingEngine.simulateDeviceContext(deviceType)
      : await ctaRenderingEngine.detectDeviceCapabilities();

    const benchmarkResults = await runPerformanceBenchmark(instanceId, deviceContext);
    
    res.json({
      instanceId,
      deviceType: deviceType || 'current',
      benchmarkResults,
      recommendations: generatePerformanceRecommendations(benchmarkResults)
    });
  } catch (error) {
    logger.error('❌ Performance benchmarking failed:', error);
    res.status(500).json({ error: 'Benchmarking failed', details: error.message });
  }
});

// Helper functions
function calculatePerformanceScore(deviceContext: any, renderingPipeline: any): number {
  let score = 50; // Base score
  
  // Device performance impact
  if (deviceContext.performance === 'high') score += 30;
  else if (deviceContext.performance === 'medium') score += 15;
  else score -= 10;
  
  // WebGL version impact
  if (deviceContext.webgl === 2) score += 15;
  else if (deviceContext.webgl === 1) score += 5;
  else score -= 20;
  
  // Memory impact
  if (deviceContext.memory > 4096) score += 10;
  else if (deviceContext.memory < 1024) score -= 15;
  
  // Pipeline efficiency
  const pipelineScores = {
    'native_vr': 95,
    'native_ar': 90,
    'webxr_enhanced': 85,
    'desktop_3d': 80,
    'mobile_optimized_3d': 70,
    'progressive_enhancement': 60,
    'fallback_2d': 40
  };
  
  const pipelineScore = pipelineScores[renderingPipeline.pipeline] || 50;
  score = Math.round((score + pipelineScore) / 2);
  
  return Math.max(0, Math.min(100, score));
}

function generateOptimizationSuggestions(deviceContext: any, renderingPipeline: any): string[] {
  const suggestions = [];
  
  if (deviceContext.performance === 'low') {
    suggestions.push('Enable aggressive LOD (Level of Detail) system');
    suggestions.push('Reduce texture resolution to 512x512 maximum');
    suggestions.push('Disable real-time shadows');
    suggestions.push('Use simplified materials and shaders');
  }
  
  if (deviceContext.memory < 2048) {
    suggestions.push('Implement texture streaming');
    suggestions.push('Use geometry instancing for repeated objects');
    suggestions.push('Enable automatic garbage collection');
  }
  
  if (deviceContext.webgl < 2) {
    suggestions.push('Fallback to WebGL 1.0 compatible shaders');
    suggestions.push('Disable advanced post-processing effects');
    suggestions.push('Use vertex colors instead of textures where possible');
  }
  
  if (deviceContext.platform === 'mobile') {
    suggestions.push('Enable touch-optimized controls');
    suggestions.push('Reduce particle system complexity');
    suggestions.push('Use mobile-specific rendering optimizations');
  }
  
  return suggestions;
}

function calculateExpectedEngagement(userContext: any): number {
  const persona = userContext.persona;
  const emotion = userContext.emotion;
  
  let engagement = 50; // Base engagement
  
  // Persona-based engagement
  if (persona.engagementLevel > 0.8) engagement += 30;
  else if (persona.engagementLevel > 0.5) engagement += 15;
  else engagement -= 10;
  
  // Emotion-based engagement
  if (emotion.interest > 0.8) engagement += 25;
  if (emotion.urgency > 0.7) engagement += 15;
  if (emotion.hesitation > 0.6) engagement -= 20;
  
  return Math.max(0, Math.min(100, Math.round(engagement)));
}

function getOptimizationLevel(performanceScore: number): string {
  if (performanceScore >= 85) return 'optimal';
  if (performanceScore >= 70) return 'good';
  if (performanceScore >= 50) return 'moderate';
  return 'needs_optimization';
}

function estimateFPS(deviceContext: any, renderingPipeline: any): number {
  let baseFPS = 60;
  
  // Device performance impact
  if (deviceContext.performance === 'low') baseFPS = 30;
  else if (deviceContext.performance === 'medium') baseFPS = 45;
  
  // Pipeline complexity impact
  const pipelineImpact = {
    'native_vr': 0.9,
    'native_ar': 0.85,
    'webxr_enhanced': 0.8,
    'desktop_3d': 0.9,
    'mobile_optimized_3d': 0.95,
    'progressive_enhancement': 1.0,
    'fallback_2d': 1.0
  };
  
  const impact = pipelineImpact[renderingPipeline.pipeline] || 0.8;
  return Math.round(baseFPS * impact);
}

function estimateMemoryUsage(deviceContext: any): number {
  let baseMemory = 50; // MB
  
  if (deviceContext.performance === 'high') baseMemory = 200;
  else if (deviceContext.performance === 'medium') baseMemory = 100;
  
  if (deviceContext.webgl === 2) baseMemory *= 1.5;
  if (deviceContext.platform === 'mobile') baseMemory *= 0.7;
  
  return Math.round(baseMemory);
}

function generateRecommendations(deviceContext: any, userContext: any, performanceScore: number): string[] {
  const recommendations = [];
  
  if (performanceScore < 60) {
    recommendations.push('Consider implementing progressive enhancement');
    recommendations.push('Add performance monitoring and adaptive quality');
  }
  
  if (userContext.persona.engagementLevel > 0.8) {
    recommendations.push('Enable advanced interactive features');
    recommendations.push('Add detailed analytics tracking');
  }
  
  if (deviceContext.platform === 'mobile') {
    recommendations.push('Optimize for touch interactions');
    recommendations.push('Implement mobile-specific UI scaling');
  }
  
  if (deviceContext.webxr) {
    recommendations.push('Consider offering WebXR experience');
    recommendations.push('Add VR/AR mode toggle');
  }
  
  return recommendations;
}

function assessCompatibility(deviceContext: any, renderingPipeline: any): string {
  if (renderingPipeline.pipeline === 'fallback_2d') return 'limited';
  if (deviceContext.webgl < 1) return 'incompatible';
  if (deviceContext.performance === 'low') return 'basic';
  if (deviceContext.webxr && renderingPipeline.pipeline.includes('xr')) return 'excellent';
  return 'good';
}

function generateCrossPlatformSummary(results: any): any {
  const devices = Object.keys(results);
  const avgPerformance = devices.reduce((sum, device) => 
    sum + results[device].performanceScore, 0) / devices.length;
  
  const compatibility = devices.map(device => results[device].compatibility);
  const excellentCount = compatibility.filter(c => c === 'excellent').length;
  const goodCount = compatibility.filter(c => c === 'good').length;
  
  return {
    averagePerformanceScore: Math.round(avgPerformance),
    compatibilityBreakdown: {
      excellent: excellentCount,
      good: goodCount,
      basic: compatibility.filter(c => c === 'basic').length,
      limited: compatibility.filter(c => c === 'limited').length,
      incompatible: compatibility.filter(c => c === 'incompatible').length
    },
    recommendations: generateCrossPlatformRecommendations(results)
  };
}

function generateCrossPlatformRecommendations(results: any): string[] {
  const recommendations = [];
  const devices = Object.keys(results);
  
  const lowPerformanceDevices = devices.filter(device => 
    results[device].performanceScore < 60);
  
  if (lowPerformanceDevices.length > 0) {
    recommendations.push(`Optimize for low-performance devices: ${lowPerformanceDevices.join(', ')}`);
  }
  
  const hasVR = devices.some(device => results[device].deviceContext.webxr);
  if (hasVR) {
    recommendations.push('Consider implementing WebXR experiences for VR-capable devices');
  }
  
  const mobileDevices = devices.filter(device => 
    results[device].deviceContext.platform === 'mobile');
  
  if (mobileDevices.length > 0) {
    recommendations.push('Implement mobile-first responsive design');
  }
  
  return recommendations;
}

async function runPerformanceBenchmark(instanceId: string, deviceContext: any): Promise<any> {
  // Simulated benchmark results
  const renderingTests = {
    'basic_3d': Math.random() * 100,
    'complex_3d': Math.random() * 80,
    'particle_systems': Math.random() * 60,
    'post_processing': Math.random() * 70,
    'texture_loading': Math.random() * 90
  };
  
  const memoryTests = {
    'baseline': Math.random() * 50 + 20,
    'peak_usage': Math.random() * 200 + 100,
    'gc_frequency': Math.random() * 10 + 1
  };
  
  return {
    instanceId,
    deviceContext,
    renderingPerformance: renderingTests,
    memoryPerformance: memoryTests,
    overallScore: Math.round(Object.values(renderingTests).reduce((a, b) => a + b, 0) / Object.keys(renderingTests).length),
    timestamp: new Date()
  };
}

function generatePerformanceRecommendations(benchmarkResults: any): string[] {
  const recommendations = [];
  const overall = benchmarkResults.overallScore;
  
  if (overall < 60) {
    recommendations.push('Enable performance mode with reduced quality settings');
    recommendations.push('Implement adaptive LOD based on frame rate');
  }
  
  if (benchmarkResults.memoryPerformance.peak_usage > 150) {
    recommendations.push('Optimize memory usage and implement texture streaming');
  }
  
  if (benchmarkResults.renderingPerformance.particle_systems < 40) {
    recommendations.push('Reduce particle system complexity or disable on low-end devices');
  }
  
  return recommendations;
}

export default router;