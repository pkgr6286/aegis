-- ============================================================================
-- RLS POLICY TESTING SCRIPT
-- ============================================================================
-- This script tests that Row-Level Security is working correctly
-- ============================================================================

-- Step 1: Create two test tenants
INSERT INTO tenants (id, name, slug, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Tenant A', 'test-tenant-a', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Test Tenant B', 'test-tenant-b', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Create test brand configs for each tenant
SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO brand_configs (tenant_id, name, config)
VALUES ('11111111-1111-1111-1111-111111111111', 'Brand A', '{"color": "blue"}')
ON CONFLICT DO NOTHING;

SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
INSERT INTO brand_configs (tenant_id, name, config)
VALUES ('22222222-2222-2222-2222-222222222222', 'Brand B', '{"color": "red"}')
ON CONFLICT DO NOTHING;

-- Step 3: Test isolation - Query as Tenant A (should only see blue)
SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT 
  'Tenant A View' as test,
  name, 
  config->>'color' as color 
FROM brand_configs;

-- Step 4: Test isolation - Query as Tenant B (should only see red)
SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT 
  'Tenant B View' as test,
  name, 
  config->>'color' as color 
FROM brand_configs;

-- Step 5: Test without tenant context (should see ZERO rows)
RESET app.current_tenant_id;
SELECT 
  'No Tenant Context' as test,
  COUNT(*) as visible_rows 
FROM brand_configs;

-- Step 6: Cleanup test data
DELETE FROM brand_configs WHERE name IN ('Brand A', 'Brand B');
DELETE FROM tenants WHERE slug LIKE 'test-tenant-%';

-- ============================================================================
-- Expected Results:
-- - Tenant A should see 1 row (Brand A - blue)
-- - Tenant B should see 1 row (Brand B - red)
-- - No tenant context should see 0 rows
-- ============================================================================
