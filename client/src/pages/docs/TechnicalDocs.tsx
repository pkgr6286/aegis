import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, Database, Lock, Layers, GitBranch, Server,
  Table, Key, Link as LinkIcon, Shield, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TechnicalDocs() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 p-6" data-testid="technical-docs-page">
      {/* Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Technical Documentation</h1>
        <p className="text-muted-foreground">
          Architecture, API reference, database schema, and deployment guides
        </p>
      </motion.div>

      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Tech Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4 space-y-2">
                  <Code2 className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold">Backend</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Node.js</Badge>
                    <Badge variant="outline">Express.js</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <GitBranch className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold">Frontend</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">React 18</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Vite</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <Database className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold">Database</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">PostgreSQL</Badge>
                    <Badge variant="outline">Drizzle ORM</Badge>
                    <Badge variant="outline">RLS</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold">Security</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">JWT</Badge>
                    <Badge variant="outline">bcrypt</Badge>
                    <Badge variant="outline">RBAC</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold">State Management</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">TanStack Query</Badge>
                    <Badge variant="outline">Context API</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <Code2 className="w-5 h-5 text-pink-500" />
                  <h4 className="font-semibold">UI Components</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">shadcn/ui</Badge>
                    <Badge variant="outline">Radix UI</Badge>
                    <Badge variant="outline">Tailwind</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Tenant Architecture</CardTitle>
              <CardDescription>PostgreSQL Row-Level Security (RLS) for data isolation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Each pharmaceutical company (tenant) operates in complete isolation with their own data namespace.
                PostgreSQL's RLS ensures that queries automatically filter data by tenant context.
              </p>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                <p className="text-muted-foreground mb-2">-- Example RLS Policy</p>
                <p>CREATE POLICY tenant_isolation ON drug_programs</p>
                <p className="ml-4">FOR ALL TO authenticated</p>
                <p className="ml-4">USING (tenant_id = current_setting('app.tenant_id')::uuid);</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Reference Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                API Overview
              </CardTitle>
              <CardDescription>RESTful API at /api/v1/</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Authentication</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="POST" 
                      path="/auth/login"
                      description="Authenticate user and receive JWT token"
                      body={{ email: "user@company.com", password: "password123" }}
                      response={{ success: true, data: { token: "jwt_token_here", user: {} } }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/auth/logout"
                      description="Invalidate current session"
                    />
                    <ApiEndpoint 
                      method="GET" 
                      path="/auth/me"
                      description="Get current user profile"
                      auth
                      response={{ success: true, data: { id: "uuid", email: "user@company.com", tenantRole: "admin" } }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Super Admin - Tenants</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="GET" 
                      path="/superadmin/tenants"
                      description="List all pharmaceutical company tenants"
                      auth
                      response={{ success: true, data: [{ id: "uuid", companyName: "Kenvue", status: "active" }] }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/superadmin/tenants"
                      description="Create new tenant"
                      auth
                      body={{ companyName: "Pharma Corp", primaryContactEmail: "admin@pharmac..." }}
                    />
                    <ApiEndpoint 
                      method="PATCH" 
                      path="/superadmin/tenants/:id"
                      description="Update tenant details"
                      auth
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Pharma Admin - Drug Programs</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="GET" 
                      path="/admin/programs"
                      description="List all drug programs for current tenant"
                      auth
                      response={{ success: true, data: [{ id: "uuid", programName: "Tylenol Assistance", status: "active" }] }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/admin/programs"
                      description="Create new drug program"
                      auth
                      body={{ programName: "Drug Assistance Program", drugName: "DrugName", publicSlug: "drug-assist" }}
                    />
                    <ApiEndpoint 
                      method="GET" 
                      path="/admin/programs/:id"
                      description="Get program details with screener versions"
                      auth
                    />
                    <ApiEndpoint 
                      method="PATCH" 
                      path="/admin/programs/:id"
                      description="Update program configuration"
                      auth
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Screener Builder</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="GET" 
                      path="/admin/programs/:programId/screener-versions"
                      description="List all screener versions for a program"
                      auth
                      response={{ success: true, data: [{ id: "uuid", versionNumber: 1, status: "draft" }] }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/admin/programs/:programId/screener-versions"
                      description="Create new screener version"
                      auth
                    />
                    <ApiEndpoint 
                      method="PATCH" 
                      path="/admin/screener-versions/:id"
                      description="Update screener version (questions, logic, EHR mapping)"
                      auth
                      body={{ screenerJson: { questions: [], logic: {} }, status: "published" }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Regulatory Submissions</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="GET" 
                      path="/admin/regulatory/programs"
                      description="List programs available for regulatory export"
                      auth
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/admin/regulatory/generate"
                      description="Generate all 4 FDA submission documents"
                      auth
                      body={{ programId: "uuid" }}
                      response={{ success: true, data: { designSpec: "...", versionHistory: "...", studyData: "...", acnuLog: "..." } }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Clinician Review</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="GET" 
                      path="/clinician/sessions"
                      description="Get screening sessions for review (filtered by program/outcome)"
                      auth
                      response={{ success: true, data: [{ id: "uuid", outcome: "eligible", reviewStatus: "pending" }] }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/clinician/sessions/:id/review"
                      description="Submit clinical review with notes"
                      auth
                      body={{ clinicalNotes: "Patient approved", reviewDecision: "reviewed" }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Consumer Screening (Public)</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="GET" 
                      path="/public/programs/:slug"
                      description="Get program details by public slug"
                      response={{ success: true, data: { programName: "Tylenol Sleep", drugName: "Tylenol PM" } }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/public/sessions"
                      description="Create new screening session"
                      body={{ programId: "uuid", patientEmail: "patient@email.com" }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/public/sessions/:id/answer"
                      description="Submit answer to screening question"
                      body={{ questionId: "q1", answer: true }}
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/public/sessions/:id/complete"
                      description="Complete screening and calculate outcome"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">EHR Integration</h4>
                  <div className="space-y-2">
                    <ApiEndpoint 
                      method="POST" 
                      path="/ehr/connect"
                      description="Initiate EHR OAuth flow (mock implementation)"
                      body={{ provider: "epic", redirectUri: "..." }}
                    />
                    <ApiEndpoint 
                      method="GET" 
                      path="/ehr/callback"
                      description="Handle EHR OAuth callback"
                    />
                    <ApiEndpoint 
                      method="POST" 
                      path="/ehr/fetch-data"
                      description="Fetch patient health data from EHR (diagnoses, labs, meds)"
                      body={{ accessToken: "...", fhirPaths: ["Observation.ldl", "Condition.diabetes"] }}
                      response={{ success: true, data: { ldlCholesterol: 120, hasDiabetes: true } }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-2">
                <p className="text-muted-foreground">// Success Response</p>
                <p>{'{'}</p>
                <p className="ml-4">"success": true,</p>
                <p className="ml-4">"data": {'{ /* response payload */ }'}</p>
                <p>{'}'}</p>
              </div>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-2">
                <p className="text-muted-foreground">// Error Response</p>
                <p>{'{'}</p>
                <p className="ml-4">"success": false,</p>
                <p className="ml-4">"error": "Error message here"</p>
                <p>{'}'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Schema Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Schema
              </CardTitle>
              <CardDescription>PostgreSQL with Row-Level Security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Core Schema</h4>
                
                <SchemaTable 
                  name="tenants"
                  description="Pharmaceutical company tenants"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'company_name', type: 'TEXT', description: 'Company name (e.g., Kenvue)' },
                    { name: 'primary_contact_email', type: 'TEXT', description: 'Admin email' },
                    { name: 'status', type: 'ENUM', description: 'active | suspended | inactive' },
                    { name: 'subscription_tier', type: 'TEXT', description: 'Subscription level' },
                    { name: 'created_at', type: 'TIMESTAMP', description: 'Creation timestamp' },
                  ]}
                />

                <SchemaTable 
                  name="users"
                  description="Platform and tenant users"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'email', type: 'TEXT', key: 'UNIQUE', description: 'User email' },
                    { name: 'password_hash', type: 'TEXT', description: 'bcrypt hashed password' },
                    { name: 'full_name', type: 'TEXT', description: 'Full name' },
                    { name: 'system_role', type: 'ENUM', description: 'super_admin | support_staff | null' },
                    { name: 'tenant_id', type: 'UUID', key: 'FK', description: 'Foreign key to tenants' },
                    { name: 'tenant_role', type: 'ENUM', description: 'admin | editor | viewer | clinician | auditor' },
                    { name: 'status', type: 'ENUM', description: 'active | invited | suspended' },
                  ]}
                />

                <SchemaTable 
                  name="brands"
                  description="Tenant brand configuration"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'tenant_id', type: 'UUID', key: 'FK', description: 'Foreign key to tenants' },
                    { name: 'brand_name', type: 'TEXT', description: 'Brand name' },
                    { name: 'primary_color', type: 'TEXT', description: 'Hex color code' },
                    { name: 'logo_url', type: 'TEXT', description: 'Brand logo URL' },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Programs Schema</h4>
                
                <SchemaTable 
                  name="drug_programs"
                  description="Patient assistance programs"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'tenant_id', type: 'UUID', key: 'FK', description: 'Foreign key to tenants' },
                    { name: 'program_name', type: 'TEXT', description: 'Program name' },
                    { name: 'drug_name', type: 'TEXT', description: 'Drug name' },
                    { name: 'public_slug', type: 'TEXT', key: 'UNIQUE', description: 'URL-friendly identifier' },
                    { name: 'status', type: 'ENUM', description: 'draft | active | archived' },
                    { name: 'brand_id', type: 'UUID', key: 'FK', description: 'Foreign key to brands' },
                  ]}
                />

                <SchemaTable 
                  name="screener_versions"
                  description="Questionnaire versions with change tracking"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'program_id', type: 'UUID', key: 'FK', description: 'Foreign key to drug_programs' },
                    { name: 'version_number', type: 'INTEGER', description: 'Incremental version' },
                    { name: 'screener_json', type: 'JSONB', description: 'Complete questionnaire definition' },
                    { name: 'status', type: 'ENUM', description: 'draft | published | archived' },
                    { name: 'created_by', type: 'UUID', key: 'FK', description: 'User who created version' },
                    { name: 'created_at', type: 'TIMESTAMP', description: 'Creation timestamp' },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Consumer Schema</h4>
                
                <SchemaTable 
                  name="screening_sessions"
                  description="Patient screening instances"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'program_id', type: 'UUID', key: 'FK', description: 'Foreign key to drug_programs' },
                    { name: 'screener_version_id', type: 'UUID', key: 'FK', description: 'Screener version used' },
                    { name: 'patient_email', type: 'TEXT', description: 'Patient email (encrypted)' },
                    { name: 'answers', type: 'JSONB', description: 'All question answers' },
                    { name: 'outcome', type: 'TEXT', description: 'eligible | ineligible | pending' },
                    { name: 'verification_code', type: 'TEXT', description: 'Access code for patient' },
                    { name: 'review_status', type: 'ENUM', description: 'pending | reviewed | follow_up_required' },
                    { name: 'reviewed_by', type: 'UUID', key: 'FK', description: 'Clinician user ID' },
                    { name: 'reviewed_at', type: 'TIMESTAMP', description: 'Review timestamp' },
                    { name: 'ehr_connected', type: 'BOOLEAN', description: 'Used EHR Fast Path' },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Partners Schema</h4>
                
                <SchemaTable 
                  name="partners"
                  description="Third-party integration partners"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'tenant_id', type: 'UUID', key: 'FK', description: 'Foreign key to tenants' },
                    { name: 'partner_name', type: 'TEXT', description: 'Partner name' },
                    { name: 'partner_type', type: 'ENUM', description: 'retail_pos | ecommerce | ehr | pharmacy' },
                    { name: 'api_key', type: 'TEXT', description: 'Hashed API key' },
                    { name: 'webhook_url', type: 'TEXT', description: 'Webhook endpoint' },
                    { name: 'status', type: 'ENUM', description: 'active | suspended | revoked' },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Audit Schema</h4>
                
                <SchemaTable 
                  name="audit_logs"
                  description="Comprehensive activity tracking"
                  columns={[
                    { name: 'id', type: 'UUID', key: 'PK', description: 'Unique identifier' },
                    { name: 'tenant_id', type: 'UUID', key: 'FK', description: 'Foreign key to tenants' },
                    { name: 'user_id', type: 'UUID', key: 'FK', description: 'User who performed action' },
                    { name: 'entity_type', type: 'TEXT', description: 'drug_program | screener | user | etc' },
                    { name: 'entity_id', type: 'UUID', description: 'ID of affected entity' },
                    { name: 'action', type: 'TEXT', description: 'created | updated | deleted | published' },
                    { name: 'details', type: 'JSONB', description: 'Action details and changes' },
                    { name: 'timestamp', type: 'TIMESTAMP', description: 'When action occurred' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Authentication & Authorization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">JWT Authentication</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    JSON Web Tokens are issued upon successful login and must be included in Authorization header:
                  </p>
                  <div className="rounded-lg bg-muted p-3 font-mono text-sm">
                    <p>Authorization: Bearer {'<jwt_token>'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Role-Based Access Control</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3 space-y-2">
                      <Badge>System Roles</Badge>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• super_admin - Platform management</li>
                        <li>• support_staff - Customer support</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border p-3 space-y-2">
                      <Badge>Tenant Roles</Badge>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• admin - Full tenant access</li>
                        <li>• editor - Create/edit programs</li>
                        <li>• viewer - Read-only access</li>
                        <li>• clinician - Review sessions</li>
                        <li>• auditor - Compliance view</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Middleware Chain</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">1.</span>
                      <span>JSON Parser</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">2.</span>
                      <span>CORS Handler</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">3.</span>
                      <span>Request Logger</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">4.</span>
                      <span>Zod Validation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">5.</span>
                      <span>JWT Authentication</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">6.</span>
                      <span>RBAC Authorization</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">7.</span>
                      <span>Tenant Context Injection</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
                      <span className="font-mono">8.</span>
                      <span>Rate Limiting</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Development</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-2">
                  <p className="text-muted-foreground"># Install dependencies</p>
                  <p>npm install</p>
                  <p className="mt-2 text-muted-foreground"># Set up environment variables</p>
                  <p>cp .env.example .env</p>
                  <p className="mt-2 text-muted-foreground"># Run database migrations</p>
                  <p>npm run db:push</p>
                  <p className="mt-2 text-muted-foreground"># Seed database with demo data</p>
                  <p>npx tsx server/scripts/seed-admin.ts</p>
                  <p>npx tsx server/scripts/seed-comprehensive.ts</p>
                  <p className="mt-2 text-muted-foreground"># Start development server</p>
                  <p>npm run dev</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Server runs on port 5000 with Vite HMR for instant frontend updates
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
                <p>DATABASE_URL=postgresql://...</p>
                <p>JWT_SECRET=your-secret-key</p>
                <p>SESSION_SECRET=your-session-secret</p>
                <p>NODE_ENV=development|production</p>
                <p>OPENAI_API_KEY=sk-... (optional for AI features)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Production Deployment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Configure PostgreSQL</p>
                    <p className="text-xs text-muted-foreground">Use Neon, Supabase, or managed Postgres with SSL</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Set Environment Variables</p>
                    <p className="text-xs text-muted-foreground">Configure all secrets in hosting platform</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Build Frontend</p>
                    <p className="text-xs text-muted-foreground font-mono">npm run build</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Deploy to Platform</p>
                    <p className="text-xs text-muted-foreground">Replit, Railway, Render, or Vercel</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiEndpoint({ 
  method, 
  path, 
  description, 
  auth, 
  body, 
  response 
}: { 
  method: string; 
  path: string; 
  description: string; 
  auth?: boolean;
  body?: any;
  response?: any;
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PATCH: 'bg-orange-500',
    DELETE: 'bg-red-500',
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Badge className={`${methodColors[method]} text-white`}>{method}</Badge>
        <code className="text-sm flex-1">/api/v1{path}</code>
        {auth && <Badge variant="outline" className="text-xs">Auth Required</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {body && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">Request Body:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(body, null, 2)}
          </pre>
        </div>
      )}
      {response && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">Response:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function SchemaTable({ 
  name, 
  description, 
  columns 
}: { 
  name: string; 
  description: string; 
  columns: Array<{ name: string; type: string; key?: string; description: string }>;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted p-3 border-b">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-primary" />
          <h5 className="font-semibold font-mono">{name}</h5>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-semibold">Column</th>
              <th className="text-left p-2 font-semibold">Type</th>
              <th className="text-left p-2 font-semibold">Key</th>
              <th className="text-left p-2 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2 font-mono text-xs">{col.name}</td>
                <td className="p-2">
                  <Badge variant="outline" className="text-xs">{col.type}</Badge>
                </td>
                <td className="p-2">
                  {col.key && (
                    <Badge variant={col.key === 'PK' ? 'default' : 'outline'} className="text-xs">
                      {col.key}
                    </Badge>
                  )}
                </td>
                <td className="p-2 text-xs text-muted-foreground">{col.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
