import { z } from 'zod';

export const createRegulatoryDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  category: z.enum([
    'samd_core',
    'verification_validation',
    'risk_cybersecurity',
    'acnu_specific',
    'regulatory_submissions',
    'compliance_qms',
    'post_market_surveillance'
  ]),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  accessLevel: z.enum(['admin', 'internal', 'external']).default('internal'),
  fileUrl: z.string().url('File URL must be valid').max(1000),
  metadata: z.record(z.any()).optional(),
});

export const updateRegulatoryDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  category: z.enum([
    'samd_core',
    'verification_validation',
    'risk_cybersecurity',
    'acnu_specific',
    'regulatory_submissions',
    'compliance_qms',
    'post_market_surveillance'
  ]).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  accessLevel: z.enum(['admin', 'internal', 'external']).optional(),
  fileUrl: z.string().url().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

export const listRegulatoryDocumentsSchema = z.object({
  category: z.string().optional(),
  accessLevel: z.enum(['admin', 'internal', 'external']).optional(),
  tags: z.string().optional(), // Comma-separated list
  searchTerm: z.string().optional(),
});

export const submissionPacketSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document is required'),
});

export type CreateRegulatoryDocumentInput = z.infer<typeof createRegulatoryDocumentSchema>;
export type UpdateRegulatoryDocumentInput = z.infer<typeof updateRegulatoryDocumentSchema>;
export type ListRegulatoryDocumentsQuery = z.infer<typeof listRegulatoryDocumentsSchema>;
export type SubmissionPacketInput = z.infer<typeof submissionPacketSchema>;
