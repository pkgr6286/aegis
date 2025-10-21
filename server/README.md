# Aegis Platform - Backend Foundation

A production-grade, multi-tenant SaaS platform backend designed for pharmaceutical patient assistance programs. Built with enterprise-level security, scalability, and compliance in mind.

## 🏗️ Architecture Overview

### Multi-Tenancy Strategy

This platform uses **Row-Level Security (RLS)** at the PostgreSQL database layer to ensure complete data isolation between tenants. This approach provides:

- **Database-level security**: Even if application logic has bugs, tenants cannot access each other's data
- **Performance**: All tenants share the same tables, eliminating the need for separate databases
- **Scalability**: Easy to onboard new tenants without infrastructure changes
- **Compliance**: Automatic audit trails and data isolation for healthcare regulations

### Core Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle ORM (type-safe, performant)
- **Database**: PostgreSQL (Neon Serverless)
- **Validation**: Zod (runtime type validation)
- **Authentication**: JWT (placeholder for implementation)

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── environment.ts          # Environment variable configuration
│   ├── db/
│   │   ├── schema/
│   │   │   ├── public.ts           # Global tables (tenants, users)
│   │   │   ├── core.ts             # Tenant-scoped core (tenant_users, audit_logs)
│   │   │   ├── programs.ts         # Drug programs and screeners
│   │   │   ├── consumer.ts         # Screening sessions and verification
│   │   │   ├── partners.ts         # Partner integrations
│   │   │   └── index.ts            # Consolidated schema export
│   │   ├── repositories/
│   │   │   └── user.repository.ts  # Data access layer for users
│   │   └── index.ts                # Drizzle client instance
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT auth & tenant context
│   │   └── validation.middleware.ts # Zod request validation
│   ├── routes/
│   │   ├── index.ts                # Main API router
│   │   └── auth.routes.ts          # Authentication endpoints
│   ├── services/
│   │   └── auth.service.ts         # Authentication business logic
│   ├── validations/
│   │   └── auth.validation.ts      # Zod schemas for auth
│   ├── utils/                      # Utility functions (placeholder)
│   └── index.ts                    # Server entrypoint
├── drizzle.config.ts               # Drizzle Kit configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## 🗄️ Database Schema

### Schema Organization

The database is organized into logical domains:

#### 1. **Public Schema** (Global Tables)
- `tenants` - Master list of all customers on the platform
- `users` - Global user identities (email/password)
- `user_system_roles` - System-level roles for platform admins

#### 2. **Core Schema** (Tenant-Scoped Foundation)
- `tenant_users` - User membership within tenants with roles
- `audit_logs` - Comprehensive audit trail for all actions

#### 3. **Programs Schema** (Business Logic)
- `brand_configs` - White-label branding configurations
- `drug_programs` - Core drug program entities
- `screener_versions` - Versioned, immutable screener definitions

#### 4. **Consumer Schema** (Runtime Data)
- `screening_sessions` - Consumer screening attempts (RWE source)
- `verification_codes` - Single-use codes for POS/e-commerce
- `ehr_consents` - Electronic Health Record consent logs

#### 5. **Partners Schema** (B2B Integrations)
- `partners` - Retail/e-commerce partner entities
- `partner_api_keys` - Secure API credentials (hashed)
- `partner_configs` - Partner-specific settings

### Audit Schema Pattern

All business logic tables include these audit fields:
```typescript
{
  createdAt: timestamp,
  createdBy: uuid (references users.id),
  updatedAt: timestamp,
  updatedBy: uuid (references users.id),
  deletedAt: timestamp (soft delete)
}
```

## 🔒 Row-Level Security (RLS)

### How It Works

1. **Authentication**: User logs in and receives JWT token
2. **Tenant Context**: JWT contains both `user_id` and `tenant_id`
3. **Session Variable**: Before each query, execute:
   ```sql
   SET app.current_tenant_id = '...tenant-uuid...';
   ```
4. **Automatic Filtering**: PostgreSQL RLS policies automatically filter ALL queries (SELECT, INSERT, UPDATE, DELETE) to only show/modify data for that tenant

### Setting Up RLS (Required Bootstrap SQL)

