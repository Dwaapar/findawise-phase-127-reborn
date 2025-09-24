/**
 * Enterprise Session Management Types
 * A+ Grade Type Definitions for Billion-Dollar Empire
 */

import { z } from 'zod';

// Core session validation schemas
export const sessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  userId: z.string().optional(),
  fingerprint: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date().optional(),
  lastActive: z.date().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

export const sessionUpdateSchema = z.object({
  sessionId: z.string(),
  lastActive: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

export const deviceFingerprintSchema = z.object({
  sessionId: z.string(),
  fingerprint: z.string(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  screenResolution: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional()
});

export const behaviorEventSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  eventType: z.string(),
  eventData: z.record(z.any()).optional(),
  timestamp: z.date().optional(),
  pageUrl: z.string().optional(),
  referrer: z.string().optional()
});

export const analyticsEventSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  eventType: z.string(),
  eventName: z.string().optional(),
  eventData: z.record(z.any()).optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  timestamp: z.date().optional(),
  batchId: z.string().optional(),
  fingerprint: z.string().optional()
});

// Type exports
export type Session = z.infer<typeof sessionSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;
export type DeviceFingerprint = z.infer<typeof deviceFingerprintSchema>;
export type BehaviorEvent = z.infer<typeof behaviorEventSchema>;
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// Extended session with computed properties
export interface EnhancedSession extends Session {
  duration?: number;
  pageViews?: number;
  engagementScore?: number;
  conversionEvents?: number;
  deviceInfo?: DeviceFingerprint;
  lastLocation?: string;
}

// Session management configuration
export interface SessionConfig {
  timeout: number;
  extendOnActivity: boolean;
  secureCookies: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  httpOnly: boolean;
}

// Default session configuration
export const defaultSessionConfig: SessionConfig = {
  timeout: 24 * 60 * 60 * 1000, // 24 hours
  extendOnActivity: true,
  secureCookies: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  httpOnly: false // Allow client-side access for analytics
};

// Validation utilities
export function validateSession(data: any): Session {
  return sessionSchema.parse(data);
}

export function validateSessionUpdate(data: any): SessionUpdate {
  return sessionUpdateSchema.parse(data);
}

export function validateDeviceFingerprint(data: any): DeviceFingerprint {
  return deviceFingerprintSchema.parse(data);
}

export function validateBehaviorEvent(data: any): BehaviorEvent {
  return behaviorEventSchema.parse(data);
}

export function validateAnalyticsEvent(data: any): AnalyticsEvent {
  return analyticsEventSchema.parse(data);
}

// Session utilities
export function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateFingerprint(req: any): string {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
  return Buffer.from(fingerprint).toString('base64').substring(0, 64);
}

export function isValidSessionId(sessionId: any): sessionId is string {
  return typeof sessionId === 'string' && sessionId.length > 0;
}

export function sanitizeSessionData(data: any): any {
  // Remove sensitive data from session
  const sanitized = { ...data };
  delete sanitized.password;
  delete sanitized.secret;
  delete sanitized.token;
  delete sanitized.key;
  return sanitized;
}