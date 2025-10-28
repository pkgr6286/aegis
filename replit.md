# Aegis Platform

## Overview
Aegis is a multi-tenant SaaS platform for pharmaceutical patient assistance programs. It enables pharmaceutical companies to manage drug programs, patient screening, and partner integrations with strict data isolation, enterprise security, and HIPAA-ready compliance using PostgreSQL's Row-Level Security (RLS). The platform includes THREE complete frontend UIs: (1) Super Admin UI for platform management, (2) Pharma Admin UI for tenant operations with visual Screener Builder, and (3) Consumer UI for patient screening. The system supports FIVE user roles with specific workflows: super_admin, pharma admin/editor/viewer, clinician (for clinical review workflows), and auditor (read-only compliance access). The platform aims to streamline patient assistance, enhance data accuracy, and ensure regulatory adherence in the pharmaceutical industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform employs a multi-tenancy model with PostgreSQL's Row-Level Security (RLS) for data isolation.

### UI/UX Decisions
The platform utilizes the **Zend Design System** focusing on modern minimalism with forest-green accents. Key elements include:
- **Color Palette:** Forest-green (#1D463A) as primary, neutral gray backgrounds, deep gray (#1A1D21) for dark mode.
- **Typography:** Inter and Manrope for UI, JetBrains Mono for code/data.
- **Layout:** Clean hierarchy with tonal shifts, 12px card radius, 6px button radius, soft shadows.
- **Philosophy:** Information density with visual breathing space and subtle microinteractions.
The frontend is built with shadcn/ui (Radix UI primitives) and Tailwind CSS, adhering to WCAG 2.1 AA accessibility standards.

### Technical Implementations
- **Backend**: Express.js with TypeScript on Node.js.
- **Frontend**: React 18 with TypeScript, using Vite.
- **Database**: PostgreSQL (via Neon Serverless) managed with Drizzle ORM.
- **Authentication**: JWT for secure, token-based authentication.
- **Validation**: Zod for runtime type validation, integrated with Drizzle and React Hook Form.
- **State Management**: TanStack Query for server state management.

### Feature Specifications
The Pharma Admin UI includes comprehensive pages for:
- **Brand Management**: CRUD operations, color picker integration, logo URL management.
- **User Management**: Invite users with role selection (admin, editor, viewer, clinician, auditor), user listing, and pagination.
- **Partner Management**: Create/edit partners, API key generation and revocation.
- **Audit Logs**: Comprehensive viewer with filtering by entity type, action, and date range.
- **Drug Programs**: CRUD for programs, status badges, brand configuration, and public slug management.
- **Drug Program Detail**: Tabbed interface for overview, screener versions, and settings.

The Clinician UI provides specialized workflow for clinical review:
- **Review Queue**: Filter screening sessions by program, outcome, and review status (pending/reviewed).
- **Session Review**: View complete Q&A history, patient outcomes, and submit clinical notes with review decisions (reviewed/follow-up required).

The Auditor UI provides read-only access to all admin pages with compliance monitoring:
- Full visibility into drug programs, users, partners, brands, and audit logs.
- All write operations (POST/PUT/PATCH/DELETE) are blocked at the middleware level.
- Sidebar indicates "(View Only)" status for transparency.

### System Design Choices
- **Database Schema**: Modular organization (public, core, programs, consumer, partners), UUID primary keys, audit logging, enums (including session_review_status), and timestamp fields. Screening sessions include review tracking (reviewStatus, reviewedBy, reviewedAt).
- **Authentication & Authorization**: JWT-based with system-level (super_admin, support_staff) and tenant-level (admin, editor, viewer, clinician, auditor) roles enforced via middleware. Auditor role has automatic read-only enforcement at API level.
- **API Architecture**: RESTful API (`/api/v1/`) with specific APIs for Super Admin, Pharma Admin, Clinician (session review), Public Consumer (including EHR Integration via OAuth), and Partner Verification. Middleware handles JSON parsing, CORS, logging, Zod validation, authentication, RBAC, tenant context injection, and rate limiting.
- **Frontend Architecture**: Structured with `/components/ui`, `/pages`, `/hooks`, and `/lib` directories, full TypeScript coverage. All forms utilize React Hook Form + Zod for validation, with schemas defined in `client/src/lib/schemas.ts` and types in `client/src/types/`. TanStack Query is used for API integration. Role-based sidebar navigation with conditional rendering.
- **Testing Approach**: Designed for comprehensive End-to-End testing with Playwright, utilizing `data-testid` attributes for reliable test automation. Focuses on form validation, CRUD operations, navigation, state management, and multi-step workflows.

## External Dependencies
- **Database & Infrastructure**: Neon Serverless PostgreSQL.
- **Security & Authentication**: jsonwebtoken, bcrypt.
- **UI Component Libraries**: Radix UI, lucide-react.
- **Utilities**: Class Variance Authority (CVA), clsx, tailwind-merge, nanoid.

## Development & Testing
### Seed Users
The platform includes seed scripts to create test users for all roles:

**Super Admin** (run: `npx tsx server/scripts/seed-admin.ts`):
- Email: `admin@aegis.com`
- Password: `admin123`

**Pharma Admin, Clinician, and Auditor** (run: `npx tsx server/scripts/seed-roles.ts`):
- **Pharma Admin**: 
  - Email: `pharma-admin@test.com`
  - Password: `pharma123`
  - Tenant: Test Pharma Corp
- **Clinician** (Clinical Reviewer):
  - Email: `clinician@test.com`
  - Password: `clinician123`
  - Tenant: Test Pharma Corp
- **Auditor** (Compliance Auditor):
  - Email: `auditor@test.com`
  - Password: `auditor123`
  - Tenant: Test Pharma Corp

⚠️ **Security Note**: Change all passwords after first login in production environments.

### Key Implementation Files
**Backend - Clinician API**:
- `server/src/services/clinician.service.ts` - Session retrieval and review submission
- `server/src/routes/clinician.routes.ts` - Clinician API endpoints
- `server/src/middleware/auth.middleware.ts` - RBAC with auditor read-only enforcement

**Frontend - Clinician UI**:
- `client/src/pages/clinician/ReviewQueue.tsx` - Session filtering and queue management
- `client/src/pages/clinician/SessionReview.tsx` - Detailed review with clinical notes
- `client/src/components/admin/PharmaAdminSidebar.tsx` - Role-based navigation

**Database Schema**:
- `server/src/db/schema/consumer.ts` - Screening sessions with review status columns
- `server/src/db/schema/core.ts` - Tenant roles enum (admin, editor, viewer, clinician, auditor)