-- ============================================================================
-- AEGIS PLATFORM - ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
--
-- This migration enables PostgreSQL Row-Level Security on all tenant-scoped
-- tables to enforce automatic data isolation at the database layer.
--
-- CRITICAL SECURITY REQUIREMENT:
-- Before executing ANY database query, the application MUST set the tenant
-- context using:
--   SET app.current_tenant_id = '<tenant-uuid>';
--
-- The RLS policies below automatically filter all SELECT, INSERT, UPDATE,
-- and DELETE operations to only access data belonging to the current tenant.
--
-- ⚠️  IMPORTANT LIMITATION - NEON DATABASE USERS:
-- ==================================================
-- RLS policies do NOT apply to database owners or members of pg_database_owner.
-- In Neon databases, the default user (neondb_owner) is a database owner and
-- will BYPASS all RLS policies.
--
-- For RLS to work in production, you MUST:
-- 1. Create a separate application role without owner privileges
-- 2. Use that role for all application queries
-- 3. Reserve the owner account only for migrations and admin tasks
--
-- See "Creating Application Role" section at the end of this file.
--
-- MIGRATION INSTRUCTIONS:
-- 1. Connect to your database with admin privileges
-- 2. Execute this entire file
-- 3. Create the application role (see bottom of file)
-- 4. Configure your app to use the application role
-- 5. Verify policies work with test queries (see bottom of file)
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE RLS ON ALL TENANT-SCOPED TABLES
-- ============================================================================

-- Core Schema Tables
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Programs Schema Tables
ALTER TABLE brand_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screener_versions ENABLE ROW LEVEL SECURITY;

-- Consumer Schema Tables
ALTER TABLE screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_consents ENABLE ROW LEVEL SECURITY;

-- Partners Schema Tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: CREATE RLS POLICIES FOR CORE SCHEMA
-- ============================================================================

-- Policy for tenant_users
-- This table stores the many-to-many relationship between users and tenants
DROP POLICY IF EXISTS tenant_isolation_policy ON tenant_users;
CREATE POLICY tenant_isolation_policy
  ON tenant_users
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Policy for audit_logs
-- Audit logs are critical for compliance - they must be tenant-isolated
DROP POLICY IF EXISTS tenant_isolation_policy ON audit_logs;
CREATE POLICY tenant_isolation_policy
  ON audit_logs
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- SECTION 3: CREATE RLS POLICIES FOR PROGRAMS SCHEMA
-- ============================================================================

-- Policy for brand_configs
-- Brand configurations (logos, colors) are tenant-specific assets
DROP POLICY IF EXISTS tenant_isolation_policy ON brand_configs;
CREATE POLICY tenant_isolation_policy
  ON brand_configs
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Policy for drug_programs
-- Drug programs are the core business entities - strict isolation required
DROP POLICY IF EXISTS tenant_isolation_policy ON drug_programs;
CREATE POLICY tenant_isolation_policy
  ON drug_programs
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Policy for screener_versions
-- Screener configurations must be isolated per tenant
DROP POLICY IF EXISTS tenant_isolation_policy ON screener_versions;
CREATE POLICY tenant_isolation_policy
  ON screener_versions
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- SECTION 4: CREATE RLS POLICIES FOR CONSUMER SCHEMA
-- ============================================================================

-- Policy for screening_sessions
-- Patient screening data is highly sensitive PHI - must be strictly isolated
DROP POLICY IF EXISTS tenant_isolation_policy ON screening_sessions;
CREATE POLICY tenant_isolation_policy
  ON screening_sessions
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Policy for verification_codes
-- Single-use codes for POS/e-commerce - must be tenant-isolated
DROP POLICY IF EXISTS tenant_isolation_policy ON verification_codes;
CREATE POLICY tenant_isolation_policy
  ON verification_codes
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Policy for ehr_consents
-- EHR consent records contain PHI - strict isolation required for HIPAA
DROP POLICY IF EXISTS tenant_isolation_policy ON ehr_consents;
CREATE POLICY tenant_isolation_policy
  ON ehr_consents
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES FOR PARTNERS SCHEMA
-- ============================================================================

-- Policy for partners
-- Partner integrations (CVS, Walgreens, etc.) are tenant-specific
DROP POLICY IF EXISTS tenant_isolation_policy ON partners;
CREATE POLICY tenant_isolation_policy
  ON partners
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Policy for partner_api_keys
-- API keys are highly sensitive credentials - must be strictly isolated
DROP POLICY IF EXISTS tenant_isolation_policy ON partner_api_keys;
CREATE POLICY tenant_isolation_policy
  ON partner_api_keys
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Policy for partner_configs
-- Partner-specific configurations must be tenant-isolated
DROP POLICY IF EXISTS tenant_isolation_policy ON partner_configs;
CREATE POLICY tenant_isolation_policy
  ON partner_configs
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- SECTION 6: VERIFICATION AND TESTING QUERIES
-- ============================================================================

-- Verify RLS is enabled on all tables
-- Run this query to confirm RLS status:
--
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'tenant_users', 'audit_logs', 'brand_configs', 'drug_programs',
--     'screener_versions', 'screening_sessions', 'verification_codes',
--     'ehr_consents', 'partners', 'partner_api_keys', 'partner_configs'
--   )
-- ORDER BY tablename;

