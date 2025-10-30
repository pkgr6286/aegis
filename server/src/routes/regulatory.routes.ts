import { Router } from 'express';
import { authenticateToken, setTenantContextMiddleware, requireTenantRole } from '../middleware/auth.middleware';
import { z } from 'zod';
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

// All routes require authentication, tenant context, and admin/auditor role
router.use(authenticateToken);
router.use(setTenantContextMiddleware);
router.use(requireTenantRole('admin', 'auditor'));

/**
 * GET /api/v1/admin/regulatory/package
 * Generate complete submission package metadata
 */
router.get('/package', async (req, res) => {
  try {
    const { programId, versionId } = packageQuerySchema.parse(req.query);
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Error generating package metadata:', error);
    res.status(500).json({
      error: 'Failed to generate package metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/regulatory/reports/design-spec
 * Download Software Design Specification (JSON)
 */
router.get('/reports/design-spec', async (req, res) => {
  try {
    const { versionId } = designSpecQuerySchema.parse(req.query);
    const tenantId = req.tenantId!;

      const designSpec = await generateDesignSpec({ versionId: versionId as string }, tenantId);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="design-spec-${versionId}.json"`);
      res.json(designSpec);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Error generating design spec:', error);
    res.status(500).json({
      error: 'Failed to generate design spec',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/regulatory/reports/version-history
 * Download Change Control & Version History (CSV)
 */
router.get('/reports/version-history', async (req, res) => {
  try {
    const { programId } = versionHistoryQuerySchema.parse(req.query);
    const tenantId = req.tenantId!;

      const csv = await generateVersionHistory({ programId: programId as string }, tenantId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="version-history-${programId}.csv"`);
      res.send(csv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Error generating version history:', error);
    res.status(500).json({
      error: 'Failed to generate version history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/regulatory/reports/study-data
 * Download Actual Use Study Data (CSV)
 */
router.get('/reports/study-data', async (req, res) => {
  try {
    const { versionId } = studyDataQuerySchema.parse(req.query);
    const tenantId = req.tenantId!;

      const csv = await generateStudyData({ versionId: versionId as string }, tenantId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="study-data-${versionId}.csv"`);
      res.send(csv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Error generating study data:', error);
    res.status(500).json({
      error: 'Failed to generate study data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/regulatory/reports/acnu-failures
 * Download ACNU Failure Log (CSV)
 */
router.get('/reports/acnu-failures', async (req, res) => {
  try {
    const { programId, startDate, endDate } = acnuFailuresQuerySchema.parse(req.query);
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Error generating ACNU failures log:', error);
    res.status(500).json({
      error: 'Failed to generate ACNU failures log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
