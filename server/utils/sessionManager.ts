// Empire-grade session management for Findawise Neural Federation
import { Request } from 'express';

interface EmpireSession {
  sessionId: string;
  userId?: string;
  deviceFingerprint: string;
  startTime: Date;
  lastActivity: Date;
  metadata: {
    userAgent: string;
    ipAddress: string;
    referrer?: string;
    neuronId?: string;
    vertical?: string;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark';
  };
}

declare global {
  namespace Express {
    interface Request {
      empireSession?: EmpireSession;
    }
  }
}

export function getSessionFromRequest(req: Request): EmpireSession | null {
  return req.empireSession || null;
}

export function createEmpireSession(sessionId: string, req: Request): EmpireSession {
  return {
    sessionId,
    deviceFingerprint: generateDeviceFingerprint(req),
    startTime: new Date(),
    lastActivity: new Date(),
    metadata: {
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: getClientIP(req),
      referrer: req.headers.referer
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      theme: 'light'
    }
  };
}

function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const ip = getClientIP(req);
  
  const fingerprint = Buffer.from(`${userAgent}${acceptLanguage}${acceptEncoding}${ip}`).toString('base64');
  return fingerprint.substring(0, 64);
}

function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}

export { generateDeviceFingerprint, getClientIP };