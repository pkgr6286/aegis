/**
 * Validation schemas for Brand Configuration endpoints
 */

import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { brandConfigs } from '../db/schema/programs';

// Base insert schema from Drizzle
const baseBrandConfigSchema = createInsertSchema(brandConfigs);

/**
 * Schema for creating a new brand configuration
 */
export const createBrandConfigSchema = baseBrandConfigSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    name: z.string().min(1).max(255),
    config: z.object({
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      fontFamily: z.string().optional(),
    }).passthrough(), // Allow additional properties
  });

/**
 * Schema for updating a brand configuration
 */
export const updateBrandConfigSchema = createBrandConfigSchema.partial();

// Type exports
export type CreateBrandConfigInput = z.infer<typeof createBrandConfigSchema>;
export type UpdateBrandConfigInput = z.infer<typeof updateBrandConfigSchema>;
