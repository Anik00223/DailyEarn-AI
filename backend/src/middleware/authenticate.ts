import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, gt } from 'drizzle-orm';
import { env } from '../config/env';
import { checkTokenRevocationStatus } from '../config/redis';
import { db } from '../db';
import { sessions } from '../db/schema';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Authentication required',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Authentication required',
    });
    return;
  }

  try {
    // 1. Enforce HS256 algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    // 2. Multi-instance token revocation check (Distributed Redis)
    const revocationStatus = await checkTokenRevocationStatus(decoded.userId, decoded.iat);

    if (revocationStatus === 'REVOKED') {
      res.status(401).json({
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Session has been revoked. Please log in again.',
      });
      return;
    }

    // 3. Fail-closed fallback: If Redis is unavailable, query PostgreSQL sessions table
    // to verify user has an active, unrevoked session (prevents silent revocation bypass)
    if (revocationStatus === 'UNAVAILABLE') {
      try {
        const activeSessions = await db
          .select({ id: sessions.id })
          .from(sessions)
          .where(
            and(
              eq(sessions.userId, decoded.userId),
              eq(sessions.isRevoked, false),
              gt(sessions.expiresAt, new Date())
            )
          )
          .limit(1);

        if (activeSessions.length === 0) {
          res.status(401).json({
            success: false,
            code: 'TOKEN_REVOKED',
            message: 'Session has been revoked. Please log in again.',
          });
          return;
        }
      } catch (dbErr) {
        // If DB also fails, fail closed for security
        console.error('[Auth] Database revocation fallback check failed:', dbErr);
        res.status(401).json({
          success: false,
          code: 'AUTH_VERIFICATION_FAILED',
          message: 'Unable to verify authentication state',
        });
        return;
      }
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
      });
      return;
    }

    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Authentication required',
    });
  }
}

// Augment Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}