```sql
-- Enable RLS on all tenant-scoped tables
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

-- Create the isolation policy (example for one table, repeat for all)
CREATE POLICY tenant_isolation_policy
  ON tenant_users
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Replit provides this automatically)
- Environment variables configured

### Installation

```bash
cd server
npm install
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
DATABASE_URL="postgresql://..."
NODE_ENV="development"
JWT_SECRET="your-secret-key"
PORT=3000
```

### Database Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Running the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Available Endpoints

- `GET /` - Server info
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration (not implemented)
- `POST /api/auth/login` - User login (not implemented)
- `POST /api/auth/logout` - User logout (not implemented)

## 📝 Development Guidelines

### Adding a New Business Table

1. **Create the table** in the appropriate schema file (programs, consumer, or partners)
2. **Include tenant_id** as a foreign key to `tenants.id`
3. **Spread the auditSchema** to include audit fields
4. **Add indexes** for common query patterns
5. **Define relations** using Drizzle's `relations()` API
6. **Enable RLS** with the appropriate policy SQL

Example:

```typescript
export const myTable = appTable('my_table', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  
  ...auditSchema, // Includes createdAt, createdBy, updatedAt, updatedBy, deletedAt
}, (table) => ({
  tenantIdx: index('mt_tenant_idx').on(table.tenantId),
}));
```

### Repository Pattern

Create a repository class for each major entity:

```typescript
export class MyEntityRepository {
  async findById(id: string, tenantId: string) {
    // Always include tenantId in WHERE clauses for extra safety
    return db.select().from(myTable).where(
      and(eq(myTable.id, id), eq(myTable.tenantId, tenantId))
    );
  }
}
```

### Authentication Middleware

Before implementing auth endpoints:

1. Choose a password hashing library (bcrypt, argon2)
2. Implement JWT token generation/validation
3. Create middleware to extract tenant context from JWT
4. Set the PostgreSQL session variable for RLS

## 🏛️ Architectural Decisions

### Why Drizzle ORM?

- **Type Safety**: Full TypeScript inference, no code generation
- **Performance**: Close to raw SQL, minimal overhead
- **Flexibility**: Can drop down to raw SQL when needed
- **Schema-first**: Schema defined in code, migrations generated automatically

### Why Row-Level Security?

- **Security**: Data isolation at the database layer, not just application layer
- **Compliance**: Required for healthcare/pharma regulatory compliance
- **Simplicity**: No need to modify every query to filter by tenant
- **Performance**: PostgreSQL optimizes RLS policies efficiently

### Why UUID Primary Keys?

- **Distributed**: No coordination needed across servers
- **Security**: Non-sequential, harder to enumerate
- **Merge-friendly**: Easier to merge data from different sources
- **External APIs**: Safe to expose in URLs

## 📊 Next Steps for Implementation

### Phase 1: Authentication & Authorization
- [ ] Implement password hashing (bcrypt/argon2)
- [ ] JWT token generation and validation
- [ ] Refresh token mechanism
- [ ] Tenant context middleware
- [ ] RLS session variable setup

### Phase 2: Core Business APIs
- [ ] Tenant management endpoints
- [ ] User management within tenants
- [ ] Brand configuration CRUD
- [ ] Drug program CRUD
- [ ] Screener versioning system

### Phase 3: Consumer Journey
- [ ] Screening session creation
- [ ] Screener evaluation engine
- [ ] Verification code generation
- [ ] EHR consent management

### Phase 4: Partner Integration
- [ ] Partner API key management
- [ ] Verification API for POS
- [ ] E-commerce redirect flow
- [ ] Webhook system for partners

### Phase 5: Analytics & Reporting
- [ ] RWE analytics dashboard
- [ ] Audit log querying
- [ ] Export functionality
- [ ] Compliance reports

## 🔐 Security Considerations

- All passwords MUST be hashed (never store plaintext)
- JWT secrets MUST be environment variables
- API keys MUST be hashed before storage
- All tenant-scoped queries MUST set RLS session variable
- Input validation MUST happen before database operations
- Audit logs MUST be immutable (insert-only, no updates)

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenant Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)

---

**Built with ❤️ for enterprise-grade multi-tenant SaaS**
