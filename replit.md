# Aegis Platform

## Overview

Aegis is a multi-tenant SaaS platform designed for pharmaceutical patient assistance programs. The platform enables pharmaceutical companies to manage drug programs, patient screening sessions, and partner integrations while maintaining strict data isolation between tenants. Built with enterprise-grade security and healthcare compliance in mind (HIPAA-ready architecture), the system uses Row-Level Security (RLS) at the PostgreSQL database layer to ensure complete tenant data segregation.

### Current Development Status

**Step 2 Completed: Core Services & Super Admin API**

The backend now includes:
- ✅ Complete Super Admin API for tenant management
- ✅ JWT-based authentication with signature verification
- ✅ Audit logging service for compliance tracking
- ✅ Repository pattern for database operations
- ✅ Role-based access control (RBAC) middleware
- ⚠️ Row-Level Security policies (SQL implementation pending)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenancy Strategy

**Row-Level Security (RLS) Architecture**: The platform implements database-level multi-tenancy using PostgreSQL's Row-Level Security feature rather than separate databases or schema-per-tenant approaches.

**Rationale**: This approach provides automatic data isolation enforced at the database layer, preventing cross-tenant data access even if application logic contains bugs. It offers better performance and scalability compared to separate database instances while maintaining security through PostgreSQL's native security features.

**Implementation Pattern**: Before each database query, the application sets a tenant context variable (`SET app.current_tenant_id = 'uuid'`) which RLS policies automatically use to filter all queries to the appropriate tenant's data.

### Technology Stack

**Backend Framework**: Express.js with TypeScript for type safety and developer productivity in a Node.js runtime environment.

**Authentication**: JWT (JSON Web Tokens) with `jsonwebtoken` library for cryptographic signature verification and token-based authentication.

**Database Layer**: 
- PostgreSQL (via Neon Serverless) for production-grade relational data storage
- Drizzle ORM for type-safe database queries and schema management
- WebSocket support for serverless PostgreSQL connections

**Frontend Framework**: React 18 with TypeScript, using Vite as the build tool for fast development and optimized production builds.

**UI Component System**: shadcn/ui (Radix UI primitives) with Tailwind CSS for accessible, customizable components following the "New York" design system variant.

**Validation**: Zod for runtime type validation and schema definition, integrated with both Drizzle (drizzle-zod) and React Hook Form.

**State Management**: TanStack Query (React Query) for server state management and data fetching/caching.

### Database Schema Architecture

**Schema Organization**: Five distinct schema modules for logical separation:

1. **public.ts**: Global system-level tables (tenants, users) without RLS - the master directory of all platform tenants and user accounts
2. **core.ts**: Tenant-scoped core functionality (tenant_users, audit_logs) with RLS enabled
3. **programs.ts**: Drug program management and screener configurations
4. **consumer.ts**: Patient screening sessions, verification codes, and EHR consents
5. **partners.ts**: External partner integrations, API keys, and partner configurations

**Key Design Patterns**:
- UUID primary keys for security and distributed system compatibility
- Comprehensive audit logging for compliance requirements
- Enum types for status fields to ensure data integrity
- Timestamp fields (created_at, updated_at) on all tables for temporal tracking
- Foreign key relationships with proper cascade rules for data consistency

### Authentication & Authorization

**JWT-Based Authentication**: 
- Token-based authentication with cryptographic signature verification using `jsonwebtoken` library
- Configurable expiration (default 7 days via JWT_EXPIRES_IN)
- Development fallback for JWT_SECRET (production requires explicit configuration)
- Comprehensive error handling for invalid, expired, and forged tokens

**Role System**: 
- System-level roles (super_admin, support_staff) for platform administration
- Tenant-level roles (admin, editor, viewer) for customer organization access control
- Middleware-based role enforcement with `requireRole()` and `requireSystemRole()` guards
- Middleware chain: `authenticateToken` → `requireRole` → route handlers

**Session Management**: Express session middleware with PostgreSQL session store (connect-pg-simple) for production-grade session persistence.

**Security Features**:
- JWT signature verification prevents forged tokens
- Role-based access control protects sensitive endpoints
- Comprehensive audit logging for compliance
- Environment validation with production safety checks

### API Architecture

**RESTful Design**: API routes organized under `/api` prefix with versioning capability (`/api/v1/`).

