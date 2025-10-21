import { db } from '../db';
import { auditLogs } from '../db/schema/core';
import { sql } from 'drizzle-orm';

/**
 * Audit Log Service
 * 
 * Provides centralized audit logging for all tenant-scoped actions.
 * This is critical for compliance and security in healthcare/pharma contexts.
 */

export interface CreateAuditLogInput {
  tenantId: string;
  userId?: string | null; // Nullable for system actions
  action: string; // e.g., 'tenant.create', 'user.invite', 'program.publish'
  entityType?: string; // e.g., 'Tenant', 'User', 'DrugProgram'
  entityId?: string;
  changes?: Record<string, any>; // e.g., { old: {...}, new: {...} }
}

export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  async createAuditLog(input: CreateAuditLogInput): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        tenantId: input.tenantId,
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        changes: input.changes || null,
        timestamp: new Date(),
      });
    } catch (error) {
      // Log the error but don't throw - audit logging failures shouldn't break the main operation
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs for a specific tenant
   */
  async getAuditLogs(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    entityType?: string;
    entityId?: string;
    userId?: string;
  }) {
    // Build where conditions
    const conditions = [sql`${auditLogs.tenantId} = ${tenantId}`];
    
    if (options?.entityType) {
      conditions.push(sql`${auditLogs.entityType} = ${options.entityType}`);
    }
    
    if (options?.entityId) {
      conditions.push(sql`${auditLogs.entityId} = ${options.entityId}`);
    }
    
    if (options?.userId) {
      conditions.push(sql`${auditLogs.userId} = ${options.userId}`);
    }

    // Build query with all conditions combined
    let query = db
      .select()
      .from(auditLogs)
      .where(sql.join(conditions, sql` AND `))
      .orderBy(sql`${auditLogs.timestamp} DESC`);

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditTrail(
    tenantId: string,
    entityType: string,
    entityId: string
  ) {
    return await db
      .select()
      .from(auditLogs)
      .where(
        sql`${auditLogs.tenantId} = ${tenantId} 
            AND ${auditLogs.entityType} = ${entityType} 
            AND ${auditLogs.entityId} = ${entityId}`
      )
      .orderBy(sql`${auditLogs.timestamp} ASC`);
  }
}

export const auditLogService = new AuditLogService();