-- View all policies
-- Run this query to see all RLS policies:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 7: TESTING RLS POLICIES
-- ============================================================================

-- IMPORTANT: Test RLS policies before deploying to production
--
-- Example test script:
--
-- -- 1. Create test tenants (if not exists)
-- INSERT INTO tenants (id, name, slug, status)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'Tenant A', 'tenant-a', 'active'),
--   ('22222222-2222-2222-2222-222222222222', 'Tenant B', 'tenant-b', 'active');
--
-- -- 2. Create test data for each tenant
-- SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
-- INSERT INTO brand_configs (tenant_id, name, config)
-- VALUES ('11111111-1111-1111-1111-111111111111', 'Brand A', '{"color": "blue"}');
--
-- SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
-- INSERT INTO brand_configs (tenant_id, name, config)
-- VALUES ('22222222-2222-2222-2222-222222222222', 'Brand B', '{"color": "red"}');
--
-- -- 3. Test isolation: Set context to Tenant A
-- SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
-- SELECT * FROM brand_configs;
-- -- Should ONLY return Brand A (blue)
--
-- -- 4. Test isolation: Set context to Tenant B
-- SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
-- SELECT * FROM brand_configs;
-- -- Should ONLY return Brand B (red)
--
-- -- 5. Test without context (should return nothing)
-- RESET app.current_tenant_id;
-- SELECT * FROM brand_configs;
-- -- Should return ZERO rows (RLS blocks access without tenant context)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- All tenant-scoped tables now have Row-Level Security enabled.
-- 
-- NEXT STEPS:
-- 1. Run the verification queries above
-- 2. Execute the testing script to confirm isolation
-- 3. Update application code to call setTenantContext() before every query
-- 4. Monitor application logs for RLS violations
--
-- ROLLBACK (if needed):
-- To disable RLS on a table: ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
-- To drop a policy: DROP POLICY tenant_isolation_policy ON <table_name>;
--
-- ============================================================================

-- ============================================================================
-- SECTION 7: CREATE APPLICATION ROLE (REQUIRED FOR RLS)
-- ============================================================================

-- ⚠️  CRITICAL: Run this section to create a non-owner role that respects RLS
--
-- The default Neon database user (neondb_owner) bypasses RLS because it owns
-- the database. To enforce RLS, create an application role without owner privileges.

-- Create the application role
CREATE ROLE app_user WITH LOGIN PASSWORD 'CHANGE_THIS_PASSWORD';

-- Grant connection privileges
GRANT CONNECT ON DATABASE neondb TO app_user;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant table privileges (but NOT ownership)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- ============================================================================
-- SECTION 8: UPDATE APPLICATION CONNECTION STRING
-- ============================================================================

-- After creating the app_user role, update your application's DATABASE_URL:
--
-- Before (owner role - bypasses RLS):
-- DATABASE_URL=postgresql://neondb_owner:password@host/neondb
--
-- After (application role - enforces RLS):
-- DATABASE_URL=postgresql://app_user:CHANGE_THIS_PASSWORD@host/neondb
--
-- IMPORTANT: Keep the owner connection string for running migrations only!

-- ============================================================================
-- SECTION 9: TEST RLS POLICIES WITH APPLICATION ROLE
-- ============================================================================

-- Connect as the application user:
-- psql "postgresql://app_user:CHANGE_THIS_PASSWORD@host/neondb"
--
-- Then run these tests:
/*

-- Create test data (as owner, not as app_user)
-- Connect as neondb_owner first, then:

INSERT INTO tenants (id, name, slug, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Tenant A', 'test-a', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Test Tenant B', 'test-b', 'active');

SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO brand_configs (tenant_id, name, config)
VALUES ('11111111-1111-1111-1111-111111111111', 'Brand A', '{"color": "blue"}');

SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
INSERT INTO brand_configs (tenant_id, name, config)
VALUES ('22222222-2222-2222-2222-222222222222', 'Brand B', '{"color": "red"}');

-- Now connect as app_user and test RLS:
-- psql "postgresql://app_user:PASSWORD@host/neondb"

-- Test 1: Query as Tenant A (should see ONLY Brand A)
SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT name, config->>'color' as color FROM brand_configs;
-- Expected: 1 row (Brand A - blue)

-- Test 2: Query as Tenant B (should see ONLY Brand B)
SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT name, config->>'color' as color FROM brand_configs;
-- Expected: 1 row (Brand B - red)

-- Test 3: Query without tenant context (should see ZERO rows)
RESET app.current_tenant_id;
SELECT COUNT(*) as visible_rows FROM brand_configs;
-- Expected: 0 rows

-- If all three tests pass, RLS is working correctly!

*/

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
--
-- ✅ RLS enabled on all 11 tenant-scoped tables
-- ✅ RLS policies created for tenant isolation
-- ⚠️  Application role required for RLS to work (see Section 7)
-- 📖 Test instructions provided (see Section 9)
--
-- NEXT STEPS:
-- 1. Create the app_user role (Section 7)
-- 2. Update DATABASE_URL to use app_user (Section 8)
-- 3. Test RLS is working (Section 9)
-- 4. Reserve neondb_owner connection for migrations only
--
-- ============================================================================
