# Aegis Platform

## Overview
Aegis is a multi-tenant SaaS platform for pharmaceutical patient assistance programs. It enables pharmaceutical companies to manage drug programs, patient screening, and partner integrations with strict data isolation, enterprise security, and HIPAA-ready compliance using PostgreSQL's Row-Level Security (RLS). The platform includes THREE complete frontend UIs: (1) Super Admin UI for platform management with comprehensive analytics dashboard, (2) Pharma Admin UI for tenant operations with visual Screener Builder including preview functionality, and (3) Consumer UI for patient screening with EHR Fast Path integration. The system supports FIVE user roles with specific workflows: super_admin, pharma admin/editor/viewer, clinician (for clinical review workflows), and auditor (read-only compliance access). The platform includes comprehensive seed data with 10 major pharmaceutical companies and fully-formed screening questionnaires using standardized question types (boolean, choice, numeric).

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
- **Question Types**: Standardized to boolean, choice, numeric, and diagnostic_test for consistent rendering across consumer UI and screener builder. Diagnostic tests are used for ACNU compliance when OTC-switched drugs require lab results or medical test documentation.

### Feature Specifications
The Super Admin UI includes:
- **Dashboard**: Six analytics cards (Total Tenants, Active Users, API Calls 24h, Total Screenings, Drug Programs, New Tenants) with six graphs (Screening Activity, API Traffic, New Tenants Growth, Screening Outcomes pie chart, additional visualizations).
- **Tenant Management**: Full CRUD operations with company name display (Kenvue, Haleon, Pfizer, Sanofi, AstraZeneca, Merck, Eli Lilly, Bayer, AbbVie, P&G Health).

The Pharma Admin UI includes comprehensive pages for:
- **Brand Management**: CRUD operations, color picker integration, logo URL management.
- **User Management**: Invite users with role selection (admin, editor, viewer, clinician, auditor), user listing, and pagination.
- **Partner Management**: Create/edit partners, API key generation and revocation.
- **Audit Logs**: Comprehensive viewer with filtering by entity type, action, and date range.
- **Drug Programs**: CRUD for programs, status badges, brand configuration, and public slug management.
- **Drug Program Detail**: Tabbed interface for overview, screener versions, and settings.
- **Screener Builder**: Visual flow-based editor supporting four question types (boolean for Yes/No, choice for multiple options, numeric for number inputs, diagnostic_test for lab/medical test requirements) with interactive preview mode and EHR configuration.

The Consumer UI provides patient-facing screening experience:
- **EHR Fast Path**: Optional EHR integration allowing patients to auto-fill health data from their patient portal via OAuth
- **The Fork Screen**: Choice interface offering "Connect My Patient Portal" or "Enter Manually" options for questions with EHR mapping
- **Data Confirmation**: User-friendly confirmation dialog showing fetched EHR data before use
- **Graceful Fallback**: Automatic fallback to manual entry if EHR connection fails or data is not found
- **Dynamic EHR Mapping**: Questions configured with `ehrMapping` automatically trigger the EHR choice screen

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
### Seed Data
The platform includes comprehensive seed scripts to populate the database with realistic data:

**Super Admin** (run: `npx tsx server/scripts/seed-admin.ts`):
- Email: `admin@aegis.com`
- Password: `password123`

**Comprehensive Seed Data** (run: `npx tsx server/scripts/seed-comprehensive.ts`):
This script creates 10 major pharmaceutical tenants with complete data:
- **Tenants**: Kenvue, Haleon, Pfizer, Sanofi, AstraZeneca, Merck, Eli Lilly, Bayer, AbbVie, Procter & Gamble Health
- **Admin Users**: One admin per tenant (e.g., benjamin.serbiak@kenvue.com)
- **Team Members**: 5-7 users per tenant with varied roles (admin, editor, viewer, clinician, auditor)
- **Drug Programs**: One realistic program per tenant (Tylenol Sleep Rx, Advair Diskus, Viagra Connect, Cialis Daily, Crestor, Januvia, Tirzepatide, Stivarga, Botox, Metamucil)
- **Screening Questionnaires**: Complete ACNU-style questionnaires with boolean, choice, and numeric questions
- **Screening Sessions**: 10-20 simulated sessions per program with realistic answers and outcomes
- **Partners**: 2 partners per tenant (retail POS and e-commerce integrations)
- **Default Password**: `password123` for all users (both super admin and pharma users)

