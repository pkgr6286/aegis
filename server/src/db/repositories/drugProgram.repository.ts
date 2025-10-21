/**
 * Drug Program Repository
 * 
 * Data access layer for drug programs
 */

import { db } from '../index';
import { drugPrograms } from '../schema/programs';
import { eq, and, sql } from 'drizzle-orm';

export const drugProgramRepository = {
  /**
   * Find all drug programs for a tenant
   */
  async findByTenant(tenantId: string) {
    return await db
      .select()
      .from(drugPrograms)
      .where(eq(drugPrograms.tenantId, tenantId))
      .orderBy(drugPrograms.createdAt);
  },

  /**
   * Find a drug program by ID within a tenant
   */
  async findById(tenantId: string, id: string) {
    const results = await db
      .select()
      .from(drugPrograms)
      .where(and(
        eq(drugPrograms.id, id),
        eq(drugPrograms.tenantId, tenantId)
      ));
    
    return results[0] || null;
  },

  /**
   * Create a new drug program
   */
  async create(data: {
    tenantId: string;
    name: string;
    brandName?: string;
    brandConfigId?: string;
    status?: 'draft' | 'active' | 'archived';
  }) {
    const results = await db
      .insert(drugPrograms)
      .values(data)
      .returning();
    
    return results[0];
  },

  /**
   * Update a drug program
   */
  async update(tenantId: string, id: string, data: {
    name?: string;
    brandName?: string;
    brandConfigId?: string;
    status?: 'draft' | 'active' | 'archived';
    activeScreenerVersionId?: string;
  }) {
    const results = await db
      .update(drugPrograms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(drugPrograms.id, id),
        eq(drugPrograms.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Delete a drug program
   */
  async delete(tenantId: string, id: string) {
    const results = await db
      .delete(drugPrograms)
      .where(and(
        eq(drugPrograms.id, id),
        eq(drugPrograms.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },

  /**
   * Set the active screener version for a drug program
   */
  async setActiveScreenerVersion(tenantId: string, programId: string, versionId: string) {
    const results = await db
      .update(drugPrograms)
      .set({
        activeScreenerVersionId: versionId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(drugPrograms.id, programId),
        eq(drugPrograms.tenantId, tenantId)
      ))
      .returning();
    
    return results[0] || null;
  },
};
