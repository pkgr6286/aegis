import { z } from 'zod';

/**
 * Regulatory Validation Schemas
 * Validation for FDA submission documentation endpoints
 */

export const packageQuerySchema = z.object({
  programId: z.string().uuid('Invalid program ID'),
  versionId: z.string().uuid('Invalid version ID'),
});

export const designSpecQuerySchema = z.object({
  versionId: z.string().uuid('Invalid version ID'),
});

export const versionHistoryQuerySchema = z.object({
  programId: z.string().uuid('Invalid program ID'),
});

export const studyDataQuerySchema = z.object({
  versionId: z.string().uuid('Invalid version ID'),
});

export const acnuFailuresQuerySchema = z.object({
  programId: z.string().uuid('Invalid program ID'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PackageQuery = z.infer<typeof packageQuerySchema>;
export type DesignSpecQuery = z.infer<typeof designSpecQuerySchema>;
export type VersionHistoryQuery = z.infer<typeof versionHistoryQuerySchema>;
export type StudyDataQuery = z.infer<typeof studyDataQuerySchema>;
export type ACNUFailuresQuery = z.infer<typeof acnuFailuresQuerySchema>;