⚠️ **Security Note**: Change all passwords after first login in production environments.

### Question Types
The platform uses four standardized question types for screening questionnaires:
- **boolean**: Yes/No questions (rendered as toggle buttons in consumer UI)
- **choice**: Multiple choice questions with predefined options
- **numeric**: Number input questions with optional min/max validation
- **diagnostic_test**: Lab test or medical diagnostic requirements for ACNU compliance (captures test name, date, result, and optional document upload)

These types are consistent across the ScreenerJSON schema, consumer UI rendering, and screener builder visual editor. Diagnostic test questions support collecting structured information about required medical tests (e.g., pregnancy tests, cholesterol panels) for OTC-switched medications.

### EHR Integration
Questions can be configured with optional EHR mapping to enable automatic data fetching from patient health records:
- **ehrMapping.rule**: 'optional' (shows choice screen) or 'mandatory' (requires EHR connection)
- **ehrMapping.fhirPath**: FHIR resource path (e.g., 'Observation.ldl', 'Condition.diabetes')
- **ehrMapping.displayName**: User-friendly name for the data being requested

Example questions with EHR mapping in seed data:
- LDL Cholesterol levels (Crestor, P&G programs)
- Asthma/COPD diagnosis (Advair program)
- Type 2 Diabetes diagnosis (Januvia program)

### Key Implementation Files
**Backend - Clinician API**:
- `server/src/services/clinician.service.ts` - Session retrieval and review submission
- `server/src/routes/clinician.routes.ts` - Clinician API endpoints
- `server/src/middleware/auth.middleware.ts` - RBAC with auditor read-only enforcement

**Frontend - Clinician UI**:
- `client/src/pages/clinician/ReviewQueue.tsx` - Session filtering and queue management
- `client/src/pages/clinician/SessionReview.tsx` - Detailed review with clinical notes
- `client/src/components/admin/PharmaAdminSidebar.tsx` - Role-based navigation

**Frontend - Consumer UI & EHR Integration**:
- `client/src/pages/public/Screener.tsx` - Main screening flow with intelligent EHR auto-fill and smart completion
- `client/src/pages/ehr/EhrLogin.tsx` - Mock EHR provider login page (patient portal simulation)
- `client/src/pages/ehr/EhrConsent.tsx` - HIPAA-compliant consent screen showing data sharing permissions
- `client/src/pages/ehr/EhrShareData.tsx` - AI processing visualization with real-time data extraction animation
- `client/src/components/consumer/EhrChoiceCard.tsx` - "The Fork" screen for EHR vs manual entry
- `client/src/components/consumer/EhrConfirmationDialog.tsx` - AI-verified EHR data confirmation dialog with contextual messaging
- `client/src/lib/ehrUtils.ts` - EHR OAuth popup handling and data fetching utilities

**Backend - EHR API**:
- `server/src/services/ehr.service.ts` - EHR OAuth flow and FHIR data parsing
- `server/src/routes/ehr.routes.ts` - EHR API endpoints (connect, callback, data fetching)

**Smart EHR Workflow**:
The EHR integration now features intelligent auto-completion:
1. Patient clicks "Connect My Patient Portal" on EHR-enabled questions
2. Mock EHR flow: Login → Consent → AI Processing (with animations)
3. AI extracts comprehensive health data (diagnoses, labs, medications, demographics)
4. System auto-fills ALL answerable questions from EHR data
5. If all required questions answered: Skip directly to outcome/approval
6. If incomplete data: Continue with remaining questions manually
7. Result: Streamlined experience that minimizes patient burden

**Database Schema**:
- `server/src/db/schema/consumer.ts` - Screening sessions with review status columns
- `server/src/db/schema/core.ts` - Tenant roles enum (admin, editor, viewer, clinician, auditor)