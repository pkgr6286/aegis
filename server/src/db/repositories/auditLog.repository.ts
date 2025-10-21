import { db } from '../index';
import { auditLogs } from '../schema/core';
import { sql } from 'drizzle-orm';

export class AuditLogRepository {
  async findByTenant(
    tenantId: string,
    options?: {
      resourceType?: string;
      resourceId?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const conditions = [sql`${auditLogs.tenantId} = ${tenantId}`];
    
    if (options?.resourceType) {
      conditions.push(sql`${auditLogs.entityType} = ${options.resourceType}`);
    }
    
    if (options?.resourceId) {
      conditions.push(sql`${auditLogs.entityId} = ${options.resourceId}`);
    }
    
    if (options?.userId) {
      conditions.push(sql`${auditLogs.userId} = ${options.userId}`);
    }

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

  async create(data: {
    tenantId: string;
    userId?: string | null;
    action: string;
    entityType?: string;
    entityId?: string;
    changes?: Record<string, any>;
  }) {
    return await db.insert(auditLogs).values({
      tenantId: data.tenantId,
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      changes: data.changes || null,
      timestamp: new Date(),
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
