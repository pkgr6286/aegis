import { Router } from 'express';
import { regulatoryVaultService } from '../services/regulatoryVault.service';
import { authenticateToken, requireTenantRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createRegulatoryDocumentSchema,
  updateRegulatoryDocumentSchema,
  listRegulatoryDocumentsSchema,
  submissionPacketSchema,
} from '../validations/regulatoryVault.validation';

const router = Router();

/**
 * All routes require authentication and appropriate tenant role
 */

/**
 * GET /api/v1/admin/regulatory-vault/documents
 * List all regulatory documents with optional filtering
 */
router.get(
  '/documents',
  authenticateToken,
  requireTenantRole('admin', 'editor', 'viewer', 'auditor'),
  validateRequest(listRegulatoryDocumentsSchema, 'query'),
  async (req, res, next) => {
    try {
      const documents = await regulatoryVaultService.listDocuments(
        req.tenantId!,
        req.user!.id,
        req.user!.tenantRole!,
        req.query as any
      );

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/regulatory-vault/documents/:id
 * Get a single regulatory document
 */
router.get(
  '/documents/:id',
  authenticateToken,
  requireTenantRole('admin', 'editor', 'viewer', 'auditor'),
  async (req, res, next) => {
    try {
      const document = await regulatoryVaultService.getDocument(
        req.tenantId!,
        req.params.id,
        req.user!.id
      );

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/admin/regulatory-vault/documents
 * Create a new regulatory document
 */
router.post(
  '/documents',
  authenticateToken,
  requireTenantRole('admin', 'editor'),
  validateRequest(createRegulatoryDocumentSchema),
  async (req, res, next) => {
    try {
      const document = await regulatoryVaultService.createDocument(
        req.tenantId!,
        req.user!.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/admin/regulatory-vault/documents/:id
 * Update a regulatory document
 */
router.put(
  '/documents/:id',
  authenticateToken,
  requireTenantRole('admin', 'editor'),
  validateRequest(updateRegulatoryDocumentSchema),
  async (req, res, next) => {
    try {
      const document = await regulatoryVaultService.updateDocument(
        req.tenantId!,
        req.params.id,
        req.user!.id,
        req.body
      );

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/admin/regulatory-vault/documents/:id
 * Delete a regulatory document (soft delete)
 */
router.delete(
  '/documents/:id',
  authenticateToken,
  requireTenantRole('admin'),
  async (req, res, next) => {
    try {
      const result = await regulatoryVaultService.deleteDocument(
        req.tenantId!,
        req.params.id,
        req.user!.id
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/admin/regulatory-vault/submission-packet
 * Get multiple documents for FDA submission packet
 */
router.post(
  '/submission-packet',
  authenticateToken,
  requireTenantRole('admin', 'editor'),
  validateRequest(submissionPacketSchema),
  async (req, res, next) => {
    try {
      const documents = await regulatoryVaultService.getSubmissionPacket(
        req.tenantId!,
        req.user!.id,
        req.body
      );

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/regulatory-vault/export/csv
 * Export documents to CSV
 */
router.get(
  '/export/csv',
  authenticateToken,
  requireTenantRole('admin', 'editor', 'viewer', 'auditor'),
  validateRequest(listRegulatoryDocumentsSchema, 'query'),
  async (req, res, next) => {
    try {
      const csvContent = await regulatoryVaultService.exportToCSV(
        req.tenantId!,
        req.user!.id,
        req.user!.tenantRole!,
        req.query as any
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="regulatory-documents-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
