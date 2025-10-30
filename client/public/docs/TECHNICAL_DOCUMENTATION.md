# Aegis Platform - Technical Documentation

**Version 1.0** | Last Updated: October 2025

Technical reference documentation for developers, DevOps engineers, and system architects working with the Aegis Platform.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Authentication & Authorization](#authentication--authorization)
5. [Frontend Architecture](#frontend-architecture)
6. [Deployment](#deployment)
7. [Development Setup](#development-setup)

---

## System Architecture

### Technology Stack

**Backend:**
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript 5+
- **Database**: PostgreSQL 14+ (Neon Serverless)
- **ORM**: Drizzle ORM
- **Validation**: Zod

**Frontend:**
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5+
- **Routing**: Wouter
- **State Management**: TanStack Query v5
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

**Infrastructure:**
- **Hosting**: Replit
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT tokens
- **Session Management**: Express sessions with PostgreSQL store

### Multi-Tenancy Model

Aegis implements **Row-Level Security (RLS)** for data isolation:

```
┌─────────────────┐
│   Public Schema │  ← System-wide tables (users, tenants)
└─────────────────┘
        │
        ├─── tenant_id foreign key
        │
┌─────────────────┐
│   Core Schema   │  ← Tenant-scoped tables (drug programs, brands)
└─────────────────┘
```

Every tenant-scoped table includes:
- `tenantId` UUID column
- Foreign key to `public.tenants`
- RLS policies enforcing tenant isolation

### Request Flow

```
Client Request
    ↓
Express Middleware Chain:
    1. CORS
    2. JSON Parser
    3. Session Management
    4. Logging
    5. Authentication (JWT)
    6. RBAC (Role-Based Access Control)
    7. Tenant Context Injection
    8. Rate Limiting
    ↓
Route Handler
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Database)
    ↓
Response
```

---

## Database Schema

### Schema Organization

Aegis uses **modular PostgreSQL schemas**:

1. **`public`**: System-wide entities (tenants, system users)
2. **`core`**: Tenant-scoped core entities (users, brands, partners)
3. **`programs`**: Drug program management
4. **`consumer`**: Patient screening data
5. **`partners`**: Partner integration data

### Key Tables

#### `public.tenants`

Pharmaceutical company organizations.

```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `public.system_users`

Super admin accounts.

```sql
CREATE TABLE public.system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'super_admin' | 'support_staff'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `core.users`

Tenant-scoped user accounts.

```sql
CREATE TABLE core.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin' | 'editor' | 'viewer' | 'clinician' | 'auditor'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email)
);
```

#### `core.brand_configs`

Brand identity configuration for consumer UI.

```sql
CREATE TABLE core.brand_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  brand_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `programs.drug_programs`

Patient assistance programs.

```sql
CREATE TABLE programs.drug_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  brand_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'active' | 'paused'
  public_slug TEXT NOT NULL,
  active_screener_version_id UUID,
  created_by UUID NOT NULL REFERENCES core.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, public_slug)
);
```

#### `programs.screener_versions`

Questionnaire versions for drug programs.

```sql
CREATE TABLE programs.screener_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  drug_program_id UUID NOT NULL REFERENCES programs.drug_programs(id),
  version INTEGER NOT NULL,
  screener_json JSONB NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES core.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, drug_program_id, version)
);
```

**`screener_json` Structure:**

```typescript
{
  questions: [
    {
      id: string;
      type: 'boolean' | 'choice' | 'numeric' | 'diagnostic_test';
      text: string;
      helpText?: string;
      options?: string[]; // for choice type
      min?: number; // for numeric
      max?: number; // for numeric
      ehrMapping?: {
        fhirPath: string;
        displayName: string;
        rule: 'optional' | 'mandatory';
      };
      paths: {
        qualifying?: string; // next question ID
        disqualifying?: string;
        default?: string;
      };
    }
  ];
  startQuestionId: string;
  qualifyingOutcome: { message: string };
  disqualifyingOutcome: { message: string };
}
```

#### `consumer.screening_sessions`

Individual patient screening attempts.

```sql
CREATE TABLE consumer.screening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  drug_program_id UUID NOT NULL REFERENCES programs.drug_programs(id),
  screener_version_id UUID NOT NULL REFERENCES programs.screener_versions(id),
  session_data JSONB NOT NULL,
  outcome TEXT NOT NULL, -- 'qualified' | 'disqualified' | 'under_review'
  review_status TEXT, -- 'pending' | 'reviewed'
  reviewed_by UUID REFERENCES core.users(id),
  reviewed_at TIMESTAMP,
  clinical_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**`session_data` Structure:**

