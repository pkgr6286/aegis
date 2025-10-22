/**
 * Rate Limiting Middleware
 * 
 * Protects public endpoints from abuse using in-memory rate limiting.
 * In production, use Redis for distributed rate limiting.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * For production, use express-rate-limit with Redis store
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the time window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Clean up old entries
   */
  private cleanup() {
    const now = Date.now();
    
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );

      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Create rate limiters for different endpoints
const publicApiLimiter = new InMemoryRateLimiter(
  60 * 1000, // 1 minute
  100 // 100 requests per minute
);

const verificationLimiter = new InMemoryRateLimiter(
  60 * 1000, // 1 minute
  1000 // 1000 verifications per minute (for busy retailers)
);

/**
 * Rate limit middleware factory
 */
function createRateLimitMiddleware(limiter: InMemoryRateLimiter) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Bypass rate limiting in development/test environments
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    // Use IP address as identifier
    // In production, consider using a combination of IP + user agent + other factors
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';

    if (!limiter.isAllowed(identifier)) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60, // seconds
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Remaining', limiter.getRemaining(identifier));

    next();
  };
}

/**
 * Rate limiter for public consumer API endpoints
 */
export const publicApiRateLimit = createRateLimitMiddleware(publicApiLimiter);

/**
 * Rate limiter for verification API endpoints
 */
export const verificationRateLimit = createRateLimitMiddleware(verificationLimiter);
