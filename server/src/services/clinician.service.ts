/**
 * Clinician Service
 * 
 * Business logic for clinician role operations:
 * - Review queue management
 * - Session review and notes
 */

import { db } from '../db/index';
import { screeningSessions } from '../db/schema/consumer';
import { drugPrograms, screenerVersions } from '../db/schema/programs';
import { users } from '../db/schema/public';
import { eq, and, desc, count } from 'drizzle-orm';
import type { SessionQuery, SubmitReview } from '../validations/clinician.validation';

export class ClinicianService {
  /**
   * Get paginated list of screening sessions for review
   * Supports filtering by reviewStatus, drugProgramId, and outcome
   */
  async getSessions(tenantId: string, query: SessionQuery) {
    const { reviewStatus, drugProgramId, outcome, page, limit } = query;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: any[] = [
      eq(screeningSessions.tenantId, tenantId),
      eq(screeningSessions.status, 'completed'), // Only completed sessions can be reviewed
    ];

    if (reviewStatus) {
      conditions.push(eq(screeningSessions.reviewStatus, reviewStatus));
    }

    if (drugProgramId) {
      conditions.push(eq(screeningSessions.drugProgramId, drugProgramId));
    }

    if (outcome) {
      conditions.push(eq(screeningSessions.outcome, outcome));
    }

    // Fetch sessions with related data
    const sessions = await db
      .select({
        id: screeningSessions.id,
        drugProgramId: screeningSessions.drugProgramId,
        drugProgramName: drugPrograms.name,
        screenerVersionId: screeningSessions.screenerVersionId,
        screenerVersion: screenerVersions.version,
        status: screeningSessions.status,
        outcome: screeningSessions.outcome,
        path: screeningSessions.path,
        reviewStatus: screeningSessions.reviewStatus,
        reviewedBy: screeningSessions.reviewedBy,
        reviewedByEmail: users.email,
        reviewedAt: screeningSessions.reviewedAt,
        createdAt: screeningSessions.createdAt,
        completedAt: screeningSessions.completedAt,
      })
      .from(screeningSessions)
      .leftJoin(drugPrograms, eq(screeningSessions.drugProgramId, drugPrograms.id))
      .leftJoin(screenerVersions, eq(screeningSessions.screenerVersionId, screenerVersions.id))
      .leftJoin(users, eq(screeningSessions.reviewedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(screeningSessions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(screeningSessions)
      .where(and(...conditions));

    return {
      sessions,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * Get detailed information about a single screening session
   * Includes answers and screener definition
   */
  async getSessionById(tenantId: string, sessionId: string) {
    const session = await db
      .select({
        id: screeningSessions.id,
        drugProgramId: screeningSessions.drugProgramId,
        drugProgramName: drugPrograms.name,
        drugProgramSlug: drugPrograms.slug,
        screenerVersionId: screeningSessions.screenerVersionId,
        screenerVersion: screenerVersions.version,
        screenerJson: screenerVersions.screenerJson,
        status: screeningSessions.status,
        outcome: screeningSessions.outcome,
        path: screeningSessions.path,
        answersJson: screeningSessions.answersJson,
        reviewStatus: screeningSessions.reviewStatus,
        reviewedBy: screeningSessions.reviewedBy,
        reviewedByEmail: users.email,
        reviewedAt: screeningSessions.reviewedAt,
        createdAt: screeningSessions.createdAt,
        completedAt: screeningSessions.completedAt,
      })
      .from(screeningSessions)
      .leftJoin(drugPrograms, eq(screeningSessions.drugProgramId, drugPrograms.id))
      .leftJoin(screenerVersions, eq(screeningSessions.screenerVersionId, screenerVersions.id))
      .leftJoin(users, eq(screeningSessions.reviewedBy, users.id))
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.id, sessionId)
        )
      )
      .limit(1);

    if (session.length === 0) {
      throw new Error('Session not found');
    }

    return session[0];
  }

  /**
   * Submit a clinical review for a screening session
   * Updates reviewStatus, reviewedBy, reviewedAt, and optionally adds notes
   */
  async submitReview(
    tenantId: string,
    sessionId: string,
    clinicianUserId: string,
    review: SubmitReview
  ) {
    // First verify the session exists and belongs to this tenant
    const existingSession = await db
      .select({ id: screeningSessions.id })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.id, sessionId),
          eq(screeningSessions.status, 'completed') // Can only review completed sessions
        )
      )
      .limit(1);

    if (existingSession.length === 0) {
      throw new Error('Session not found or not completed');
    }

    // Update the session with review information
    const [updatedSession] = await db
      .update(screeningSessions)
      .set({
        reviewStatus: review.reviewStatus,
        reviewedBy: clinicianUserId,
        reviewedAt: new Date(),
      })
      .where(eq(screeningSessions.id, sessionId))
      .returning();

    // TODO: In a full implementation, you might want to store clinical notes
    // in a separate table (e.g., session_review_notes) for audit trail purposes
    // For now, we're just updating the review status

    return updatedSession;
  }
}

export const clinicianService = new ClinicianService();
