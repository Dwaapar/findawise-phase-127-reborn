import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import crypto from 'crypto';

// ===========================================
// FEDERATION WEBSOCKET MANAGER
// ===========================================

interface ConnectedNeuron {
  neuronId: string;
  ws: WebSocket;
  lastPing: Date;
  isAlive: boolean;
  metadata: Record<string, any>;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, ConnectedNeuron>();
  private pingInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  /**
   * Initialize WebSocket server
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔌 Initializing Federation WebSocket Manager...');

    try {
      // Create WebSocket server
      this.wss = new WebSocketServer({ 
        port: 0, // Let the system assign a port
        path: '/federation-ws'
      });

      this.wss.on('connection', (ws, req) => {
        console.log('🔗 New WebSocket connection from', req.socket.remoteAddress);
        this.handleConnection(ws, req);
      });

      this.startPingInterval();
      this.initialized = true;

      console.log('✅ Federation WebSocket Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket Manager:', error);
      throw error;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const connectionId = crypto.randomUUID();
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message, connectionId);
      } catch (error) {
        console.error('❌ Invalid message format:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed:', connectionId);
      this.removeConnection(connectionId);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.removeConnection(connectionId);
    });

    // Send connection acknowledgment
    ws.send(JSON.stringify({ 
      type: 'connection_ack', 
      connectionId,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(ws: WebSocket, message: any, connectionId: string): void {
    switch (message.type) {
      case 'neuron_register':
        this.registerNeuron(ws, message.neuronId, message.metadata || {});
        break;
      
      case 'ping':
        this.handlePing(ws, message.neuronId);
        break;
      
      case 'pong':
        this.handlePong(message.neuronId);
        break;
      
      case 'status_update':
        this.handleStatusUpdate(message.neuronId, message.status);
        break;
      
      default:
        console.log('📨 Received message:', message.type, 'from', connectionId);
    }
  }

  /**
   * Register a neuron with WebSocket connection
   */
  private registerNeuron(ws: WebSocket, neuronId: string, metadata: Record<string, any>): void {
    console.log(`🔗 Registering neuron: ${neuronId}`);

    this.connections.set(neuronId, {
      neuronId,
      ws,
      lastPing: new Date(),
      isAlive: true,
      metadata
    });

    ws.send(JSON.stringify({
      type: 'neuron_registered',
      neuronId,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Send message to specific neuron
   */
  async sendToNeuron(
    neuronId: string, 
    message: any, 
    timeout: number = 30000
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const connection = this.connections.get(neuronId);
    
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return { 
        success: false, 
        error: `Neuron ${neuronId} not connected` 
      };
    }

    return new Promise((resolve) => {
      const messageId = crypto.randomUUID();
      const timeoutId = setTimeout(() => {
        resolve({ success: false, error: 'Timeout waiting for response' });
      }, timeout);

      const messageWithId = {
        ...message,
        messageId,
        timestamp: new Date().toISOString()
      };

      // Listen for response
      const responseHandler = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.replyTo === messageId) {
            clearTimeout(timeoutId);
            connection.ws.off('message', responseHandler);
            resolve({ success: true, data: response });
          }
        } catch (error) {
          // Ignore parsing errors for other messages
        }
      };

      connection.ws.on('message', responseHandler);
      connection.ws.send(JSON.stringify(messageWithId));
    });
  }

  /**
   * Broadcast message to all connected neurons
   */
  async broadcast(message: any): Promise<{ sent: number; total: number; errors: string[] }> {
    const errors: string[] = [];
    let sent = 0;
    const total = this.connections.size;

    const broadcastMessage = {
      ...message,
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    for (const [neuronId, connection] of this.connections.entries()) {
      try {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify(broadcastMessage));
          sent++;
        } else {
          errors.push(`Neuron ${neuronId} not ready`);
        }
      } catch (error) {
        errors.push(`Failed to send to ${neuronId}: ${error}`);
      }
    }

