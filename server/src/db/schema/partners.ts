import {
  pgTableCreator,
  uuid,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  text,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { tenants } from './public';
import { auditSchema } from './core';

/**
 * Use the app table creator.
 * RLS MUST be enabled on all tables created here.
 */
const appTable = pgTableCreator((name) => `${name}`);

// ------------------------------------------------------------------
// ENUMS (Partner-Scoped)
// ------------------------------------------------------------------

export const partnerTypeEnum = pgEnum('partner_type', ['ecommerce', 'retail_pos']);
export const partnerStatusEnum = pgEnum('partner_status', ['active', 'inactive']);
export const keyStatusEnum = pgEnum('key_status', ['active', 'revoked']);

// ------------------------------------------------------------------
// TABLES (Partner-Scoped)
// ------------------------------------------------------------------

/**
 * Defines a partner entity for the tenant (e.g., CVS, Walgreens, Amazon).
 */
export const partners = appTable('partners', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(), // e.g., "CVS E-Commerce"
  type: partnerTypeEnum('type').notNull(),
  status: partnerStatusEnum('status').notNull().default('active'),
  
  ...auditSchema,
}, (table) => ({
  tenantNameIdx: index('p_tenant_name_idx').on(table.tenantId, table.name),
}));

/**
 * Securely stores API credentials for partners.
 * This table follows best practices by only storing a hashed key.
 */
export const partnerApiKeys = appTable('partner_api_keys', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  partnerId: uuid('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),

  /**
   * A non-secret prefix for identifying the key (e.g., "cvs_prod_...").
   * This is what the admin sees in the dashboard.
   */
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull().unique(),
  
  /**
   * The securely hashed API key (e.g., using bcrypt or argon2).
   * The application compares the hash of the incoming key with this value.
   */
  hashedKey: varchar('hashed_key', { length: 255 }).notNull(),
  
  status: keyStatusEnum('status').notNull().default('active'),
  expiresAt: timestamp('expires_at'),
  
  ...auditSchema,
}, (table) => ({
  // Index for finding all keys for a partner
  partnerIdx: index('pak_partner_idx').on(table.tenantId, table.partnerId),
}));

/**
 * Stores partner-specific configurations, such as e-commerce redirect URLs.
 */
export const partnerConfigs = appTable('partner_configs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // A partner config is always 1-to-1 with a partner
  partnerId: uuid('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),

  /**
   * A list of allowed URLs to redirect a consumer to after an e-comm flow.
   * This is a critical security feature to prevent open redirect vulnerabilities.
   */
  whitelistedRedirectUrls: text('whitelisted_redirect_urls').array(),
  
  /**
   * JSONB field for any other partner-specific settings
   */
  metadata: jsonb('metadata').notNull().default('{}'),

  ...auditSchema,
}, (table) => ({
  partnerIdx: uniqueIndex('pc_partner_idx').on(table.partnerId),
}));

// ------------------------------------------------------------------
// RELATIONS (Partner-Scoped)
// ------------------------------------------------------------------

export const partnersRelations = relations(partners, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [partners.tenantId],
    references: [tenants.id],
  }),
  apiKeys: many(partnerApiKeys),
  config: one(partnerConfigs, {
    fields: [partners.id],
    references: [partnerConfigs.partnerId],
  }),
}));

export const partnerApiKeysRelations = relations(partnerApiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [partnerApiKeys.tenantId],
    references: [tenants.id],
  }),
  partner: one(partners, {
    fields: [partnerApiKeys.partnerId],
    references: [partners.id],
  }),
}));

export const partnerConfigsRelations = relations(partnerConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [partnerConfigs.tenantId],
    references: [tenants.id],
  }),
  partner: one(partners, {
    fields: [partnerConfigs.partnerId],
    references: [partners.id],
  }),
}));