```typescript
{
  answers: {
    [questionId: string]: {
      answer: any;
      timestamp: string;
    };
  };
  metadata: {
    startedAt: string;
    completedAt: string;
    ehrUsed: boolean;
  };
}
```

#### `core.partners`

External system integrations.

```sql
CREATE TABLE core.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  api_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES core.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `core.audit_logs`

Comprehensive activity logging.

```sql
CREATE TABLE core.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

Key performance indexes:

```sql
CREATE INDEX idx_users_tenant ON core.users(tenant_id);
CREATE INDEX idx_users_email ON core.users(tenant_id, email);
CREATE INDEX idx_drug_programs_tenant ON programs.drug_programs(tenant_id);
CREATE INDEX idx_drug_programs_slug ON programs.drug_programs(tenant_id, public_slug);
CREATE INDEX idx_screener_versions_program ON programs.screener_versions(drug_program_id);
CREATE INDEX idx_screening_sessions_program ON consumer.screening_sessions(drug_program_id);
CREATE INDEX idx_screening_sessions_review ON consumer.screening_sessions(review_status);
CREATE INDEX idx_audit_logs_tenant ON core.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_resource ON core.audit_logs(resource_type, resource_id);
```

---

## API Reference

Base URL: `/api/v1`

### Authentication Endpoints

#### `POST /api/v1/auth/login`

Authenticate user or super admin.

**Request:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin"
    },
    "token": "jwt-token-here"
  }
}
```

#### `POST /api/v1/auth/logout`

End user session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Super Admin Endpoints

All require `Authorization: Bearer <token>` with super_admin role.

#### `GET /api/v1/superadmin/me`

Get current super admin info.

#### `GET /api/v1/superadmin/dashboard/stats`

Platform-wide statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTenants": 10,
    "activeUsers": 234,
    "apiCalls24h": 45678,
    "totalScreenings": 12345,
    "drugPrograms": 45,
    "newTenantsThisMonth": 2
  }
}
```

#### `GET /api/v1/superadmin/tenants`

List all tenants.

#### `POST /api/v1/superadmin/tenants`

Create new tenant.

**Request:**
```json
{
  "companyName": "Acme Pharmaceuticals",
  "subdomain": "acme",
  "contactEmail": "admin@acme.com",
  "contactName": "Jane Smith"
}
```

#### `PUT /api/v1/superadmin/tenants/:id`

Update tenant.

#### `DELETE /api/v1/superadmin/tenants/:id`

Delete tenant and all associated data.

### Pharma Admin Endpoints

All require `Authorization: Bearer <token>` and tenant context.

#### `GET /api/v1/admin/me`

Get current tenant user info.

#### `GET /api/v1/admin/dashboard/stats`

Tenant dashboard statistics.

#### `GET /api/v1/admin/drug-programs`

List tenant's drug programs.

**Query Parameters:**
- `status` (optional): Filter by status (draft, active, paused)

#### `POST /api/v1/admin/drug-programs`

Create drug program.

**Request:**
```json
{
  "name": "Advair Diskus OTC Pilot",
  "brandName": "Advair",
  "status": "draft",
  "publicSlug": "advair-diskus-otc"
}
```

**Permissions**: admin, editor

#### `GET /api/v1/admin/drug-programs/:id`

Get single drug program.

#### `PUT /api/v1/admin/drug-programs/:id`

Update drug program.

**Permissions**: admin, editor

#### `DELETE /api/v1/admin/drug-programs/:id`

Delete drug program.

**Permissions**: admin only

#### `GET /api/v1/admin/drug-programs/:programId/screeners`

List screener versions for program.

#### `POST /api/v1/admin/drug-programs/:programId/screeners`

Create new screener version.

**Request:**
```json
{
  "screenerJson": { /* screener structure */ },
  "notes": "Added EHR integration for cholesterol questions"
}
```

**Permissions**: admin, editor

#### `POST /api/v1/admin/drug-programs/:programId/screeners/:versionId/publish`

Publish screener version (set as active).

**Permissions**: admin only

