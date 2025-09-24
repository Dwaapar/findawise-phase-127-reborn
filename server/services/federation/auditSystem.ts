/**
 * Phase 3B: Enhanced Audit System with RBAC and Security Hardening
 * 
 * Comprehensive audit logging, role-based access control, and security enforcement
 */

import { DatabaseStorage } from '../../storage';
import crypto from 'crypto';

export interface AuditEvent {
  id?: number;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserRole {
  userId: string;
  role: 'admin' | 'operator' | 'viewer' | 'neuron_manager';
  permissions: string[];
  expiresAt?: Date;
  createdBy: string;
}

export interface SecurityPolicy {
  maxConfigPushesPerHour: number;
  requireApprovalForCritical: boolean;
  allowedIpRanges?: string[];
  sessionTimeoutMinutes: number;
  auditRetentionDays: number;
}

export class EnhancedAuditSystem {
  private storage: DatabaseStorage;
  private userRoles: Map<string, UserRole> = new Map();
  private activeSessions: Map<string, { userId: string; lastActivity: Date; ipAddress: string }> = new Map();
  private securityPolicy: SecurityPolicy;
  private auditBuffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  // Rate limiting
  private actionCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
    this.securityPolicy = {
      maxConfigPushesPerHour: 50,
      requireApprovalForCritical: true,
      sessionTimeoutMinutes: 60,
      auditRetentionDays: 90
    };

    this.initializeDefaultRoles();
    this.startAuditBufferFlush();
    this.startSessionCleanup();
  }

  private initializeDefaultRoles(): void {
    // Define default role permissions
    const rolePermissions = {
      admin: [
        'neuron:create', 'neuron:update', 'neuron:delete', 'neuron:view',
        'config:push', 'config:rollback', 'config:view',
        'experiment:deploy', 'experiment:view', 'experiment:manage',
        'audit:view', 'audit:export', 'system:manage', 'user:manage'
      ],
      operator: [
        'neuron:view', 'neuron:update',
        'config:push', 'config:view',
        'experiment:deploy', 'experiment:view',
        'audit:view'
      ],
      neuron_manager: [
        'neuron:view', 'neuron:update',
        'config:view', 'experiment:view'
      ],
      viewer: [
        'neuron:view', 'config:view', 'experiment:view', 'audit:view'
      ]
    };

    // Set up system admin (for bootstrapping)
    this.userRoles.set('system', {
      userId: 'system',
      role: 'admin',
      permissions: rolePermissions.admin,
      createdBy: 'system'
    });
  }

  // RBAC Methods
  async assignRole(userId: string, role: UserRole['role'], assignedBy: string, ipAddress: string, userAgent: string): Promise<boolean> {
    try {
      const roleData: UserRole = {
        userId,
        role,
        permissions: this.getRolePermissions(role),
        createdBy: assignedBy
      };

      this.userRoles.set(userId, roleData);

      await this.recordAudit({
        userId: assignedBy,
        action: 'assign_role',
        resource: 'user',
        resourceId: userId,
        details: { role, permissions: roleData.permissions },
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success: true,
        severity: 'high'
      });

      return true;
    } catch (error) {
      await this.recordAudit({
        userId: assignedBy,
        action: 'assign_role',
        resource: 'user',
        resourceId: userId,
        details: { role, error: (error as Error).message },
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success: false,
        errorMessage: (error as Error).message,
        severity: 'critical'
      });

      return false;
    }
  }

  private getRolePermissions(role: UserRole['role']): string[] {
    const permissions = {
      admin: [
        'neuron:create', 'neuron:update', 'neuron:delete', 'neuron:view',
        'config:push', 'config:rollback', 'config:view',
        'experiment:deploy', 'experiment:view', 'experiment:manage',
        'audit:view', 'audit:export', 'system:manage', 'user:manage'
      ],
      operator: [
        'neuron:view', 'neuron:update',
        'config:push', 'config:view',
        'experiment:deploy', 'experiment:view',
        'audit:view'
      ],
      neuron_manager: [
        'neuron:view', 'neuron:update',
        'config:view', 'experiment:view'
      ],
      viewer: [
        'neuron:view', 'config:view', 'experiment:view', 'audit:view'
      ]
    };

    return permissions[role] || [];
  }

