/**
 * ENTERPRISE SECURITY HARDENING SERVICE
 * JWT Authentication, Rate Limiting, RBAC, and Advanced Security
 */

import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Security Configuration Schema
const SecurityConfigSchema = z.object({
  jwtSecret: z.string().min(32),
  jwtExpirationTime: z.string().default('24h'),
  rateLimitWindowMs: z.number().default(15 * 60 * 1000), // 15 minutes
  rateLimitMaxRequests: z.number().default(100),
  allowedIPs: z.array(z.string()).optional(),
  blockedIPs: z.array(z.string()).default([]),
  corsOrigins: z.array(z.string()).default(['*']),
  encryptionKey: z.string().min(32)
});

type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

// User Role Schema for RBAC
const UserRoleSchema = z.enum(['admin', 'neuron', 'user', 'viewer']);
type UserRole = z.infer<typeof UserRoleSchema>;

// JWT Payload Schema
const JWTPayloadSchema = z.object({
  userId: z.string(),
  role: UserRoleSchema,
  neuronId: z.string().optional(),
  permissions: z.array(z.string()),
  sessionId: z.string(),
  iat: z.number(),
  exp: z.number()
});

type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// Rate Limiting Store
interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

export class EnterpriseSecurity {
  private config: SecurityConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private failedAttempts: Map<string, { count: number; lockUntil: number }> = new Map();
  private activeSessions: Map<string, JWTPayload> = new Map();

  constructor() {
    this.config = {
      jwtSecret: process.env.JWT_SECRET || this.generateSecureSecret(),
      jwtExpirationTime: process.env.JWT_EXPIRATION || '24h',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      allowedIPs: process.env.ALLOWED_IPS?.split(','),
      blockedIPs: process.env.BLOCKED_IPS?.split(',') || [],
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
      encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecureSecret()
    };

    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set - using generated secret (not suitable for production)');
    }