#### `GET /api/v1/admin/users`

List tenant users.

#### `POST /api/v1/admin/users/invite`

Invite new user.

**Request:**
```json
{
  "email": "newuser@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "editor"
}
```

**Permissions**: admin only

#### `GET /api/v1/admin/partners`

List partners.

#### `POST /api/v1/admin/partners`

Create partner.

**Request:**
```json
{
  "name": "CVS Pharmacy Integration",
  "description": "Point-of-sale system integration"
}
```

**Response includes API key** (only shown once).

**Permissions**: admin only

#### `DELETE /api/v1/admin/partners/:id`

Revoke partner access.

**Permissions**: admin only

#### `GET /api/v1/admin/brand-configs`

List brand configurations.

#### `POST /api/v1/admin/brand-configs`

Create brand configuration.

**Request:**
```json
{
  "brandName": "Advair",
  "primaryColor": "#1D463A",
  "secondaryColor": "#2F5D4F",
  "logoUrl": "https://cdn.example.com/logo.png"
}
```

**Permissions**: admin, editor

#### `GET /api/v1/admin/audit-logs`

List audit logs.

**Query Parameters:**
- `resourceType` (optional): Filter by entity type
- `action` (optional): Filter by action
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

#### `GET /api/v1/admin/regulatory/package`

Generate FDA submission package.

**Query Parameters:**
- `programId` (required): Drug program UUID
- `versionId` (required): Screener version UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2025-10-30T13:00:00Z",
    "programId": "uuid",
    "versionId": "uuid",
    "reports": [
      {
        "id": "design-spec",
        "name": "Software Design Specification",
        "filename": "design_specification.json",
        "description": "Complete screener logic...",
        "endpoint": "/api/v1/admin/regulatory/reports/design-spec?..."
      }
      // ... 3 more reports
    ]
  }
}
```

#### `GET /api/v1/admin/regulatory/reports/:reportType`

Download individual report.

**Report Types:**
- `design-spec`: JSON file
- `version-history`: CSV file
- `study-data`: CSV file
- `failure-log`: CSV file

**Query Parameters:**
- `programId` (required)
- `versionId` (required)

### Clinician Endpoints

#### `GET /api/v1/clinician/sessions`

List screening sessions for review.

**Query Parameters:**
- `programId` (optional)
- `outcome` (optional)
- `reviewStatus` (optional): pending, reviewed

**Permissions**: clinician role

#### `GET /api/v1/clinician/sessions/:sessionId`

Get session details.

**Permissions**: clinician role

#### `POST /api/v1/clinician/sessions/:sessionId/review`

Submit clinical review.

**Request:**
```json
{
  "clinicalNotes": "Patient meets criteria...",
  "decision": "reviewed"
}
```

**Permissions**: clinician role

### Public Consumer Endpoints

No authentication required.

#### `GET /api/v1/public/programs/:slug`

Get program by public slug.

**Example**: `/api/v1/public/programs/advair-diskus-otc`

#### `GET /api/v1/public/programs/:programId/screener`

Get active screener for program.

#### `POST /api/v1/public/screening-sessions`

Create new screening session.

**Request:**
```json
{
  "programId": "uuid",
  "versionId": "uuid",
  "sessionData": {
    "answers": {},
    "metadata": {}
  },
  "outcome": "qualified"
}
```

#### `POST /api/v1/ehr/connect`

Initiate EHR OAuth flow (mock).

**Request:**
```json
{
  "provider": "epic",
  "questionIds": ["q1", "q2"]
}
```

#### `GET /api/v1/ehr/callback`

EHR OAuth callback (mock).

#### `GET /api/v1/ehr/data/:sessionId`

Fetch EHR data for session (mock).

**Response:**
```json
{
  "success": true,
  "data": {
    "q1": { "value": "Yes", "confidence": 0.95 },
    "q2": { "value": 150, "confidence": 0.89 }
  }
}
```

### Partner Verification Endpoints

#### `GET /api/v1/partners/verify-session/:sessionId`

Verify screening session result.

**Headers:**
```
X-API-Key: partner-api-key-here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "outcome": "qualified",
    "programName": "Advair Diskus",
    "completedAt": "2025-10-30T12:00:00Z"
  }
}
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
{
  userId: string;
  email: string;
  role: string;
  tenantId?: string; // null for super admins
  iat: number;
  exp: number; // 24 hours from iat
}
```

### Role Hierarchy

```
System Level:
  - super_admin (full platform access)
  - support_staff (read-only platform access)

