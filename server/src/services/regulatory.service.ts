import { db } from '../db';
import { screenerVersions, drugPrograms } from '../db/schema/programs';
import { screeningSessions } from '../db/schema/consumer';
import { auditLogs } from '../db/schema/core';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import type { DesignSpecQuery, VersionHistoryQuery, StudyDataQuery, ACNUFailuresQuery } from '../validations/regulatory.validation';

/**
 * Regulatory Service
 * Generates FDA submission-ready documentation
 */

/**
 * Generate Software Design Specification (screener_json)
 */
export async function generateDesignSpec(query: DesignSpecQuery, tenantId: string) {
  const version = await db.query.screenerVersions.findFirst({
    where: and(
      eq(screenerVersions.id, query.versionId),
      eq(screenerVersions.tenantId, tenantId)
    ),
    with: {
      drugProgram: true,
    },
  });

  if (!version) {
    throw new Error('Screener version not found');
  }

  // Return the complete design specification
  return {
    metadata: {
      programName: version.drugProgram.name,
      versionId: version.id,
      versionNumber: version.version,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      generatedAt: new Date().toISOString(),
    },
    screenerJson: version.screenerJson,
  };
}

/**
 * Generate Version History CSV
 * Includes all screener versions and publish events from audit logs
 */
export async function generateVersionHistory(query: VersionHistoryQuery, tenantId: string) {
  // Fetch all versions for this program
  const versions = await db.query.screenerVersions.findMany({
    where: and(
      eq(screenerVersions.drugProgramId, query.programId),
      eq(screenerVersions.tenantId, tenantId)
    ),
    orderBy: (screenerVersions, { asc }) => [asc(screenerVersions.createdAt)],
  });

  // Fetch all publish-related audit logs
  const logs = await db.query.auditLogs.findMany({
    where: and(
      eq(auditLogs.tenantId, tenantId),
      eq(auditLogs.entityType, 'ScreenerVersion'),
      inArray(auditLogs.action, ['screener.create', 'screener.publish', 'screener.archive'])
    ),
    orderBy: (auditLogs, { asc }) => [asc(auditLogs.timestamp)],
  });

  // Combine into CSV rows
  const rows = [
    ['Timestamp', 'Version ID', 'Version Number', 'Action', 'Performed By', 'Notes'],
  ];

  for (const version of versions) {
    // Add version creation row
    rows.push([
      version.createdAt.toISOString(),
      version.id,
      `v${version.version}`,
      'Created',
      version.createdBy || 'System',
      version.notes || `Screener version ${version.version} created`,
    ]);
  }

  // Add audit log entries
  for (const log of logs) {
    rows.push([
      log.timestamp.toISOString(),
      log.entityId || '',
      '',
      log.action,
      log.userId || 'System',
      log.changes ? JSON.stringify(log.changes) : '',
    ]);
  }

  // Convert to CSV string
  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Generate Actual Use Study Data CSV
 * Anonymized screening session data for FDA submission
 */
export async function generateStudyData(query: StudyDataQuery, tenantId: string) {
  // Fetch all sessions for this version
  const sessions = await db.query.screeningSessions.findMany({
    where: and(
      eq(screeningSessions.screenerVersionId, query.versionId),
      eq(screeningSessions.tenantId, tenantId)
    ),
    orderBy: (screeningSessions, { asc }) => [asc(screeningSessions.createdAt)],
  });

  // CSV header
  const rows = [
    [
      'Session ID (Anonymized)',
      'Created At',
      'Completed At',
      'Path Type',
      'Outcome',
      'Review Status',
      'Question-Answer Pairs',
    ],
  ];

  // Add session data (anonymized)
  for (const session of sessions) {
    const answersArray = session.answersJson as Array<{ questionId: string; questionText: string; answer: any }>;
    const qaText = answersArray
      ?.map((qa, idx) => `Q${idx + 1}: ${qa.questionText} | A: ${JSON.stringify(qa.answer)}`)
      .join(' || ') || '';

    rows.push([
      session.id.substring(0, 8), // Anonymized session ID
      session.createdAt.toISOString(),
      session.completedAt?.toISOString() || '',
      session.path || 'manual',
      session.outcome || '',
      session.reviewStatus || 'pending',
      qaText,
    ]);
  }

  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Generate ACNU Failure Log CSV
 * All safety failures for adverse event reporting
 */
export async function generateACNUFailures(query: ACNUFailuresQuery, tenantId: string) {
  // Build where conditions
  const conditions = [
    eq(auditLogs.tenantId, tenantId),
  ];

  if (query.startDate) {
    conditions.push(gte(auditLogs.timestamp, new Date(query.startDate)));
  }

  if (query.endDate) {
    conditions.push(lte(auditLogs.timestamp, new Date(query.endDate)));
  }

  // Fetch all failure-related audit logs
  const logs = await db.query.auditLogs.findMany({
    where: and(...conditions),
    orderBy: (auditLogs, { asc }) => [asc(auditLogs.timestamp)],
  });

  // Filter for failure actions
  const failureLogs = logs.filter(log => 
    log.action.includes('fail') || 
    log.action.includes('reject') ||
    log.action.includes('do_not_use') ||
    log.action.includes('ask_a_doctor')
  );

  // CSV header
  const rows = [
    [
      'Timestamp',
      'Entity Type',
      'Action',
      'User ID',
      'Session ID',
      'Changes',
    ],
  ];

  // Add failure data
  for (const log of failureLogs) {
    rows.push([
      log.timestamp.toISOString(),
      log.entityType || '',
      log.action,
      log.userId || 'Anonymous',
      log.entityId || '',
      log.changes ? JSON.stringify(log.changes) : '',
    ]);
  }

  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}
