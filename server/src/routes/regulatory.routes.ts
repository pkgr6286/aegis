import { Router } from 'express';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { setTenantContext } from '../middleware/tenant.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  packageQuerySchema,
  designSpecQuerySchema,
  versionHistoryQuerySchema,
  studyDataQuerySchema,
  acnuFailuresQuerySchema,
} from '../validations/regulatory.validation';
import {
  generateDesignSpec,
  generateVersionHistory,
  generateStudyData,
  generateACNUFailures,
} from '../services/regulatory.service';

const router = Router();

/**
 * GET /api/v1/admin/regulatory/package
 * Generate complete submission package metadata
 */
router.get(
  '/package',
  authenticateToken,
  setTenantContext,
  requireRole(['admin', 'auditor']),
  validateRequest({ query: packageQuerySchema }),
  async (req, res, next) => {
    try {
      const { programId, versionId } = req.query;
      const tenantId = req.tenantId!;

      // Return metadata about available reports
      const packageMetadata = {
        programId,
        versionId,
        generatedAt: new Date().toISOString(),
        reports: [
          {
            id: 'design-spec',
            name: 'Software Design Specification',
            filename: `design-spec-${versionId}.json`,
            description: '21 CFR Part 11 compliant software design specification',
            endpoint: `/api/v1/admin/regulatory/reports/design-spec?versionId=${versionId}`,
          },
          {
            id: 'version-history',
            name: 'Change Control & Version History',
            filename: `version-history-${programId}.csv`,
            description: 'Complete audit trail of all screener versions and changes',
            endpoint: `/api/v1/admin/regulatory/reports/version-history?programId=${programId}`,
          },
          {
            id: 'study-data',
            name: 'Actual Use Study Data',
            filename: `study-data-${versionId}.csv`,
            description: 'Anonymized screening session data for actual use studies',
            endpoint: `/api/v1/admin/regulatory/reports/study-data?versionId=${versionId}`,
          },
          {
            id: 'acnu-failures',
            name: 'ACNU Failure Log',
            filename: `acnu-failures-${programId}.csv`,
            description: 'Safety failure events for ACNU adverse event reporting',
            endpoint: `/api/v1/admin/regulatory/reports/acnu-failures?programId=${programId}`,
          },
        ],
      };

      res.json({
        success: true,
        data: packageMetadata,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/regulatory/reports/design-spec
 * Download Software Design Specification (JSON)
 */
router.get(
  '/reports/design-spec',
  authenticateToken,
  setTenantContext,
  requireRole(['admin', 'auditor']),
  validateRequest({ query: designSpecQuerySchema }),
  async (req, res, next) => {
    try {
      const { versionId } = req.query;
      const tenantId = req.tenantId!;

      const designSpec = await generateDesignSpec({ versionId: versionId as string }, tenantId);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="design-spec-${versionId}.json"`);
      res.json(designSpec);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/regulatory/reports/version-history
 * Download Change Control & Version History (CSV)
 */
router.get(
  '/reports/version-history',
  authenticateToken,
  setTenantContext,
  requireRole(['admin', 'auditor']),
  validateRequest({ query: versionHistoryQuerySchema }),
  async (req, res, next) => {
    try {
      const { programId } = req.query;
      const tenantId = req.tenantId!;

      const csv = await generateVersionHistory({ programId: programId as string }, tenantId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="version-history-${programId}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/regulatory/reports/study-data
 * Download Actual Use Study Data (CSV)
 */
router.get(
  '/reports/study-data',
  authenticateToken,
  setTenantContext,
  requireRole(['admin', 'auditor']),
  validateRequest({ query: studyDataQuerySchema }),
  async (req, res, next) => {
    try {
      const { versionId } = req.query;
      const tenantId = req.tenantId!;

      const csv = await generateStudyData({ versionId: versionId as string }, tenantId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="study-data-${versionId}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/regulatory/reports/acnu-failures
 * Download ACNU Failure Log (CSV)
 */
router.get(
  '/reports/acnu-failures',
  authenticateToken,
  setTenantContext,
  requireRole(['admin', 'auditor']),
  validateRequest({ query: acnuFailuresQuerySchema }),
  async (req, res, next) => {
    try {
      const { programId, startDate, endDate } = req.query;
      const tenantId = req.tenantId!;

      const csv = await generateACNUFailures(
        {
          programId: programId as string,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
        },
        tenantId
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="acnu-failures-${programId}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