Tenant Level:
  - admin (full tenant control)
  - editor (create/edit, no delete)
  - viewer (read-only)
  - clinician (review sessions only)
  - auditor (read-only, compliance focus)
```

### Middleware Chain

```typescript
// 1. Authentication
requireAuth() // Validates JWT token

// 2. Tenant Context (for tenant-scoped routes)
setTenantContextMiddleware() // Extracts tenantId from token

// 3. RBAC
requireTenantRole(['admin', 'editor']) // Enforces role permissions

// 4. Auditor Read-Only Enforcement
// Automatically blocks POST/PUT/PATCH/DELETE for auditors
```

### Auditor Role Implementation

Auditors have special handling:
- All GET requests allowed
- All POST/PUT/PATCH/DELETE requests return 403 Forbidden
- Enforcement at middleware level before route handlers
- UI displays "(View Only)" indicator

---

## Frontend Architecture

### Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── admin/           # Admin-specific components
│   │   ├── consumer/        # Consumer UI components
│   │   └── shared/          # Shared components
│   ├── pages/
│   │   ├── admin/           # Pharma admin pages
│   │   ├── superadmin/      # Super admin pages
│   │   ├── clinician/       # Clinician pages
│   │   ├── public/          # Consumer screening pages
│   │   └── ehr/             # EHR integration flow pages
│   ├── lib/
│   │   ├── apiClient.ts     # Axios instance with auth
│   │   ├── queryClient.ts   # TanStack Query config
│   │   └── schemas.ts       # Zod validation schemas
│   ├── types/               # TypeScript type definitions
│   ├── hooks/               # Custom React hooks
│   └── App.tsx              # Root component with routing
```

### Routing

Using **wouter** for client-side routing:

```typescript
// Super Admin Routes
<Route path="/" component={SuperAdminDashboard} />
<Route path="/tenants" component={TenantManagement} />

// Pharma Admin Routes (requires tenant auth)
<Route path="/admin" component={PharmaAdminDashboard} />
<Route path="/admin/drug-programs" component={DrugPrograms} />
<Route path="/admin/drug-programs/:id" component={DrugProgramDetail} />
<Route path="/admin/screener-builder/:id" component={ScreenerBuilder} />
<Route path="/admin/regulatory" component={Regulatory} />
<Route path="/admin/users" component={UserManagement} />

// Public Routes (no auth)
<Route path="/screen/:slug" component={Screener} />
```

### State Management

**TanStack Query** for server state:

```typescript
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['/admin/drug-programs'],
});

// Mutations
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/admin/drug-programs', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/admin/drug-programs'] });
    toast({ title: 'Program created!' });
  },
});
```

**React Hook Form + Zod** for form state:

```typescript
const form = useForm({
  resolver: zodResolver(drugProgramSchema),
  defaultValues: {
    name: '',
    status: 'draft',
  },
});
```

### Design System

**Zend Design System** implemented via:

1. **Colors** (defined in `index.css`):
   ```css
   :root {
     --primary: 160 45% 25%;        /* Forest green */
     --secondary: 160 25% 35%;
     --background: 0 0% 100%;
     --foreground: 160 10% 10%;
   }
   ```

2. **Components** (shadcn/ui):
   - All components support theming
   - Tailwind classes for styling
   - Radix UI for accessibility

3. **Animations** (Framer Motion):
   ```typescript
   const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
       opacity: 1,
       transition: { staggerChildren: 0.1 },
     },
   };
   ```

### API Integration

**apiClient.ts** pattern:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-parse responses
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle 401, show toast, etc.
    throw error;
  }
);
```

---

## Deployment

### Environment Variables

**Backend** (`.env`):
```bash
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=your-secret-key-here
SESSION_SECRET=session-secret-here

# PostgreSQL (extracted from DATABASE_URL)
PGHOST=host
PGPORT=5432
PGDATABASE=db
PGUSER=user
PGPASSWORD=password
```

**Frontend** (Vite env vars):
```bash
# Must be prefixed with VITE_
VITE_API_BASE_URL=https://api.aegis.com
```

### Build Process

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Run database migrations
npx drizzle-kit push:pg

# Start production server
npm start
```

### Database Migrations

