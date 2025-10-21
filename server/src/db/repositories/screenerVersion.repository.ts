/**
 * Screener Version Repository
 * 
 * Data access layer for screener versions
 */

import { db } from '../index';
import { screenerVersions } from '../schema/programs';
import { eq, and, desc, sql } from 'drizzle-orm';

export const screenerVersionRepository = {
  /**
   * Find all screener versions for a drug program
   */
  async findByProgram(tenantId: string, drugProgramId: string) {
    return await db
      .select()
      .from(screenerVersions)
      .where(and(
        eq(screenerVersions.drugProgramId, drugProgramId),
        eq(screenerVersions.tenantId, tenantId)
      ))
      .orderBy(desc(screenerVersions.version));
  },

  /**
   * Find a specific screener version
   */
  async findById(tenantId: string, id: string) {
    const results = await db
      .select()
      .from(screenerVersions)
      .where(and(
        eq(screenerVersions.id, id),
        eq(screenerVersions.tenantId, tenantId)
      ));
    
    return results[0] || null;
  },

  /**
   * Get the next version number for a drug program
   */
  async getNextVersionNumber(tenantId: string, drugProgramId: string): Promise<number> {
    const results = await db
      .select({
        maxVersion: sql<number>`COALESCE(MAX(${screenerVersions.version}), 0)`,
      })
      .from(screenerVersions)
      .where(and(
        eq(screenerVersions.drugProgramId, drugProgramId),
        eq(screenerVersions.tenantId, tenantId)
      ));
    
    return (results[0]?.maxVersion || 0) + 1;
  },

  /**
   * Create a new screener version
   */
  async create(data: {
    tenantId: string;
    drugProgramId: string;
    version: number;
    screenerJson: Record<string, any>;
    createdBy?: string;
  }) {
    const results = await db
      .insert(screenerVersions)
      .values(data)
      .returning();
    
    return results[0];
  },

  /**
   * Check if a version exists for a program
   */
  async versionExists(tenantId: string, drugProgramId: string, version: number): Promise<boolean> {
    const results = await db
      .select({ id: screenerVersions.id })
      .from(screenerVersions)
      .where(and(
        eq(screenerVersions.drugProgramId, drugProgramId),
        eq(screenerVersions.tenantId, tenantId),
        eq(screenerVersions.version, version)
      ));
    
    return results.length > 0;
  },
};