    return { sent, total, errors };
  }

  /**
   * Ping specific neuron
   */
  async pingNeuron(neuronId: string): Promise<{ success: boolean; responseTime?: number; metrics?: any }> {
    const startTime = Date.now();
    
    const result = await this.sendToNeuron(neuronId, { type: 'ping' }, 5000);
    
    if (result.success) {
      const responseTime = Date.now() - startTime;
      return {
        success: true,
        responseTime,
        metrics: {
          responseTime,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    return { success: false };
  }

  /**
   * Get active connections
   */
  getActiveConnections(): Record<string, any> {
    const connections: Record<string, any> = {};
    
    for (const [neuronId, connection] of this.connections.entries()) {
      connections[neuronId] = {
        connected: connection.ws.readyState === WebSocket.OPEN,
        lastPing: connection.lastPing,
        isAlive: connection.isAlive,
        metadata: connection.metadata
      };
    }
    
    return connections;
  }

  /**
   * Get connection status summary
   */
  getConnectionStatus(): { total: number; by_neuron: Record<string, number> } {
    const by_neuron: Record<string, number> = {};
    let total = 0;

    for (const [neuronId, connection] of this.connections.entries()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        by_neuron[neuronId] = 1;
        total++;
      } else {
        by_neuron[neuronId] = 0;
      }
    }

    return { total, by_neuron };
  }

  /**
   * Get connected neurons list
   */
  async getConnectedNeurons(): Promise<string[]> {
    const connected: string[] = [];
    
    for (const [neuronId, connection] of this.connections.entries()) {
      if (connection.ws.readyState === WebSocket.OPEN && connection.isAlive) {
        connected.push(neuronId);
      }
    }
    
    return connected;
  }

  /**
   * Check if neuron is connected
   */
  isNeuronConnected(neuronId: string): boolean {
    const connection = this.connections.get(neuronId);
    return connection ? 
      connection.ws.readyState === WebSocket.OPEN && connection.isAlive : 
      false;
  }

  /**
   * Broadcast configuration to all neurons
   */
  async broadcastConfigToAll(configData: any, deployedBy: string): Promise<any> {
    const message = {
      type: 'config_update',
      configData,
      deployedBy,
      timestamp: new Date().toISOString()
    };

    const results = await this.broadcast(message);
    
    return {
      sent: results.sent,
      total: results.total,
      results: results.errors.map(error => ({ error }))
    };
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private handlePing(ws: WebSocket, neuronId: string): void {
    const connection = this.connections.get(neuronId);
    if (connection) {
      connection.lastPing = new Date();
      connection.isAlive = true;
    }

    ws.send(JSON.stringify({ 
      type: 'pong', 
      timestamp: new Date().toISOString() 
    }));
  }

  private handlePong(neuronId: string): void {
    const connection = this.connections.get(neuronId);
    if (connection) {
      connection.lastPing = new Date();
      connection.isAlive = true;
    }
  }

  private handleStatusUpdate(neuronId: string, status: any): void {
    const connection = this.connections.get(neuronId);
    if (connection) {
      connection.metadata.status = status;
      connection.lastPing = new Date();
    }
  }

  private removeConnection(connectionId: string): void {
    // Find and remove connection by ID
    for (const [neuronId, connection] of this.connections.entries()) {
      if (connection.ws.readyState === WebSocket.CLOSED) {
        this.connections.delete(neuronId);
        console.log(`🔌 Removed connection for neuron: ${neuronId}`);
        break;
      }
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      for (const [neuronId, connection] of this.connections.entries()) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          // Mark as not alive, will be set to true on pong
          connection.isAlive = false;
          
          // Send ping
          connection.ws.send(JSON.stringify({ type: 'ping' }));
          
          // Check if connection is stale
          const timeSinceLastPing = Date.now() - connection.lastPing.getTime();
          if (timeSinceLastPing > 60000) { // 1 minute
            console.log(`🔌 Terminating stale connection: ${neuronId}`);
            connection.ws.terminate();
          }
        } else {
          this.connections.delete(neuronId);
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Shutdown WebSocket manager
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down WebSocket Manager...');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Close all connections
    for (const connection of this.connections.values()) {
      connection.ws.close();
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    this.connections.clear();
    this.initialized = false;
    
    console.log('✅ WebSocket Manager shutdown complete');
  }
}

export const webSocketManager = new WebSocketManager();