Using **Drizzle Kit**:

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Apply migrations
npx drizzle-kit push:pg

# View studio (GUI)
npx drizzle-kit studio
```

### Health Checks

#### `GET /api/health`

Service health status.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 123456,
  "version": "1.0.0"
}
```

---

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Local Development

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-org/aegis-platform
   cd aegis-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup database**:
   ```bash
   npx drizzle-kit push:pg
   ```

5. **Seed data**:
   ```bash
   # Create super admin
   npx tsx server/scripts/seed-admin.ts
   
   # Create sample tenants and data
   npx tsx server/scripts/seed-comprehensive.ts
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

   This starts:
   - Backend on `http://localhost:5000`
   - Frontend (Vite) with HMR

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts

# Watch mode
npm test -- --watch
```

### Code Quality

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Format
npm run format
```

### Database GUI

Access Drizzle Studio:

```bash
npx drizzle-kit studio
```

Opens at `https://local.drizzle.studio`

---

## API Response Patterns

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [ /* validation errors */ ]
}
```

### HTTP Status Codes

- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server error

---

## Security Considerations

### Data Protection

1. **RLS Enforcement**: All tenant data protected by row-level security
2. **Password Hashing**: bcrypt with salt rounds = 10
3. **JWT Expiration**: Tokens expire after 24 hours
4. **SQL Injection Prevention**: Drizzle ORM parameterized queries
5. **XSS Protection**: React auto-escapes content
6. **CSRF Protection**: SameSite cookies

### HIPAA Compliance

1. **Data Anonymization**: Screening sessions don't store PII
2. **Audit Logging**: All data access logged
3. **Encryption**: TLS/HTTPS for all traffic
4. **Access Controls**: Role-based permissions
5. **Data Retention**: Configurable retention policies

### API Security

1. **Rate Limiting**: 100 requests/minute per IP
2. **API Key Rotation**: Partners can rotate keys
3. **CORS**: Configured allowed origins
4. **Content Security Policy**: Strict CSP headers

---

## Performance Optimization

### Database

- Indexed columns for common queries
- Connection pooling (via Drizzle)
- Prepared statements
- Materialized views for complex analytics (future)

### Frontend

- Code splitting (Vite automatic)
- Lazy loading routes
- TanStack Query caching (5 minute default)
- Image optimization
- Bundle size monitoring

### API

- Response compression (gzip)
- Efficient JSON serialization
- Batch endpoints where appropriate
- Pagination for large datasets

---

## Troubleshooting

### Common Issues

**Database Connection Errors:**
```
Error: connect ECONNREFUSED
```
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Check firewall rules

**JWT Token Errors:**
```
401 Unauthorized - Invalid token
```
- Token may be expired (24h lifetime)
- Check JWT_SECRET matches between requests
- Clear localStorage and re-login

**Migration Conflicts:**
```
Error: Relation already exists
```
- Database out of sync with schema
- Run: `npx drizzle-kit push:pg --force`

**Port Already in Use:**
```
Error: listen EADDRINUSE :::5000
```
- Kill process: `lsof -ti:5000 | xargs kill -9`
- Or change PORT in .env

---

## API Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| Public Consumer | 100 requests | 1 minute |
| Authenticated | 1000 requests | 1 minute |
| Partner API | 500 requests | 1 minute |

Exceeding limits returns `429 Too Many Requests`.

---

## Monitoring & Logging

### Application Logs

Format:
```
[timestamp] [level] [context] message
```

Example:
```
2025-10-30T13:00:00Z [INFO] [express] GET /api/v1/admin/drug-programs
```

### Audit Logs

All significant actions logged to `core.audit_logs`:
- User creation/deletion
- Program creation/modification
- Screener publication
- Partner key generation
- Permission changes

### Health Metrics

Track:
- Request rate (req/min)
- Response times (p50, p95, p99)
- Error rates
- Database query performance
- Active sessions

---

## Support & Contribution

### Reporting Bugs

Include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Screenshots/logs
4. Environment (browser, OS)

### Feature Requests

Submit via GitHub Issues with:
1. Use case description
2. Proposed solution
3. Impact assessment

### Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes with tests
3. Run linter: `npm run lint`
4. Create pull request
5. Await code review

---

**© 2025 Aegis Platform. All rights reserved.**

*For questions or support: tech-support@aegis.com*