  checkPermission(userId: string, permission: string): boolean {
    const userRole = this.userRoles.get(userId);
    if (!userRole) {
      console.warn(`⚠️ No role found for user ${userId}`);
      return false;
    }

    // Check if role has expired
    if (userRole.expiresAt && userRole.expiresAt < new Date()) {
      console.warn(`⚠️ Role expired for user ${userId}`);
      return false;
    }

    return userRole.permissions.includes(permission);
  }

  checkRateLimit(userId: string, action: string): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    const current = this.actionCounts.get(key);
    if (!current || now > current.resetTime) {
      this.actionCounts.set(key, { count: 1, resetTime: now + hour });
      return true;
    }

    const limits = {
      'config:push': this.securityPolicy.maxConfigPushesPerHour,
      'experiment:deploy': 20,
      'neuron:create': 10
    };

    const limit = limits[action as keyof typeof limits] || 100;
    
    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  // Session Management
  createSession(userId: string, ipAddress: string): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    this.activeSessions.set(sessionId, {
      userId,
      lastActivity: new Date(),
      ipAddress
    });

    return sessionId;
  }

  validateSession(sessionId: string, ipAddress: string): string | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    // Check session timeout
    const timeoutMs = this.securityPolicy.sessionTimeoutMinutes * 60 * 1000;
    if (Date.now() - session.lastActivity.getTime() > timeoutMs) {
      this.activeSessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    return session.userId;
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const timeoutMs = this.securityPolicy.sessionTimeoutMinutes * 60 * 1000;
      const now = Date.now();

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity.getTime() > timeoutMs) {
          this.activeSessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  // Enhanced Audit Methods
  async recordAudit(auditEvent: Omit<AuditEvent, 'id'>): Promise<void> {
    // Add to buffer for batch processing
    this.auditBuffer.push(auditEvent as AuditEvent);

    // Immediate flush for critical events
    if (auditEvent.severity === 'critical' || !auditEvent.success) {
      await this.flushAuditBuffer();
    }
  }

  private startAuditBufferFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushAuditBuffer();
    }, 10000); // Flush every 10 seconds
  }

  private async flushAuditBuffer(): Promise<void> {
    if (this.auditBuffer.length === 0) return;

    const events = [...this.auditBuffer];
    this.auditBuffer = [];

    try {
      for (const event of events) {
        await this.storage.createAuditEvent(event);
      }
    } catch (error) {
      console.error('❌ Failed to flush audit buffer:', error);
      // Re-add failed events to buffer
      this.auditBuffer.unshift(...events);
    }
  }

  // Configuration Actions with Audit
  async recordConfigAction(
    action: 'push' | 'rollback' | 'broadcast',
    target: string,
    userId: string,
    details: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const severity = action === 'broadcast' ? 'high' : 'medium';
    
    await this.recordAudit({
      userId,
      action: `config_${action}`,
      resource: 'configuration',
      resourceId: target,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success: true,
      severity
    });
  }

  async recordExperimentAction(
    action: 'deploy' | 'stop' | 'broadcast',
    target: string,
    userId: string,
    details: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.recordAudit({
      userId,
      action: `experiment_${action}`,
      resource: 'experiment',
      resourceId: target,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success: true,
      severity: 'medium'
    });
  }

  async recordSecurityEvent(
    event: 'unauthorized_access' | 'rate_limit_exceeded' | 'invalid_session' | 'suspicious_activity',
    userId: string,
    details: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.recordAudit({
      userId,
      action: `security_${event}`,
      resource: 'security',
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success: false,
      severity: 'critical'
    });
  }

  // Rollback Management
  async rollbackConfig(
    neuronId: string,
    configId: number,
    rolledBackBy: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Get configuration to rollback to
      const configs = await this.storage.getNeuronConfigs(neuronId);
      const targetConfig = configs.find(c => c.id === configId);
      
      if (!targetConfig) {
        throw new Error(`Configuration ${configId} not found for neuron ${neuronId}`);
      }

      // Mark current config as inactive
      await this.storage.updateNeuronConfigStatus(neuronId, 'rolled_back');

      // Activate target config
      await this.storage.createNeuronConfig({
        neuronId,
        configData: targetConfig.configData,
        configVersion: targetConfig.configVersion,
        deployedBy: rolledBackBy,
        deploymentStatus: 'success',
        isActive: true,
        rollbackReason: reason,
        rollbackFromConfigId: configId
      });

      return true;
    } catch (error) {
      console.error(`❌ Rollback failed for ${neuronId}:`, error);
      return false;
    }
  }

  // Analytics and Reporting
  async getAuditReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      userId?: string;
      action?: string;
      resource?: string;
      severity?: AuditEvent['severity'];
    }
  ): Promise<AuditEvent[]> {
    try {
      return await this.storage.getAuditEvents(startDate, endDate, filters);
    } catch (error) {
      console.error('❌ Failed to get audit report:', error);
      return [];
    }
  }

  async getUserActionSummary(userId: string, days: number = 7): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    lastActivity: Date | null;
    securityIncidents: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.getAuditReport(startDate, new Date(), { userId });

    const summary = {
      totalActions: events.length,
      actionsByType: {} as Record<string, number>,
      lastActivity: events.length > 0 ? events[events.length - 1].timestamp : null,
      securityIncidents: events.filter(e => e.severity === 'critical' || !e.success).length
    };

    events.forEach(event => {
      summary.actionsByType[event.action] = (summary.actionsByType[event.action] || 0) + 1;
    });

    return summary;
  }

  // Security Hardening Methods
  validateIpAddress(ipAddress: string): boolean {
    if (!this.securityPolicy.allowedIpRanges) return true;
    
    // Simple IP range validation (in production, use proper CIDR libraries)
    return this.securityPolicy.allowedIpRanges.some(range => {
      if (range === '*') return true;
      return ipAddress.startsWith(range);
    });
  }

  async exportAuditLog(
    userId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    if (!this.checkPermission(userId, 'audit:export')) {
      throw new Error('Insufficient permissions to export audit log');
    }

    const events = await this.getAuditReport(startDate, endDate);
    
    if (format === 'csv') {
      const headers = ['timestamp', 'userId', 'action', 'resource', 'success', 'ipAddress'];
      const rows = events.map(event => [
        event.timestamp.toISOString(),
        event.userId,
        event.action,
        event.resource,
        event.success.toString(),
        event.ipAddress
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(events, null, 2);
  }

  // Cleanup and Maintenance
  async cleanupOldAuditRecords(): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - this.securityPolicy.auditRetentionDays * 24 * 60 * 60 * 1000
    );

    try {
      const deletedCount = await this.storage.deleteOldAuditEvents(cutoffDate);
      console.log(`🧹 Cleaned up ${deletedCount} old audit records`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old audit records:', error);
      return 0;
    }
  }

  getSecurityMetrics(): {
    activeSessions: number;
    auditEventsToday: number;
    failedActionsToday: number;
    criticalEventsToday: number;
    rateLimitViolations: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // This would typically query the database for today's events
    // For now, return basic metrics
    return {
      activeSessions: this.activeSessions.size,
      auditEventsToday: 0, // Would query DB
      failedActionsToday: 0, // Would query DB
      criticalEventsToday: 0, // Would query DB
      rateLimitViolations: 0
    };
  }

  shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush remaining audit events
    if (this.auditBuffer.length > 0) {
      this.flushAuditBuffer();
    }

    console.log('✅ Enhanced audit system shutdown complete');
  }
}

export default EnhancedAuditSystem;