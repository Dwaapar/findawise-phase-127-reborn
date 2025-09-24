import { logger } from "../../utils/logger";
import { randomUUID } from "crypto";

export interface AuditEvent {
  id: string;
  timestamp: Date;
  component: string;
  action: string;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
  severity: 'info' | 'warn' | 'error' | 'critical';
}

class AuditLogger {
  private events: AuditEvent[] = [];

  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      ...event
    };
    
    this.events.push(auditEvent);
    logger.info('Audit event logged', { 
      component: 'AuditLogger',
      auditEvent 
    });
  }

  getEvents(component?: string): AuditEvent[] {
    if (component) {
      return this.events.filter(e => e.component === component);
    }
    return this.events;
  }
}

export const auditLogger = new AuditLogger();