/**
 * Analytics Service
 * 
 * Business logic for advanced analytics and intelligence:
 * - Screener funnel analysis
 * - Outcome analysis by question
 * - Path performance (manual vs EHR)
 * - Population/demographic insights
 * - Partner performance metrics
 * - Education efficacy tracking
 */

export const analyticsService = {
  /**
   * Get overview statistics for a drug program
   */
  async getOverviewStats(tenantId: string, drugProgramId: string) {
    const { db } = await import('../db');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { verificationCodes } = await import('../db/schema/consumer');
    const { sql, count, eq, and } = await import('drizzle-orm');

    const [totalScreenings] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId)
        )
      );

    const [completedScreenings] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.status, 'completed')
        )
      );

    const [eligibleScreenings] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.outcome, 'ok_to_use')
        )
      );

    const totalCodes = await db
      .select({ count: count() })
      .from(verificationCodes)
      .innerJoin(
        screeningSessions,
        eq(verificationCodes.screeningSessionId, screeningSessions.id)
      )
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId)
        )
      );

    const usedCodes = await db
      .select({ count: count() })
      .from(verificationCodes)
      .innerJoin(
        screeningSessions,
        eq(verificationCodes.screeningSessionId, screeningSessions.id)
      )
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(verificationCodes.status, 'used')
        )
      );

    const completionRate =
      totalScreenings.count > 0
        ? (completedScreenings.count / totalScreenings.count) * 100
        : 0;

    const eligibilityRate =
      completedScreenings.count > 0
        ? (eligibleScreenings.count / completedScreenings.count) * 100
        : 0;

    const verificationRate =
      totalCodes[0]?.count > 0
        ? (usedCodes[0]?.count / totalCodes[0].count) * 100
        : 0;

    return {
      totalScreenings: totalScreenings.count,
      completedScreenings: completedScreenings.count,
      eligibleScreenings: eligibleScreenings.count,
      totalCodes: totalCodes[0]?.count || 0,
      usedCodes: usedCodes[0]?.count || 0,
      completionRate: Math.round(completionRate * 10) / 10,
      eligibilityRate: Math.round(eligibilityRate * 10) / 10,
      verificationRate: Math.round(verificationRate * 10) / 10,
    };
  },

  /**
   * Get screener funnel data
   * Shows drop-off at each stage
   */
  async getScreenerFunnel(tenantId: string, drugProgramId: string) {
    const { db } = await import('../db');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { verificationCodes } = await import('../db/schema/consumer');
    const { count, eq, and } = await import('drizzle-orm');

    const [started] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId)
        )
      );

    const [completed] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.status, 'completed')
        )
      );

    const [passedScreener] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.outcome, 'ok_to_use')
        )
      );

    const generatedCode = await db
      .select({ count: count() })
      .from(verificationCodes)
      .innerJoin(
        screeningSessions,
        eq(verificationCodes.screeningSessionId, screeningSessions.id)
      )
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId)
        )
      );

    const usedCode = await db
      .select({ count: count() })
      .from(verificationCodes)
      .innerJoin(
        screeningSessions,
        eq(verificationCodes.screeningSessionId, screeningSessions.id)
      )
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(verificationCodes.status, 'used')
        )
      );

    return {
      started: started.count,
      completed: completed.count,
      passedScreener: passedScreener.count,
      generatedCode: generatedCode[0]?.count || 0,
      usedCode: usedCode[0]?.count || 0,
    };
  },

  /**
   * Get outcomes breakdown by question
   * Identifies which questions/answers drive failures
   */
  async getOutcomesByQuestion(tenantId: string, drugProgramId: string) {
    const { db } = await import('../db');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { eq, and, or, ne } = await import('drizzle-orm');

    const sessions = await db
      .select({
        answersJson: screeningSessions.answersJson,
        outcome: screeningSessions.outcome,
      })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.status, 'completed'),
          or(
            eq(screeningSessions.outcome, 'ask_a_doctor'),
            eq(screeningSessions.outcome, 'do_not_use')
          )
        )
      );

    const questionOutcomeMap = new Map<string, Map<string, { outcome: string; count: number }>>();

    sessions.forEach((session) => {
      const answers = session.answersJson as Record<string, any>;
      const outcome = session.outcome;

      if (!outcome) return;

      Object.entries(answers).forEach(([questionId, answer]) => {
        if (!questionOutcomeMap.has(questionId)) {
          questionOutcomeMap.set(questionId, new Map());
        }

        const answerStr = typeof answer === 'object' ? JSON.stringify(answer) : String(answer);
        const key = `${answerStr}:${outcome}`;

        const outcomeMap = questionOutcomeMap.get(questionId)!;
        const existing = outcomeMap.get(key);

        if (existing) {
          existing.count++;
        } else {
          outcomeMap.set(key, { outcome, count: 1 });
        }
      });
    });

    const results: Array<{
      questionId: string;
      answer: string;
      outcome: string;
      count: number;
    }> = [];

    questionOutcomeMap.forEach((outcomeMap, questionId) => {
      outcomeMap.forEach((data, key) => {
        const [answer] = key.split(':');
        results.push({
          questionId,
          answer,
          outcome: data.outcome,
          count: data.count,
        });
      });
    });

    return results.sort((a, b) => b.count - a.count).slice(0, 50);
  },

  /**
   * Compare manual vs EHR-assisted path performance
   */
  async getPathPerformance(tenantId: string, drugProgramId: string) {
    const { db } = await import('../db');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { count, eq, and } = await import('drizzle-orm');

    const [manualStarted] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.path, 'manual')
        )
      );

    const [manualCompleted] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.path, 'manual'),
          eq(screeningSessions.status, 'completed')
        )
      );

    const [manualEligible] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.path, 'manual'),
          eq(screeningSessions.outcome, 'ok_to_use')
        )
      );

    const [ehrStarted] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.path, 'ehr_assisted')
        )
      );

    const [ehrCompleted] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.path, 'ehr_assisted'),
          eq(screeningSessions.status, 'completed')
        )
      );

    const [ehrEligible] = await db
      .select({ count: count() })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.path, 'ehr_assisted'),
          eq(screeningSessions.outcome, 'ok_to_use')
        )
      );

    const manualCompletionRate =
      manualStarted.count > 0 ? (manualCompleted.count / manualStarted.count) * 100 : 0;
    const manualEligibilityRate =
      manualCompleted.count > 0 ? (manualEligible.count / manualCompleted.count) * 100 : 0;

    const ehrCompletionRate =
      ehrStarted.count > 0 ? (ehrCompleted.count / ehrStarted.count) * 100 : 0;
    const ehrEligibilityRate =
      ehrCompleted.count > 0 ? (ehrEligible.count / ehrCompleted.count) * 100 : 0;

    return {
      manual: {
        started: manualStarted.count,
        completed: manualCompleted.count,
        eligible: manualEligible.count,
        completionRate: Math.round(manualCompletionRate * 10) / 10,
        eligibilityRate: Math.round(manualEligibilityRate * 10) / 10,
      },
      ehr: {
        started: ehrStarted.count,
        completed: ehrCompleted.count,
        eligible: ehrEligible.count,
        completionRate: Math.round(ehrCompletionRate * 10) / 10,
        eligibilityRate: Math.round(ehrEligibilityRate * 10) / 10,
      },
    };
  },

  /**
   * Get population/demographic insights
   * Analyzes outcomes by demographic question answers
   */
  async getPopulationOutcomes(tenantId: string, drugProgramId: string, questionId?: string) {
    const { db } = await import('../db');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { eq, and } = await import('drizzle-orm');

    const sessions = await db
      .select({
        answersJson: screeningSessions.answersJson,
        outcome: screeningSessions.outcome,
      })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.status, 'completed')
        )
      );

    if (questionId) {
      const outcomeMap = new Map<string, { ok_to_use: number; ask_a_doctor: number; do_not_use: number }>();

      sessions.forEach((session) => {
        const answers = session.answersJson as Record<string, any>;
        const answer = answers[questionId];
        const outcome = session.outcome;

        if (!answer || !outcome) return;

        const answerStr = typeof answer === 'object' ? JSON.stringify(answer) : String(answer);

        if (!outcomeMap.has(answerStr)) {
          outcomeMap.set(answerStr, { ok_to_use: 0, ask_a_doctor: 0, do_not_use: 0 });
        }

        const stats = outcomeMap.get(answerStr)!;
        stats[outcome as keyof typeof stats]++;
      });

      return Array.from(outcomeMap.entries()).map(([answer, outcomes]) => ({
        answer,
        ...outcomes,
        total: outcomes.ok_to_use + outcomes.ask_a_doctor + outcomes.do_not_use,
      }));
    }

    const allQuestionIds = new Set<string>();
    sessions.forEach((session) => {
      const answers = session.answersJson as Record<string, any>;
      Object.keys(answers).forEach((qId) => allQuestionIds.add(qId));
    });

    return Array.from(allQuestionIds).map((qId) => ({ questionId: qId }));
  },

  /**
   * Get partner performance metrics
   * Analyzes verification success/failure by partner
   */
  async getPartnerPerformance(tenantId: string, drugProgramId: string) {
    const { db } = await import('../db');
    const { auditLogs } = await import('../db/schema/core');
    const { partners } = await import('../db/schema/partners');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { eq, and, or, sql } = await import('drizzle-orm');

    const verificationLogs = await db
      .select({
        userId: auditLogs.userId,
        action: auditLogs.action,
        changes: auditLogs.changes,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenantId),
          or(
            eq(auditLogs.action, 'code.verified'),
            eq(auditLogs.action, 'code.verification_failed')
          )
        )
      );

    const partnerList = await db
      .select({
        id: partners.id,
        name: partners.name,
      })
      .from(partners)
      .where(eq(partners.tenantId, tenantId));

    const partnerMap = new Map<string, { name: string; success: number; failed: number }>();

    partnerList.forEach((partner) => {
      partnerMap.set(partner.id, { name: partner.name, success: 0, failed: 0 });
    });

    verificationLogs.forEach((log) => {
      const partnerId = log.userId;
      if (!partnerId || !partnerMap.has(partnerId)) return;

      const stats = partnerMap.get(partnerId)!;
      if (log.action === 'code.verified') {
        stats.success++;
      } else {
        stats.failed++;
      }
    });

    return Array.from(partnerMap.entries())
      .map(([partnerId, data]) => ({
        partnerId,
        partnerName: data.name,
        success: data.success,
        failed: data.failed,
        total: data.success + data.failed,
        successRate:
          data.success + data.failed > 0
            ? Math.round((data.success / (data.success + data.failed)) * 1000) / 10
            : 0,
      }))
      .filter((p) => p.total > 0)
      .sort((a, b) => b.total - a.total);
  },

  /**
   * Get education efficacy metrics
   * Tracks comprehension check pass/fail rates
   */
  async getEducationEfficacy(tenantId: string, drugProgramId: string) {
    const { db } = await import('../db');
    const { screeningSessions } = await import('../db/schema/consumer');
    const { eq, and, sql } = await import('drizzle-orm');

    const sessions = await db
      .select({
        answersJson: screeningSessions.answersJson,
        outcome: screeningSessions.outcome,
      })
      .from(screeningSessions)
      .where(
        and(
          eq(screeningSessions.tenantId, tenantId),
          eq(screeningSessions.drugProgramId, drugProgramId),
          eq(screeningSessions.status, 'completed')
        )
      );

    let comprehensionPass = 0;
    let comprehensionFail = 0;
    let totalWithComprehension = 0;

    sessions.forEach((session) => {
      const answers = session.answersJson as Record<string, any>;
      
      const comprehensionKeys = Object.keys(answers).filter(
        (key) => key.includes('comprehension') || key.includes('education_check')
      );

      if (comprehensionKeys.length > 0) {
        totalWithComprehension++;
        const allPassed = comprehensionKeys.every((key) => {
          const answer = answers[key];
          return answer === true || answer === 'yes' || answer === 'correct';
        });

        if (allPassed) {
          comprehensionPass++;
        } else {
          comprehensionFail++;
        }
      }
    });

    const failRate =
      totalWithComprehension > 0
        ? Math.round((comprehensionFail / totalWithComprehension) * 1000) / 10
        : 0;

    return {
      pass: comprehensionPass,
      fail: comprehensionFail,
      total: totalWithComprehension,
      failRate: `${failRate}%`,
    };
  },
};
