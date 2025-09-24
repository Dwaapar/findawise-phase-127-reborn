// Enterprise Request Validation Middleware
// A+ Grade Input Validation for Billion-Dollar Empire

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (config: ValidationConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (config.body) {
        const bodyResult = config.body.safeParse(req.body);
        if (!bodyResult.success) {
          return res.status(400).json({
            success: false,
            error: 'Invalid request body',
            code: 'VALIDATION_ERROR',
            details: bodyResult.error.errors
          });
        }
        req.body = bodyResult.data;
      }

      // Validate query parameters
      if (config.query) {
        const queryResult = config.query.safeParse(req.query);
        if (!queryResult.success) {
          return res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: queryResult.error.errors
          });
        }
        req.query = queryResult.data;
      }

      // Validate route parameters
      if (config.params) {
        const paramsResult = config.params.safeParse(req.params);
        if (!paramsResult.success) {
          return res.status(400).json({
            success: false,
            error: 'Invalid route parameters',
            code: 'VALIDATION_ERROR',
            details: paramsResult.error.errors
          });
        }
        req.params = paramsResult.data;
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Validation processing failed',
        code: 'VALIDATION_PROCESSING_ERROR'
      });
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid(),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
};