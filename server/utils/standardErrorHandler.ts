/**
 * Standardized Error Handling Utility for Findawise Empire
 * Provides consistent error logging, formatting, and response patterns
 */

export interface ErrorLogContext {
  component: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  additionalData?: any;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class StandardErrorHandler {
  /**
   * Log error with consistent format and context
   */
  static logError(error: any, context: ErrorLogContext): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      level: 'ERROR',
      component: context.component,
      operation: context.operation,
      message: error.message || error,
      stack: error.stack,
      userId: context.userId,
      sessionId: context.sessionId,
      additionalData: context.additionalData
    };

    console.error(`[${timestamp}] ERROR in ${context.component}.${context.operation}:`);
    console.error(errorInfo);
  }

  /**
   * Log warning with context
   */
  static logWarning(message: string, context: ErrorLogContext): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARNING in ${context.component}.${context.operation}: ${message}`);
    if (context.additionalData) {
      console.warn('Additional data:', context.additionalData);
    }
  }

  /**
   * Format error response for API endpoints
   */
  static formatErrorResponse(error: any, requestId?: string): ErrorResponse {
    const timestamp = new Date().toISOString();
    
    // Handle known error types
    if (error.name === 'ZodError') {
      return {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
        timestamp,
        requestId
      };
    }

    if (error.message?.includes('duplicate key')) {
      return {
        error: 'Resource already exists',
        code: 'DUPLICATE_KEY',
        details: error.message,
        timestamp,
        requestId
      };
    }

    if (error.message?.includes('not found')) {
      return {
        error: 'Resource not found',
        code: 'NOT_FOUND',
        details: error.message,
        timestamp,
        requestId
      };
    }

    // Generic error response
    return {
      error: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp,
      requestId
    };
  }

  /**
   * Handle database constraint violations consistently
   */
  static handleConstraintViolation(error: any, resourceType: string, context: ErrorLogContext): void {
    if (error.message?.includes('unique constraint')) {
      this.logWarning(`${resourceType} already exists, skipping creation`, {
        ...context,
        additionalData: { constraint: error.constraint, detail: error.detail }
      });
    } else {
      this.logError(error, context);
    }
  }

  /**
   * Seed data error handler with retry logic
   */
  static async handleSeedError<T>(
    operation: () => Promise<T>,
    resourceName: string,
    context: ErrorLogContext,
    allowDuplicates: boolean = true
  ): Promise<T | null> {
    try {
      const result = await operation();
      console.log(`✅ Created ${resourceName}`);
      return result;
    } catch (error) {
      if (allowDuplicates && (error.message?.includes('duplicate key') || error.message?.includes('unique constraint'))) {
        console.log(`⏭️  ${resourceName} already exists, skipping...`);
        return null;
      } else {
        this.logError(error, {
          ...context,
          additionalData: { resourceName }
        });
        throw error;
      }
    }
  }

  /**
   * API request wrapper with standardized error handling
   */
  static wrapApiHandler(handler: Function, component: string, operation: string) {
    return async (req: any, res: any, next?: Function) => {
      const requestId = req.id || Math.random().toString(36).substring(2);
      const context: ErrorLogContext = {
        component,
        operation,
        userId: req.user?.id,
        sessionId: req.sessionID,
        additionalData: {
          method: req.method,
          path: req.path,
          requestId
        }
      };

      try {
        await handler(req, res, next);
      } catch (error) {
        this.logError(error, context);
        const errorResponse = this.formatErrorResponse(error, requestId);
        
        // Set appropriate status code
        let statusCode = 500;
        if (errorResponse.code === 'VALIDATION_ERROR') statusCode = 400;
        if (errorResponse.code === 'NOT_FOUND') statusCode = 404;
        if (errorResponse.code === 'DUPLICATE_KEY') statusCode = 409;

        res.status(statusCode).json(errorResponse);
      }
    };
  }
}

/**
 * Decorator for consistent error handling in storage operations
 */
export function withErrorHandling(component: string, operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const context: ErrorLogContext = {
        component,
        operation: `${propertyName}`,
        additionalData: { args: args.length }
      };

      try {
        return await method.apply(this, args);
      } catch (error) {
        StandardErrorHandler.logError(error, context);
        throw error;
      }
    };
  };
}

// Export commonly used error patterns
export const ErrorPatterns = {
  DUPLICATE_KEY: 'duplicate key value violates unique constraint',
  NOT_NULL_VIOLATION: 'null value in column',
  FOREIGN_KEY_VIOLATION: 'violates foreign key constraint',
  CHECK_VIOLATION: 'violates check constraint'
};