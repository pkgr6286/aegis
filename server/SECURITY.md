# Security Notes for Aegis Platform Backend

## Security Status Overview

### JWT Authentication - IMPLEMENTED ✅

**Status**: 🟢 SECURE (Development mode with fallback)

The authentication middleware (`server/src/middleware/auth.middleware.ts`) now implements **proper JWT signature verification** using the `jsonwebtoken` library.

#### Current Implementation

1. ✅ **Signature Verification**: JWT tokens are cryptographically verified using `jwt.verify()`
2. ✅ **Forged Token Protection**: Tokens with invalid signatures are rejected
3. ✅ **Expiration Handling**: Expired tokens are properly rejected
4. ✅ **Error Handling**: Different JWT errors (invalid, expired, malformed) are handled separately

#### Required Actions Before Production

1. ✅ **COMPLETED**: jsonwebtoken library installed
2. ✅ **COMPLETED**: JWT verification implemented with signature checking
3. ⚠️ **ACTION REQUIRED**: Set a strong JWT_SECRET in production:
   ```bash
   # Generate a strong secret:
   openssl rand -base64 32

   # Add to production .env:
   JWT_SECRET="your-generated-secret-here"
   ```

4. 📋 **TODO**: Implement token generation in authentication service:
   ```typescript
   import jwt from 'jsonwebtoken';
   
   const token = jwt.sign(
     {
       userId: user.id,
       email: user.email,
       systemRoles: userSystemRoles,
       tenantId: tenantId,
     },
     process.env.JWT_SECRET,
     { expiresIn: '7d' }
   );
   ```

5. 📋 **TODO**: Add automated security tests:
   - Test that forged tokens are rejected
   - Test that expired tokens are rejected
   - Test that tokens with invalid signatures are rejected
   - Test that legitimate tokens populate roles correctly

#### Development Mode

In development, if `JWT_SECRET` is not set, the system automatically uses a fallback secret: `development-secret-DO-NOT-USE-IN-PRODUCTION`. This is **ONLY** for local development convenience.

**Production Deployment**: The application will refuse to start if `JWT_SECRET` is not set when `NODE_ENV=production`.

## Multi-Tenant Security (RLS)

### Row-Level Security Setup

The platform uses PostgreSQL's Row-Level Security (RLS) to enforce tenant data isolation. This must be configured before any tenant data is created.

#### Required SQL Bootstrap

Run these commands on your database BEFORE using the application:

```sql
-- 1. Enable RLS on all tenant-scoped tables
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screener_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_configs ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for each table
-- Example for tenant_users:
CREATE POLICY tenant_isolation_policy
  ON tenant_users
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Repeat for all other tables listed above
```

#### Tenant Context Validation

The `setTenantContext()` function validates tenant IDs using a UUID regex before executing the SET command:

```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

This prevents SQL injection even without parameterization, but additional safety is provided by Drizzle's SQL template tags.

## Additional Security Considerations

### Password Hashing

Currently, no password hashing is implemented. Before production:

1. Install bcrypt or argon2
2. Hash all passwords before storage
3. Never store plaintext passwords

### API Keys

Partner API keys in the `partner_api_keys` table:

1. Must be hashed before storage (use bcrypt with high work factor)
2. Should have expiration dates
3. Should support rotation
4. Should be revocable

### Audit Logging

Audit logs are critical for compliance:

1. Never delete audit logs (they are insert-only)
2. Audit log failures are logged but don't block operations
3. Include before/after states in changes field
4. Store enough context to reconstruct actions

## Development vs Production

This codebase is currently in **DEVELOPMENT MODE** with the following status:

- ✅ JWT signature verification implemented
- ⚠️ JWT_SECRET uses development fallback if not set
- ❌ No password hashing (no password auth yet)
- ❌ No rate limiting
- ❌ No API key hashing
- ❌ No HTTPS enforcement
- ❌ RLS policies not created in database

**PRODUCTION CHECKLIST**: See security checklist below before deploying.

## Security Checklist for Production

- [x] Install and configure jsonwebtoken
- [x] Implement JWT signature verification
- [ ] Set strong JWT_SECRET in production environment (currently uses dev fallback)
- [ ] Install and configure bcrypt/argon2 (when password auth is implemented)
- [ ] Hash all user passwords (when password auth is implemented)
- [ ] Hash all API keys (when partner API keys are implemented)
- [ ] Create all RLS policies on database
- [ ] Test RLS policies with different tenant contexts
- [ ] Implement rate limiting
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Add request logging and monitoring
- [ ] Set up automated security testing
- [ ] Perform security audit
- [ ] Set up automated dependency scanning

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourcompany.com

**Do not create public GitHub issues for security vulnerabilities.**
