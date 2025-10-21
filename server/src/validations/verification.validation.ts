/**
 * Validation schemas for Partner Verification API
 */

import { z } from 'zod';

/**
 * Schema for verifying a consumer code
 * POST /api/v1/verify
 */
export const verifyCodeSchema = z.object({
  code: z.string().min(1).max(32),
  metadata: z.object({
    partnerId: z.string().uuid().optional(), // May be inferred from API key
    locationId: z.string().max(255).optional(), // Store ID, terminal ID, etc.
    orderId: z.string().max(255).optional(), // Partner's order/transaction ID
    amount: z.number().positive().optional(), // Purchase amount for analytics
  }).optional(),
});

// Type exports
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
