import {
  pgTableCreator,
  uuid,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { tenants, users } from './public'; // Import the global tables

/**
 * =================================================================
 * ARCHITECTURAL NOTE: ROW-LEVEL SECURITY (RLS) SETUP
 * =================================================================
 *
 * This schema uses a shared-table model with PostgreSQL's Row-Level
 * Security (RLS). This provides strong isolation at the database layer.
 *
 * HOW IT WORKS:
 * 1. Your Node.js authentication middleware must identify the user
 * AND the tenant they are accessing.
 * 2. On EVERY authenticated request, you MUST set a session variable:
 * `SET app.current_tenant_id = '...tenant-uuid-here...';`
 * 3. The RLS policies below read this `app.current_tenant_id`
 * variable and automatically filter all queries (SELECT, INSERT,
 * UPDATE, DELETE) to match that tenant.
 * 4. Data leakage between tenants becomes impossible, even if there
 * is a bug in the application's query logic.
 *
 *
 * REQUIRED BOOTSTRAP SQL (Run this once on your DB):
 *
 * -- 1. Create a "bypass RLS" user for migrations and system tasks
 * CREATE ROLE bypass_rls;
 * -- (Your migration user should be a member of this role)
 *
 * -- 2. Enable RLS on all tenant-scoped tables
 * ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 * -- ... (do this for all future app tables) ...
 *
 * -- 3. Create the RLS policy
 * CREATE POLICY tenant_isolation_policy
 * ON tenant_users
 * FOR ALL
 * USING (tenant_id::text = current_setting('app.current_tenant_id', true))
 * WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
 *
 * CREATE POLICY tenant_isolation_policy
 * ON audit_logs
 * FOR ALL
 * USING (tenant_id::text = current_setting('app.current_tenant_id', true))
 * WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
 *
 * -- 4. Grant access to your app's role (e.g., 'app_user')
 * GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
 * GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
 *
 * -- 5. Grant bypass to your admin/migration role
 * -- (For specific tables that need it)
 *
 * =================================================================
 */

/**
 * We use the same table creator for consistency.
 * In production, you might use pgSchema to create an 'app' schema.
 */
const appTable = pgTableCreator((name) => `${name}`);

// ------------------------------------------------------------------
// REUSABLE SCHEMAS & ENUMS (Tenant-Scoped)
// ------------------------------------------------------------------

/**
 * Tenant-level roles. These are distinct from System-level roles.
 */
export const tenantRoleEnum = pgEnum('tenant_role', ['admin', 'editor', 'viewer']);

/**
 * A reusable Drizzle object for full audit trails on all app tables.
 * All your business-logic tables should spread this object.
 */
export const auditSchema = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
  deletedAt: timestamp('deleted_at'), // For soft-deletion
};

// ------------------------------------------------------------------
// CORE APP TABLES (Tenant-Scoped)
// ------------------------------------------------------------------

/**
 * This is the central "membership" table.
 * It connects a global User to a global Tenant with a specific Role.
 * RLS IS MANDATORY ON THIS TABLE.
 */
export const tenantUsers = appTable('tenant_users', {
  // Core Fields
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: tenantRoleEnum('role').notNull().default('viewer'),

  // Extensibility
  metadata: jsonb('metadata'),
  
  // Spread the reusable audit schema
  ...auditSchema,
}, (table) => ({
  // Index for RLS-scoped user lookups
  userIdx: index('tu_user_id_idx').on(table.userId),
  tenantUserIdx: index('tu_tenant_user_idx').on(table.tenantId, table.userId),
}));

/**
 * A comprehensive, tenant-scoped audit log for all major events.
 * RLS IS MANDATORY ON THIS TABLE.
 */
export const auditLogs = appTable('audit_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Context of who did what
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // Nullable for system actions
  action: varchar('action', { length: 255 }).notNull(), // e.g., 'user.create', 'screener.publish'
  
  // Context of the entity that was changed
  entityType: varchar('entity_type', { length: 255 }), // e.g., 'User', 'DrugProgram'
  entityId: uuid('entity_id'),
  
  // The actual change data
  changes: jsonb('changes'), // e.g., { "old": { "status": "draft" }, "new": { "status": "published" } }
  
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  // Composite index for fast lookups of a specific entity's history
  entityIdx: index('audit_entity_idx').on(table.tenantId, table.entityType, table.entityId),
  
  // Index for user-specific activity logs
  userIdx: index('audit_user_idx').on(table.tenantId, table.userId),
}));

// ------------------------------------------------------------------
// RELATIONS (Tenant-Scoped)
// ------------------------------------------------------------------

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
