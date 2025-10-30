/**
 * Analytics Routes
 * 
 * Advanced analytics and intelligence endpoints for Pharma Admins
 * All routes are protected and tenant-scoped
 */

import { Router } from 'express';
import { analyticsService } from '../services/analytics.service';
import { aiAnalystService } from '../services/aiAnalyst.service';
import { analyticsQuerySchema } from '../validations/analytics.validation';
import { z } from 'zod';
import { authenticateToken, setTenantContextMiddleware, requireTenantRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication, tenant context, and viewer+ role
router.use(authenticateToken);
router.use(setTenantContextMiddleware);
router.use(requireTenantRole('viewer', 'editor', 'admin', 'auditor', 'clinician'));

/**
 * GET /api/v1/admin/analytics/overview-stats
 * Get overview statistics for a drug program
 */
router.get('/overview-stats', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { drugProgramId } = analyticsQuerySchema.parse(req.query);

    const stats = await analyticsService.getOverviewStats(tenantId, drugProgramId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error fetching overview stats:', error);
    res.status(500).json({
      error: 'Failed to fetch overview stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/analytics/screener-funnel
 * Get screener funnel data showing drop-off at each stage
 */
router.get('/screener-funnel', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { drugProgramId } = analyticsQuerySchema.parse(req.query);

    const funnel = await analyticsService.getScreenerFunnel(tenantId, drugProgramId);

    res.json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error fetching screener funnel:', error);
    res.status(500).json({
      error: 'Failed to fetch screener funnel',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/analytics/outcomes-by-question
 * Get breakdown of which questions/answers drive failures
 */
router.get('/outcomes-by-question', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { drugProgramId } = analyticsQuerySchema.parse(req.query);

    const outcomes = await analyticsService.getOutcomesByQuestion(tenantId, drugProgramId);

    res.json({
      success: true,
      data: outcomes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error fetching outcomes by question:', error);
    res.status(500).json({
      error: 'Failed to fetch outcomes by question',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/analytics/path-performance
 * Compare manual vs EHR-assisted path performance
 */
router.get('/path-performance', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { drugProgramId } = analyticsQuerySchema.parse(req.query);

    const performance = await analyticsService.getPathPerformance(tenantId, drugProgramId);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error fetching path performance:', error);
    res.status(500).json({
      error: 'Failed to fetch path performance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/analytics/population-outcomes
 * Get demographic/population insights
 * Optional questionId parameter to get breakdown for specific demographic question
 */
router.get('/population-outcomes', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { drugProgramId, questionId } = analyticsQuerySchema.parse(req.query);

    const outcomes = await analyticsService.getPopulationOutcomes(
      tenantId,
      drugProgramId,
      questionId
    );

    res.json({
      success: true,
      data: outcomes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error fetching population outcomes:', error);
    res.status(500).json({
      error: 'Failed to fetch population outcomes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/analytics/partner-performance
 * Get verification success/failure rates by partner
 */
router.get('/partner-performance', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { drugProgramId } = analyticsQuerySchema.parse(req.query);

    const performance = await analyticsService.getPartnerPerformance(tenantId, drugProgramId);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error fetching partner performance:', error);
    res.status(500).json({
      error: 'Failed to fetch partner performance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/analytics/education-efficacy
 * Get education/comprehension check metrics
 */
router.get('/education-efficacy', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { drugProgramId } = analyticsQuerySchema.parse(req.query);

    const efficacy = await analyticsService.getEducationEfficacy(tenantId, drugProgramId);

    res.json({
      success: true,
      data: efficacy,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error fetching education efficacy:', error);
    res.status(500).json({
      error: 'Failed to fetch education efficacy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/admin/analytics/query-ai
 * Ask the AI Analyst a natural language question about analytics data
 */
const queryAISchema = z.object({
  query: z.string().min(3, 'Question must be at least 3 characters').max(500, 'Question too long'),
  drugProgramId: z.string().uuid('Invalid drug program ID'),
});

router.post('/query-ai', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { query, drugProgramId } = queryAISchema.parse(req.body);

    const aiResponse = await aiAnalystService.queryAI({
      query,
      tenantId,
      drugProgramId,
    });

    res.json({
      success: true,
      data: {
        query,
        response: aiResponse,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error in AI Analyst query:', error);
    res.status(500).json({
      error: 'Failed to process AI query',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
