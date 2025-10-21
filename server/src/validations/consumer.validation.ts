/**
 * Validation schemas for Public Consumer API endpoints
 */

import { z } from 'zod';

/**
 * Schema for creating a new screening session
 * POST /api/v1/public/sessions
 */
export const createSessionSchema = z.object({
  programSlug: z.string().min(1).max(255),
  path: z.enum(['manual', 'ehr_assisted', 'ehr_mandatory']).default('manual'),
});

/**
 * Schema for submitting consumer answers
 * PUT /api/v1/public/sessions/:id
 */
export const submitAnswersSchema = z.object({
  answers: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ])),
});

/**
 * Schema for generating verification code
 * POST /api/v1/public/sessions/:id/generate-code
 */
export const generateCodeSchema = z.object({
  codeType: z.enum(['pos_barcode', 'ecommerce_jwt']).default('pos_barcode'),
  expiresInHours: z.number().int().min(1).max(720).default(72), // Default 72 hours (3 days)
});

/**
 * Schema for granting EHR consent
 * POST /api/v1/public/sessions/:id/ehr-consent
 */
export const grantEhrConsentSchema = z.object({
  providerName: z.string().min(1).max(255),
  scopesGranted: z.array(z.string()).min(1),
});

// Type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SubmitAnswersInput = z.infer<typeof submitAnswersSchema>;
export type GenerateCodeInput = z.infer<typeof generateCodeSchema>;
export type GrantEhrConsentInput = z.infer<typeof grantEhrConsentSchema>;
