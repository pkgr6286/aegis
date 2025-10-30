/**
 * AI Analyst Routes
 * 
 * Natural language analytics query endpoint powered by OpenAI
 */

import { Router } from 'express';
import { aiAnalystService } from '../services/aiAnalyst.service';
import { z } from 'zod';

const router = Router();

/**
 * Query schema validation
 */
const queryAISchema = z.object({
  query: z.string().min(3, 'Question must be at least 3 characters').max(500, 'Question too long'),
  drugProgramId: z.string().uuid('Invalid drug program ID'),
});

/**
 * POST /api/v1/admin/analytics/query-ai
 * Ask the AI Analyst a question about analytics data
 * 
 * Request body:
 * {
 *   "query": "Why is our screener failing most often?",
 *   "drugProgramId": "uuid"
 * }
 */
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
