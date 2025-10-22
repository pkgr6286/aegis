import {
  pgTableCreator,
  uuid,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * Use a pgTableCreator to optionally prefix all tables.
 * This is a Drizzle best-practice for schema organization.
 * We will use a 'public' prefix for our global tables.
 */
const publicTable = pgTableCreator((name) => `${name}`);

// ------------------------------------------------------------------
// ENUMS (Global)
// ------------------------------------------------------------------

export const systemRoleEnum = pgEnum('system_role', ['super_admin', 'support_staff']);
export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'suspended', 'trial']);
export const tokenStatusEnum = pgEnum('token_status', ['active', 'used', 'expired']);

// ------------------------------------------------------------------
// TABLES (Global)
// ------------------------------------------------------------------

/**
 * The master list of all tenants on the platform.
 * This is the central "directory" of your customers (e.g., Kenvue, AstraZeneca).
 */
export const tenants = publicTable('tenants', {
  // Core Fields
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  status: tenantStatusEnum('status').notNull().default('trial'),

  // Extensibility & Lifecycle
  metadata: jsonb('metadata'),
  retiredAt: timestamp('retired_at'), // For permanent, non-destructive tenant offboarding

  // Audit Fields (Global)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * The master list of all user identities across the entire platform.
 * A single user can belong to multiple tenants (e.g., a consultant).
 * Authentication happens against this table.
 */
export const users = publicTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  
  // Lifecycle
  lastLoginAt: timestamp('last_login_at'),
  
  // Audit Fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  emailIdx: uniqueIndex('user_email_idx').on(table.email),
}));

/**
 * Join table for assigning global, system-level roles to users.
 * This is for Mahalo staff (Super Admins, Support), NOT for tenant users.
 */
export const userSystemRoles = publicTable('user_system_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: systemRoleEnum('role').notNull(),
}, (table) => ({
  // A user can only have one instance of each system role
  pk: primaryKey({ columns: [table.userId, table.role] }),
}));

/**
 * Password reset tokens for secure password reset flows.
 * Tokens expire after a set duration (e.g., 1 hour).
 */
export const passwordResetTokens = publicTable('password_reset_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: tokenStatusEnum('status').notNull().default('active'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('password_reset_token_idx').on(table.token),
}));

/**
 * Invitation tokens for user onboarding.
 * Includes tenant context and role assignment.
 */
export const invitationTokens = publicTable('invitation_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // Stores tenant_role or system_role
  invitedBy: uuid('invited_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: tokenStatusEnum('status').notNull().default('active'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('invitation_token_idx').on(table.token),
}));

// ------------------------------------------------------------------
// RELATIONS (Global)
// ------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  userSystemRoles: many(userSystemRoles),
  passwordResetTokens: many(passwordResetTokens),
  invitedTokens: many(invitationTokens, { relationName: 'invitedBy' }),
  tenantUsers: many('tenantUsers'), // Forward reference
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  tenantUsers: many('tenantUsers'), // Forward reference
  auditLogs: many('auditLogs'), // Forward reference
  invitationTokens: many(invitationTokens),
}));

export const userSystemRolesRelations = relations(userSystemRoles, ({ one }) => ({
  user: one(users, {
    fields: [userSystemRoles.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const invitationTokensRelations = relations(invitationTokens, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitationTokens.tenantId],
    references: [tenants.id],
  }),
  inviter: one(users, {
    fields: [invitationTokens.invitedBy],
    references: [users.id],
    relationName: 'invitedBy',
  }),
}));
