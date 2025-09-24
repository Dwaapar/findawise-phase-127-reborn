/**
 * Enterprise-grade Error Handling System
 * Replaces basic try-catch with structured error management, retries, and circuit breakers
 */

import { EventEmitter } from 'events';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_API = 'external_api',
  SYSTEM = 'system'
}

export interface EmpireError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: any;
  timestamp: Date;
  stackTrace?: string;
  retryCount?: number;
  resolved?: boolean;
  userId?: string;
  neuronId?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCategory[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitorPeriod: number;
}

class ErrorHandler extends EventEmitter {
  private retryConfig: RetryConfig;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private errorHistory: EmpireError[] = [];
  private alertRules: Map<ErrorCategory, AlertRule[]> = new Map();

  constructor() {
    super();
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.DATABASE, ErrorCategory.EXTERNAL_API]
    };

    this.initializeAlertRules();
  }

  /**
   * Main error handling method with automatic retry and circuit breaker logic
   */
  async handleError<T>(
    operation: () => Promise<T>,
    context: {
      category: ErrorCategory;
      operationName: string;
      userId?: string;
      neuronId?: string;
      retryConfig?: Partial<RetryConfig>;
    }
  ): Promise<T> {
    const operationId = `${context.category}:${context.operationName}`;
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(operationId)) {
      throw this.createError({
        category: context.category,
        severity: ErrorSeverity.HIGH,
        message: `Circuit breaker open for ${operationId}`,
        context: { operationId, circuitBreakerOpen: true }
      });
    }

    const config = { ...this.retryConfig, ...context.retryConfig };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Reset circuit breaker on success
        this.recordSuccess(operationId);
        
        // Log recovery if this was a retry
        if (attempt > 1) {
          console.log(`✅ Operation recovered after ${attempt} attempts: ${operationId}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        const empireError = this.createError({
          category: context.category,
          severity: this.calculateSeverity(error as Error, attempt, config.maxAttempts),
          message: `${context.operationName} failed (attempt ${attempt}/${config.maxAttempts})`,
          originalError: error as Error,
          context: { ...context, attempt, operationId },
          retryCount: attempt - 1,
          userId: context.userId,
          neuronId: context.neuronId
        });

        // Record failure
        this.recordFailure(operationId);
        this.errorHistory.push(empireError);

        // Check if we should retry
        if (attempt < config.maxAttempts && this.shouldRetry(empireError, config)) {
          const delay = this.calculateDelay(attempt, config);
          console.warn(`⚠️ ${operationId} failed, retrying in ${delay}ms (attempt ${attempt}/${config.maxAttempts})`);
          await this.sleep(delay);
          continue;
        }

        // Final failure - trigger alerts
        await this.processError(empireError);
        throw empireError;
      }
    }

    throw lastError!;
  }

  /**
   * Create structured error with metadata
   */
  createError(params: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    originalError?: Error;
    context?: any;
    userId?: string;
    neuronId?: string;
  }): EmpireError {
    return {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...params,
      timestamp: new Date(),
      stackTrace: params.originalError?.stack,
      resolved: false
    };
  }

  /**
   * Process error with alerting and escalation
   */
  private async processError(error: EmpireError): Promise<void> {
    // Log structured error
    console.error('🚨 Empire Error:', {
      id: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp
    });

    // Check alert rules
    const rules = this.alertRules.get(error.category) || [];
    for (const rule of rules) {
      if (this.shouldTriggerAlert(error, rule)) {
        await this.sendAlert(error, rule);
      }
    }

    // Emit event for monitoring systems
    this.emit('error', error);
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitBreakerOpen(operationId: string): boolean {
    const breaker = this.circuitBreakers.get(operationId);
    if (!breaker) return false;

    const now = Date.now();
    
    // Check if reset timeout has passed
    if (breaker.state === 'open' && now - breaker.lastFailTime > breaker.config.resetTimeout) {
      breaker.state = 'half-open';
      breaker.failureCount = 0;
    }

    return breaker.state === 'open';
  }

  private recordSuccess(operationId: string): void {
    const breaker = this.circuitBreakers.get(operationId);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
    }
  }

  private recordFailure(operationId: string): void {
    let breaker = this.circuitBreakers.get(operationId);
    if (!breaker) {
      breaker = {
        state: 'closed',
        failureCount: 0,
        lastFailTime: 0,
        config: {
          failureThreshold: 5,
          resetTimeout: 60000,
          monitorPeriod: 300000
        }
      };
      this.circuitBreakers.set(operationId, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailTime = Date.now();

    if (breaker.failureCount >= breaker.config.failureThreshold) {
      breaker.state = 'open';
      console.warn(`🔴 Circuit breaker opened for ${operationId}`);
    }
  }

  /**
   * Utility methods
   */
  private shouldRetry(error: EmpireError, config: RetryConfig): boolean {
    return config.retryableErrors.includes(error.category) &&
           error.severity !== ErrorSeverity.CRITICAL;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private calculateSeverity(error: Error, attempt: number, maxAttempts: number): ErrorSeverity {
    if (attempt === maxAttempts) return ErrorSeverity.HIGH;
    if (error.message.includes('ECONNRESET') || error.message.includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeAlertRules(): void {
    // Database error alerts
    this.alertRules.set(ErrorCategory.DATABASE, [
      {
        condition: 'severity >= HIGH',
        action: 'email_admin',
        cooldown: 300000 // 5 minutes
      }
    ]);

    // Authentication error alerts
    this.alertRules.set(ErrorCategory.AUTHENTICATION, [
      {
        condition: 'count > 10 in 60s',
        action: 'security_alert',
        cooldown: 60000
      }
    ]);
  }

  private shouldTriggerAlert(error: EmpireError, rule: AlertRule): boolean {
    // Simplified alert logic - in production, implement proper rule engine
    return error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL;
  }

  private async sendAlert(error: EmpireError, rule: AlertRule): Promise<void> {
    console.warn(`🚨 ALERT TRIGGERED: ${rule.action} for error ${error.id}`);
    // In production: send email, Slack notification, etc.
  }

  /**
   * Public API methods
   */
  getErrorHistory(filters?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    limit?: number;
  }): EmpireError[] {
    let filtered = this.errorHistory;
    
    if (filters?.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }
    
    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, filters?.limit || 100);
  }

  getCircuitBreakerStatus(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  resetCircuitBreaker(operationId: string): void {
    const breaker = this.circuitBreakers.get(operationId);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
    }
  }
}

// Types
interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailTime: number;
  config: CircuitBreakerConfig;
}

interface AlertRule {
  condition: string;
  action: string;
  cooldown: number;
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Convenience wrapper for database operations
export const withDatabaseRetry = <T>(operation: () => Promise<T>, context?: any): Promise<T> => {
  return errorHandler.handleError(operation, {
    category: ErrorCategory.DATABASE,
    operationName: 'database_operation',
    ...context
  });
};

// Convenience wrapper for API operations
export const withApiRetry = <T>(operation: () => Promise<T>, context?: any): Promise<T> => {
  return errorHandler.handleError(operation, {
    category: ErrorCategory.EXTERNAL_API,
    operationName: 'api_operation',
    ...context
  });
};