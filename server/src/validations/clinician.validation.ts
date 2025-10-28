/**
 * Clinician API Validation Schemas
 * 
 * Zod schemas for validating clinician role endpoints
 */

import { z } from 'zod';

/**
 * Schema for querying sessions in the review queue
 */
export const sessionQuerySchema = z.object({
  reviewStatus: z.enum(['pending', 'reviewed', 'follow_up_required']).optional(),
  drugProgramId: z.string().uuid().optional(),
  outcome: z.enum(['ok_to_use', 'ask_a_doctor', 'do_not_use']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type SessionQuery = z.infer<typeof sessionQuerySchema>;

/**
 * Schema for submitting a clinical review
 */
export const submitReviewSchema = z.object({
  reviewStatus: z.enum(['reviewed', 'follow_up_required']),
  clinicalNotes: z.string().min(1).max(5000).optional(),
});

export type SubmitReview = z.infer<typeof submitReviewSchema>;
