/**
 * Validation schemas for Analytics endpoints
 */

import { z } from 'zod';

/**
 * Schema for analytics query parameters
 * All analytics endpoints require a drug program ID
 */
export const analyticsQuerySchema = z.object({
  drugProgramId: z.string().uuid(),
  questionId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
