/**
 * Validation schemas for Pharma Admin endpoints
 * (User Management, Partner Management, Audit Logs)
 */

import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { partners, partnerApiKeys } from '../db/schema/partners';

// ============================================================================
// User Management Schemas
// ============================================================================

/**
 * Schema for inviting a new user to the tenant
 */
export const inviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().max(255).optional().transform(val => val || undefined),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
});

// ============================================================================
// Partner Management Schemas
// ============================================================================

// Base schemas from Drizzle
const basePartnerSchema = createInsertSchema(partners);
const basePartnerApiKeySchema = createInsertSchema(partnerApiKeys);

/**
 * Schema for creating a new partner
 */
export const createPartnerSchema = basePartnerSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    name: z.string().min(1).max(255),
    type: z.enum(['ecommerce', 'retail_pos']),
    status: z.enum(['active', 'inactive']).default('active'),
  });

/**
 * Schema for generating a new API key for a partner
 */
export const generateApiKeySchema = z.object({
  expiresInDays: z.number().int().min(1).max(3650).optional(), // Optional expiration (1 day to 10 years)
  description: z.string().max(255).optional(),
});

/**
 * Schema for audit log query parameters
 */
export const auditLogQuerySchema = z.object({
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// Type exports
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type GenerateApiKeyInput = z.infer<typeof generateApiKeySchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
