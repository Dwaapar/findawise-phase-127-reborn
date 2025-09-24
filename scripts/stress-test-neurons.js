#!/usr/bin/env node

/**
 * Phase 3B: Neuron Federation Stress Test & Scale Hardening
 * 
 * This script creates 10-50 mock neurons to test federation scale,
 * failure modes, and real-time data integrity under load.
 */

const WebSocket = require('ws');
const axios = require('axios').default;
const { performance } = require('perf_hooks');

class MockNeuron {
  constructor(id, baseUrl = 'http://localhost:5000') {
    this.neuronId = `test-neuron-${id}`;
    this.name = `Test Neuron ${id}`;
    this.type = ['finance', 'health', 'saas', 'travel', 'education'][id % 5];
    this.version = '1.0.0';
    this.baseUrl = baseUrl;
    this.ws = null;
    this.isConnected = false;
    this.healthScore = Math.floor(Math.random() * 40) + 60; // 60-100
    this.stats = {
      pageViews: Math.floor(Math.random() * 10000),
      conversions: Math.floor(Math.random() * 500),
      revenue: Math.floor(Math.random() * 50000),
      errors: Math.floor(Math.random() * 10)
    };
    this.configVersion = 1;
    this.lastHeartbeat = Date.now();
    this.failureMode = null; // 'offline', 'bad_config', 'analytics_fail', 'partial_failure'
  }

