import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Code2, FileText, Users, Layers, Database, FolderLock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Documentation() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="space-y-8 p-6" data-testid="documentation-page">
      {/* Header */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentation Portal</h1>
            <p className="text-muted-foreground">
              Comprehensive guides and technical references for the Aegis Platform
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Documentation Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-3"
      >
        {/* User Guide Card */}
        <motion.div variants={itemVariants}>
          <Card className="h-full hover-elevate transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>User Guide</CardTitle>
                    <CardDescription>End-to-end platform tutorials</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Step-by-step instructions for all user roles including Super Admins, Pharma Admins, 
                Clinicians, and Auditors. Learn how to manage drug programs, build screeners, 
                conduct patient screenings, and generate FDA documentation.
              </p>
              
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Covers:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Getting started and logging in</li>
                  <li>Managing tenants and users</li>
                  <li>Creating drug programs and screeners</li>
                  <li>EHR Fast Path integration</li>
                  <li>Regulatory submission center</li>
                  <li>Clinical review workflows</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  asChild
                  className="flex-1"
                  data-testid="button-view-user-guide"
                >
                  <a href="/docs/user-guide">
                    <FileText className="w-4 h-4 mr-2" />
                    View Guide
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Technical Documentation Card */}
        <motion.div variants={itemVariants}>
          <Card className="h-full hover-elevate transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                    <Code2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>Technical Documentation</CardTitle>
                    <CardDescription>Architecture and API reference</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Detailed technical documentation for developers, DevOps engineers, and system architects. 
                Includes database schema, API endpoints, authentication flows, and deployment guides.
              </p>
              
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Covers:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>System architecture and tech stack</li>
                  <li>Database schema with RLS</li>
                  <li>Complete API reference</li>
                  <li>Authentication & authorization</li>
                  <li>Frontend architecture</li>
                  <li>Deployment and monitoring</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  asChild
                  className="flex-1"
                  data-testid="button-view-tech-docs"
                >
                  <a href="/docs/technical">
                    <Code2 className="w-4 h-4 mr-2" />
                    View Docs
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Regulatory Vault Card */}
        <motion.div variants={itemVariants}>
          <Card className="h-full hover-elevate transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                    <FolderLock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Regulatory Vault</CardTitle>
                    <CardDescription>FDA compliance documentation</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Centralized repository of regulatory documentation for FDA submissions, 
                SaMD compliance, ACNU studies, and post-market surveillance. 
                Includes 29 documents organized across 7 categories.
              </p>
              
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Includes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>SaMD Core Documentation</li>
                  <li>Verification & Validation</li>
                  <li>Risk & Cybersecurity</li>
                  <li>ACNU-Specific Files</li>
                  <li>Regulatory Submissions</li>
                  <li>Compliance & QMS</li>
                  <li>Post-Market Surveillance</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  asChild
                  className="flex-1"
                  data-testid="button-view-regulatory-vault"
                >
                  <a href="/docs/regulatory-vault">
                    <FolderLock className="w-4 h-4 mr-2" />
                    View Vault
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Reference Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-3"
      >
        <motion.div variants={itemVariants}>
          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Database Schema</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                PostgreSQL with Row-Level Security, multi-tenant architecture, 
                and comprehensive audit logging.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">API Endpoints</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                RESTful API with JWT authentication, role-based access control, 
                and comprehensive error handling.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Development Setup</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Node.js, TypeScript, React, Vite, and Drizzle ORM. 
                Includes seed scripts and local development guide.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Platform Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About Aegis Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              <strong>Aegis</strong> is a multi-tenant SaaS platform for pharmaceutical patient assistance programs. 
              It enables pharmaceutical companies to manage drug programs, patient screening, and partner integrations 
              with strict data isolation, enterprise security, and HIPAA-ready compliance.
            </p>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-semibold mb-1">Key Features:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Visual Screener Builder</li>
                  <li>EHR Fast Path Integration</li>
                  <li>FDA Regulatory Documentation</li>
                  <li>Clinical Review Workflows</li>
                  <li>Comprehensive Audit Logs</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">User Roles:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Super Admin</li>
                  <li>Pharma Admin/Editor/Viewer</li>
                  <li>Clinician</li>
                  <li>Auditor</li>
                  <li>Consumer (Patient)</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Version:</strong> 1.0 | 
                <strong className="ml-2">Last Updated:</strong> October 2025 | 
                <strong className="ml-2">Support:</strong> support@aegis.com
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