    console.log('🔒 Enterprise Security initialized with hardened configuration');
  }

  /**
   * Generate JWT Token with Enhanced Security
   */
  generateJWT(payload: {
    userId: string;
    role: UserRole;
    neuronId?: string;
    permissions?: string[];
    sessionId: string;
  }): string {
    const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: payload.userId,
      role: payload.role,
      neuronId: payload.neuronId,
      permissions: payload.permissions || this.getDefaultPermissions(payload.role),
      sessionId: payload.sessionId
    };

    const token = jwt.sign(jwtPayload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpirationTime,
      issuer: 'findawise-empire',
      audience: 'federation-api',
      algorithm: 'HS256'
    } as jwt.SignOptions);

    // Store active session
    const decodedPayload = jwt.decode(token) as JWTPayload;
    this.activeSessions.set(payload.sessionId, decodedPayload);

    return token;
  }

  /**
   * Verify and Validate JWT Token
   */
  verifyJWT(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret, {
        issuer: 'findawise-empire',
        audience: 'federation-api',
        algorithms: ['HS256']
      }) as JWTPayload;

      // Check if session is still active
      const activeSession = this.activeSessions.get(payload.sessionId);
      if (!activeSession) {
        throw new Error('Session expired or invalid');
      }

      return JWTPayloadSchema.parse(payload);
    } catch (error) {
      console.warn('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Enterprise JWT Authentication Middleware
   */
  authenticateJWT() {
    return (req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) => {
      const authHeader = req.header('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'JWT token required',
          code: 'MISSING_TOKEN'
        });
      }

      const payload = this.verifyJWT(token);
      if (!payload) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }

      req.user = payload;
      next();
    };
  }

  /**
   * Role-Based Access Control (RBAC) Middleware
   */
  requireRole(allowedRoles: UserRole | UserRole[]) {
    return (req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required role: ${roles.join(' or ')}`,
          code: 'INSUFFICIENT_ROLE'
        });
      }

      next();
    };
  }

  /**
   * Permission-Based Access Control
   */
  requirePermission(requiredPermissions: string | string[]) {
    return (req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const hasPermission = permissions.some(permission => 
        req.user!.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required permission: ${permissions.join(' or ')}`,
          code: 'INSUFFICIENT_PERMISSION'
        });
      }

      next();
    };
  }

  /**
   * Advanced Rate Limiting with IP-based tracking
   */
  rateLimiter() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = this.getClientIP(req);
      
      // Check if IP is blocked
      if (this.config.blockedIPs.includes(clientIP)) {
        return res.status(403).json({
          error: 'IP blocked',
          code: 'IP_BLOCKED'
        });
      }

      // Check if IP is allowed (if whitelist is configured)
      if (this.config.allowedIPs && !this.config.allowedIPs.includes(clientIP)) {
        return res.status(403).json({
          error: 'IP not allowed',
          code: 'IP_NOT_WHITELISTED'
        });
      }

      const now = Date.now();
      const key = `rate_limit:${clientIP}`;
      const entry = this.rateLimitStore.get(key);

      if (!entry || now > entry.resetTime) {
        // Reset rate limit window
        this.rateLimitStore.set(key, {
          requests: 1,
          resetTime: now + this.config.rateLimitWindowMs
        });
        return next();
      }

      if (entry.requests >= this.config.rateLimitMaxRequests) {
        // Rate limit exceeded
        res.set({
          'X-RateLimit-Limit': this.config.rateLimitMaxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
        });

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again after ${Math.ceil((entry.resetTime - now) / 1000)} seconds`,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      // Increment request count
      entry.requests++;
      this.rateLimitStore.set(key, entry);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.config.rateLimitMaxRequests.toString(),
        'X-RateLimit-Remaining': (this.config.rateLimitMaxRequests - entry.requests).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
      });

      next();
    };
  }

  /**
   * Brute Force Protection
   */
  bruteForceProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = this.getClientIP(req);
      const key = `brute_force:${clientIP}`;
      const attempt = this.failedAttempts.get(key);

      if (attempt && Date.now() < attempt.lockUntil) {
        const lockTimeRemaining = Math.ceil((attempt.lockUntil - Date.now()) / 1000);
        return res.status(423).json({
          error: 'Account temporarily locked',
          message: `Too many failed attempts. Try again in ${lockTimeRemaining} seconds`,
          code: 'BRUTE_FORCE_LOCKED'
        });
      }

      next();
    };
  }

  /**
   * Record Failed Authentication Attempt
   */
  recordFailedAttempt(ip: string): void {
    const key = `brute_force:${ip}`;
    const attempt = this.failedAttempts.get(key) || { count: 0, lockUntil: 0 };

    attempt.count++;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (attempt.count >= 5) {
      attempt.lockUntil = Date.now() + (15 * 60 * 1000);
      console.warn(`🚨 IP ${ip} locked due to ${attempt.count} failed attempts`);
    }

    this.failedAttempts.set(key, attempt);
  }

  /**
   * Clear Failed Attempts (successful login)
   */
  clearFailedAttempts(ip: string): void {
    this.failedAttempts.delete(`brute_force:${ip}`);
  }

  /**
   * WebSocket Security Validation
   */
  validateWebSocketConnection(token: string, clientIP: string): {
    valid: boolean;
    user?: JWTPayload;
    error?: string;
  } {
    // Remove old user-agent bypass - enforce JWT only
    const payload = this.verifyJWT(token);
    
    if (!payload) {
      return { valid: false, error: 'Invalid or expired JWT token' };
    }

    // Check IP restrictions
    if (this.config.blockedIPs.includes(clientIP)) {
      return { valid: false, error: 'IP address blocked' };
    }

    if (this.config.allowedIPs && !this.config.allowedIPs.includes(clientIP)) {
      return { valid: false, error: 'IP address not whitelisted' };
    }

    return { valid: true, user: payload };
  }

  /**
   * Security Headers Middleware
   */
  securityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      });
      next();
    };
  }

  /**
   * Audit Logging for Security Events
   */
  auditLog(event: {
    type: 'AUTH' | 'ACCESS' | 'SECURITY' | 'ERROR';
    action: string;
    userId?: string;
    ip: string;
    userAgent: string;
    details?: Record<string, any>;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event.type,
      action: event.action,
      userId: event.userId || 'anonymous',
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details || {}
    };

    // In production, send to security monitoring service (Datadog, Splunk, etc.)
    console.log('🔍 SECURITY AUDIT:', JSON.stringify(logEntry));
    
    // Store critical security events in database
    if (['BRUTE_FORCE', 'UNAUTHORIZED_ACCESS', 'JWT_FRAUD'].includes(event.action)) {
      this.storeSecurityIncident(logEntry);
    }
  }

  // Helper Methods
  private getDefaultPermissions(role: UserRole): string[] {
    switch (role) {
      case 'admin':
        return ['*']; // All permissions
      case 'neuron':
        return ['neuron:read', 'neuron:write', 'federation:connect'];
      case 'user':
        return ['user:read', 'content:view'];
      case 'viewer':
        return ['content:view'];
      default:
        return [];
    }
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           '127.0.0.1';
  }

  private generateSecureSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return Array.from({ length: 64 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  private async storeSecurityIncident(incident: any): Promise<void> {
    // Store in database for compliance and monitoring
    // This would integrate with your logging/monitoring stack
    console.warn('🚨 CRITICAL SECURITY INCIDENT:', incident);
  }

  /**
   * Revoke Session/Token
   */
  revokeSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  /**
   * Get Active Sessions Count
   */
  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Clean Expired Sessions
   */
  cleanExpiredSessions(): void {
    const now = Date.now() / 1000; // JWT uses seconds
    
    for (const [sessionId, payload] of this.activeSessions.entries()) {
      if (payload.exp < now) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

export const enterpriseSecurity = new EnterpriseSecurity();