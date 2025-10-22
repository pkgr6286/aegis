# Aegis Platform

## Overview

Aegis is a multi-tenant SaaS platform designed for pharmaceutical patient assistance programs. Its primary purpose is to enable pharmaceutical companies to efficiently manage drug programs, patient screening, and partner integrations while ensuring strict data isolation, enterprise-grade security, and healthcare compliance (HIPAA-ready) through PostgreSQL's Row-Level Security (RLS). The platform features a Super Admin API, Pharma Admin API, Public Consumer API, and Partner Verification API. The business vision aims to streamline patient assistance processes, enhance data accuracy, and guarantee regulatory adherence within the pharmaceutical industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 22, 2025 - Pharma Admin UI Complete

**Summary**: Built comprehensive Pharma Admin UI with 6 complete pages following enterprise healthcare design patterns. All pages use React Hook Form + Zod validation with shadcn/ui components.

**Completed Pages:**

1. **Brand Management** (/admin/brands)
   - CRUD operations for brand configurations
   - Color picker integration using react-colorful
   - Logo URL management with visual preview
   - Real-time client-side validation with FormField components

2. **User Management** (/admin/users)
   - Invite users by email with role selection (admin, editor, viewer)
   - User list with status badges and removal actions
   - Pagination support for large tenant user lists
   - Proper tenant scoping via RLS

3. **Partner Management** (/admin/partners)
   - Create/edit B2B partners with contact information
   - API key generation with secure one-time display
   - Key revocation with confirmation dialogs
   - Dual form handling (partner + API key forms)

4. **Audit Logs** (/admin/audit-logs)
   - Comprehensive audit log viewer with filtering
   - Advanced filters: entity type, action, date range
   - Reactive filtering using form.watch()
   - Pagination with offset-based navigation

5. **Drug Programs List** (/admin/programs)
   - CRUD operations for drug programs
   - Status badges (active, draft, archived)
   - Brand configuration selection dropdown
   - Public slug management for consumer URLs

6. **Drug Program Detail** (/admin/programs/:id)
   - Tabbed interface: Overview, Screener Versions, Settings
   - Program info, brand visualization, active version display
   - Screener versions list with status tracking
   - Navigation to screener builder (placeholder ready)

**Test Credentials:**
- Pharma Admin: pharma@kenvue.com / pharma123
- Super Admin: admin@aegis.com / admin123

**Technical Patterns:**
- All forms use useForm + zodResolver + FormField components
- Schemas defined in client/src/lib/schemas.ts
- Types in client/src/types/
- TanStack Query for API integration
- 20+ data-testid attributes per page

## System Architecture

The platform utilizes a multi-tenancy model, leveraging PostgreSQL's Row-Level Security (RLS) for robust data isolation.

### Technology Stack

*   **Backend**: Express.js with TypeScript on Node.js.
*   **Frontend**: React 18 with TypeScript, using Vite.
*   **Database**: PostgreSQL (via Neon Serverless) managed with Drizzle ORM.
*   **Authentication**: JWT for secure, token-based authentication.
*   **UI/UX**: shadcn/ui (Radix UI primitives) with Tailwind CSS, following an enterprise SaaS aesthetic with a professional blue color palette, and adhering to WCAG 2.1 AA accessibility standards.
*   **Validation**: Zod for runtime type validation, integrated with Drizzle and React Hook Form.
*   **State Management**: TanStack Query for server state management.

### Database Schema Architecture

The database is organized into modular schemas: public, core, programs, consumer, and partners. It uses UUID primary keys, includes comprehensive audit logging, enum types, and timestamp fields across all tables.

### Authentication & Authorization

Authentication is JWT-based, supporting both system-level roles (super_admin, support_staff) and tenant-level roles (admin, editor, viewer), enforced via middleware. Session management is handled by Express session with a PostgreSQL store.

### API Architecture

