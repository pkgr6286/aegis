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

// Define all 35+ regulatory documents with their metadata
const REGULATORY_DOCUMENTS = [
  // SaMD Core Documentation (8 documents)
  {
    title: 'Mahalo Aegis – Software Requirements Specification (SRS)',
    category: 'samd_core',
    description: 'Detailed spec covering platform capabilities and behavior for SaMD classification.',
    tags: ['IEC 62304', 'FDA', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/srs-aegis-v3.pdf',
  },
  {
    title: 'Mahalo Aegis – Software Design Document (SDD)',
    category: 'samd_core',
    description: 'Architecture and design documentation including system architecture diagrams, component specifications, database schema, API design, and security architecture following IEC 62304 Class C requirements.',
    tags: ['IEC 62304', 'Architecture', 'Design', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/sdd-aegis-v3.pdf',
  },
  {
    title: 'Mahalo Aegis – Software Development Lifecycle (SDLC) Plan',
    category: 'samd_core',
    description: 'Comprehensive SDLC documentation covering development methodology, version control, code review, CI/CD, and change management.',
    tags: ['IEC 62304', 'Quality Management', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/sdlc-plan-v2.pdf',
  },
  {
    title: 'Mahalo Aegis – Design History File (DHF)',
    category: 'samd_core',
    description: 'Complete Design History File documenting all design and development activities from concept through validation.',
    tags: ['21 CFR 820.30', 'Design Controls', 'FDA'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/dhf-aegis.pdf',
  },
  {
    title: 'Mahalo Aegis – System Architecture & API Blueprint',
    category: 'samd_core',
    description: 'Detailed system architecture diagrams and RESTful API documentation for all endpoints including authentication, screening, EHR integration, and partner verification.',
    tags: ['Architecture', 'API', 'Technical Documentation', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/system-architecture-api.pdf',
  },
  {
    title: 'Mahalo Aegis – Traceability Matrix',
    category: 'samd_core',
    description: 'Requirements traceability matrix linking user needs to system requirements, design specifications, verification tests, and validation evidence.',
    tags: ['Traceability', 'IEC 62304', 'Quality Assurance'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/traceability-matrix.pdf',
  },
  {
    title: 'Mahalo Aegis – SaMD Classification & Justification Report',
    category: 'samd_core',
    description: 'Comprehensive classification analysis determining the SaMD risk category based on FDA guidance and intended use.',
    tags: ['SaMD', 'Classification', 'FDA', 'Risk Assessment'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/samd-classification.pdf',
  },
  {
    title: 'Mahalo Aegis – Intended Use Statement (ACNU Configuration)',
    category: 'samd_core',
    description: 'Formal intended use statement for ACNU-based digital screening companion, defining patient population, clinical application, and healthcare setting.',
    tags: ['Intended Use', 'ACNU', 'FDA', 'Labeling'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/intended-use-acnu.pdf',
  },

  // Verification & Validation (5 documents)
  {
    title: 'Mahalo Aegis – Verification & Validation Protocols',
    category: 'verification_validation',
    description: 'Master V&V plan outlining testing strategy, acceptance criteria, traceability matrices, and validation protocols for all software components.',
    tags: ['V&V', 'Testing', 'IEC 62304', 'FDA', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/vv-protocols.pdf',
  },
  {
    title: 'Mahalo Aegis – Validation Reports (ACNU Logic + UX)',
    category: 'verification_validation',
    description: 'Comprehensive validation reports covering ACNU screening logic accuracy and user experience testing with real-world patient data.',
    tags: ['Validation', 'ACNU', 'Clinical Accuracy', 'UX Testing'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/validation-reports-acnu.pdf',
  },
  {
    title: 'Mahalo Aegis – Human Factors Validation Report',
    category: 'verification_validation',
    description: 'Human factors engineering validation demonstrating usability, safety, and effectiveness of the patient-facing screening interface.',
    tags: ['Human Factors', 'Usability', 'IEC 62366', 'Patient Safety'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/human-factors-validation.pdf',
  },
  {
    title: 'Mahalo Aegis – Usability Engineering File (IEC 62366)',
    category: 'verification_validation',
    description: 'Complete usability engineering file per IEC 62366 including use-related risk analysis, formative studies, and summative validation testing.',
    tags: ['IEC 62366', 'Usability', 'Risk Analysis', 'FDA'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/usability-engineering-file.pdf',
  },
  {
    title: 'Mahalo Aegis – V&V to Requirements Trace Report',
    category: 'verification_validation',
    description: 'Complete traceability report linking all verification and validation activities back to software requirements and design specifications.',
    tags: ['Traceability', 'V&V', 'Requirements', 'Quality Assurance'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/vv-trace-report.pdf',
  },

  // Risk & Cybersecurity (4 documents)
  {
    title: 'Mahalo Aegis – Risk Management File (ISO 14971)',
    category: 'risk_cybersecurity',
    description: 'Complete risk management file per ISO 14971 including hazard analysis, risk matrices, mitigation strategies, and residual risk evaluation.',
    tags: ['ISO 14971', 'Risk Management', 'Patient Safety', 'FDA'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/risk-management-iso14971.pdf',
  },
  {
    title: 'Mahalo Aegis – Cybersecurity Threat Model',
    category: 'risk_cybersecurity',
    description: 'FDA-aligned cybersecurity threat model covering attack vectors, vulnerability analysis, penetration testing results, and security controls.',
    tags: ['Cybersecurity', 'Threat Modeling', 'HIPAA', 'FDA'],
    accessLevel: 'admin',
    fileUrl: 'https://docs.mahalo.health/cybersecurity-threat-model.pdf',
  },
  {
    title: 'Mahalo Aegis – Software Bill of Materials (SBOM)',
    category: 'risk_cybersecurity',
    description: 'Complete SBOM listing all software components, dependencies, versions, and known vulnerabilities per FDA guidance on medical device cybersecurity.',
    tags: ['SBOM', 'Cybersecurity', 'Dependencies', 'FDA'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/sbom-aegis.pdf',
  },
  {
    title: 'Mahalo Aegis – Secure Coding & Vulnerability SOP',
    category: 'risk_cybersecurity',
    description: 'Standard operating procedures for secure coding practices, vulnerability management, penetration testing, and security patch deployment.',
    tags: ['Secure Coding', 'SOP', 'Vulnerability Management', 'Security'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/secure-coding-sop.pdf',
  },

  // ACNU-Specific Files (5 documents)
  {
    title: 'Mahalo Aegis – Self-Selection Logic Flow',
    category: 'acnu_specific',
    description: 'Visual flowcharts and decision trees showing the complete self-selection screening logic for ACNU-based OTC transitions.',
    tags: ['ACNU', 'Self-Selection', 'Logic Flow', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/self-selection-logic.pdf',
  },
  {
    title: 'Mahalo Aegis – Comprehension Assessment Framework',
    category: 'acnu_specific',
    description: 'Framework for assessing consumer comprehension of Drug Facts Labels and screening questions, including validation methodology.',
    tags: ['Comprehension', 'ACNU', 'Consumer Testing', 'FDA'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/comprehension-framework.pdf',
  },
  {
    title: 'Mahalo Aegis – Label-to-Digital UX Mapping',
    category: 'acnu_specific',
    description: 'Detailed mapping document showing how Drug Facts Label content translates to digital screening interface, ensuring regulatory compliance.',
    tags: ['Label Mapping', 'UX', 'ACNU', 'Compliance'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/label-digital-mapping.pdf',
  },
  {
    title: 'Mahalo Aegis – ACNU Digital Companion Summary Sheet',
    category: 'acnu_specific',
    description: 'Executive summary of the digital companion functionality, intended use, and regulatory pathway for ACNU submissions.',
    tags: ['ACNU', 'Summary', 'Regulatory', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/acnu-companion-summary.pdf',
  },
  {
    title: 'Mahalo Aegis – ACNU-Specific Test Plans',
    category: 'acnu_specific',
    description: 'Comprehensive test plans specifically designed for ACNU validation including consumer comprehension, self-selection accuracy, and safety verification.',
    tags: ['Test Plans', 'ACNU', 'Validation', 'Quality Assurance'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/acnu-test-plans.pdf',
  },

  // Regulatory Submissions (4 documents)
  {
    title: 'Mahalo Aegis – FDA Submission-Ready Validation Package',
    category: 'regulatory_submissions',
    description: 'Complete validation package ready for FDA submission including all V&V reports, clinical evidence, and regulatory documentation.',
    tags: ['FDA Submission', 'Validation Package', 'Pre-market', 'Partner-shareable'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/fda-validation-package.pdf',
  },
  {
    title: 'Mahalo Aegis – Clinical Evaluation Report (CER)',
    category: 'regulatory_submissions',
    description: 'Comprehensive clinical evaluation report summarizing clinical data, literature review, and evidence supporting safety and effectiveness.',
    tags: ['Clinical Evaluation', 'CER', 'Clinical Evidence', 'FDA'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/clinical-evaluation-report.pdf',
  },
  {
    title: 'Mahalo Aegis – Regulatory Filing Cover Sheet (ACNU)',
    category: 'regulatory_submissions',
    description: 'FDA Form 356h and cover sheet for ACNU supplement submission with all required metadata and contact information.',
    tags: ['ACNU', 'Form 356h', 'FDA Filing', 'Submission'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/filing-cover-sheet-acnu.pdf',
  },
  {
    title: 'Mahalo Aegis – 21 CFR Part 11 Compliance Statement',
    category: 'regulatory_submissions',
    description: 'Formal compliance statement demonstrating adherence to 21 CFR Part 11 requirements for electronic records and signatures.',
    tags: ['21 CFR Part 11', 'Electronic Records', 'Compliance', 'FDA'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/21cfr-part11-compliance.pdf',
  },

  // Compliance & QMS (5 documents)
  {
    title: 'Mahalo Aegis – ISO 13485 Certification',
    category: 'compliance_qms',
    description: 'Official ISO 13485:2016 certification demonstrating compliance with medical device quality management system requirements.',
    tags: ['ISO 13485', 'Certification', 'QMS', 'Compliance'],
    accessLevel: 'external',
    fileUrl: 'https://docs.mahalo.health/iso13485-certification.pdf',
  },
  {
    title: 'Mahalo Aegis – QMS Overview & SOP Index',
    category: 'compliance_qms',
    description: 'Comprehensive QMS overview with master SOP index covering all quality management processes and procedures.',
    tags: ['QMS', 'SOPs', 'Quality System', 'Process Documentation'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/qms-overview-sop-index.pdf',
  },
  {
    title: 'Mahalo Aegis – Change Management Logbook',
    category: 'compliance_qms',
    description: 'Complete change management log documenting all software changes, impact assessments, approvals, and validation activities.',
    tags: ['Change Management', 'Version Control', 'Audit Trail', 'Compliance'],
    accessLevel: 'admin',
    fileUrl: 'https://docs.mahalo.health/change-management-log.pdf',
  },
  {
    title: 'Mahalo Aegis – Audit Trail Sample Logs',
    category: 'compliance_qms',
    description: 'Representative audit trail logs demonstrating system tracking of all user actions, data modifications, and security events.',
    tags: ['Audit Trail', '21 CFR Part 11', 'Compliance', 'Security'],
    accessLevel: 'admin',
    fileUrl: 'https://docs.mahalo.health/audit-trail-samples.pdf',
  },
  {
    title: 'Mahalo Aegis – IQ/OQ/PQ Summary Validation Sheet',
    category: 'compliance_qms',
    description: 'Installation Qualification, Operational Qualification, and Performance Qualification summary for all system deployments.',
    tags: ['IQ/OQ/PQ', 'Validation', 'Qualification', 'Deployment'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/iq-oq-pq-summary.pdf',
  },

  // Post-Market Surveillance (4 documents)
  {
    title: 'Mahalo Aegis – Post-Market Surveillance Plan',
    category: 'post_market_surveillance',
    description: 'Comprehensive post-market surveillance plan including complaint handling, adverse event reporting, and real-world evidence collection.',
    tags: ['Post-Market', 'Surveillance', 'Safety Monitoring', 'FDA'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/post-market-surveillance.pdf',
  },
  {
    title: 'Mahalo Aegis – RWD Signal Reporting Workflow',
    category: 'post_market_surveillance',
    description: 'Real-world data signal detection and reporting workflow for identifying and escalating potential safety issues from production usage.',
    tags: ['Real-World Data', 'Signal Detection', 'Safety', 'Pharmacovigilance'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/rwd-signal-reporting.pdf',
  },
  {
    title: 'Mahalo Aegis – Adverse Event Reporting SOP',
    category: 'post_market_surveillance',
    description: 'Standard operating procedure for reporting device-related adverse events to FDA per 21 CFR Part 803 (MDR) requirements.',
    tags: ['Adverse Events', 'MDR', '21 CFR 803', 'FDA Reporting'],
    accessLevel: 'internal',
    fileUrl: 'https://docs.mahalo.health/adverse-event-sop.pdf',
  },
  {
    title: 'Mahalo Aegis – Incident Response Protocol',
    category: 'post_market_surveillance',
    description: 'Incident response protocol for handling system failures, security breaches, and other critical events affecting patient safety.',
    tags: ['Incident Response', 'Security', 'Patient Safety', 'Emergency Response'],
    accessLevel: 'admin',
    fileUrl: 'https://docs.mahalo.health/incident-response-protocol.pdf',
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
    console.log('   • SaMD Core Documentation: 8 documents');
    console.log('   • Verification & Validation: 5 documents');
    console.log('   • Risk & Cybersecurity: 4 documents');
    console.log('   • ACNU-Specific Files: 5 documents');
    console.log('   • Regulatory Submissions: 4 documents');
    console.log('   • Compliance & QMS: 5 documents');
    console.log('   • Post-Market Surveillance: 4 documents');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   TOTAL: 35 documents per tenant\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Regulatory Vault:', error);
    process.exit(1);
  }
}

// Run the seed function
seedRegulatoryVault();
