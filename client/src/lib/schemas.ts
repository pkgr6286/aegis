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
  role: z.enum(['admin', 'editor', 'viewer', 'clinician', 'auditor']),
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

// ============================================================================
// Authentication & Account Schemas
// ============================================================================

export const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================================================
// Consumer Screening Schemas
// ============================================================================

export const booleanAnswerSchema = z.boolean({
  required_error: 'Please select an option',
});

export const numericAnswerSchema = z.coerce.number({
  required_error: 'Please enter a number',
  invalid_type_error: 'Must be a valid number',
}).finite('Must be a finite number');

export const textAnswerSchema = z.string({
  required_error: 'This field is required',
}).min(1, 'This field cannot be empty');

export const choiceAnswerSchema = z.string({
  required_error: 'Please select an option',
}).min(1, 'Please select an option');

/**
 * Dynamic answer schema creator based on question type
 */
export function createAnswerSchema(questionType: string, min?: number, max?: number) {
  switch (questionType) {
    case 'boolean':
      return booleanAnswerSchema;
    case 'numeric':
      let schema = numericAnswerSchema;
      if (min !== undefined) {
        schema = schema.min(min, `Must be at least ${min}`);
      }
      if (max !== undefined) {
        schema = schema.max(max, `Must be at most ${max}`);
      }
      return schema;
    case 'text':
      return textAnswerSchema;
    case 'choice':
      return choiceAnswerSchema;
    default:
      return z.any();
  }
}

export type BooleanAnswer = z.infer<typeof booleanAnswerSchema>;
export type NumericAnswer = z.infer<typeof numericAnswerSchema>;
export type TextAnswer = z.infer<typeof textAnswerSchema>;
export type ChoiceAnswer = z.infer<typeof choiceAnswerSchema>;
