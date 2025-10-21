/**
 * Session Authentication Middleware
 * 
 * Generates and validates short-lived session JWTs for the consumer screening flow.
 * These are different from user JWTs - they only protect a single screening session.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include session info
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      sessionToken?: string;
    }
  }
}

// CRITICAL: Session JWT secret MUST be set via environment variable
const SESSION_JWT_SECRET = process.env.SESSION_JWT_SECRET || process.env.JWT_SECRET;

if (!SESSION_JWT_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: SESSION_JWT_SECRET (or JWT_SECRET) environment variable must be set. ' +
    'Session JWTs cannot be issued without a cryptographically secure secret.'
  );
}

const SESSION_JWT_EXPIRES_IN = '1h'; // Short-lived tokens for security

/**
 * Generate a session JWT for a screening session
 */
export function generateSessionToken(sessionId: string): string {
  return jwt.sign(
    {
      sessionId,
      type: 'screening_session',
    },
    SESSION_JWT_SECRET,
    {
      expiresIn: SESSION_JWT_EXPIRES_IN,
    }
  );
}

/**
 * Middleware to validate session JWT
 * Protects consumer endpoints after session creation
 */
export const authenticateSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Session token required' });
  }

  try {
    // Verify JWT signature and decode payload
    const payload = jwt.verify(token, SESSION_JWT_SECRET) as {
      sessionId: string;
      type: string;
    };

    // Verify this is a session token (not a user token)
    if (payload.type !== 'screening_session') {
      return res.status(403).json({ error: 'Invalid token type' });
    }

    // Attach session ID to request
    req.sessionId = payload.sessionId;
    req.sessionToken = token;

    next();
  } catch (error) {
    // Handle different JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid session token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Session token expired' });
    }
    return res.status(403).json({ error: 'Session token verification failed' });
  }
};
