# Aegis Platform

## Overview
Aegis is a multi-tenant SaaS platform for pharmaceutical patient assistance programs. It enables pharmaceutical companies to manage drug programs, patient screening, and partner integrations with strict data isolation, enterprise security, and HIPAA-ready compliance using PostgreSQL's Row-Level Security (RLS). The platform includes Super Admin, Pharma Admin, Public Consumer, and Partner Verification APIs, aiming to streamline patient assistance, enhance data accuracy, and ensure regulatory adherence in the pharmaceutical industry.

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
- **User Management**: Invite users with role selection (admin, editor, viewer), user listing, and pagination.
- **Partner Management**: Create/edit partners, API key generation and revocation.
- **Audit Logs**: Comprehensive viewer with filtering by entity type, action, and date range.
- **Drug Programs**: CRUD for programs, status badges, brand configuration, and public slug management.
- **Drug Program Detail**: Tabbed interface for overview, screener versions, and settings.

### System Design Choices
- **Database Schema**: Modular organization (public, core, programs, consumer, partners), UUID primary keys, audit logging, enums, and timestamp fields.
- **Authentication & Authorization**: JWT-based with system-level (super_admin, support_staff) and tenant-level (admin, editor, viewer) roles enforced via middleware.
- **API Architecture**: RESTful API (`/api/v1/`) with specific APIs for Super Admin, Pharma Admin, Public Consumer (including EHR Integration via OAuth), and Partner Verification. Middleware handles JSON parsing, CORS, logging, Zod validation, authentication, RBAC, tenant context injection, and rate limiting.
- **Frontend Architecture**: Structured with `/components/ui`, `/pages`, `/hooks`, and `/lib` directories, full TypeScript coverage. All forms utilize React Hook Form + Zod for validation, with schemas defined in `client/src/lib/schemas.ts` and types in `client/src/types/`. TanStack Query is used for API integration.
- **Testing Approach**: Designed for comprehensive End-to-End testing with Playwright, utilizing `data-testid` attributes for reliable test automation. Focuses on form validation, CRUD operations, navigation, state management, and multi-step workflows.

## External Dependencies
- **Database & Infrastructure**: Neon Serverless PostgreSQL.
- **Security & Authentication**: jsonwebtoken, bcrypt.
- **UI Component Libraries**: Radix UI, lucide-react.
- **Utilities**: Class Variance Authority (CVA), clsx, tailwind-merge, nanoid.