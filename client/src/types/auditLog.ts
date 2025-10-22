/**
 * Audit Log Types
 */

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  // Optional joined data
  userEmail?: string;
  userName?: string;
}

export interface AuditLogQuery {
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