A RESTful API is structured under /api/v1/ and comprises:
*   **Super Admin API**: For platform-level tenant management.
*   **Pharma Admin API**: For tenant-specific operations like brand configuration, drug programs, and user/partner management.
*   **Public Consumer API**: Manages patient screening flows, including an EHR Integration for automated data population via OAuth.
*   **Partner Verification API**: Facilitates secure verification of consumer codes by partners using API keys.

Middleware handles JSON parsing, CORS, logging, Zod validation, various authentication methods, role-based access control, tenant context injection for RLS, and rate limiting. A centralized error handling system is implemented, and business logic is encapsulated within a service layer that includes automatic audit logging.

### Frontend Architecture

The frontend is structured with /components/ui, /pages, /hooks, and /lib directories. Styling is managed with Tailwind CSS, supporting light/dark modes, and the entire frontend is built with full TypeScript coverage.

#### Pharma Admin UI Architecture

All Pharma Admin pages are located in client/src/pages/admin/ and follow strict architectural patterns.

**Page Structure:**
- BrandManagement.tsx (/admin/brands) - Brand configuration CRUD with color picker
- UserManagement.tsx (/admin/users) - Tenant user invitation and management
- PartnerManagement.tsx (/admin/partners) - B2B partner and API key management
- AuditLogs.tsx (/admin/audit-logs) - Audit log viewer with advanced filtering
- DrugPrograms.tsx (/admin/programs) - Drug program list and CRUD operations
- DrugProgramDetail.tsx (/admin/programs/:id) - Program detail with tabs
- ScreenerBuilder.tsx (/admin/programs/:programId/screener/:versionId) - Visual screener builder (placeholder)

**Routing Configuration (client/src/App.tsx):**

```typescript
<Route path="/admin/dashboard"><PharmaAdminRoute component={PharmaAdminDashboard} /></Route>
<Route path="/admin/brands"><PharmaAdminRoute component={BrandManagement} /></Route>
<Route path="/admin/users"><PharmaAdminRoute component={UserManagement} /></Route>
<Route path="/admin/partners"><PharmaAdminRoute component={PartnerManagement} /></Route>
<Route path="/admin/audit-logs"><PharmaAdminRoute component={AuditLogsPage} /></Route>
<Route path="/admin/programs"><PharmaAdminRoute component={DrugPrograms} /></Route>
<Route path="/admin/programs/:programId/screener/:versionId"><PharmaAdminRoute component={ScreenerBuilder} /></Route>
<Route path="/admin/programs/:id"><PharmaAdminRoute component={DrugProgramDetail} /></Route>
```

**Form Validation Architecture:**

Every form follows the React Hook Form + Zod pattern with these 6 steps:

1. **Schema Definition** - Zod schemas in client/src/lib/schemas.ts define validation rules
2. **Type Inference** - TypeScript types inferred from schemas using z.infer<typeof schema>
3. **Form Initialization** - useForm hook with zodResolver and typed defaultValues
4. **Component Structure** - Form, FormField, FormItem, FormControl, FormLabel, FormMessage from shadcn
5. **Real-time Validation** - Client-side validation with instant error feedback
6. **Submission Handling** - form.handleSubmit with typed data parameter

**Code Example - Form Validation:**

