/**
 * Screening Session Repository
 * 
 * Data access layer for consumer screening sessions
 */

import { db } from '../index';
import { screeningSessions, ehrConsents } from '../schema/consumer';
import { eq, and, sql } from 'drizzle-orm';

export const screeningSessionRepository = {
  /**
   * Find a screening session by ID
   */
  async findById(sessionId: string) {
    const results = await db
      .select()
      .from(screeningSessions)
      .where(eq(screeningSessions.id, sessionId));
    
    return results[0] || null;
  },

  /**
   * Create a new screening session
   */
  async create(data: {
    tenantId: string;
    drugProgramId: string;
    screenerVersionId: string;
    path?: 'manual' | 'ehr_assisted' | 'ehr_mandatory';
  }) {
    const results = await db
      .insert(screeningSessions)
      .values({
        ...data,
        status: 'started',
        answersJson: {},
      })
      .returning();
    
    return results[0];
  },

  /**
   * Submit answers and complete the session
   */
  async submitAnswers(sessionId: string, data: {
    answersJson: Record<string, any>;
    outcome: 'ok_to_use' | 'ask_a_doctor' | 'do_not_use';
  }) {
    const results = await db
      .update(screeningSessions)
      .set({
        answersJson: data.answersJson,
        outcome: data.outcome,
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(screeningSessions.id, sessionId))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Update session answers (without completing)
   */
  async updateAnswers(sessionId: string, answersJson: Record<string, any>) {
    const results = await db
      .update(screeningSessions)
      .set({
        answersJson,
      })
      .where(eq(screeningSessions.id, sessionId))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Update session outcome (e.g., after comprehension check failure)
   */
  async updateOutcome(sessionId: string, outcome: 'ok_to_use' | 'ask_a_doctor' | 'do_not_use') {
    const results = await db
      .update(screeningSessions)
      .set({
        outcome,
      })
      .where(eq(screeningSessions.id, sessionId))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Check if session is valid for code generation
   * (completed and outcome is 'ok_to_use')
   */
  async isEligibleForCode(sessionId: string): Promise<boolean> {
    const results = await db
      .select({
        id: screeningSessions.id,
      })
      .from(screeningSessions)
      .where(and(
        eq(screeningSessions.id, sessionId),
        eq(screeningSessions.status, 'completed'),
        eq(screeningSessions.outcome, 'ok_to_use')
      ));
    
    return results.length > 0;
  },

  /**
   * Get session statistics for a drug program (analytics)
   */
  async getSessionStats(tenantId: string, drugProgramId: string) {
    const results = await db
      .select({
        totalSessions: sql<number>`COUNT(*)`,
        completedSessions: sql<number>`COUNT(*) FILTER (WHERE ${screeningSessions.status} = 'completed')`,
        okToUse: sql<number>`COUNT(*) FILTER (WHERE ${screeningSessions.outcome} = 'ok_to_use')`,
        askADoctor: sql<number>`COUNT(*) FILTER (WHERE ${screeningSessions.outcome} = 'ask_a_doctor')`,
        doNotUse: sql<number>`COUNT(*) FILTER (WHERE ${screeningSessions.outcome} = 'do_not_use')`,
      })
      .from(screeningSessions)
      .where(and(
        eq(screeningSessions.tenantId, tenantId),
        eq(screeningSessions.drugProgramId, drugProgramId)
      ));
    
    return results[0];
  },

  /**
   * Update session path (e.g., from 'manual' to 'ehr_assisted')
   */
  async updatePath(sessionId: string, path: 'manual' | 'ehr_assisted' | 'ehr_mandatory') {
    const results = await db
      .update(screeningSessions)
      .set({ path })
      .where(eq(screeningSessions.id, sessionId))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Find session by ID with EHR consent relation
   */
  async findByIdWithConsent(sessionId: string) {
    const results = await db.query.screeningSessions.findFirst({
      where: eq(screeningSessions.id, sessionId),
      with: {
        ehrConsent: true,
      },
    });
    
    return results || null;
  },
};
