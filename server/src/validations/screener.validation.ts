/**
 * Validation schemas for Screener Version endpoints
 */

import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { screenerVersions } from '../db/schema/programs';

// Base insert schema from Drizzle
const baseScreenerVersionSchema = createInsertSchema(screenerVersions);

/**
 * Schema for a single screener question
 */
const screenerQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['yes_no', 'multiple_choice', 'numeric', 'text']),
  text: z.string().min(1),
  required: z.boolean().default(true),
  options: z.array(z.string()).optional(), // For multiple_choice
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    regex: z.string().optional(),
  }).optional(),
});

/**
 * Schema for screener logic/rules
 */
const screenerLogicSchema = z.object({
  rules: z.array(z.object({
    condition: z.string(), // e.g., "q1 == 'yes' && q5_ldl > 130"
    outcome: z.enum(['ok_to_use', 'ask_a_doctor', 'do_not_use']),
    message: z.string().optional(),
  })),
  defaultOutcome: z.enum(['ok_to_use', 'ask_a_doctor', 'do_not_use']),
});

/**
 * Schema for creating a new screener version
 */
export const createScreenerVersionSchema = baseScreenerVersionSchema
  .omit({
    id: true,
    tenantId: true,
    drugProgramId: true,
    versionNumber: true,
    createdAt: true,
    createdBy: true,
  })
  .extend({
    screenerJson: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      questions: z.array(screenerQuestionSchema).min(1),
      logic: screenerLogicSchema,
      disclaimers: z.array(z.string()).optional(),
    }),
  });

/**
 * Schema for publishing a screener version
 */
export const publishScreenerVersionSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Must explicitly confirm publishing' }),
  }),
});

// Type exports
export type CreateScreenerVersionInput = z.infer<typeof createScreenerVersionSchema>;
export type PublishScreenerVersionInput = z.infer<typeof publishScreenerVersionSchema>;
export type ScreenerQuestion = z.infer<typeof screenerQuestionSchema>;
export type ScreenerLogic = z.infer<typeof screenerLogicSchema>;