  async register() {
    try {
      console.log(`📡 Registering ${this.neuronId}...`);
      const response = await axios.post(`${this.baseUrl}/api/federation/neurons/register`, {
        neuronId: this.neuronId,
        name: this.name,
        type: this.type,
        version: this.version,
        url: `http://mock-${this.neuronId}.local`,
        healthScore: this.healthScore,
        uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
        metadata: {
          isMockNeuron: true,
          testId: process.env.TEST_ID || 'stress-test',
          createdAt: new Date().toISOString()
        }
      });

      if (response.data.success) {
        console.log(`✅ ${this.neuronId} registered successfully`);
        await this.connectWebSocket();
        return true;
      } else {
        console.error(`❌ Failed to register ${this.neuronId}:`, response.data.error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Registration error for ${this.neuronId}:`, error.message);
      return false;
    }
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:5000/federation-ws`;
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          console.log(`🔌 ${this.neuronId} WebSocket connected`);
          this.isConnected = true;
          
          // Send initial handshake
          this.ws.send(JSON.stringify({
            type: 'neuron_handshake',
            neuronId: this.neuronId,
            timestamp: Date.now()
          }));

          this.startHeartbeat();
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(JSON.parse(data.toString()));
        });

        this.ws.on('close', () => {
          console.log(`🔌 ${this.neuronId} WebSocket disconnected`);
          this.isConnected = false;
          
          // Auto-reconnect unless in failure mode
          if (this.failureMode !== 'offline') {
            setTimeout(() => this.connectWebSocket(), 5000);
          }
        });

        this.ws.on('error', (error) => {
          console.error(`❌ WebSocket error for ${this.neuronId}:`, error.message);
          reject(error);
        });

      } catch (error) {
        console.error(`❌ WebSocket connection error for ${this.neuronId}:`, error.message);
        reject(error);
      }
    });
  }

  handleMessage(message) {
    console.log(`📩 ${this.neuronId} received:`, message.type);

    switch (message.type) {
      case 'config_update':
        this.handleConfigUpdate(message);
        break;
      case 'experiment_deploy':
        this.handleExperimentDeploy(message);
        break;
      case 'ping':
        this.sendPong(message.id);
        break;
      case 'health_check':
        this.sendHealthUpdate();
        break;
      default:
        console.log(`🤷 ${this.neuronId} unknown message type:`, message.type);
    }
  }

  handleConfigUpdate(message) {
    if (this.failureMode === 'bad_config') {
      console.log(`💥 ${this.neuronId} simulating bad config failure`);
      this.ws.send(JSON.stringify({
        type: 'config_update_response',
        messageId: message.id,
        success: false,
        error: 'Simulated configuration validation failure',
        neuronId: this.neuronId,
        timestamp: Date.now()
      }));
      return;
    }

    // Simulate processing delay
    setTimeout(() => {
      this.configVersion++;
      console.log(`⚙️ ${this.neuronId} applied config v${this.configVersion}`);
      
      this.ws.send(JSON.stringify({
        type: 'config_update_response',
        messageId: message.id,
        success: true,
        configVersion: this.configVersion,
        neuronId: this.neuronId,
        timestamp: Date.now()
      }));
    }, Math.random() * 2000 + 500); // 500-2500ms delay
  }

  handleExperimentDeploy(message) {
    console.log(`🧪 ${this.neuronId} deploying experiment:`, message.experiment?.name);
    
    this.ws.send(JSON.stringify({
      type: 'experiment_deploy_response',
      messageId: message.id,
      success: true,
      experimentId: message.experiment?.id,
      neuronId: this.neuronId,
      timestamp: Date.now()
    }));
  }

  sendPong(messageId) {
    this.ws.send(JSON.stringify({
      type: 'pong',
      messageId,
      neuronId: this.neuronId,
      timestamp: Date.now()
    }));
  }

  sendHealthUpdate() {
    // Simulate health fluctuation
    this.healthScore = Math.max(0, Math.min(100, 
      this.healthScore + (Math.random() - 0.5) * 10
    ));

    this.ws.send(JSON.stringify({
      type: 'health_update',
      neuronId: this.neuronId,
      healthScore: Math.floor(this.healthScore),
      stats: this.stats,
      timestamp: Date.now()
    }));
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.failureMode !== 'offline') {
        this.sendHealthUpdate();
        this.sendAnalyticsData();
      }
    }, 10000); // Every 10 seconds
  }

  sendAnalyticsData() {
    if (this.failureMode === 'analytics_fail') {
      console.log(`📊 ${this.neuronId} simulating analytics failure`);
      return;
    }

    // Simulate realistic traffic
    this.stats.pageViews += Math.floor(Math.random() * 20);
    this.stats.conversions += Math.floor(Math.random() * 3);
    this.stats.revenue += Math.floor(Math.random() * 1000);

    this.ws.send(JSON.stringify({
      type: 'analytics_update',
      neuronId: this.neuronId,
      data: {
        pageViews: Math.floor(Math.random() * 50),
        conversions: Math.floor(Math.random() * 5),
        revenue: Math.floor(Math.random() * 500),
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }));
  }

  simulateFailure(mode) {
    console.log(`💥 ${this.neuronId} entering failure mode: ${mode}`);
    this.failureMode = mode;

    switch (mode) {
      case 'offline':
        this.goOffline();
        break;
      case 'bad_config':
        // Will fail next config update
        break;
      case 'analytics_fail':
        // Will stop sending analytics
        break;
      case 'partial_failure':
        this.healthScore = Math.random() * 30; // Very low health
        break;
    }
  }

  goOffline() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.isConnected = false;
    console.log(`🔴 ${this.neuronId} is now offline`);
  }

  recover() {
    console.log(`🟢 ${this.neuronId} recovering from failure mode`);
    this.failureMode = null;
    this.healthScore = Math.floor(Math.random() * 40) + 60;
    
    if (!this.isConnected) {
      this.connectWebSocket();
    }
  }

  async cleanup() {
    console.log(`🧹 Cleaning up ${this.neuronId}...`);
    this.goOffline();
    
    try {
      await axios.delete(`${this.baseUrl}/api/federation/neurons/${this.neuronId}`);
      console.log(`✅ ${this.neuronId} deregistered`);
    } catch (error) {
      console.error(`❌ Failed to deregister ${this.neuronId}:`, error.message);
    }
  }
}

class StressTestOrchestrator {
  constructor(neuronCount = 20) {
    this.neurons = [];
    this.neuronCount = neuronCount;
    this.testResults = {
      registrations: { success: 0, failure: 0 },
      configPushes: { success: 0, failure: 0, latency: [] },
      experiments: { success: 0, failure: 0 },
      failures: { detected: 0, recovered: 0 },
      analytics: { sent: 0, failed: 0 }
    };
    this.baseUrl = 'http://localhost:5000';
  }

