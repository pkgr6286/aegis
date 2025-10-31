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
  requireTenantRole(['admin', 'editor', 'viewer', 'auditor']),
  validateRequest(listRegulatoryDocumentsSchema, 'query'),
  async (req, res, next) => {
    try {
      const documents = await regulatoryVaultService.listDocuments(
        req.tenantId!,
        req.userId!,
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
  requireTenantRole(['admin', 'editor', 'viewer', 'auditor']),
  async (req, res, next) => {
    try {
      const document = await regulatoryVaultService.getDocument(
        req.tenantId!,
        req.params.id,
        req.userId!
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
  requireTenantRole(['admin', 'editor']),
  validateRequest(createRegulatoryDocumentSchema),
  async (req, res, next) => {
    try {
      const document = await regulatoryVaultService.createDocument(
        req.tenantId!,
        req.userId!,
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
  requireTenantRole(['admin', 'editor']),
  validateRequest(updateRegulatoryDocumentSchema),
  async (req, res, next) => {
    try {
      const document = await regulatoryVaultService.updateDocument(
        req.tenantId!,
        req.params.id,
        req.userId!,
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
  requireTenantRole(['admin']),
  async (req, res, next) => {
    try {
      const result = await regulatoryVaultService.deleteDocument(
        req.tenantId!,
        req.params.id,
        req.userId!
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
  requireTenantRole(['admin', 'editor']),
  validateRequest(submissionPacketSchema),
  async (req, res, next) => {
    try {
      const documents = await regulatoryVaultService.getSubmissionPacket(
        req.tenantId!,
        req.userId!,
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

export default router;
