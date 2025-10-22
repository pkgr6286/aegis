/**
 * Frontend Validation Schemas
 * These mirror backend validation schemas for client-side validation
 */

import { z } from 'zod';

// ============================================================================
// Brand Config Schemas
// ============================================================================

export const brandConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  config: z.object({
    logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  }),
});

export type BrandConfigFormData = z.infer<typeof brandConfigSchema>;

// ============================================================================
// User Management Schemas
// ============================================================================

export const inviteUserSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  fullName: z.string().max(255).optional().transform(val => val || undefined),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

// ============================================================================
// Partner Management Schemas
// ============================================================================

export const createPartnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required').max(255),
  type: z.enum(['ecommerce', 'retail_pos']),
  status: z.enum(['active', 'inactive']),
});

export const generateApiKeySchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(3650).optional(),
  description: z.string().max(255).optional(),
});

export type CreatePartnerFormData = z.infer<typeof createPartnerSchema>;
export type GenerateApiKeyFormData = z.infer<typeof generateApiKeySchema>;

// ============================================================================
// Drug Program Schemas
// ============================================================================

export const drugProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required').max(255),
  brandName: z.string().max(255).optional().transform(val => val || undefined),
  brandConfigId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['draft', 'active', 'archived']),
});

export type DrugProgramFormData = z.infer<typeof drugProgramSchema>;

// ============================================================================
// Audit Log Filter Schemas
// ============================================================================

export const auditLogFilterSchema = z.object({
  resourceType: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditLogFilterFormData = z.infer<typeof auditLogFilterSchema>;
