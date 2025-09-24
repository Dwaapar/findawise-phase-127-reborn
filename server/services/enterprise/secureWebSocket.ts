// Enterprise-Grade Secure WebSocket Manager
// JWT Authentication & Authorization for Billion-Dollar Empire

import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';
import { userSessions, performanceLogs } from '../../../shared/schema';
import { eq, and, gte } from 'drizzle-orm';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  permissions?: string[];
  lastActivity?: Date;
  connectionId?: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  messageId: string;
}

interface ConnectionMetrics {
  totalConnections: number;
  authenticatedConnections: number;
  unauthorizedAttempts: number;
  messagesPerSecond: number;
  bandwidthUsage: number;
}

export class SecureWebSocketManager extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, AuthenticatedWebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private messageBuffer: Map<string, WebSocketMessage[]> = new Map();
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    authenticatedConnections: 0,
    unauthorizedAttempts: 0,
    messagesPerSecond: 0,
    bandwidthUsage: 0
  };

  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private readonly MAX_CONNECTIONS_PER_USER = 5;
  private readonly RATE_LIMIT_MESSAGES = 100; // per minute
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TIMEOUT = 60000; // 60 seconds

  constructor(server: any) {
    super();
    this.setupWebSocketServer(server);
    this.startMetricsCollection();
    this.startHeartbeat();
  }

  private setupWebSocketServer(server: any): void {
    console.log('🔐 Setting up Secure WebSocket Server...');

    this.wss = new WebSocketServer({
      server,
      path: '/secure-ws',
      verifyClient: (info) => {
        // Initial verification - full auth happens after connection
        return this.verifyInitialConnection(info);
      }
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      this.handleNewConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket Server Error:', error);
      this.logSecurityEvent('server_error', { error: error.message });
    });

    console.log('✅ Secure WebSocket Server initialized');
  }

  private verifyInitialConnection(info: any): boolean {
    try {
      // Check IP whitelist, rate limits, etc.
      const clientIP = info.req.connection.remoteAddress;
      
      // Rate limit check
      if (this.isRateLimited(clientIP)) {
        this.logSecurityEvent('rate_limit_exceeded', { ip: clientIP });
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Initial connection verification failed:', error);
      return false;
    }
  }

  private async handleNewConnection(ws: AuthenticatedWebSocket, request: any): Promise<void> {
    const connectionId = uuidv4();
    ws.connectionId = connectionId;
    ws.lastActivity = new Date();

    console.log(`🔌 New WebSocket connection: ${connectionId}`);

    // Set connection timeout
    const timeout = setTimeout(() => {
      if (!ws.userId) {
        this.logSecurityEvent('authentication_timeout', { connectionId });
        ws.terminate();
      }
    }, this.CONNECTION_TIMEOUT);

    // Handle authentication message
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (!ws.userId && message.type === 'authenticate') {
          await this.authenticateConnection(ws, message.token, timeout);
        } else if (ws.userId) {
          await this.handleAuthenticatedMessage(ws, message);
        } else {
          this.logSecurityEvent('unauthorized_message', { 
            connectionId, 
            messageType: message.type 
          });
          ws.terminate();
        }
      } catch (error) {
        console.error('❌ Message handling error:', error);
        this.logSecurityEvent('message_error', { 
          connectionId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        ws.terminate();
      }
    });

    // Handle connection close
    ws.on('close', (code: number, reason: Buffer) => {
      this.handleConnectionClose(ws, code, reason.toString());
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      this.handleConnectionError(ws, error);
    });

    // Update metrics
    this.metrics.totalConnections++;
  }

  private async authenticateConnection(
    ws: AuthenticatedWebSocket, 
    token: string, 
    timeout: NodeJS.Timeout
  ): Promise<void> {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      if (!decoded.userId || !decoded.sessionId) {
        throw new Error('Invalid token payload');
      }

      // Verify session in database
      const session = await this.verifySession(decoded.sessionId, decoded.userId);
      if (!session) {
        throw new Error('Invalid session');
      }

      // Check if user has too many connections
      const userConnections = this.userConnections.get(decoded.userId);
      if (userConnections && userConnections.size >= this.MAX_CONNECTIONS_PER_USER) {
        throw new Error('Maximum connections per user exceeded');
      }

      // Authentication successful
      clearTimeout(timeout);
      
      ws.userId = decoded.userId;
      ws.sessionId = decoded.sessionId;
      ws.permissions = decoded.permissions || [];
      
      // Register connection
      this.connections.set(ws.connectionId!, ws);
      
      if (!this.userConnections.has(decoded.userId)) {
        this.userConnections.set(decoded.userId, new Set());
      }
      this.userConnections.get(decoded.userId)!.add(ws.connectionId!);

      // Update metrics
      this.metrics.authenticatedConnections++;

      // Send authentication success
      this.sendMessage(ws, {
        type: 'auth_success',
        data: { 
          connectionId: ws.connectionId,
          permissions: ws.permissions 
        }
      });

      // Log successful authentication
      this.logSecurityEvent('authentication_success', {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        connectionId: ws.connectionId
      });

      this.emit('user:connected', { 
        userId: decoded.userId, 
        connectionId: ws.connectionId 
      });

    } catch (error) {
      this.metrics.unauthorizedAttempts++;
      
      this.logSecurityEvent('authentication_failed', {
        connectionId: ws.connectionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Send error and close connection
      this.sendMessage(ws, {
        type: 'auth_error',
        data: { message: 'Authentication failed' }
      });

      setTimeout(() => ws.terminate(), 1000);
    }
  }

  private async verifySession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const [session] = await db.select()
        .from(userSessions)
        .where(and(
          eq(userSessions.sessionId, sessionId),
          eq(userSessions.userId, userId),
          eq(userSessions.isActive, true),
          gte(userSessions.expiresAt, new Date())
        ))
        .limit(1);

      return !!session;
    } catch (error) {
      console.error('❌ Session verification error:', error);
      return false;
    }
  }

  private async handleAuthenticatedMessage(
    ws: AuthenticatedWebSocket, 
    message: any
  ): Promise<void> {
    try {
      // Rate limiting
      if (this.isUserRateLimited(ws.userId!)) {
        this.sendMessage(ws, {
          type: 'rate_limit_error',
          data: { message: 'Rate limit exceeded' }
        });
        return;
      }

      // Update activity
      ws.lastActivity = new Date();

      // Permission check
      if (!this.hasPermission(ws, message.type)) {
        this.logSecurityEvent('permission_denied', {
          userId: ws.userId,
          messageType: message.type,
          permissions: ws.permissions
        });
        
        this.sendMessage(ws, {
          type: 'permission_error',
          data: { message: 'Insufficient permissions' }
        });
        return;
      }

      // Process message
      await this.processMessage(ws, message);

    } catch (error) {
      console.error('❌ Authenticated message handling error:', error);
      this.sendMessage(ws, {
        type: 'error',
        data: { message: 'Message processing failed' }
      });
    }
  }

  private async processMessage(ws: AuthenticatedWebSocket, message: any): Promise<void> {
    const messageWithMetadata: WebSocketMessage = {
      type: message.type,
      data: message.data,
      timestamp: new Date(),
      messageId: uuidv4()
    };

    switch (message.type) {
      case 'subscribe':
        await this.handleSubscription(ws, message.data);
        break;
      case 'unsubscribe':
        await this.handleUnsubscription(ws, message.data);
        break;
      case 'federation_command':
        await this.handleFederationCommand(ws, message.data);
        break;
      case 'metrics_request':
        await this.handleMetricsRequest(ws, message.data);
        break;
      case 'ping':
        this.sendMessage(ws, { type: 'pong', data: { timestamp: new Date() } });
        break;
      default:
        // Forward to appropriate handler
        this.emit('message:received', { ws, message: messageWithMetadata });
    }
  }

  private async handleSubscription(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    const { channel, filters } = data;
    
    // Store subscription
    if (!this.messageBuffer.has(ws.connectionId!)) {
      this.messageBuffer.set(ws.connectionId!, []);
    }
    
    this.emit('subscription:added', { 
      userId: ws.userId, 
      connectionId: ws.connectionId, 
      channel, 
      filters 
    });

    this.sendMessage(ws, {
      type: 'subscription_success',
      data: { channel, status: 'subscribed' }
    });
  }

  private async handleFederationCommand(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!this.hasPermission(ws, 'federation_admin')) {
      throw new Error('Insufficient permissions for federation commands');
    }

    this.emit('federation:command', { 
      userId: ws.userId, 
      command: data,
      connectionId: ws.connectionId 
    });
  }

  private hasPermission(ws: AuthenticatedWebSocket, action: string): boolean {
    if (!ws.permissions) return false;
    
    // Admin has all permissions
    if (ws.permissions.includes('admin')) return true;
    
    // Check specific permissions
    const permissionMap: Record<string, string[]> = {
      'subscribe': ['user', 'admin'],
      'federation_command': ['federation_admin', 'admin'],
      'metrics_request': ['analytics', 'admin'],
      'ping': ['user', 'admin']
    };

    const requiredPermissions = permissionMap[action] || [];
    return requiredPermissions.some(perm => ws.permissions!.includes(perm));
  }

  private isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const limit = this.rateLimiter.get(identifier);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimiter.set(identifier, {
        count: 1,
        resetTime: now + 60000 // 1 minute
      });
      return false;
    }
    
    if (limit.count >= this.RATE_LIMIT_MESSAGES) {
      return true;
    }
    
    limit.count++;
    return false;
  }

  private isUserRateLimited(userId: string): boolean {
    return this.isRateLimited(`user:${userId}`);
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify({
          ...message,
          timestamp: new Date(),
          messageId: uuidv4()
        });
        
        ws.send(messageStr);
        this.metrics.bandwidthUsage += messageStr.length;
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    }
  }

  private handleConnectionClose(ws: AuthenticatedWebSocket, code: number, reason: string): void {
    console.log(`🔌 WebSocket disconnected: ${ws.connectionId} (${code}: ${reason})`);
    
    if (ws.connectionId) {
      this.connections.delete(ws.connectionId);
      
      if (ws.userId) {
        const userConnections = this.userConnections.get(ws.userId);
        if (userConnections) {
          userConnections.delete(ws.connectionId);
          if (userConnections.size === 0) {
            this.userConnections.delete(ws.userId);
          }
        }
        this.metrics.authenticatedConnections--;
        
        this.emit('user:disconnected', { 
          userId: ws.userId, 
          connectionId: ws.connectionId 
        });
      }
      
      this.messageBuffer.delete(ws.connectionId);
    }
    
    this.metrics.totalConnections--;
  }

  private handleConnectionError(ws: AuthenticatedWebSocket, error: Error): void {
    console.error(`❌ WebSocket error for ${ws.connectionId}:`, error);
    
    this.logSecurityEvent('connection_error', {
      connectionId: ws.connectionId,
      userId: ws.userId,
      error: error.message
    });
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.connections.forEach((ws, connectionId) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Check for inactive connections
          const inactiveTime = Date.now() - (ws.lastActivity?.getTime() || 0);
          
          if (inactiveTime > this.CONNECTION_TIMEOUT * 2) {
            console.log(`🔌 Terminating inactive connection: ${connectionId}`);
            ws.terminate();
          } else {
            // Send heartbeat
            this.sendMessage(ws, { type: 'heartbeat', data: { timestamp: new Date() } });
          }
        } else {
          // Clean up closed connections
          this.handleConnectionClose(ws, 1006, 'Connection lost');
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      // Reset per-second metrics
      this.metrics.messagesPerSecond = 0;
      
      this.emit('metrics:updated', this.metrics);
    }, 1000);
  }

  private async logSecurityEvent(eventType: string, data: any): Promise<void> {
    try {
      await db.insert(performanceLogs).values({
        level: 'security',
        component: 'secure_websocket',
        message: `Security Event: ${eventType}`,
        metadata: JSON.stringify({ eventType, ...data }),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Error logging security event:', error);
    }
  }

  // Public API Methods
  public broadcastToUser(userId: string, message: any): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.forEach(connectionId => {
        const ws = this.connections.get(connectionId);
        if (ws) {
          this.sendMessage(ws, message);
        }
      });
    }
  }

  public broadcastToAllUsers(message: any, permissions?: string[]): void {
    this.connections.forEach(ws => {
      if (ws.userId) {
        // Check permissions if specified
        if (permissions && !permissions.some(perm => ws.permissions?.includes(perm))) {
          return;
        }
        
        this.sendMessage(ws, message);
      }
    });
  }

  public getConnectionMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public getUserConnections(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  public disconnectUser(userId: string, reason: string = 'Admin disconnect'): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.forEach(connectionId => {
        const ws = this.connections.get(connectionId);
        if (ws) {
          this.sendMessage(ws, {
            type: 'disconnect',
            data: { reason }
          });
          setTimeout(() => ws.terminate(), 1000);
        }
      });
    }
  }

  public async shutdown(): Promise<void> {
    console.log('🔻 Shutting down Secure WebSocket Server...');
    
    // Notify all clients
    this.broadcastToAllUsers({
      type: 'server_shutdown',
      data: { message: 'Server is shutting down' }
    });

    // Close all connections
    this.connections.forEach(ws => {
      ws.terminate();
    });

    // Close server
    if (this.wss) {
      this.wss.close();
    }

    // Clean up
    this.connections.clear();
    this.userConnections.clear();
    this.messageBuffer.clear();
    this.rateLimiter.clear();
    
    this.removeAllListeners();
    
    console.log('✅ Secure WebSocket Server shut down');
  }
}

// Handle missing methods for compatibility
export class SecureWebSocketManager_Extended extends SecureWebSocketManager {
  private async handleUnsubscription(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    const { channel } = data;
    
    this.emit('subscription:removed', { 
      userId: ws.userId, 
      connectionId: ws.connectionId, 
      channel 
    });

    this.sendMessage(ws, {
      type: 'unsubscription_success',
      data: { channel, status: 'unsubscribed' }
    });
  }

  private async handleMetricsRequest(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    const metrics = this.getConnectionMetrics();
    
    this.sendMessage(ws, {
      type: 'metrics_response',
      data: metrics
    });
  }
}

export { AuthenticatedWebSocket, WebSocketMessage, ConnectionMetrics };