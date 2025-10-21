/**
 * Validation schemas for EHR integration endpoints
 */

import { z } from 'zod';

/**
 * Schema for OAuth callback query parameters
 * GET /api/v1/public/ehr/callback?code=xxx&state=yyy
 */
export const ehrCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

/**
 * Type definition for the state JWT payload
 * Used to prevent CSRF and maintain session context
 */
export interface EhrStateJwtPayload {
  sessionId: string;
  tenantId: string;
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

// Type exports
export type EhrCallbackInput = z.infer<typeof ehrCallbackSchema>;
