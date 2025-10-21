# Aegis Platform

## Overview

Aegis is a multi-tenant SaaS platform designed for pharmaceutical patient assistance programs. Its purpose is to enable pharmaceutical companies to manage drug programs, patient screening sessions, and partner integrations while ensuring strict data isolation between tenants. The platform is built with enterprise-grade security and healthcare compliance (HIPAA-ready architecture) using PostgreSQL's Row-Level Security (RLS) for complete tenant data segregation. Key capabilities include a Super Admin API for platform management, a Pharma Admin API for tenant operations, a Public Consumer API for patient screening, and a Partner Verification API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenancy Strategy

The platform utilizes PostgreSQL's Row-Level Security (RLS) for database-level multi-tenancy. This approach enforces automatic data isolation, enhancing security and performance. Tenant context is set before each database query, allowing RLS policies to filter data appropriately.

### Technology Stack

*   **Backend**: Express.js with TypeScript, running on Node.js.
*   **Authentication**: JWT (JSON Web Tokens) for secure, token-based authentication.
*   **Database**: PostgreSQL (via Neon Serverless) for relational data, managed with Drizzle ORM for type-safe queries.
*   **Frontend**: React 18 with TypeScript, using Vite.
*   **UI/UX**: shadcn/ui (Radix UI primitives) with Tailwind CSS, following a "New York" design system variant for accessible and customizable components. The design aims for an enterprise SaaS aesthetic, inspired by Linear, Stripe, and Healthcare.gov, with a professional blue color palette and WCAG 2.1 AA accessibility compliance.
*   **Validation**: Zod for runtime type validation, integrated with Drizzle and React Hook Form.
*   **State Management**: TanStack Query for server state management and data fetching.

### Database Schema Architecture

The database schema is organized into five distinct modules: `public` (global system tables), `core` (tenant-scoped core functionality with RLS), `programs` (drug program and screener configurations), `consumer` (patient screening, verification codes), and `partners` (external partner integrations). UUID primary keys, comprehensive audit logging, enum types for data integrity, and timestamp fields are standard across tables.

### Authentication & Authorization

JWT-based authentication is used with cryptographic signature verification. A robust role system includes system-level roles (`super_admin`, `support_staff`) and tenant-level roles (`admin`, `editor`, `viewer`), enforced via middleware. Session management is handled by Express session middleware with a PostgreSQL store.

### API Architecture

The API follows a RESTful design, organized under `/api/v1/`.

*   **Super Admin API**: Manages platform-level tenant operations, requiring `super_admin` role.
*   **Pharma Admin API**: Manages tenant-specific operations including brand configuration, drug programs, user management, and partner integrations, requiring JWT authentication and tenant-level roles.
*   **Public Consumer API**: Handles patient screening flows (QR code -> screening -> verification code) with session JWTs and rate limiting.
*   **Partner Verification API**: Facilitates atomic verification of consumer codes by partners using API key authentication and rate limiting.

Middleware handles JSON parsing, CORS, logging, Zod validation, various authentication methods (JWT, Session JWT, API Key), role-based access control, tenant context injection for RLS, and rate limiting. A centralized error handling system provides environment-aware error details. Data access is abstracted via a repository pattern using Drizzle ORM, and business logic is encapsulated within a service layer that also integrates automatic audit logging.

### Frontend Architecture

Components are organized into `/components/ui`, `/pages`, `/hooks`, and `/lib`. Styling is managed with Tailwind CSS and custom CSS variables, supporting light and dark modes. The frontend maintains full TypeScript coverage with shared types between frontend and backend.

## External Dependencies

### Database & Infrastructure

*   **Neon Serverless PostgreSQL**: Primary database.

### Security & Authentication

*   **jsonwebtoken**: For JWT handling.

### Audit & Compliance

*   **Audit Log Service**: Tracks sensitive operations for compliance.

### UI Component Libraries

*   **Radix UI**: Provides accessible, unstyled component primitives.
*   **lucide-react**: Icon library.
*   **react-day-picker**: Date picker.
*   **embla-carousel-react**: Carousel functionality.
*   **cmdk**: Command palette.
*   **vaul**: Drawer component.
*   **recharts**: Charting library.

### Utilities

*   **Class Variance Authority (CVA)**: For managing component variants.
*   **clsx + tailwind-merge**: For combining Tailwind classes.
*   **date-fns**: Date manipulation.
*   **nanoid**: Secure unique ID generation.