  async initialize() {
    console.log(`🚀 Initializing stress test with ${this.neuronCount} neurons...`);
    
    for (let i = 1; i <= this.neuronCount; i++) {
      const neuron = new MockNeuron(i, this.baseUrl);
      this.neurons.push(neuron);
    }

    console.log(`✅ Created ${this.neurons.length} mock neurons`);
  }

  async registerAllNeurons() {
    console.log(`📡 Registering all ${this.neurons.length} neurons...`);
    const startTime = performance.now();

    const registrationPromises = this.neurons.map(async (neuron) => {
      const success = await neuron.register();
      if (success) {
        this.testResults.registrations.success++;
      } else {
        this.testResults.registrations.failure++;
      }
      return success;
    });

    await Promise.all(registrationPromises);
    const endTime = performance.now();

    console.log(`📊 Registration Results:`);
    console.log(`   Success: ${this.testResults.registrations.success}`);
    console.log(`   Failure: ${this.testResults.registrations.failure}`);
    console.log(`   Total Time: ${Math.round(endTime - startTime)}ms`);
  }

  async testBulkConfigPush() {
    console.log(`⚙️ Testing bulk configuration push...`);
    const startTime = performance.now();

    const testConfig = {
      version: '2.0.0',
      settings: {
        timeout: 30000,
        retries: 3,
        logLevel: 'info',
        features: ['analytics', 'experiments', 'ai_optimization']
      },
      timestamp: Date.now()
    };

    try {
      const response = await axios.post(`${this.baseUrl}/api/federation/configs/broadcast`, {
        configData: testConfig,
        deployedBy: 'stress-test-orchestrator'
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      this.testResults.configPushes.latency.push(latency);
      
      if (response.data.success) {
        this.testResults.configPushes.success++;
        console.log(`✅ Bulk config push succeeded in ${Math.round(latency)}ms`);
        console.log(`   Sent: ${response.data.sent}/${response.data.total} neurons`);
      } else {
        this.testResults.configPushes.failure++;
        console.log(`❌ Bulk config push failed`);
      }
    } catch (error) {
      this.testResults.configPushes.failure++;
      console.error(`❌ Config push error:`, error.message);
    }
  }

  async testFailureModes() {
    console.log(`💥 Testing failure modes...`);

    // Select random neurons for different failure modes
    const offlineNeurons = this.neurons.slice(0, 3);
    const badConfigNeurons = this.neurons.slice(3, 6);
    const analyticsFailNeurons = this.neurons.slice(6, 9);

    // Simulate offline neurons
    for (const neuron of offlineNeurons) {
      neuron.simulateFailure('offline');
    }

    // Simulate bad config neurons
    for (const neuron of badConfigNeurons) {
      neuron.simulateFailure('bad_config');
    }

    // Simulate analytics failures
    for (const neuron of analyticsFailNeurons) {
      neuron.simulateFailure('analytics_fail');
    }

    // Wait for failures to propagate
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test config push with failures
    await this.testBulkConfigPush();

    // Recovery test
    console.log(`🔄 Testing recovery...`);
    for (const neuron of [...offlineNeurons, ...badConfigNeurons, ...analyticsFailNeurons]) {
      neuron.recover();
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  async testRaceConditions() {
    console.log(`🏁 Testing race conditions...`);

    const config1 = { version: '3.0.0', admin: 'admin1', timestamp: Date.now() };
    const config2 = { version: '3.0.1', admin: 'admin2', timestamp: Date.now() + 1 };

    // Simulate simultaneous config pushes
    const promises = [
      axios.post(`${this.baseUrl}/api/federation/configs/broadcast`, {
        configData: config1,
        deployedBy: 'admin1'
      }),
      axios.post(`${this.baseUrl}/api/federation/configs/broadcast`, {
        configData: config2,
        deployedBy: 'admin2'
      })
    ];

    try {
      const results = await Promise.allSettled(promises);
      console.log(`🏁 Race condition results:`, results.map(r => r.status));
    } catch (error) {
      console.error(`❌ Race condition test error:`, error.message);
    }
  }

  async monitorSystemHealth() {
    console.log(`🔍 Monitoring system health...`);

    try {
      const healthResponse = await axios.get(`${this.baseUrl}/api/federation/health/overview`);
      const statusResponse = await axios.get(`${this.baseUrl}/api/federation/status`);
      const wsResponse = await axios.get(`${this.baseUrl}/api/federation/websocket/status`);

      console.log(`📊 System Health:`);
      console.log(`   Total Neurons: ${healthResponse.data.data?.total || 0}`);
      console.log(`   Healthy: ${healthResponse.data.data?.healthy || 0}`);
      console.log(`   Warning: ${healthResponse.data.data?.warning || 0}`);
      console.log(`   Critical: ${healthResponse.data.data?.critical || 0}`);
      console.log(`   WebSocket Connections: ${wsResponse.data.data?.totalConnections || 0}`);
      
    } catch (error) {
      console.error(`❌ Health monitoring error:`, error.message);
    }
  }

  async runFullStressTest() {
    console.log(`🎯 Starting Full Stress Test...`);
    const overallStart = performance.now();

    try {
      // Phase 1: Registration
      await this.registerAllNeurons();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Phase 2: Health monitoring
      await this.monitorSystemHealth();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 3: Bulk operations
      for (let i = 0; i < 3; i++) {
        await this.testBulkConfigPush();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Phase 4: Failure modes
      await this.testFailureModes();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Phase 5: Race conditions
      await this.testRaceConditions();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 6: Final health check
      await this.monitorSystemHealth();

    } catch (error) {
      console.error(`❌ Stress test error:`, error);
    }

    const overallEnd = performance.now();
    console.log(`\n🎯 Stress Test Complete!`);
    console.log(`   Total Time: ${Math.round(overallEnd - overallStart)}ms`);
    this.printResults();
  }

  printResults() {
    console.log(`\n📊 STRESS TEST RESULTS:`);
    console.log(`========================================`);
    console.log(`Registrations:`);
    console.log(`  ✅ Success: ${this.testResults.registrations.success}`);
    console.log(`  ❌ Failure: ${this.testResults.registrations.failure}`);
    
    console.log(`\nConfig Pushes:`);
    console.log(`  ✅ Success: ${this.testResults.configPushes.success}`);
    console.log(`  ❌ Failure: ${this.testResults.configPushes.failure}`);
    
    if (this.testResults.configPushes.latency.length > 0) {
      const avgLatency = this.testResults.configPushes.latency.reduce((a, b) => a + b, 0) / this.testResults.configPushes.latency.length;
      const maxLatency = Math.max(...this.testResults.configPushes.latency);
      console.log(`  📊 Avg Latency: ${Math.round(avgLatency)}ms`);
      console.log(`  📊 Max Latency: ${Math.round(maxLatency)}ms`);
    }

    console.log(`\n🎯 System Status: ${this.getOverallStatus()}`);
  }

  getOverallStatus() {
    const successRate = this.testResults.registrations.success / this.neuronCount;
    if (successRate >= 0.95) return '🟢 EXCELLENT';
    if (successRate >= 0.9) return '🟡 GOOD';
    if (successRate >= 0.8) return '🟠 ACCEPTABLE';
    return '🔴 NEEDS IMPROVEMENT';
  }

  async cleanup() {
    console.log(`🧹 Cleaning up all test neurons...`);
    const cleanupPromises = this.neurons.map(neuron => neuron.cleanup());
    await Promise.allSettled(cleanupPromises);
    console.log(`✅ Cleanup complete`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const neuronCount = parseInt(args[0]) || 20;
  
  console.log(`🚀 Neuron Federation Stress Test`);
  console.log(`   Target Neurons: ${neuronCount}`);
  console.log(`   Test ID: ${process.env.TEST_ID || 'default'}`);
  console.log(`========================================\n`);

  const orchestrator = new StressTestOrchestrator(neuronCount);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n🛑 Shutting down stress test...`);
    await orchestrator.cleanup();
    process.exit(0);
  });

  try {
    await orchestrator.initialize();
    await orchestrator.runFullStressTest();
  } catch (error) {
    console.error(`❌ Test failed:`, error);
  } finally {
    // Keep running for monitoring unless explicitly stopped
    if (!process.env.AUTO_CLEANUP) {
      console.log(`\n🔄 Test neurons will continue running for monitoring.`);
      console.log(`   Press Ctrl+C to cleanup and exit.`);
    } else {
      await orchestrator.cleanup();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MockNeuron, StressTestOrchestrator };