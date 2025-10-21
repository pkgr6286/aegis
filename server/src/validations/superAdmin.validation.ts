import { z } from 'zod';

/**
 * Validation schemas for Super Admin endpoints
 */

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(255),
  status: z.enum(['active', 'suspended', 'trial']).optional().default('trial'),
  metadata: z.record(z.any()).optional(),
});

export const updateTenantLicenseSchema = z.object({
  licenseType: z.string().min(1, 'License type is required'),
  maxUsers: z.number().int().positive().optional(),
  maxPrograms: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  features: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const inviteTenantAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'editor', 'viewer']).default('admin'),
});

export const tenantIdParamSchema = z.object({
  id: z.string().uuid('Invalid tenant ID'),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantLicenseInput = z.infer<typeof updateTenantLicenseSchema>;
export type InviteTenantAdminInput = z.infer<typeof inviteTenantAdminSchema>;
export type TenantIdParam = z.infer<typeof tenantIdParamSchema>;
