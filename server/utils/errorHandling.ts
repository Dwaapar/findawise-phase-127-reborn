// Empire-grade error handling utilities
import { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class EmpireError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: string = 'EMPIRE_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'EmpireError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleError(error: unknown, res: Response, operation: string): void {
  const timestamp = new Date().toISOString();
  
  if (error instanceof EmpireError) {
    console.error(`[${timestamp}] Empire Error in ${operation}:`, error);
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        operation
      }
    });
    return;
  }

  if (error instanceof Error) {
    console.error(`[${timestamp}] Error in ${operation}:`, error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp,
        operation
      }
    });
    return;
  }

  // Unknown error type
  console.error(`[${timestamp}] Unknown error in ${operation}:`, error);
  res.status(500).json({
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      timestamp,
      operation
    }
  });
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}

export function isValidationError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError';
}

export function formatValidationError(error: any): string {
  if (error?.issues) {
    return error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  }
  return safeErrorMessage(error);
}