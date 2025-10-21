# Database Migrations

This directory contains SQL migration scripts for the Aegis Platform database.

## Migration Files

### 001_enable_rls_policies.sql

**Purpose**: Enables PostgreSQL Row-Level Security (RLS) on all tenant-scoped tables to enforce automatic data isolation.

**What it does**:
1. Enables RLS on 11 tenant-scoped tables
2. Creates tenant isolation policies for each table
3. Enforces that all queries are automatically filtered by `app.current_tenant_id`

**Critical for**: Multi-tenant data isolation, HIPAA compliance, preventing cross-tenant data leakage

## Running Migrations

### Option 1: Using psql (Recommended for Production)

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i server/migrations/001_enable_rls_policies.sql

# Verify policies are enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tenant_users', 'audit_logs', 'brand_configs', 'drug_programs',
    'screener_versions', 'screening_sessions', 'verification_codes',
    'ehr_consents', 'partners', 'partner_api_keys', 'partner_configs'
  )
ORDER BY tablename;
```

### Option 2: Using Node.js Script

```bash
# From the server directory
cd server
npm run migration:run
```

### Option 3: Using Drizzle Studio

```bash
# From the server directory
cd server
npm run db:studio

# Then execute the SQL directly in the console
```

## Testing RLS Policies

After running the migration, you **MUST** test that RLS is working correctly:

```sql
-- Create two test tenants
INSERT INTO tenants (id, name, slug, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Tenant A', 'test-tenant-a', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Test Tenant B', 'test-tenant-b', 'active');

-- Create test data for Tenant A
SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO brand_configs (tenant_id, name, config)
VALUES ('11111111-1111-1111-1111-111111111111', 'Brand A', '{"color": "blue"}');

-- Create test data for Tenant B
SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
INSERT INTO brand_configs (tenant_id, name, config)
VALUES ('22222222-2222-2222-2222-222222222222', 'Brand B', '{"color": "red"}');

-- Test: Query as Tenant A (should only see blue)
SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT * FROM brand_configs;
-- Expected: 1 row (Brand A - blue)

-- Test: Query as Tenant B (should only see red)
SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT * FROM brand_configs;
-- Expected: 1 row (Brand B - red)

-- Test: Query without tenant context (should see nothing)
RESET app.current_tenant_id;
SELECT * FROM brand_configs;
-- Expected: 0 rows (RLS blocks access)

-- Cleanup test data
DELETE FROM brand_configs WHERE name IN ('Brand A', 'Brand B');
DELETE FROM tenants WHERE slug LIKE 'test-tenant-%';
```

## Verifying RLS Status

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- View all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Rollback

If you need to disable RLS (NOT RECOMMENDED for production):

```sql
-- Disable RLS on a specific table
ALTER TABLE tenant_users DISABLE ROW LEVEL SECURITY;

-- Drop a specific policy
DROP POLICY tenant_isolation_policy ON tenant_users;
```

## Important Notes

1. **Application Code Required**: RLS policies only work if your application sets the tenant context:
   ```typescript
   await setTenantContext(db, tenantId);
   ```

2. **Performance**: RLS policies add a WHERE clause to every query. Ensure `tenant_id` columns are indexed (already done in schema).

3. **Super Admin Access**: Some operations (like tenant creation) need to bypass RLS. Use the global `users` and `tenants` tables which don't have RLS enabled.

4. **Testing**: Always test RLS policies in a staging environment before production deployment.

5. **Monitoring**: Monitor query performance after enabling RLS to ensure indexes are being used.

## Migration History

| Version | File | Date | Description |
|---------|------|------|-------------|
| 001 | 001_enable_rls_policies.sql | 2025-10-21 | Initial RLS setup for all tenant-scoped tables |