```typescript
// 1. Schema Definition (client/src/lib/schemas.ts)
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'editor', 'viewer']),
});
export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

// 2. Component (client/src/pages/admin/UserManagement.tsx)
const form = useForm<InviteUserFormData>({
  resolver: zodResolver(inviteUserSchema),
  defaultValues: { email: '', name: '', role: 'viewer' },
});

// 3. Form JSX
<Form {...form}>
  <form onSubmit={form.handleSubmit(handleSubmit)}>
    <FormField control={form.control} name="email" render={({ field }) => (
      <FormItem>
        <FormLabel>Email *</FormLabel>
        <FormControl><Input {...field} type="email" data-testid="input-email" /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <FormField control={form.control} name="role" render={({ field }) => (
      <FormItem>
        <FormLabel>Role *</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl><SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger></FormControl>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

**Shared Validation Schemas (client/src/lib/schemas.ts):**
- brandConfigSchema: name, logoUrl, primaryColor, secondaryColor
- inviteUserSchema: email, name, role (enum: admin/editor/viewer)
- partnerSchema: name, description, contactEmail, contactPhone
- apiKeySchema: name, permissions array
- auditLogFilterSchema: entityType, action, startDate, endDate
- drugProgramSchema: name, brandName, slug, status, brandConfigId

**Shared TypeScript Types (client/src/types/):**
- brand.ts: BrandConfig, BrandConfigFormData
- drugProgram.ts: DrugProgram, ScreenerVersion
- partner.ts: Partner, ApiKey
- audit.ts: AuditLog, AuditLogFilters

**API Integration Pattern:**

All pages use TanStack Query v5 for server state management.

**Code Example - TanStack Query:**

```typescript
// Query - Fetch data
const { data, isLoading } = useQuery({ queryKey: ['/api/v1/admin/brands'] });
const brands = (data as { success: boolean; data: BrandConfig[] })?.data || [];

// Mutation - Create/Update
const createMutation = useMutation({
  mutationFn: async (formData: BrandConfigFormData) => {
    const res = await apiClient.post('/api/v1/admin/brands', formData);
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/brands'] });
    toast({ title: 'Brand created successfully' });
    setDialogOpen(false);
    form.reset();
  },
  onError: (error) => {
    toast({ title: 'Failed to create brand', description: error.message, variant: 'destructive' });
  },
});

const handleSubmit = (data: BrandConfigFormData) => createMutation.mutate(data);
```

**Code Example - Hierarchical Query Keys:**

```typescript
// Program details
const { data: programData } = useQuery({ queryKey: ['/api/v1/admin/drug-programs', programId] });

// Screener versions (nested)
const { data: versionsData } = useQuery({ queryKey: ['/api/v1/admin/drug-programs', programId, 'screeners'] });

// Invalidate all queries for specific program
queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/drug-programs', programId] });
```

**Design System & UI Patterns:**

Components: Card, Table, Dialog, Button, Badge, Skeleton
Patterns: Status badges, loading states, empty states with CTAs
All pages include 20-25 data-testid attributes for E2E testing

**Testing Attributes Naming Convention:**
- Interactive elements: button-{action}, input-{field}
- Display elements: text-{content}, badge-{status}
- Dynamic elements: card-{type}-{id}, row-{entity}-{id}

### Testing Approach

**End-to-End Testing with Playwright:**

All Pharma Admin pages are designed for comprehensive E2E testing using Playwright. Each page includes 20-25 data-testid attributes to enable reliable test automation.

**Testing Strategy:**
1. **Form Validation Testing** - Verify client-side validation, error messages, and successful submissions
2. **CRUD Operations Testing** - Test create, read, update, delete flows for all entities (brands, users, partners, programs)
3. **Navigation Testing** - Verify routing between list views, detail views, and nested routes
4. **State Management Testing** - Validate cache invalidation, optimistic updates, and loading states
5. **Multi-step Workflow Testing** - Test complex flows like partner creation → API key generation → key display

**Test Execution:**
- Tests run against the development database with proper tenant isolation via RLS
- Each test uses unique identifiers (nanoid) to avoid conflicts with existing data
- Tests verify both UI state and API responses for comprehensive coverage
- Playwright launches browser, performs user interactions, captures screenshots on failure

**Coverage Areas:**
- Authentication flows (login, logout, session management)
- All CRUD pages (Brand Management, User Management, Partner Management, Audit Logs, Drug Programs)
- Navigation between pages and proper route parameter handling
- Form validation with both valid and invalid inputs
- Error handling and toast notifications
- Loading states and skeleton screens

**Test Credentials:**
- Pharma Admin: pharma@kenvue.com / pharma123
- Super Admin: admin@aegis.com / admin123

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
