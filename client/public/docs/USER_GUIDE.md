# Aegis Platform - User Guide

**Version 1.0** | Last Updated: October 2025

Welcome to Aegis, your complete multi-tenant SaaS platform for managing pharmaceutical patient assistance programs. This guide will walk you through every feature of the platform step-by-step.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Super Admin Guide](#super-admin-guide)
3. [Pharma Admin Guide](#pharma-admin-guide)
4. [Consumer Screening Guide](#consumer-screening-guide)
5. [Clinician Review Guide](#clinician-review-guide)
6. [Auditor Guide](#auditor-guide)
7. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Logging In

1. Navigate to your Aegis platform URL
2. Enter your email address and password
3. Click **Sign In**

**Demo Accounts:**
- Super Admin: `admin@aegis.com` / `password123`
- Pharma Admin (Haleon): `sarah.mitchell@haleon.com` / `password123`
- Pharma Admin (Kenvue): `benjamin.serbiak@kenvue.com` / `password123`

### Understanding User Roles

Aegis supports five distinct user roles:

| Role | Access Level | Typical User |
|------|-------------|--------------|
| **Super Admin** | Platform-wide management | Aegis staff |
| **Pharma Admin** | Full tenant management | Company administrators |
| **Pharma Editor** | Create and edit content | Program managers |
| **Pharma Viewer** | Read-only access | Analysts, stakeholders |
| **Clinician** | Review screening sessions | Medical reviewers |
| **Auditor** | Read-only compliance access | Compliance officers |

---

## Super Admin Guide

Super Admins manage the entire Aegis platform and all tenant organizations.

### Accessing the Dashboard

After logging in as a Super Admin, you'll see the **Platform Dashboard** with key metrics:

**Analytics Cards:**
- Total Tenants (pharmaceutical companies)
- Active Users across all tenants
- API Calls (last 24 hours)
- Total Screenings conducted
- Drug Programs created
- New Tenants (this month)

**Graphs & Visualizations:**
- Screening Activity (7-day trend)
- API Traffic (hourly breakdown)
- New Tenants Growth (monthly)
- Screening Outcomes (pie chart showing qualified/disqualified)
- Additional performance metrics

### Managing Tenants

**To Create a New Tenant:**

1. Click **Tenant Management** in the sidebar
2. Click the **Add Tenant** button (+ icon)
3. Fill in the form:
   - **Company Name**: Full legal name (e.g., "Haleon Consumer Healthcare")
   - **Subdomain**: Unique identifier (e.g., "haleon")
   - **Contact Email**: Primary admin email
   - **Contact Name**: Primary contact person
4. Click **Create Tenant**

**To Edit a Tenant:**

1. Find the tenant in the list
2. Click the **Edit** icon (pencil)
3. Update any fields
4. Click **Update Tenant**

**To Delete a Tenant:**

1. Click the **Delete** icon (trash)
2. Confirm the action
3. ⚠️ **Warning**: This permanently deletes all tenant data, including users, programs, and screening sessions

---

## Pharma Admin Guide

Pharma Admins manage their pharmaceutical company's patient assistance programs.

### Dashboard Overview

Your dashboard shows:
- Active Drug Programs
- Total Screening Sessions
- Qualified Patients
- Active Users on your team
- Recent screening activity
- Program performance metrics

### Managing Your Brand

**To Configure Your Brand Identity:**

1. Go to **Settings** → **Brand Management**
2. Click **Create Brand** or **Edit** existing brand
3. Configure:
   - **Brand Name**: Your product or company brand
   - **Primary Color**: Main brand color (use color picker)
   - **Secondary Color**: Accent color
   - **Logo URL**: Link to your brand logo image
4. Click **Save**

Your brand colors will be applied to consumer-facing screening pages.

### Managing Users

**To Invite a New Team Member:**

1. Click **Access Management** → **User Management**
2. Click **Invite User** button
3. Fill in:
   - **Email Address**: User's work email
   - **First Name** and **Last Name**
   - **Role**: Select admin, editor, viewer, clinician, or auditor
4. Click **Send Invitation**

The user will receive an email with login credentials.

**Understanding Roles:**
- **Admin**: Full control (create/edit/delete)
- **Editor**: Create and modify programs and screeners
- **Viewer**: Read-only access to all data
- **Clinician**: Review and approve screening sessions
- **Auditor**: Compliance-focused read-only access

### Managing Partners

Partners are external systems that integrate with your programs (e.g., pharmacy systems, e-commerce platforms).

**To Create a Partner Integration:**

1. Go to **Access Management** → **Partner Management**
2. Click **Add Partner**
3. Fill in:
   - **Partner Name**: Integration name (e.g., "CVS Pharmacy POS")
   - **Description**: What this partner does
4. Click **Create Partner**
5. **Copy the API Key** displayed and provide it to your partner

**To Revoke Partner Access:**

1. Find the partner in the list
2. Click **Revoke Key**
3. The partner will immediately lose access

### Creating Drug Programs

**Step-by-Step: Create Your First Program**

1. Click **Product & Compliance** → **Drug Programs**
2. Click **Add Program** button
3. Fill in the form:
   - **Program Name**: Your drug name (e.g., "Advair Diskus 100/50 OTC Pilot")
   - **Brand**: Select from your configured brands
   - **Status**: Choose Draft, Active, or Paused
   - **Public Slug**: URL-friendly identifier (auto-generated from name)
4. Click **Create Program**

**Program Status Meanings:**
- 🟡 **Draft**: Not yet live, visible only to your team
- 🟢 **Active**: Live and accepting patient screenings
- 🔴 **Paused**: Temporarily disabled, no new screenings

### Building Screening Questionnaires

The Screener Builder is a visual flow-based editor for creating patient eligibility questionnaires.

**To Create a Screener Version:**

1. Go to your **Drug Program** detail page
2. Click the **Screener Versions** tab
3. Click **Create New Version**
4. You'll enter the **Visual Screener Builder**

**Understanding Question Types:**

Aegis supports four standardized question types:

| Type | Use Case | Example |
|------|----------|---------|
| **Boolean** | Yes/No questions | "Are you 18 years or older?" |
| **Choice** | Multiple options | "What is your insurance status?" |
| **Numeric** | Number inputs | "What is your LDL cholesterol level?" |
| **Diagnostic Test** | Lab/medical tests | "Pregnancy test result and date" |

**Adding Questions:**

1. Click **Add Node** in the canvas
2. Select question type
3. Fill in:
   - **Question Text**: Clear, patient-friendly language
   - **Question ID**: Unique identifier (e.g., "age_verification")
   - **Help Text** (optional): Additional context
   - **Options** (for choice questions): List all choices
   - **Validation** (for numeric): Min/max values

**Configuring Question Logic:**

Each question can have conditional paths:
- **Qualifying Path**: Patient meets this criterion
- **Disqualifying Path**: Patient doesn't meet criterion
- **Next Question**: Continue to next question

**EHR Integration Configuration:**

For questions that can be auto-filled from patient health records:

1. In question settings, enable **EHR Mapping**
2. Configure:
   - **FHIR Path**: e.g., "Observation.ldl" for cholesterol
   - **Display Name**: User-friendly name "LDL Cholesterol"
   - **Rule**: "optional" (offers choice) or "mandatory" (requires EHR)
3. Patients will see "Connect My Patient Portal" option

**Using Preview Mode:**

1. Click **Preview** button in top-right
2. Experience the screener as a patient would
3. Test all question paths and logic
4. Exit preview to return to builder

**Publishing a Screener:**

1. Save your screener version
2. Return to **Drug Program** → **Screener Versions** tab
3. Click **Publish** on your desired version
4. This version becomes active for patient screenings

### Generating FDA Documentation

The **Regulatory Submission Center** automates FDA documentation for OTC-switch submissions.

**To Generate a Compliance Package:**

1. Click **Product & Compliance** → **Regulatory**
2. **Step 1**: Select your **Drug Program** from dropdown
3. **Step 2**: Select the **Screener Version** you want to document
4. Click **Generate Package**

You'll see a loading animation, then four reports will appear:

**1. Software Design Specification (JSON)**
- Complete screener logic and configuration
- 21 CFR Part 11 compliant format
- Includes all questions, paths, and validation rules

**2. Change Control & Version History (CSV)**
- Complete audit trail of all screener versions
- Timestamps and author information
- Modification history for regulatory review

**3. Actual Use Study Data (CSV)**
- Anonymized real-world screening sessions
- Question-answer pairs for safety validation
- HIPAA-compliant data export

**4. ACNU Failure Log (CSV)**
- Safety failure events
- Disqualification reasons and patterns
- Adverse event reporting data

**To Download Reports:**

1. Click **Download** button on any report
2. Files download immediately
3. Review all documents before submission to FDA

💡 **Pro Tip**: This automated process saves pharma companies 3-6 months of manual documentation work per product launch!

### Viewing Audit Logs

All actions on the platform are logged for compliance.

**To View Audit Logs:**

1. Go to **Product & Compliance** → **Audit Logs**
2. Use filters:
   - **Entity Type**: Users, Programs, Screeners, etc.
   - **Action**: Created, Updated, Deleted
   - **Date Range**: Custom date picker
3. View complete history of who did what and when

---

## Consumer Screening Guide

Patients access screening through a unique URL for each drug program.

### Taking a Screening

**Step 1: Landing Page**

1. Patient visits the screening URL
2. Sees program name and brand
3. Clicks **Start Screening**

**Step 2: Answering Questions**

Questions appear one at a time:

- **Boolean Questions**: Toggle Yes/No buttons
- **Choice Questions**: Select one option
- **Numeric Questions**: Enter number in input field
- **Diagnostic Test Questions**: Enter test name, date, result, and optionally upload document

**Step 3: EHR Fast Path (Optional)**

If a question supports EHR integration, patient sees **"The Fork Screen"**:

- **Option 1: Connect My Patient Portal**
  - Patient clicks this option
  - Redirected to mock EHR login
  - Logs in to patient portal
  - Reviews HIPAA consent screen
  - Approves data sharing
  - System extracts health data with AI animation
  - Returns to screener with auto-filled answers
  
- **Option 2: Enter Manually**
  - Patient answers questions themselves
  - Standard flow continues

**Smart Completion**: If EHR data answers all remaining required questions, patient skips directly to outcome screen!

**Step 4: Outcome**

Patient sees one of three outcomes:

- ✅ **Qualified**: Eligible for the program with next steps
- ❌ **Disqualified**: Not eligible with explanation
- ⏳ **Under Review**: Requires clinical review

---

## Clinician Review Guide

Clinicians review screening sessions that require medical judgment.

### Accessing the Review Queue

1. Log in with your clinician account
2. You'll land on the **Review Queue** page
3. See all pending screening sessions

### Filtering Sessions

Use filters to find sessions:
- **Drug Program**: Filter by specific program
- **Outcome**: All, Qualified, Disqualified, Under Review
- **Review Status**: Pending or Reviewed

### Reviewing a Session

**To Review a Session:**

1. Click **Review** button on any session
2. You'll see the **Session Review** page with:
   - **Patient Information** (anonymized)
   - **Complete Q&A History**: All questions and answers
   - **Preliminary Outcome**: System-determined result
   - **Session Metadata**: Date, time, program details

**Making Your Decision:**

1. Review all patient answers carefully
2. Scroll to **Clinical Review** section
3. Enter **Clinical Notes**: Your professional assessment
4. Select **Review Decision**:
   - **Reviewed - Approved**: Confirm qualification
   - **Follow-up Required**: Additional information needed
5. Click **Submit Review**

Your review is saved and logged in the audit trail.

---

## Auditor Guide

Auditors have read-only access to all admin features for compliance monitoring.

### What You Can Access

As an auditor, you can view:
- ✅ Dashboard metrics
- ✅ All drug programs
- ✅ User lists
- ✅ Partner configurations  
- ✅ Brand settings
- ✅ Complete audit logs
- ✅ Screener configurations
- ✅ Screening sessions

### What You Cannot Do

- ❌ Create or edit programs
- ❌ Modify users or permissions
- ❌ Delete any data
- ❌ Generate new API keys
- ❌ Publish screener versions

All write operations are blocked at the system level for auditor accounts.

### Sidebar Indicator

Your sidebar displays **(View Only)** to remind you of read-only status.

---

## Tips & Best Practices

### For Pharma Admins

**Screener Design Best Practices:**

1. **Keep it Simple**: Average screening should take 2-5 minutes
2. **Order Matters**: Ask disqualifying questions early to save patient time
3. **Clear Language**: Use 8th-grade reading level, avoid medical jargon
4. **Test Thoroughly**: Use Preview mode extensively before publishing
5. **Use EHR Mapping**: Reduce patient burden by auto-filling from health records

**Version Control:**

- Always create a new version for changes, don't edit published screeners
- Add clear notes describing what changed in each version
- Keep historical versions for regulatory compliance

**Brand Consistency:**

- Use your official brand colors from style guide
- High-resolution logo (at least 200x200px)
- Test appearance in both light and dark modes

### For Clinicians

**Review Efficiency:**

1. Use filters to focus on specific programs
2. Review sessions in batches
3. Document clearly - your notes may be reviewed by FDA
4. Flag sessions requiring follow-up promptly

**Clinical Notes Guidelines:**

- Be specific about concerns or approvals
- Reference specific answers that informed your decision
- Use professional medical terminology
- Document any safety concerns immediately

### For Super Admins

**Tenant Management:**

- Verify company information before creating tenants
- Use consistent naming conventions for subdomains
- Maintain contact information current
- Monitor API usage for unusual patterns

**Security:**

- Rotate default passwords immediately after setup
- Audit user permissions quarterly
- Monitor audit logs for suspicious activity
- Review partner API key usage regularly

---

## Need Help?

**Technical Support:**
- Email: support@aegis.com
- Documentation Portal: [Link in sidebar]
- Response Time: 24-48 hours

**Training Resources:**
- Video tutorials (coming soon)
- Webinars for new users
- One-on-one onboarding sessions

**Reporting Issues:**
- Use the bug report form in your dashboard
- Include screenshots when possible
- Describe steps to reproduce the issue

---

## Glossary

**ACNU**: Actual Conditions of Normal Use - FDA requirement for OTC switch studies

**Drug Program**: A pharmaceutical patient assistance initiative managed in Aegis

**EHR**: Electronic Health Record - digital patient medical information

**FHIR**: Fast Healthcare Interoperability Resources - healthcare data standard

**Screener**: Questionnaire to determine patient eligibility

**Tenant**: Individual pharmaceutical company organization in Aegis

**Version**: Specific iteration of a screening questionnaire

---

**© 2025 Aegis Platform. All rights reserved.**

*This guide is updated regularly. Check the documentation portal for the latest version.*
