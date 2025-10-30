import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Lock, Building2, Pill, Stethoscope, FileText, 
  ClipboardList, BarChart3, FileCheck, Palette, UserPlus,
  FileSearch, CheckCircle2, AlertCircle, Database, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserGuide() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 p-6" data-testid="user-guide-page">
      {/* Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">User Guide</h1>
        <p className="text-muted-foreground">
          Complete guide to using the Aegis Platform across all user roles
        </p>
      </motion.div>

      {/* Role-Based Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="super-admin">Super Admin</TabsTrigger>
          <TabsTrigger value="pharma-admin">Pharma Admin</TabsTrigger>
          <TabsTrigger value="clinician">Clinician</TabsTrigger>
          <TabsTrigger value="consumer">Consumer</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Welcome to the Aegis Platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Aegis is a multi-tenant SaaS platform designed for pharmaceutical patient assistance programs.
                The platform enables pharmaceutical companies to manage drug programs, conduct patient screenings,
                and maintain regulatory compliance with enterprise-grade security.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Authentication
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    JWT-based authentication with role-based access control (RBAC).
                    All users authenticate via email and password.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    User Roles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Super Admin</Badge>
                    <Badge variant="outline">Pharma Admin</Badge>
                    <Badge variant="outline">Editor</Badge>
                    <Badge variant="outline">Viewer</Badge>
                    <Badge variant="outline">Clinician</Badge>
                    <Badge variant="outline">Auditor</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-semibold text-sm">Demo Credentials</h4>
                <div className="grid gap-2 text-sm font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Super Admin:</span>
                    <span>admin@aegis.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pharma Admin:</span>
                    <span>benjamin.serbiak@kenvue.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password (all):</span>
                    <Badge>password123</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Super Admin Tab */}
        <TabsContent value="super-admin" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <CardTitle>Super Admin Dashboard</CardTitle>
              </div>
              <CardDescription>Platform-wide management and analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Analytics Dashboard
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor platform health with six real-time metrics and comprehensive visualizations:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Total Tenants</p>
                      <p className="text-sm font-semibold">Track active pharma companies</p>
                    </div>
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Active Users</p>
                      <p className="text-sm font-semibold">Platform-wide user count</p>
                    </div>
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">API Calls (24h)</p>
                      <p className="text-sm font-semibold">Real-time API traffic</p>
                    </div>
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Total Screenings</p>
                      <p className="text-sm font-semibold">Patient screening count</p>
                    </div>
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Drug Programs</p>
                      <p className="text-sm font-semibold">Active programs</p>
                    </div>
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">New Tenants</p>
                      <p className="text-sm font-semibold">30-day growth</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-500" />
                    Tenant Management
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>Create and configure pharmaceutical company tenants</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>Enable/disable tenant access and features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>View tenant metadata and subscription status</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    User Management
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>Create super admin and support staff accounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>Monitor platform-wide user activity</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Platform Audit Logs
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>View all tenant activities across the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>Filter by tenant, entity type, action, and date range</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>Export audit trails for compliance reporting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pharma Admin Tab */}
        <TabsContent value="pharma-admin" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  <CardTitle>Drug Program Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create and manage patient assistance programs for your pharmaceutical products.
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Create Program</p>
                      <p className="text-xs text-muted-foreground">
                        Set program name, drug name, brand configuration, and public screening URL
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Build Screener</p>
                      <p className="text-xs text-muted-foreground">
                        Use the visual flow editor to create screening questionnaires with EHR integration
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Publish & Monitor</p>
                      <p className="text-xs text-muted-foreground">
                        Activate the program and monitor patient screenings in real-time
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle>Screener Builder</CardTitle>
                </div>
                <CardDescription>Visual flow-based questionnaire editor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Question Types</h4>
                    <div className="space-y-2">
                      <Badge variant="outline" className="mr-2">Boolean (Yes/No)</Badge>
                      <Badge variant="outline" className="mr-2">Multiple Choice</Badge>
                      <Badge variant="outline" className="mr-2">Numeric Input</Badge>
                      <Badge variant="outline">Diagnostic Test</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">EHR Integration</h4>
                    <p className="text-xs text-muted-foreground">
                      Configure questions to auto-fill from patient health records using FHIR mapping
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Preview Mode:</strong> Test your screener flow in real-time before publishing
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <CardTitle>Regulatory Submission Center</CardTitle>
                </div>
                <CardDescription>FDA-ready documentation generator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate submission-ready regulatory documents with one click:
                </p>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Design Specification (JSON)</p>
                      <p className="text-xs text-muted-foreground">Complete screener logic and flow</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <FileText className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Version History (CSV)</p>
                      <p className="text-xs text-muted-foreground">All changes and modifications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Database className="w-5 h-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Study Data Export (CSV)</p>
                      <p className="text-xs text-muted-foreground">Screening session outcomes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">ACNU Failure Log (CSV)</p>
                      <p className="text-xs text-muted-foreground">Ineligibility tracking</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Time Saved:</strong> 3-6 months of manual documentation work per product launch
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <CardTitle>Team Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-sm font-medium">Admin</span>
                    <Badge>Full Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-sm font-medium">Editor</span>
                    <Badge variant="outline">Create & Edit</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-sm font-medium">Viewer</span>
                    <Badge variant="outline">Read-Only</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-sm font-medium">Clinician</span>
                    <Badge variant="outline">Review Sessions</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-sm font-medium">Auditor</span>
                    <Badge variant="outline">Compliance View</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clinician Tab */}
        <TabsContent value="clinician" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <CardTitle>Clinical Review Workflow</CardTitle>
              </div>
              <CardDescription>Review and approve patient screening sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <ClipboardList className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Review Queue</h4>
                    <p className="text-sm text-muted-foreground">
                      Filter sessions by program, outcome status, and review state. View pending screenings
                      requiring clinical evaluation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <FileSearch className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Session Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Review complete Q&A history, patient answers, eligibility outcome, and add clinical notes.
                      Mark sessions as reviewed or flag for follow-up.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-4">
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    <strong>HIPAA Compliant:</strong> All clinical reviews are logged in audit trail with full data encryption
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumer Tab */}
        <TabsContent value="consumer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Screening Experience</CardTitle>
              <CardDescription>EHR Fast Path integration for streamlined screening</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    EHR Fast Path
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Patients can connect their patient portal to auto-fill health information:
                  </p>
                  <div className="space-y-2 ml-6">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Diagnoses (diabetes, asthma, COPD)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Lab results (LDL, cholesterol panels)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Medications and treatment history</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Demographics and contact info</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-4">
                  <h4 className="font-semibold text-sm mb-2">Smart Completion</h4>
                  <p className="text-sm text-muted-foreground">
                    If EHR data answers all required questions, patients skip directly to outcome. 
                    Otherwise, they complete remaining questions manually.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="font-semibold text-sm">Education Module</p>
                    <p className="text-xs text-muted-foreground">
                      Interactive content about the drug and program before screening
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="font-semibold text-sm">Comprehension Check</p>
                    <p className="text-xs text-muted-foreground">
                      Verify patient understanding before final eligibility determination
                    </p>
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
