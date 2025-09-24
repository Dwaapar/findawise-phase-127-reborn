// Enterprise Authentication & Authorization Middleware
// A+ Grade Security for Billion-Dollar Empire

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { userSessions } from '../../shared/schema';
import { eq, and, gte } from 'drizzle-orm';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    sessionId: string;
    permissions: string[];
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies.authToken ||
                  req.headers['x-auth-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.userId || !decoded.sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Verify session in database
    const [session] = await db.select()
      .from(userSessions)
      .where(and(
        eq(userSessions.sessionId, decoded.sessionId),
        eq(userSessions.userId, decoded.userId),
        eq(userSessions.isActive, true),
        gte(userSessions.expiresAt || userSessions.updatedAt, new Date())
      ))
      .limit(1);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid',
        code: 'INVALID_SESSION'
      });
    }

    // Set user context (role from JWT token for now)
    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      permissions: decoded.permissions || ['user'],
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

export const requirePermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    const userPermissions = req.user.permissions || [];
    
    // Admin has all permissions
    if (userPermissions.includes('admin')) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
        current: userPermissions
      });
    }

    next();
  };
};

export const requireRole = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role',
        code: 'INSUFFICIENT_ROLE',
        required: requiredRoles,
        current: req.user.role
      });
    }

    next();
  };
};

export { AuthenticatedRequest };