**Super Admin API** (`/api/v1/superadmin`):
- `GET /tenants` - List all tenants with admin counts
- `POST /tenants` - Create new tenant organization
- `PUT /tenants/:id/license` - Update tenant license configuration
- `POST /tenants/:id/invite` - Invite tenant administrator
- All endpoints protected by `super_admin` role requirement
- Integrated audit logging for all operations

**Middleware Stack**:
- JSON/URL-encoded body parsing
- CORS configuration for cross-origin requests
- Request logging for debugging and monitoring
- Zod validation middleware for request body/query/params validation
- JWT authentication middleware with signature verification
- Role-based access control middleware (`requireRole`, `requireSystemRole`)
- Tenant context injection for RLS enforcement

**Error Handling**: Centralized error handling middleware with environment-aware error details (stack traces in development only).

**Repository Pattern**: Data access abstracted through repository layer:
- `tenant.repository.ts` - Tenant CRUD operations
- `user.repository.ts` - User management
- `tenantUser.repository.ts` - Tenant membership management
- All repositories use Drizzle ORM with proper type safety

### Frontend Architecture

**Component Organization**:
- `/components/ui`: Reusable UI primitives from shadcn/ui
- `/pages`: Route-level page components
- `/hooks`: Custom React hooks for shared logic
- `/lib`: Utility functions and configurations

**Design System**: Enterprise SaaS aesthetic inspired by Linear, Stripe, and Healthcare.gov with professional blue color palette, conservative styling for healthcare industry trust, and WCAG 2.1 AA accessibility compliance.

**Styling Approach**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes with healthcare-appropriate color schemes.

**Type Safety**: Full TypeScript coverage with path aliases (`@/`, `@shared/`) for clean imports and shared types between frontend/backend.

### Development Workflow

**Build System**: 
- Vite for frontend development and bundling
- esbuild for backend bundling (production)
- tsx for TypeScript execution in development

**Database Migrations**: Drizzle Kit for schema generation and database synchronization with `db:push` command for schema updates.

**Project Structure**: Monorepo architecture with `client/`, `server/`, and `shared/` directories for code organization and type sharing.

## External Dependencies

### Database & Infrastructure

**Neon Serverless PostgreSQL**: Primary data store with WebSocket-based serverless connections for scalability and automatic connection pooling.

**Environment Configuration**: 
- `.env` file for configuration management
- Required: `DATABASE_URL`, `JWT_SECRET` (production), `NODE_ENV`, `PORT`
- Development fallback for `JWT_SECRET` if not set
- Environment validation on startup

### Security & Authentication

**jsonwebtoken**: JWT token generation and verification with cryptographic signature checking.

**bcrypt** (planned): Password hashing for user authentication (to be implemented).

### Audit & Compliance

**Audit Log Service**: Automatic tracking of all sensitive operations:
- Tenant creation, updates, and deletions
- User invitations and role changes
- License modifications
- Non-blocking error handling (logs failures but doesn't interrupt operations)
- Complete before/after state capture for compliance

### UI Component Libraries

**Radix UI**: Comprehensive set of accessible, unstyled component primitives including:
- Form controls (checkbox, radio, select, slider, switch)
- Overlays (dialog, popover, tooltip, dropdown, context menu)
- Navigation (accordion, tabs, menubar, navigation menu)
- Feedback (toast, alert, progress)
- Layout (aspect-ratio, scroll-area, separator, collapsible)

**Additional UI Dependencies**:
- `lucide-react`: Icon library for consistent iconography
- `react-day-picker`: Calendar/date picker component
- `embla-carousel-react`: Carousel/slider functionality
- `cmdk`: Command palette component
- `vaul`: Drawer component for mobile interfaces
- `recharts`: Charting library for data visualization

### Utilities

**Class Variance Authority (CVA)**: Utility for managing component variants and conditional class composition with TypeScript support.

**clsx + tailwind-merge**: Class name management utilities for combining Tailwind classes without conflicts.

**date-fns**: Date manipulation and formatting library.

**nanoid**: Secure, URL-friendly unique ID generation.

### Development Tools

**Replit Plugins**: Development environment enhancements including error overlay, cartographer (code mapping), and dev banner for Replit-hosted development.

**TypeScript**: Strict type checking with ESNext module resolution and bundler mode for modern development patterns.