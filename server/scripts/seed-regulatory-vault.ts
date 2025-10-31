#!/usr/bin/env tsx
/**
 * Seed Script: Populate Regulatory Vault Documents
 * 
 * This script populates the regulatory_documents table with all 25 regulatory documents
 * across 7 categories for each pharmaceutical tenant in the system.
 * 
 * Run with: npx tsx server/scripts/seed-regulatory-vault.ts
 */

import { db } from '../src/db';
import { regulatoryDocuments } from '../src/db/schema/programs';
import { tenantUsers } from '../src/db/schema/core';
import { tenants } from '../src/db/schema/public';
import { eq } from 'drizzle-orm';

// Define all 25 regulatory documents with their metadata
const REGULATORY_DOCUMENTS = [
  // SaMD Core Documentation (4 documents)
  {
    title: 'Software as a Medical Device (SaMD) Classification Report',
    category: 'samd_core',
    description: 'Comprehensive classification analysis determining the SaMD risk category (I, II, III) based on FDA guidance. Includes intended use statement, clinical significance assessment, and state of healthcare situation analysis.',
    tags: ['SaMD', 'Classification', 'FDA', 'Risk Assessment'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/samd-classification-report.pdf',
  },
  {
    title: 'Software Requirements Specification (SRS)',
    category: 'samd_core',
    description: 'Detailed technical requirements document covering functional requirements, performance criteria, safety requirements, and security specifications for the screening questionnaire engine and decision algorithms.',
    tags: ['SRS', 'Requirements', 'Software Engineering', 'IEC 62304'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/software-requirements-specification.pdf',
  },
  {
    title: 'Software Design Document (SDD)',
    category: 'samd_core',
    description: 'Architecture and design documentation including system architecture diagrams, component specifications, database schema, API design, and security architecture following IEC 62304 Class C requirements.',
    tags: ['SDD', 'Architecture', 'Design', 'IEC 62304'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/software-design-document.pdf',
  },
  {
    title: 'Software Development Lifecycle (SDLC) Plan',
    category: 'samd_core',
    description: 'Comprehensive SDLC documentation covering development methodology, version control procedures, code review processes, continuous integration/deployment pipelines, and change management protocols.',
    tags: ['SDLC', 'Development Process', 'Quality Management', 'IEC 62304'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/sdlc-plan.pdf',
  },

  // Verification & Validation (4 documents)
  {
    title: 'Software Verification & Validation (V&V) Plan',
    category: 'verification_validation',
    description: 'Master V&V plan outlining testing strategy, acceptance criteria, traceability matrices, and validation protocols for all software components including screening algorithms and EHR integration.',
    tags: ['V&V', 'Testing', 'Validation', 'IEC 62304', 'FDA'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/verification-validation-plan.pdf',
  },
  {
    title: 'Unit Testing Report',
    category: 'verification_validation',
    description: 'Comprehensive unit test coverage report with automated test results, code coverage metrics (>90% for critical paths), and traceability to software requirements. Includes test cases for all decision algorithms.',
    tags: ['Unit Testing', 'Code Coverage', 'Automated Testing', 'CI/CD'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/unit-testing-report.pdf',
  },
  {
    title: 'Integration Testing Report',
    category: 'verification_validation',
    description: 'Integration test results covering API endpoints, database transactions, EHR Fast Path OAuth flow, partner verification system, and end-to-end screening workflows. Includes performance benchmarks.',
    tags: ['Integration Testing', 'API Testing', 'System Integration', 'Performance'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/integration-testing-report.pdf',
  },
  {
    title: 'Clinical Validation Study Report',
    category: 'verification_validation',
    description: 'Clinical validation study demonstrating accuracy of screening algorithms against pharmacist-reviewed manual assessments. Includes sensitivity/specificity analysis, edge case handling, and real-world performance data.',
    tags: ['Clinical Validation', 'Clinical Study', 'Algorithm Accuracy', 'Evidence'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/clinical-validation-study.pdf',
  },

  // Risk & Cybersecurity (4 documents)
  {
    title: 'ISO 14971 Risk Management File',
    category: 'risk_cybersecurity',
    description: 'Complete risk management file per ISO 14971 including hazard analysis, risk assessment matrices, risk mitigation strategies, and residual risk evaluation for all software hazards including data breaches and algorithm errors.',
    tags: ['Risk Management', 'ISO 14971', 'Hazard Analysis', 'Patient Safety'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/iso14971-risk-management-file.pdf',
  },
  {
    title: 'Cybersecurity Risk Assessment',
    category: 'risk_cybersecurity',
    description: 'FDA-aligned cybersecurity risk assessment covering threat modeling, vulnerability analysis, penetration testing results, and security controls. Addresses HIPAA, GDPR, and FDA cybersecurity guidance.',
    tags: ['Cybersecurity', 'Security', 'HIPAA', 'Threat Modeling', 'FDA'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/cybersecurity-risk-assessment.pdf',
  },
  {
    title: 'Security Architecture Document',
    category: 'risk_cybersecurity',
    description: 'Detailed security architecture including encryption standards (AES-256, TLS 1.3), authentication mechanisms (JWT, OAuth 2.0), PostgreSQL Row-Level Security implementation, and audit logging systems.',
    tags: ['Security Architecture', 'Encryption', 'Authentication', 'Audit Trails'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/security-architecture.pdf',
  },
  {
    title: 'HIPAA Compliance Documentation',
    category: 'risk_cybersecurity',
    description: 'Comprehensive HIPAA compliance documentation including Business Associate Agreements (BAA) templates, PHI handling procedures, breach notification protocols, and annual security risk assessments.',
    tags: ['HIPAA', 'Compliance', 'PHI', 'Privacy', 'Security'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/hipaa-compliance-documentation.pdf',
  },

  // ACNU-Specific Files (4 documents)
  {
    title: 'ACNU Regulatory Strategy Document',
    category: 'acnu_specific',
    description: 'Strategic regulatory document outlining ACNU (Actual Use Study) submission approach for OTC switches. Includes rationale for questionnaire design, safety protocols, and FDA pre-submission meeting notes.',
    tags: ['ACNU', 'Regulatory Strategy', 'OTC Switch', 'FDA Submission'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/acnu-regulatory-strategy.pdf',
  },
  {
    title: 'Consumer Comprehension Study Protocol',
    category: 'acnu_specific',
    description: 'IRB-approved study protocol for consumer comprehension testing of Drug Facts Labels (DFL) and screening questionnaires. Includes study design, inclusion/exclusion criteria, and statistical analysis plan.',
    tags: ['Consumer Comprehension', 'Clinical Study', 'IRB', 'Label Comprehension'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/consumer-comprehension-protocol.pdf',
  },
  {
    title: 'Self-Selection Study Report',
    category: 'acnu_specific',
    description: 'Complete self-selection study report demonstrating consumers can appropriately self-select the OTC product using the screening questionnaire. Includes demographic analysis, success rates, and error analysis.',
    tags: ['Self-Selection', 'ACNU', 'Consumer Study', 'Clinical Evidence'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/self-selection-study-report.pdf',
  },
  {
    title: 'Screening Algorithm Validation Report',
    category: 'acnu_specific',
    description: 'Validation report demonstrating screening algorithm accuracy, consistency, and safety. Includes edge case testing, sensitivity/specificity metrics, and comparison against expert pharmacist reviews.',
    tags: ['Algorithm Validation', 'Clinical Accuracy', 'Safety', 'Quality Assurance'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/screening-algorithm-validation.pdf',
  },

  // Regulatory Submissions (4 documents)
  {
    title: 'FDA 510(k) Submission Package (if applicable)',
    category: 'regulatory_submissions',
    description: 'Complete FDA 510(k) premarket notification submission for SaMD Class II medical device. Includes device description, substantial equivalence analysis, performance testing, and biocompatibility if applicable.',
    tags: ['510(k)', 'FDA Submission', 'Premarket Notification', 'Device Classification'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/510k-submission-package.pdf',
  },
  {
    title: 'FDA Pre-Submission (Q-Sub) Meeting Minutes',
    category: 'regulatory_submissions',
    description: 'Official FDA pre-submission meeting minutes documenting FDA feedback on regulatory pathway, testing requirements, labeling expectations, and submission strategy for the ACNU/OTC switch program.',
    tags: ['Pre-Submission', 'Q-Sub', 'FDA Meeting', 'Regulatory Guidance'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/fda-presub-meeting-minutes.pdf',
  },
  {
    title: 'ACNU Supplement Application',
    category: 'regulatory_submissions',
    description: 'Complete ACNU supplement application for OTC switch including consumer study results, labeling proposals, safety data, and post-market surveillance plans. FDA Form 356h and all required attachments.',
    tags: ['ACNU', 'Supplement', 'OTC Switch', 'FDA Application'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/acnu-supplement-application.pdf',
  },
  {
    title: 'eCopy Submission Confirmation',
    category: 'regulatory_submissions',
    description: 'FDA eCopy submission confirmation receipts, acknowledgment letters, and correspondence tracking. Includes submission dates, FDA assigned numbers, and review division assignments.',
    tags: ['eCopy', 'Submission Confirmation', 'FDA Correspondence', 'Tracking'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/ecopy-submission-confirmation.pdf',
  },

  // Compliance & QMS (5 documents)
  {
    title: 'Quality Management System (QMS) Manual',
    category: 'compliance_qms',
    description: 'Comprehensive QMS manual covering quality policy, organizational structure, document control, CAPA procedures, internal audits, management review, and continuous improvement processes per ISO 13485 and 21 CFR Part 820.',
    tags: ['QMS', 'ISO 13485', '21 CFR 820', 'Quality System', 'Compliance'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/qms-manual.pdf',
  },
  {
    title: 'Standard Operating Procedures (SOPs)',
    category: 'compliance_qms',
    description: 'Master SOP index and key procedures including: Software Change Control, Document Management, CAPA Process, Non-Conformance Handling, Supplier Management, Training Programs, and Audit Procedures.',
    tags: ['SOPs', 'Procedures', 'Quality System', 'Process Documentation'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/standard-operating-procedures.pdf',
  },
  {
    title: 'Design History File (DHF)',
    category: 'compliance_qms',
    description: 'Complete Design History File documenting all design and development activities from concept through validation. Includes design inputs, design outputs, design reviews, verification results, and validation evidence.',
    tags: ['DHF', 'Design History', 'Design Controls', '21 CFR 820.30'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/design-history-file.pdf',
  },
  {
    title: 'Device Master Record (DMR)',
    category: 'compliance_qms',
    description: 'Device Master Record containing manufacturing specifications, quality assurance procedures, deployment procedures, software build scripts, configuration management protocols, and labeling specifications.',
    tags: ['DMR', 'Manufacturing', 'Configuration Management', '21 CFR 820.181'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/device-master-record.pdf',
  },
  {
    title: 'Internal Audit Reports',
    category: 'compliance_qms',
    description: 'Annual internal audit reports covering QMS effectiveness, regulatory compliance, software development processes, and corrective action follow-ups. Includes audit schedules, findings, and CAPA tracking.',
    tags: ['Internal Audit', 'Compliance Audit', 'QMS Audit', 'CAPA'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/internal-audit-reports.pdf',
  },

  // Post-Market Surveillance (4 documents)
  {
    title: 'Post-Market Surveillance Plan',
    category: 'post_market_surveillance',
    description: 'Comprehensive post-market surveillance plan including complaint handling procedures, adverse event reporting protocols, periodic safety update reports (PSURs), and real-world evidence collection strategies.',
    tags: ['Post-Market', 'Surveillance', 'Safety Monitoring', 'Adverse Events'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/post-market-surveillance-plan.pdf',
  },
  {
    title: 'Medical Device Reporting (MDR) Procedures',
    category: 'post_market_surveillance',
    description: 'FDA MDR compliance procedures for reporting device-related deaths, serious injuries, and malfunctions. Includes reporting timelines, FDA Form 3500A templates, and investigation protocols per 21 CFR Part 803.',
    tags: ['MDR', 'Adverse Event Reporting', 'FDA Compliance', '21 CFR 803'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/mdr-procedures.pdf',
  },
  {
    title: 'Software Maintenance & Support Plan',
    category: 'post_market_surveillance',
    description: 'Software maintenance plan covering bug tracking, patch management, security updates, feature enhancements, version control, and end-of-life procedures. Includes SLA commitments and escalation procedures.',
    tags: ['Software Maintenance', 'Support', 'Updates', 'Version Control'],
    accessLevel: 'internal',
    fileUrl: 'https://storage.aegis.platform/docs/software-maintenance-plan.pdf',
  },
  {
    title: 'Annual Product Review Report',
    category: 'post_market_surveillance',
    description: 'Annual comprehensive product review summarizing performance metrics, complaint trends, adverse events, software updates, user feedback, and continuous improvement initiatives. Required for QMS compliance.',
    tags: ['Annual Review', 'Product Performance', 'Metrics', 'Continuous Improvement'],
    accessLevel: 'admin',
    fileUrl: 'https://storage.aegis.platform/docs/annual-product-review.pdf',
  },
];

async function seedRegulatoryVault() {
  try {
    console.log('🌱 Seeding Regulatory Vault Documents...\n');

    // Get all pharmaceutical tenants
    const allTenants = await db.query.tenants.findMany();
    
    if (allTenants.length === 0) {
      console.log('⚠️  No tenants found. Please run seed-comprehensive.ts first.\n');
      process.exit(1);
    }

    console.log(`📊 Found ${allTenants.length} pharmaceutical tenants\n`);

    let totalDocumentsCreated = 0;

    // For each tenant, create all 25 documents
    for (const tenant of allTenants) {
      console.log(`\n🏢 Processing tenant: ${tenant.name}`);

      // Find the first admin user for this tenant to be the creator
      const adminUser = await db.query.tenantUsers.findFirst({
        where: eq(tenantUsers.tenantId, tenant.id),
      });

      if (!adminUser) {
        console.log(`   ⚠️  No admin user found for ${tenant.name}, skipping...`);
        continue;
      }

      // Insert all documents for this tenant
      for (const doc of REGULATORY_DOCUMENTS) {
        try {
          await db.insert(regulatoryDocuments).values({
            tenantId: tenant.id,
            title: doc.title,
            category: doc.category as any,
            description: doc.description,
            tags: doc.tags,
            accessLevel: doc.accessLevel as any,
            fileUrl: doc.fileUrl,
            metadata: {},
            createdBy: adminUser.userId,
            updatedBy: adminUser.userId,
          });
          totalDocumentsCreated++;
        } catch (error: any) {
          if (error.code === '23505') {
            // Duplicate entry, skip
            continue;
          }
          throw error;
        }
      }

      console.log(`   ✅ Created ${REGULATORY_DOCUMENTS.length} regulatory documents`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Regulatory Vault Seeding Complete!\n');
    console.log(`📄 Total documents created: ${totalDocumentsCreated}`);
    console.log(`🏢 Tenants processed: ${allTenants.length}`);
    console.log(`📦 Documents per tenant: ${REGULATORY_DOCUMENTS.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Document Breakdown by Category:');
    console.log('   • SaMD Core Documentation: 4 documents');
    console.log('   • Verification & Validation: 4 documents');
    console.log('   • Risk & Cybersecurity: 4 documents');
    console.log('   • ACNU-Specific Files: 4 documents');
    console.log('   • Regulatory Submissions: 4 documents');
    console.log('   • Compliance & QMS: 5 documents');
    console.log('   • Post-Market Surveillance: 4 documents\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Regulatory Vault:', error);
    process.exit(1);
  }
}

// Run the seed function
seedRegulatoryVault();
