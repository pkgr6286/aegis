/**
 * API Key Authentication Middleware
 * 
 * Validates partner API keys from the X-API-Key header.
 * Sets req.partner context for use in route handlers.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { partnerApiKeys, partners } from '../db/schema/partners';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Extend Express Request to include partner info
declare global {
  namespace Express {
    interface Request {
      partner?: {
        id: string;
        name: string;
        type: string;
        tenantId: string;
      };
      partnerApiKeyId?: string;
    }
  }
}

/**
 * Middleware to authenticate partner API keys
 * 
 * Process:
 * 1. Extract API key from X-API-Key header
 * 2. Hash the key (currently base64, should be bcrypt in production)
 * 3. Look up the hashed key in partner_api_keys table
 * 4. Verify key is active and not expired
 * 5. Load partner details and set on req object
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract API key from X-API-Key header
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'API key required in X-API-Key header' 
    });
  }

  try {
    // Look up API keys for this partner (we'll validate the hash with bcrypt.compare)
    // Note: We can't query directly by hash since bcrypt hashes are unique per encryption
    const keyRecords = await db
      .select({
        keyId: partnerApiKeys.id,
        keyStatus: partnerApiKeys.status,
        expiresAt: partnerApiKeys.expiresAt,
        hashedKey: partnerApiKeys.hashedKey,
        partnerId: partnerApiKeys.partnerId,
        tenantId: partnerApiKeys.tenantId,
        partnerName: partners.name,
        partnerType: partners.type,
      })
      .from(partnerApiKeys)
      .innerJoin(partners, eq(partnerApiKeys.partnerId, partners.id))
      .where(eq(partnerApiKeys.status, 'active'));

    // Find matching key by comparing with bcrypt
    let matchedKey = null;
    for (const record of keyRecords) {
      const isMatch = await bcrypt.compare(apiKey, record.hashedKey);
      if (isMatch) {
        matchedKey = record;
        break;
      }
    }

    if (!matchedKey) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Invalid or inactive API key' 
      });
    }

    // Check if key has expired
    if (matchedKey.expiresAt && new Date(matchedKey.expiresAt) < new Date()) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'API key has expired' 
      });
    }

    // Set partner context on request
    req.partner = {
      id: matchedKey.partnerId,
      name: matchedKey.partnerName,
      type: matchedKey.partnerType,
      tenantId: matchedKey.tenantId,
    };
    req.partnerApiKeyId = matchedKey.keyId;

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to authenticate API key' 
    });
  }
};
