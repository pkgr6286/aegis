/**
 * Validation schemas for Drug Program endpoints
 */

import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { drugPrograms } from '../db/schema/programs';

// Base insert schema from Drizzle
const baseDrugProgramSchema = createInsertSchema(drugPrograms);

/**
 * Schema for creating a new drug program
 */
export const createDrugProgramSchema = baseDrugProgramSchema
  .omit({
    id: true,
    tenantId: true,
    activeScreenerVersionId: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
  })
  .extend({
    name: z.string().min(1).max(255),
    brandName: z.string().max(255).optional().transform(val => val || undefined),
    brandConfigId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
  });

/**
 * Schema for updating a drug program
 */
export const updateDrugProgramSchema = createDrugProgramSchema.partial();

// Type exports
export type CreateDrugProgramInput = z.infer<typeof createDrugProgramSchema>;
export type UpdateDrugProgramInput = z.infer<typeof updateDrugProgramSchema>;
