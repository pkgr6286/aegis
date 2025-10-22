# Aegis Platform

## Overview

Aegis is a multi-tenant SaaS platform designed for pharmaceutical patient assistance programs. Its primary purpose is to enable pharmaceutical companies to efficiently manage drug programs, patient screening, and partner integrations while ensuring strict data isolation, enterprise-grade security, and healthcare compliance (HIPAA-ready) through PostgreSQL's Row-Level Security (RLS). The platform features a Super Admin API, Pharma Admin API, Public Consumer API, and Partner Verification API. The business vision aims to streamline patient assistance processes, enhance data accuracy, and guarantee regulatory adherence within the pharmaceutical industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The platform utilizes a multi-tenancy model, leveraging PostgreSQL's Row-Level Security (RLS) for robust data isolation.

### Technology Stack

*   **Backend**: Express.js with TypeScript on Node.js.
*   **Frontend**: React 18 with TypeScript, using Vite.
*   **Database**: PostgreSQL (via Neon Serverless) managed with Drizzle ORM.
*   **Authentication**: JWT for secure, token-based authentication.
*   **UI/UX**: shadcn/ui (Radix UI primitives) with Tailwind CSS, following an enterprise SaaS aesthetic with a professional blue color palette, inspired by leading tech and healthcare platforms, and adhering to WCAG 2.1 AA accessibility standards.
*   **Validation**: Zod for runtime type validation, integrated with Drizzle and React Hook Form.
*   **State Management**: TanStack Query for server state management.

### Database Schema Architecture

The database is organized into modular schemas: `public`, `core`, `programs`, `consumer`, and `partners`. It uses UUID primary keys, includes comprehensive audit logging, enum types, and timestamp fields across all tables.

### Authentication & Authorization

Authentication is JWT-based, supporting both system-level roles (`super_admin`, `support_staff`) and tenant-level roles (`admin`, `editor`, `viewer`), enforced via middleware. Session management is handled by Express session with a PostgreSQL store.

### API Architecture

A RESTful API is structured under `/api/v1/` and comprises:
*   **Super Admin API**: For platform-level tenant management.
*   **Pharma Admin API**: For tenant-specific operations like brand configuration, drug programs, and user/partner management.
*   **Public Consumer API**: Manages patient screening flows, including an EHR Integration ("Fast Path") for automated data population via OAuth.
*   **Partner Verification API**: Facilitates secure verification of consumer codes by partners using API keys.

Middleware handles JSON parsing, CORS, logging, Zod validation, various authentication methods, role-based access control, tenant context injection for RLS, and rate limiting. A centralized error handling system is implemented, and business logic is encapsulated within a service layer that includes automatic audit logging.

### Frontend Architecture

The frontend is structured with `/components/ui`, `/pages`, `/hooks`, and `/lib` directories. Styling is managed with Tailwind CSS, supporting light/dark modes, and the entire frontend is built with full TypeScript coverage.

#### Pharma Admin UI Architecture

Pharma Admin pages, located in `client/src/pages/admin/`, adhere to strict architectural patterns for consistency, maintainability, and testability. Key pages include Brand Management, User Management, Partner Management, Audit Logs, Drug Programs List, and Drug Program Detail.

**Form Validation Architecture:**
All forms utilize the React Hook Form + Zod pattern:
1.  **Schema Definition**: Zod schemas in `client/src/lib/schemas.ts` define validation rules.
2.  **Type Inference**: TypeScript types are inferred from these schemas.
3.  **Form Initialization**: The `useForm` hook is used with `zodResolver` and typed default values.
4.  **Component Structure**: `Form`, `FormField`, `FormItem`, `FormControl`, `FormLabel`, `FormMessage` components from shadcn/ui are used.
5.  **Real-time Validation**: Client-side validation provides instant error feedback.
6.  **Submission Handling**: `form.handleSubmit` manages form submissions with typed data.

**API Integration Pattern:**
All pages use TanStack Query v5 for server state management, including queries for data fetching with automatic caching and mutations for create/update/delete operations with cache invalidation. Hierarchical query keys are used for targeted cache invalidation.

**Design System & UI Patterns:**
The UI consistently uses shadcn/ui components like `Card`, `Table`, `Dialog`, `Button`, `Badge`, and `Skeleton`. Specific patterns are implemented for status badges, loading states, and empty states.

**Testing Attributes:**
Comprehensive `data-testid` attributes are included across all pages (20-25 per page) to support E2E testing, following a naming convention like `{action}-{target}` for interactive elements and `{type}-{content}` for display elements.

## External Dependencies

### Database & Infrastructure

*   **Neon Serverless PostgreSQL**: The primary relational database.

### Security & Authentication

*   **jsonwebtoken**: Used for JWT creation and verification.
*   **bcrypt**: Employed for one-way hashing of partner API keys.

### UI Component Libraries

*   **Radix UI**: Provides accessible, unstyled UI primitives.
*   **lucide-react**: The icon library used throughout the application.

### Utilities

*   **Class Variance Authority (CVA)**: For managing component styling variants.
*   **clsx + tailwind-merge**: For conditional and merging Tailwind CSS classes.
*   **nanoid**: Used for secure, unique ID generation.