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
*   **EHR Integration API ("Fast Path")**: Enables consumers to connect their Electronic Health Records via OAuth for automatic health data population, reducing manual entry. Uses state JWT tokens for CSRF protection, mock FHIR data parsing, and audit logging for compliance.
*   **Partner Verification API**: Facilitates atomic verification of consumer codes by partners using bcrypt-hashed API key authentication and rate limiting.

Middleware handles JSON parsing, CORS, logging, Zod validation, various authentication methods (JWT, Session JWT, API Key), role-based access control, tenant context injection for RLS, and rate limiting. A centralized error handling system provides environment-aware error details. Data access is abstracted via a repository pattern using Drizzle ORM, and business logic is encapsulated within a service layer that also integrates automatic audit logging.

### Frontend Architecture

Components are organized into `/components/ui`, `/pages`, `/hooks`, and `/lib`. Styling is managed with Tailwind CSS and custom CSS variables, supporting light and dark modes. The frontend maintains full TypeScript coverage with shared types between frontend and backend.

## External Dependencies

### Database & Infrastructure

*   **Neon Serverless PostgreSQL**: Primary database.

### Security & Authentication

*   **jsonwebtoken**: For JWT handling and OAuth state tokens.
*   **bcrypt**: For one-way hashing of partner API keys (10 salt rounds).

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

## EHR Integration ("Fast Path")

### Overview

The EHR "Fast Path" integration enables consumers to connect their Electronic Health Records during the screening process, automatically populating health data (such as LDL cholesterol levels, medications) instead of requiring manual entry. This improves user experience and data accuracy.

### OAuth Flow

1. **Consumer initiates connection**: During screening, consumer clicks "Connect EHR" → `GET /api/v1/public/sessions/:id/ehr/connect`
2. **System generates OAuth URL**: Backend creates state JWT containing sessionId and tenantId, then redirects to mock EHR aggregator (e.g., Health Gorilla)
3. **Consumer grants consent**: Consumer authorizes access at the aggregator's OAuth page
4. **Callback handling**: Aggregator redirects back → `GET /api/v1/public/ehr/callback?code=xxx&state=yyy`
5. **Token exchange** (mock): System verifies state JWT, simulates token exchange, records consent in `ehr_consents` table
6. **Session path update**: System updates `screening_sessions.path` from "manual" to "ehr_assisted"
7. **Data retrieval**: Consumer flow fetches parsed health data → `GET /api/v1/public/sessions/:id/ehr-data`

### API Endpoints

All EHR endpoints are mounted under `/api/v1/public` with rate limiting.

#### GET /api/v1/public/sessions/:id/ehr/connect

*   **Description**: Generate OAuth connect URL for EHR aggregator
*   **Authentication**: Session JWT (Bearer token)
*   **Response**: `{ success: true, connectUrl: "https://..." }`
*   **Security**: State JWT contains sessionId and tenantId for CSRF protection

#### GET /api/v1/public/ehr/callback

*   **Description**: Handle OAuth callback from EHR aggregator
*   **Authentication**: None (public endpoint)
*   **Query Parameters**: `code` (authorization code), `state` (JWT token)
*   **Response**: HTML page with success/failure message (auto-closes popup)
*   **Actions**: Verifies state JWT, mocks token exchange, creates consent record, updates session path, audit logs consent

#### GET /api/v1/public/sessions/:id/ehr-data

*   **Description**: Fetch parsed EHR data for a session
*   **Authentication**: Session JWT (Bearer token)
*   **Response**: `{ success: true, data: { labResults: [...], medications: [...], retrievedAt: "..." } }`
*   **Requirements**: Active EHR consent must exist
*   **Data Format**: Parsed FHIR data (NOT raw FHIR bundle)

### Implementation Details

#### Mock Data

The implementation uses mock data to simulate the EHR aggregator integration:

*   **OAuth Provider**: `https://sandbox.healthgorilla.example.com/oauth/authorize`
*   **Token Exchange**: Simulated server-to-server call (no actual HTTP request)
*   **FHIR Data**: Mock bundle containing LDL cholesterol observation (145 mg/dL) and two active medications (Atorvastatin, Metformin)

#### Database Tables

*   **ehr_consents**: Immutable audit log of consent grants (id, tenantId, screeningSessionId, status, providerName, scopesGranted, createdAt)
*   **screening_sessions.path**: Updated to "ehr_assisted" when EHR data is connected

#### Security Features

*   **State JWT**: Prevents CSRF attacks, expires in 15 minutes
*   **Session JWT**: Protects connect and data endpoints
*   **Consent Validation**: Data fetching requires active consent
*   **Audit Logging**: All consent grants are logged for compliance
*   **Tenant Isolation**: RLS policies ensure data isolation

### Production Considerations

The current implementation uses mock data for development. Before production deployment:

1. **Real OAuth Provider**: Replace mock aggregator URL with real EHR aggregator (e.g., Health Gorilla, CommonHealth)
2. **Token Exchange**: Implement actual server-to-server POST to exchange authorization code for access token
3. **FHIR API Calls**: Replace mock FHIR data with real API calls using LOINC codes (e.g., 2093-3 for LDL cholesterol)
4. **Client Credentials**: Configure OAuth client_id and client_secret for the aggregator
5. **Scopes**: Define appropriate FHIR scopes (e.g., `patient/*.read`, `Observation.read`, `MedicationStatement.read`)