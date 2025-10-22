# Aegis Platform

## Overview

Aegis is a multi-tenant SaaS platform for pharmaceutical patient assistance programs. It enables pharmaceutical companies to manage drug programs, patient screening, and partner integrations with strict data isolation, enterprise-grade security, and healthcare compliance (HIPAA-ready) using PostgreSQL's Row-Level Security (RLS). The platform provides Super Admin, Pharma Admin, Public Consumer, and Partner Verification APIs. Its purpose is to streamline patient assistance processes, enhance data accuracy, and ensure regulatory adherence in the pharmaceutical industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

Aegis uses a multi-tenancy model with PostgreSQL's Row-Level Security (RLS) for data isolation.

### Technology Stack

*   **Backend**: Express.js with TypeScript on Node.js.
*   **Frontend**: React 18 with TypeScript, using Vite.
*   **Database**: PostgreSQL (via Neon Serverless) managed with Drizzle ORM.
*   **Authentication**: JWT for token-based authentication.
*   **UI/UX**: shadcn/ui (Radix UI primitives) with Tailwind CSS, featuring an enterprise SaaS aesthetic with a professional blue color palette, adhering to WCAG 2.1 AA accessibility standards.
*   **Validation**: Zod for runtime type validation, integrated with Drizzle and React Hook Form.
*   **State Management**: TanStack Query for server state management.

### Database Schema Architecture

The database is modular, with schemas for public, core, programs, consumer, and partners. It uses UUID primary keys, includes comprehensive audit logging, enum types, and timestamp fields.

### Authentication & Authorization

Authentication is JWT-based, supporting system-level roles (super_admin, support_staff) and tenant-level roles (admin, editor, viewer), enforced via middleware.

### API Architecture

A RESTful API under `/api/v1/` includes:
*   **Super Admin API**: For platform-level tenant management.
*   **Pharma Admin API**: For tenant-specific operations (brand config, drug programs, user/partner management).
*   **Public Consumer API**: Manages patient screening flows, including EHR Integration via OAuth.
*   **Partner Verification API**: Facilitates secure verification of consumer codes by partners using API keys.

Middleware handles JSON parsing, CORS, logging, Zod validation, authentication, role-based access control, tenant context injection for RLS, and rate limiting. Business logic is in a service layer with automatic audit logging.

### Frontend Architecture

The frontend is structured with `/components/ui`, `/pages`, `/hooks`, and `/lib` directories. Styling uses Tailwind CSS, supporting light/dark modes, and has full TypeScript coverage.

#### Pharma Admin UI Architecture

Pharma Admin pages in `client/src/pages/admin/` follow strict architectural patterns, including:
- Brand Management (`/admin/brands`)
- User Management (`/admin/users`)
- Partner Management (`/admin/partners`)
- Audit Logs (`/admin/audit-logs`)
- Drug Programs List (`/admin/programs`)
- Drug Program Detail (`/admin/programs/:id`)
- Screener Builder (`/admin/programs/:programId/screener/:versionId`)

**Form Validation Architecture:** All forms use React Hook Form + Zod, with schemas defined in `client/src/lib/schemas.ts` and types inferred from these schemas.

**API Integration Pattern:** All pages use TanStack Query v5 for server state management, employing queries for data fetching with caching and mutations for create/update/delete operations with cache invalidation via hierarchical query keys.

**Design System & UI Patterns:** Leverages shadcn/ui components (Card, Table, Dialog, Button, Badge, Skeleton) and patterns like status badges and loading states. All pages include `data-testid` attributes for E2E testing.

## External Dependencies

### Database & Infrastructure
*   **Neon Serverless PostgreSQL**: Primary relational database.

### Security & Authentication
*   **jsonwebtoken**: For JWT creation and verification.
*   **bcrypt**: For one-way hashing of partner API keys.

### UI Component Libraries
*   **Radix UI**: Accessible, unstyled UI primitives.
*   **lucide-react**: Icon library.

### Utilities
*   **Class Variance Authority (CVA)**: For managing component styling variants.
*   **clsx + tailwind-merge**: For conditional and merging Tailwind CSS classes.
*   **nanoid**: For secure, unique ID generation.