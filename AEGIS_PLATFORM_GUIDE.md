# Aegis Platform - Complete Guide

## Table of Contents
1. [What is Aegis?](#what-is-aegis)
2. [The Problem It Solves](#the-problem-it-solves)
3. [Who Uses Aegis?](#who-uses-aegis)
4. [How It Works: The Complete Journey](#how-it-works-the-complete-journey)
5. [Database Structure](#database-structure)
6. [API Endpoints](#api-endpoints)
7. [Business Logic & Rules](#business-logic--rules)
8. [Security & Compliance](#security--compliance)
9. [User Interfaces](#user-interfaces)
10. [Technical Architecture](#technical-architecture)

---

## What is Aegis?

Aegis is a **multi-tenant Software-as-a-Service (SaaS) platform** designed specifically for pharmaceutical companies to manage patient assistance programs. Think of it as a central hub where drug manufacturers can:

- Create and manage programs that help patients access medications
- Screen patients to determine if they're eligible for over-the-counter (OTC) versions of prescription drugs
- Partner with pharmacies and retailers to verify patient eligibility
- Track everything that happens with complete audit trails
- Ensure all data is kept separate and secure for each pharmaceutical company

**Multi-tenant** means multiple pharmaceutical companies (called "tenants") use the same platform, but each company's data is completely isolated from others - like having separate apartments in the same building.

---

## The Problem It Solves

### The Healthcare Challenge

When a prescription drug becomes available over-the-counter (OTC), pharmaceutical companies often want to help patients transition safely. However, not everyone should use the OTC version - some patients need to continue with prescription medication under doctor supervision.

**Example Scenario:**
- A cholesterol medication (like Rosuvastatin) becomes available OTC at a lower dose
- The pharmaceutical company wants to help appropriate patients save money by using the OTC version
- BUT certain patients (pregnant women, people with liver disease, etc.) should NOT use the OTC version
- Pharmacies need a way to verify which patients are eligible

### What Aegis Does

Aegis creates a complete system where:

1. **Pharmaceutical companies** can build custom screening questionnaires
2. **Patients** can scan a QR code, answer questions, and instantly know if they're eligible
3. **Patients who qualify** receive a verification code
4. **Pharmacies/retailers** can validate the code at checkout to provide discounts or free products
5. **Everything is tracked** for regulatory compliance and program management

---

## Who Uses Aegis?

### 1. Super Administrators
**Who they are:** Aegis platform staff who manage the entire system

**What they do:**
- Create new pharmaceutical company accounts (tenants)
- Manage licenses and subscriptions
- Monitor platform-wide activity
- Provide technical support
- View system-wide statistics

### 2. Pharma Administrators
**Who they are:** Employees at pharmaceutical companies (like Kenvue, Pfizer, etc.)

**What they do:**
- Create and manage drug programs (e.g., "Rosuvastatin 5mg OTC Program")
- Build screening questionnaires using a visual builder tool
- Invite team members (admins, editors, viewers)
- Set up partnerships with pharmacies (CVS, Walgreens, etc.)
- Generate API keys for partners
- Monitor program performance
- View audit logs of all activities

**Roles within Pharma:**
- **Admin:** Full access to create, edit, and delete everything
- **Editor:** Can create and edit but not delete
- **Viewer:** Read-only access to view data

### 3. Consumers/Patients
**Who they are:** Regular people who want to use OTC medications

**What they do:**
- Scan QR codes on product packaging or marketing materials
- Answer screening questions about their health
- Receive instant results (eligible, not eligible, or ask a doctor)
- Get a verification code if eligible
- Optionally connect their electronic health records (EHR) to auto-fill answers
- Show the code at checkout for discounts

### 4. Partner Organizations (Pharmacies/Retailers)
**Who they are:** CVS, Walgreens, grocery stores, online retailers

**What they do:**
- Receive verification codes from patients
- Use API to validate codes in real-time
- Apply discounts or provide free products
- Mark codes as "used" to prevent fraud

---

## How It Works: The Complete Journey

### Journey 1: Setting Up a Drug Program (Pharma Admin)

**Step 1: Login**
- Pharma admin visits the admin portal
- Logs in with email and password
- System verifies their identity and checks which company they belong to

**Step 2: Create Brand Configuration (Optional)**
- Admin can set up branding for their programs
- Upload logo, choose colors (e.g., purple for Nexium, blue for Advil)
- This makes the consumer experience match the drug's brand

**Step 3: Create a Drug Program**
- Admin clicks "Create New Program"
- Enters program details:
  - **Name:** Internal name (e.g., "Rosuvastatin 5mg OTC")
  - **Brand Name:** Consumer-facing name (e.g., "Crestor-OTC")
  - **Slug:** URL-friendly identifier (e.g., "crestor-otc-5mg") - this becomes the QR code link
  - **Status:** Draft, Active, or Archived
- Associates the program with a brand configuration

**Step 4: Build the Screener**
- Admin uses the visual Screener Builder
- Adds questions:
  - **Multiple Choice:** "Are you currently pregnant?" → Yes/No
  - **Numeric:** "What is your age?" → Number input
  - **Text:** "What medications are you taking?" → Text area
- For each question, admin sets:
  - Question text
  - Question type
  - Whether it's required
  - Validation rules (min/max for numbers, etc.)

**Step 5: Define Logic Rules**
- Admin sets up the decision logic:
  - **OK to Use:** If age ≥ 18 AND not pregnant AND no liver disease
  - **Do Not Use:** If age < 18 OR pregnant OR has liver disease
  - **Ask a Doctor:** All other cases

**Step 6: Publish the Screener**
- Admin clicks "Publish Version 1"
- System creates an immutable snapshot of the screener
- The screener is now live and ready for consumers

**Step 7: Generate QR Code**
- System generates a QR code pointing to: `https://aegis.app/screen/crestor-otc-5mg`
- This QR code can be printed on packaging, marketing materials, etc.

**Step 8: Set Up Partners**
- Admin creates partner entries for pharmacies
- Generates API keys for each partner
- Partners can now use their API keys to verify codes

### Journey 2: Patient Screening (Consumer)

**Step 1: Scan QR Code**
- Patient sees a QR code on product packaging
- Scans it with their smartphone camera
- Opens link: `https://aegis.app/screen/crestor-otc-5mg`

**Step 2: Welcome Screen**
- Patient sees a branded welcome page with:
  - Program logo and name
  - Brief description
  - "Start Screening" button
- Patient clicks "Start Screening"

**Step 3: Data Entry Choice (Optional EHR Integration)**
- Screen asks: "How would you like to provide information?"
  - **Option 1:** Answer questions manually
  - **Option 2:** Connect electronic health records (auto-fill)
- If patient chooses EHR:
  - Opens OAuth connection to health data aggregator
  - Patient logs into their health provider
  - Authorizes data sharing
  - System fetches relevant medical data
  - Pre-fills screening questions

**Step 4: Answer Questions**
- Patient sees questions one by one or all together (depending on screener design)
- Examples:
  - "Are you currently pregnant?" → Selects "No"
  - "What is your age?" → Enters "45"
  - "Do you have liver disease?" → Selects "No"
  - "Are you taking blood thinners?" → Selects "No"
- System validates answers in real-time (e.g., age must be a number)

**Step 5: Submit Answers**
- Patient clicks "Submit"
- System sends answers to the backend
- Backend evaluates answers against logic rules
- Determines outcome instantly

**Step 6: View Outcome**
- Patient sees one of three results:
  
  **A. OK to Use (Eligible)**
  - Green success screen
  - "Great news! You may be eligible for this OTC medication"
  - "Generate Verification Code" button
  
  **B. Do Not Use (Not Eligible)**
  - Red warning screen
  - "Based on your answers, this OTC medication may not be right for you"
  - "Please consult your doctor before using this product"
  - No verification code offered
  
  **C. Ask a Doctor (Uncertain)**
  - Yellow caution screen
  - "We recommend speaking with your doctor"
  - "Your situation requires professional medical advice"
  - No verification code offered

**Step 7: Generate Verification Code (If Eligible)**
- Patient clicks "Generate Verification Code"
- System creates a unique code (e.g., "AEGIS-A1B2-C3D4-E5F6")
- Code is displayed prominently on screen
- Patient can:
  - Screenshot it
  - Email it to themselves
  - Text it to themselves
- Code expires after a set time (e.g., 48 hours)

**Step 8: Use Code at Pharmacy**
- Patient goes to CVS, Walgreens, or participating retailer
- Shows verification code at checkout
- Pharmacist enters code into their system
- System validates code and provides discount/free product

### Journey 3: Code Verification (Partner/Pharmacy)

**Step 1: Receive Code from Patient**
- Pharmacist asks patient for verification code
- Patient shows code on phone or reads it aloud

**Step 2: Enter Code in System**
- Pharmacist enters code into their POS (point of sale) system
- Their system calls Aegis API with:
  - API key (for authentication)
  - Verification code
  - Transaction details

**Step 3: Real-Time Validation**
- Aegis API checks:
  - Does the code exist?
  - Is it valid (not expired)?
  - Has it already been used?
  - Does it belong to this partner's tenant?
- Returns result in milliseconds

**Step 4: Process Transaction**
- **If valid:** 
  - System marks code as "used"
  - Returns patient eligibility details
  - Pharmacy applies discount
  - Patient receives product
  
- **If invalid:**
  - System returns error message
  - Pharmacy cannot apply discount
  - Patient may need to re-screen or pay full price

### Journey 4: Monitoring & Compliance (Pharma Admin)

**Step 1: View Dashboard**
- Admin logs in and sees dashboard with:
  - Total screening sessions (e.g., 1,247)
  - Eligibility rate (e.g., 68% eligible)
  - Codes generated (e.g., 845)
  - Codes redeemed (e.g., 612)
  - Active programs (e.g., 5)

**Step 2: Review Audit Logs**
- Admin navigates to Audit Logs page
- Sees comprehensive log of all activities:
  - "User john@pharma.com created drug program 'Rosuvastatin 5mg'"
  - "User jane@pharma.com published screener version 2"
  - "Partner CVS-API-001 verified code AEGIS-1234"
  - "User bob@pharma.com invited new user sally@pharma.com"
- Can filter by:
  - Date range
  - Action type (create, update, delete)
  - Entity type (user, program, partner)
  - Specific user

**Step 3: Manage Users**
- Admin can:
  - Invite new team members via email
  - Assign roles (admin, editor, viewer)
  - Remove users who leave the company
  - View all active users

**Step 4: Update Screeners**
- If screening criteria change, admin can:
  - Create a new version of the screener
  - Test it internally
  - Publish it when ready
  - Old version remains in database for historical tracking

**Step 5: Manage Partners**
- Admin can:
  - Add new pharmacy partners
  - Generate new API keys
  - Revoke compromised keys
  - View partner usage statistics

---

## Database Structure

The database is organized like a filing system with different sections for different types of data. Here's what each section stores:

### Public Schema (Platform-Wide Data)

These tables store information that applies across the entire platform, not just one pharmaceutical company.

#### 1. **tenants** - Pharmaceutical Company Accounts
Stores information about each pharmaceutical company using the platform.

**What it contains:**
- **id:** Unique identifier for the company (like a customer number)
- **name:** Company name (e.g., "Kenvue", "Pfizer")
- **status:** Account status (trial, active, suspended, cancelled)
- **metadata:** Extra information (subscription details, contact info)
- **retiredAt:** Date when company account was closed (if applicable)
- **createdAt:** When the account was created
- **updatedAt:** Last time account was modified

**Real-world example:**
```
id: "550e8400-e29b-41d4-a716-446655440000"
name: "Kenvue Pharmaceuticals"
status: "active"
createdAt: "2024-01-15T10:30:00Z"
```

#### 2. **users** - User Identities
Stores login credentials and basic information for every person who uses the system.

**What it contains:**
- **id:** Unique identifier for the user
- **email:** Login email address (must be unique)
- **hashedPassword:** Encrypted password (not stored in plain text for security)
- **firstName:** User's first name
- **lastName:** User's last name
- **lastLoginAt:** When they last logged in
- **createdAt:** When account was created

**Real-world example:**
```
id: "660e8400-e29b-41d4-a716-446655440001"
email: "john.smith@kenvue.com"
firstName: "John"
lastName: "Smith"
lastLoginAt: "2024-10-28T09:15:00Z"
```

#### 3. **user_system_roles** - Platform Administrator Roles
Links users to system-wide roles (like "super_admin" for Aegis staff).

**What it contains:**
- **userId:** Reference to the user
- **role:** System role (super_admin, support_staff)

**Real-world example:**
```
userId: "660e8400-e29b-41d4-a716-446655440001"
role: "super_admin"
```

#### 4. **password_reset_tokens** - Password Recovery
Stores temporary tokens for password reset emails.

**What it contains:**
- **id:** Unique token identifier
- **userId:** User requesting reset
- **token:** Secret code sent via email
- **status:** Token status (active, used, expired)
- **expiresAt:** When token becomes invalid
- **createdAt:** When token was generated

**Real-world example:**
```
token: "abc123def456"
userId: "660e8400-e29b-41d4-a716-446655440001"
expiresAt: "2024-10-28T11:00:00Z"
status: "active"
```

#### 5. **invitation_tokens** - User Invitation System
Stores invitation links sent to new team members.

**What it contains:**
- **id:** Unique invitation identifier
- **email:** Email of person being invited
- **token:** Secret code in invitation link
- **tenantId:** Which company they're being invited to
- **role:** What role they'll have (admin, editor, viewer)
- **invitedBy:** Who sent the invitation
- **status:** Invitation status (active, accepted, expired)
- **expiresAt:** When invitation expires
- **createdAt:** When invitation was sent

**Real-world example:**
```
email: "jane.doe@kenvue.com"
token: "inv-xyz789abc123"
tenantId: "550e8400-e29b-41d4-a716-446655440000"
role: "editor"
invitedBy: "660e8400-e29b-41d4-a716-446655440001"
expiresAt: "2024-11-04T10:30:00Z"
```

### Core Schema (Tenant-Specific Data)

These tables store data that belongs to a specific pharmaceutical company. Row-Level Security (RLS) ensures companies can only see their own data.

#### 6. **tenant_users** - Company Membership
Links users to companies and defines their role within that company.

**What it contains:**
- **id:** Unique membership identifier
- **tenantId:** Which company
- **userId:** Which user
- **role:** Their role in this company (admin, editor, viewer)
- **metadata:** Additional settings or preferences
- **createdBy:** Who added them
- **updatedBy:** Who last modified their membership
- **createdAt:** When they joined
- **updatedAt:** Last modification

**Real-world example:**
```
tenantId: "550e8400-e29b-41d4-a716-446655440000" (Kenvue)
userId: "660e8400-e29b-41d4-a716-446655440001" (John Smith)
role: "admin"
createdAt: "2024-01-15T10:30:00Z"
```

**Note:** A user can belong to multiple companies with different roles in each.

#### 7. **audit_logs** - Activity Tracking
Records every important action taken in the system for compliance and security.

**What it contains:**
- **id:** Unique log entry identifier
- **tenantId:** Which company's data was affected
- **userId:** Who performed the action
- **action:** What happened (e.g., "user.create", "screener.publish")
- **entityType:** What type of thing was affected (e.g., "User", "DrugProgram")
- **entityId:** Which specific item was affected
- **changes:** What changed (old value → new value)
- **timestamp:** Exactly when it happened

**Real-world example:**
```
tenantId: "550e8400-e29b-41d4-a716-446655440000"
userId: "660e8400-e29b-41d4-a716-446655440001"
action: "screener.publish"
entityType: "ScreenerVersion"
entityId: "770e8400-e29b-41d4-a716-446655440002"
changes: {
  "old": { "status": "draft" },
  "new": { "status": "published" }
}
timestamp: "2024-10-28T10:30:00Z"
```

### Programs Schema (Drug Program Data)

These tables store information about drug assistance programs and their screening questionnaires.

#### 8. **brand_configs** - Branding & Visual Identity
Stores logo, colors, and styling for drug brands.

**What it contains:**
- **id:** Unique brand configuration identifier
- **tenantId:** Which company owns this brand
- **name:** Brand name (e.g., "Nexium Purple Brand")
- **config:** JSON object with branding details:
  - logoUrl: Link to logo image
  - primaryColor: Brand color (e.g., "#663399")
  - secondaryColor: Accent color
  - fontFamily: Custom font (optional)

**Real-world example:**
```
tenantId: "550e8400-e29b-41d4-a716-446655440000"
name: "Nexium Purple Brand"
config: {
  "logoUrl": "https://cdn.example.com/nexium-logo.png",
  "primaryColor": "#663399",
  "secondaryColor": "#9966CC"
}
```

#### 9. **drug_programs** - Drug Assistance Programs
Core information about each drug program.

**What it contains:**
- **id:** Unique program identifier
- **tenantId:** Which company owns this program
- **brandConfigId:** Optional link to brand styling
- **name:** Internal program name
- **brandName:** Consumer-facing name
- **slug:** URL-friendly identifier (goes in QR code)
- **status:** Program status (draft, active, archived)
- **activeScreenerVersionId:** Which screener version is currently live
- **createdBy:** Who created the program
- **updatedBy:** Who last modified it
- **createdAt:** Creation date
- **updatedAt:** Last modification date

**Real-world example:**
```
id: "880e8400-e29b-41d4-a716-446655440003"
tenantId: "550e8400-e29b-41d4-a716-446655440000"
name: "Rosuvastatin 5mg OTC Program"
brandName: "Crestor-OTC"
slug: "crestor-otc-5mg"
status: "active"
activeScreenerVersionId: "990e8400-e29b-41d4-a716-446655440004"
```

**The slug "crestor-otc-5mg" becomes:** `https://aegis.app/screen/crestor-otc-5mg`

#### 10. **screener_versions** - Screening Questionnaires
Immutable snapshots of screening questionnaires.

**What it contains:**
- **id:** Unique version identifier
- **tenantId:** Which company owns this
- **drugProgramId:** Which program it belongs to
- **version:** Version number (1, 2, 3...)
- **screenerJson:** Complete questionnaire definition (JSON):
  - questions: Array of questions with types, validation rules
  - evaluationLogic: Decision rules (who's eligible)
  - branding: Visual customization
- **notes:** Admin notes about this version
- **createdBy:** Who created this version
- **createdAt:** When it was created

**Real-world example:**
```
id: "990e8400-e29b-41d4-a716-446655440004"
drugProgramId: "880e8400-e29b-41d4-a716-446655440003"
version: 1
screenerJson: {
  "title": "Crestor-OTC Eligibility Screener",
  "questions": [
    {
      "id": "age",
      "text": "What is your age?",
      "type": "numeric",
      "required": true,
      "validation": { "min": 0, "max": 120 }
    },
    {
      "id": "pregnant",
      "text": "Are you currently pregnant?",
      "type": "multiple_choice",
      "options": ["Yes", "No"],
      "required": true
    }
  ],
  "evaluationLogic": {
    "okToUse": [
      { "questionId": "age", "operator": "greater_than", "value": 17 },
      { "questionId": "pregnant", "operator": "equals", "value": "No" }
    ],
    "doNotUse": [
      { "questionId": "age", "operator": "less_than", "value": 18 }
    ]
  }
}
notes: "Initial launch version"
```

### Consumer Schema (Patient Screening Data)

These tables store information about patient screening sessions and verification codes.

#### 11. **screening_sessions** - Patient Screening Attempts
Records each time a patient completes a screening questionnaire.

**What it contains:**
- **id:** Unique session identifier
- **tenantId:** Which company's program
- **drugProgramId:** Which specific program
- **screenerVersionId:** Which version of screener was used
- **path:** How patient accessed screener (e.g., "qr_code", "web_link")
- **status:** Session status (started, completed)
- **answersJson:** Patient's answers to all questions (encrypted)
- **outcome:** Evaluation result (ok_to_use, do_not_use, ask_a_doctor)
- **metadata:** Additional tracking data
- **startedAt:** When session began
- **completedAt:** When patient submitted answers

**Real-world example:**
```
id: "aa0e8400-e29b-41d4-a716-446655440005"
drugProgramId: "880e8400-e29b-41d4-a716-446655440003"
screenerVersionId: "990e8400-e29b-41d4-a716-446655440004"
path: "qr_code"
status: "completed"
answersJson: {
  "age": 45,
  "pregnant": "No",
  "liver_disease": "No",
  "blood_thinners": "No"
}
outcome: "ok_to_use"
startedAt: "2024-10-28T14:30:00Z"
completedAt: "2024-10-28T14:32:15Z"
```

#### 12. **verification_codes** - Eligibility Codes
Unique codes given to eligible patients to redeem at pharmacies.

**What it contains:**
- **id:** Unique code identifier
- **tenantId:** Which company's program
- **screeningSessionId:** Which screening session generated this
- **code:** The actual verification code (e.g., "AEGIS-A1B2-C3D4")
- **type:** Code type (e.g., "discount", "free_sample")
- **status:** Code status (active, used, expired)
- **usedAt:** When code was redeemed
- **usedBy:** Which partner redeemed it
- **expiresAt:** When code becomes invalid
- **createdAt:** When code was generated

**Real-world example:**
```
id: "bb0e8400-e29b-41d4-a716-446655440006"
screeningSessionId: "aa0e8400-e29b-41d4-a716-446655440005"
code: "AEGIS-A1B2-C3D4-E5F6"
type: "discount"
status: "active"
expiresAt: "2024-10-30T14:32:15Z"
createdAt: "2024-10-28T14:32:15Z"
```

#### 13. **ehr_consents** - Electronic Health Record Permissions
Tracks when patients consent to share their EHR data.

**What it contains:**
- **id:** Unique consent identifier
- **tenantId:** Which company's program
- **screeningSessionId:** Which screening session
- **status:** Consent status (pending, authorized, denied)
- **aggregatorSessionId:** External EHR system's session ID
- **ehrData:** Downloaded health data (encrypted)
- **consentedAt:** When patient gave permission
- **revokedAt:** When patient withdrew permission (if applicable)

**Real-world example:**
```
screeningSessionId: "aa0e8400-e29b-41d4-a716-446655440005"
status: "authorized"
ehrData: {
  "medications": ["Lisinopril 10mg", "Metformin 500mg"],
  "conditions": ["Type 2 Diabetes", "Hypertension"],
  "allergies": ["Penicillin"]
}
consentedAt: "2024-10-28T14:31:00Z"
```

### Partners Schema (Pharmacy Integration Data)

These tables manage relationships with pharmacies and retailers who verify codes.

#### 14. **partners** - Pharmacy & Retailer Organizations
Stores information about pharmacy partners.

**What it contains:**
- **id:** Unique partner identifier
- **tenantId:** Which pharmaceutical company they partner with
- **name:** Partner name (e.g., "CVS Pharmacy")
- **type:** Partner type (pharmacy, retailer, telehealth)
- **status:** Partnership status (active, inactive)
- **contactEmail:** Primary contact
- **contactPhone:** Contact number
- **metadata:** Additional details
- **createdBy:** Who added this partner
- **createdAt:** When partnership was created

**Real-world example:**
```
id: "cc0e8400-e29b-41d4-a716-446655440007"
tenantId: "550e8400-e29b-41d4-a716-446655440000"
name: "CVS Pharmacy"
type: "pharmacy"
status: "active"
contactEmail: "api-support@cvs.com"
```

#### 15. **partner_api_keys** - Authentication Credentials
API keys that partners use to verify codes.

**What it contains:**
- **id:** Unique key identifier
- **tenantId:** Which pharmaceutical company
- **partnerId:** Which partner owns this key
- **name:** Key name/description (e.g., "Production Key - West Coast")
- **keyHash:** Encrypted API key
- **keyPrefix:** First few characters of key (for display)
- **status:** Key status (active, revoked)
- **expiresAt:** Optional expiration date
- **lastUsedAt:** Last time key was used
- **createdAt:** When key was generated

**Real-world example:**
```
partnerId: "cc0e8400-e29b-41d4-a716-446655440007"
name: "Production Key - East Coast"
keyPrefix: "ak_live_abc"
status: "active"
lastUsedAt: "2024-10-28T15:00:00Z"
```

**Note:** The actual API key (e.g., "ak_live_abc123def456xyz789") is only shown once when created.

#### 16. **partner_configs** - Partner-Specific Settings
Custom configuration for each partner.

**What it contains:**
- **id:** Unique config identifier
- **tenantId:** Which pharmaceutical company
- **partnerId:** Which partner
- **config:** JSON object with settings:
  - webhookUrl: Where to send notifications
  - allowedIpAddresses: Security whitelist
  - redirectUrl: Where to send patients after verification
  - customFields: Partner-specific data

**Real-world example:**
```
partnerId: "cc0e8400-e29b-41d4-a716-446655440007"
config: {
  "webhookUrl": "https://cvs.com/api/aegis-webhook",
  "allowedIpAddresses": ["192.168.1.100", "192.168.1.101"],
  "redirectUrl": "https://cvs.com/thankyou"
}
```

---

## API Endpoints

The platform provides four separate APIs, each designed for a specific user type.

### Authentication API
**Base URL:** `/api/v1/auth`

#### POST `/api/v1/auth/login`
**Purpose:** Log in to the system

**Who uses it:** All users (Super Admins, Pharma Admins)

**Request:**
```json
{
  "email": "john.smith@kenvue.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "john.smith@kenvue.com",
    "firstName": "John",
    "lastName": "Smith"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

**What happens:**
1. System looks up user by email
2. Compares hashed password
3. Generates JWT token for authenticated requests
4. Returns user info and token

#### POST `/api/v1/auth/register`
**Purpose:** Create a new user account (usually via invitation)

**Request:**
```json
{
  "email": "jane.doe@kenvue.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "invitationToken": "inv-xyz789abc123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "dd0e8400-e29b-41d4-a716-446655440008",
    "email": "jane.doe@kenvue.com"
  }
}
```

#### POST `/api/v1/auth/forgot-password`
**Purpose:** Request password reset email

#### POST `/api/v1/auth/reset-password`
**Purpose:** Complete password reset with token from email

---

### Super Admin API
**Base URL:** `/api/v1/superadmin`
**Authentication:** Requires JWT token with `super_admin` role

#### GET `/api/v1/superadmin/tenants`
**Purpose:** List all pharmaceutical companies

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Kenvue Pharmaceuticals",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440009",
      "name": "Pfizer Consumer Healthcare",
      "status": "trial",
      "createdAt": "2024-02-20T14:00:00Z"
    }
  ]
}
```

#### POST `/api/v1/superadmin/tenants`
**Purpose:** Create a new pharmaceutical company account

**Request:**
```json
{
  "name": "Johnson & Johnson Consumer",
  "adminEmail": "admin@jnj.com",
  "adminFirstName": "Robert",
  "adminLastName": "Johnson"
}
```

**What happens:**
1. Creates new tenant entry
2. Creates admin user account
3. Links user to tenant with admin role
4. Sends invitation email
5. Logs action in audit trail

#### GET `/api/v1/superadmin/stats`
**Purpose:** Get platform-wide statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTenants": 12,
    "activeTenants": 10,
    "trialTenants": 2,
    "totalUsers": 156,
    "totalPrograms": 47,
    "totalScreeningSessions": 125478,
    "totalCodesGenerated": 87234
  }
}
```

#### GET `/api/v1/superadmin/audit-logs`
**Purpose:** View all platform activity

---

### Pharma Admin API
**Base URL:** `/api/v1/admin`
**Authentication:** Requires JWT token + tenant membership

#### GET `/api/v1/admin/me`
**Purpose:** Get current user info and permissions

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "john.smith@kenvue.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "admin"
  },
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### GET `/api/v1/admin/dashboard/stats`
**Purpose:** Get dashboard statistics for this pharmaceutical company

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPrograms": 5,
    "activePrograms": 4,
    "totalScreeningSessions": 12547,
    "eligibilityRate": 0.68,
    "totalCodesGenerated": 8523,
    "totalCodesRedeemed": 6129,
    "redemptionRate": 0.72
  }
}
```

#### Brand Configuration Endpoints

**GET `/api/v1/admin/brand-configs`** - List all brand configurations
**POST `/api/v1/admin/brand-configs`** - Create new brand
**GET `/api/v1/admin/brand-configs/:id`** - Get single brand
**PUT `/api/v1/admin/brand-configs/:id`** - Update brand
**DELETE `/api/v1/admin/brand-configs/:id`** - Delete brand

**Example Create Request:**
```json
{
  "name": "Nexium Purple Brand",
  "config": {
    "logoUrl": "https://cdn.example.com/nexium-logo.png",
    "primaryColor": "#663399",
    "secondaryColor": "#9966CC"
  }
}
```

#### Drug Program Endpoints

**GET `/api/v1/admin/drug-programs`** - List all programs
**POST `/api/v1/admin/drug-programs`** - Create new program
**GET `/api/v1/admin/drug-programs/:id`** - Get single program
**PUT `/api/v1/admin/drug-programs/:id`** - Update program
**DELETE `/api/v1/admin/drug-programs/:id`** - Delete program

**Example Create Request:**
```json
{
  "name": "Rosuvastatin 5mg OTC Program",
  "brandName": "Crestor-OTC",
  "slug": "crestor-otc-5mg",
  "status": "draft",
  "brandConfigId": "ff0e8400-e29b-41d4-a716-446655440010"
}
```

#### Screener Version Endpoints

**GET `/api/v1/admin/drug-programs/:programId/screeners`** - List all versions
**POST `/api/v1/admin/drug-programs/:programId/screeners`** - Create new version
**POST `/api/v1/admin/drug-programs/:programId/screeners/:versionId/publish`** - Make version active

**Example Create Screener Request:**
```json
{
  "screenerJson": {
    "title": "Crestor-OTC Eligibility Screener",
    "questions": [
      {
        "id": "age",
        "text": "What is your age?",
        "type": "numeric",
        "required": true
      }
    ],
    "evaluationLogic": {
      "okToUse": [
        { "questionId": "age", "operator": "greater_than", "value": 17 }
      ]
    }
  },
  "notes": "Added age requirement"
}
```

#### User Management Endpoints

**GET `/api/v1/admin/users`** - List all users in company
**POST `/api/v1/admin/users/invite`** - Invite new user
**DELETE `/api/v1/admin/users/:userId`** - Remove user

**Example Invite Request:**
```json
{
  "email": "sally.jones@kenvue.com",
  "firstName": "Sally",
  "lastName": "Jones",
  "role": "editor"
}
```

#### Partner Management Endpoints

**GET `/api/v1/admin/partners`** - List all partners
**POST `/api/v1/admin/partners`** - Create new partner
**POST `/api/v1/admin/partners/:partnerId/keys`** - Generate API key
**DELETE `/api/v1/admin/partners/:partnerId/keys/:keyId`** - Revoke API key

**Example Create Partner Request:**
```json
{
  "name": "Walgreens",
  "type": "pharmacy",
  "contactEmail": "api@walgreens.com",
  "contactPhone": "1-800-WAL-GREN"
}
```

**Example Generate API Key Response:**
```json
{
  "success": true,
  "data": {
    "id": "gg0e8400-e29b-41d4-a716-446655440011",
    "key": "ak_live_abc123def456xyz789",
    "keyPrefix": "ak_live_abc",
    "name": "Production Key"
  },
  "message": "API key generated successfully. Save it now - it won't be shown again."
}
```

#### Audit Log Endpoints

**GET `/api/v1/admin/audit-logs`** - View company audit logs

**Query Parameters:**
- `entityType` - Filter by type (User, DrugProgram, etc.)
- `action` - Filter by action (create, update, delete)
- `startDate` - Start of date range
- `endDate` - End of date range
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

---

### Public Consumer API
**Base URL:** `/api/v1/public`
**Authentication:** Session-based (for screening flow)

#### GET `/api/v1/public/programs/:slug`
**Purpose:** Get program details by QR code slug

**Example:** `GET /api/v1/public/programs/crestor-otc-5mg`

**Response:**
```json
{
  "success": true,
  "data": {
    "program": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "Rosuvastatin 5mg OTC Program",
      "brandName": "Crestor-OTC",
      "slug": "crestor-otc-5mg",
      "status": "active"
    },
    "screenerVersion": {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "version": 1,
      "screenerJson": { /* full questionnaire */ }
    },
    "brandConfig": {
      "name": "Crestor Brand",
      "config": {
        "logoUrl": "https://cdn.example.com/crestor-logo.png",
        "primaryColor": "#0066CC"
      }
    }
  }
}
```

#### POST `/api/v1/public/sessions`
**Purpose:** Start a new screening session

**Request:**
```json
{
  "programSlug": "crestor-otc-5mg",
  "path": "qr_code"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "status": "started",
      "startedAt": "2024-10-28T14:30:00Z"
    },
    "sessionToken": "sess_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "screenerJson": { /* questions to display */ }
  }
}
```

#### PUT `/api/v1/public/sessions/:id`
**Purpose:** Submit answers and get outcome

**Authentication:** Requires session token

**Request:**
```json
{
  "answers": {
    "age": 45,
    "pregnant": "No",
    "liver_disease": "No",
    "blood_thinners": "No"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "status": "completed",
      "outcome": "ok_to_use",
      "completedAt": "2024-10-28T14:32:15Z"
    },
    "evaluation": {
      "outcome": "ok_to_use"
    }
  },
  "message": "Great! Based on your answers, you may be eligible for this OTC medication."
}
```

#### POST `/api/v1/public/sessions/:id/generate-code`
**Purpose:** Generate verification code for eligible patient

**Authentication:** Requires session token

**Request:**
```json
{
  "codeType": "discount",
  "expiresInHours": 48
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "code": "AEGIS-A1B2-C3D4-E5F6",
      "type": "discount",
      "expiresAt": "2024-10-30T14:32:15Z",
      "status": "active"
    }
  },
  "message": "Verification code generated successfully"
}
```

#### EHR Integration Endpoints

**GET `/api/v1/public/sessions/:id/ehr/connect`** - Get EHR OAuth URL
**GET `/api/v1/public/ehr/callback`** - Handle OAuth callback
**GET `/api/v1/public/sessions/:id/ehr-data`** - Fetch patient health data

---

### Partner Verification API
**Base URL:** `/api/v1/verify`
**Authentication:** Requires API key in header

#### POST `/api/v1/verify`
**Purpose:** Verify and redeem a patient code

**Authentication Header:**
```
Authorization: Bearer ak_live_abc123def456xyz789
```

**Request:**
```json
{
  "code": "AEGIS-A1B2-C3D4-E5F6",
  "transactionId": "POS-12345-67890",
  "metadata": {
    "storeId": "CVS-1234",
    "cashierId": "C5678"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "type": "discount",
      "usedAt": "2024-10-28T15:00:00Z"
    },
    "session": {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "outcome": "ok_to_use",
      "completedAt": "2024-10-28T14:32:15Z"
    }
  },
  "message": "Code verified and marked as used"
}
```

**Response (Already Used):**
```json
{
  "success": false,
  "valid": false,
  "error": "Code already used",
  "message": "This verification code has already been redeemed"
}
```

**Response (Expired):**
```json
{
  "success": false,
  "valid": false,
  "error": "Code expired",
  "message": "This verification code has expired"
}
```

#### GET `/api/v1/verify/:code`
**Purpose:** Check code validity WITHOUT marking as used

**Use case:** Pre-validation before final checkout

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": {
      "type": "discount",
      "expiresAt": "2024-10-30T14:32:15Z",
      "status": "active"
    }
  }
}
```

---

## Business Logic & Rules

### Screener Evaluation Engine

The heart of the platform is the **Screener Evaluation Engine** - the system that determines if a patient is eligible.

#### How It Works

**Step 1: Validation**
Before evaluating eligibility, the system validates all answers:
- **Required fields:** All required questions must be answered
- **Data types:** Numbers must be valid numbers, not text
- **Range validation:** Numeric answers must be within allowed ranges
- **Format validation:** Text answers must match expected patterns (e.g., email format)
- **Choice validation:** Multiple choice answers must be from available options

**Step 2: Logic Evaluation**
The system supports two evaluation approaches:

**Approach A: Simple Condition Matching (New Format)**
```json
{
  "evaluationLogic": {
    "okToUse": [
      { "questionId": "age", "operator": "greater_than", "value": 17 },
      { "questionId": "pregnant", "operator": "equals", "value": "No" },
      { "questionId": "liver_disease", "operator": "equals", "value": "No" }
    ],
    "doNotUse": [
      { "questionId": "age", "operator": "less_than", "value": 18 }
    ]
  }
}
```

**Logic:**
1. Check if ALL "okToUse" conditions are true → Return "ok_to_use"
2. Check if ALL "doNotUse" conditions are true → Return "do_not_use"
3. Otherwise → Return "ask_a_doctor"

**Supported operators:**
- `equals` - Exact match
- `not_equals` - Not equal to
- `greater_than` - Number is larger than value
- `less_than` - Number is smaller than value
- `greater_than_or_equal` - Number is ≥ value
- `less_than_or_equal` - Number is ≤ value

**Approach B: Complex Rule Expressions (Legacy Format)**
```json
{
  "logic": {
    "rules": [
      {
        "condition": "age < 18 || pregnant === 'Yes'",
        "outcome": "do_not_use",
        "message": "Not recommended for individuals under 18 or who are pregnant"
      },
      {
        "condition": "age >= 65 && blood_thinners === 'Yes'",
        "outcome": "ask_a_doctor",
        "message": "Please consult your doctor due to age and medication interactions"
      }
    ],
    "defaultOutcome": "ok_to_use"
  }
}
```

**Logic:**
1. Evaluate each rule in order
2. First matching rule determines outcome
3. If no rules match, use default outcome

#### Outcome Types

**ok_to_use (Eligible)**
- Patient meets all criteria for OTC medication
- Verification code can be generated
- Green success message displayed
- Patient can proceed to pharmacy

**do_not_use (Not Eligible)**
- Patient has contraindications
- Should NOT use OTC version
- Red warning message displayed
- No verification code offered
- Advised to consult doctor

**ask_a_doctor (Uncertain)**
- Patient's situation is complex
- Requires professional medical judgment
- Yellow caution message displayed
- No verification code offered
- Advised to speak with healthcare provider

### Code Generation Rules

Verification codes can only be generated when:
1. Session status is "completed"
2. Outcome is "ok_to_use"
3. All required questions were answered
4. All validation passed

**Code Properties:**
- **Format:** `AEGIS-XXXX-XXXX-XXXX` (uppercase alphanumeric)
- **Uniqueness:** Globally unique across all tenants
- **Expiration:** Set by pharma admin (typically 24-48 hours)
- **Single-use:** Can only be redeemed once
- **Tenant-scoped:** Only valid for the generating company's partners

### Security Rules

**Row-Level Security (RLS)**
PostgreSQL RLS ensures:
- Kenvue can ONLY see Kenvue's data
- Pfizer can ONLY see Pfizer's data
- Super admins can see all data
- Consumers can only see their own sessions

**Example RLS Policy:**
```sql
-- Drug programs can only be accessed by the owning tenant
CREATE POLICY tenant_isolation ON drug_programs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**API Key Security:**
- Keys are hashed before storage (never stored in plain text)
- Keys include prefix for identification (e.g., "ak_live_")
- Keys can be revoked instantly
- Key usage is logged for audit trail
- Rate limiting prevents brute force attacks

**Session Token Security:**
- Consumer sessions use JWT tokens
- Tokens expire after 1 hour
- Tokens are tied to specific session ID
- Cannot be used across different sessions

---

## Security & Compliance

### Data Isolation (Multi-Tenancy)

**How it works:**
Every database query automatically includes the tenant ID:

```typescript
// Setting tenant context
const tenantId = req.user.tenantId;
await db.execute(
  sql`SET LOCAL app.current_tenant_id = ${tenantId}`
);

// Now all queries are automatically filtered
const programs = await db.select().from(drugPrograms);
// Only returns programs for this tenant
```

**Benefits:**
- Impossible to accidentally access another company's data
- Database-level enforcement (not just application-level)
- Complies with data privacy regulations
- Each company's data is truly isolated

### HIPAA Compliance Considerations

The platform is designed to support HIPAA compliance:

**Patient Data Protection:**
- All patient answers are encrypted in database
- Personal health information (PHI) is never logged
- Screening sessions are anonymized (no patient names/IDs required)
- Data retention policies can be configured
- Audit logs track all access to patient data

**Access Controls:**
- Role-based access control (RBAC)
- Principle of least privilege
- Multi-factor authentication support (planned)
- Session timeouts
- Password complexity requirements

**Audit Trail:**
- Every action is logged
- Logs are immutable (cannot be deleted)
- Logs include: who, what, when, where
- Logs are retained per compliance requirements

### Data Encryption

**At Rest:**
- Database uses encryption at rest
- Password hashing with bcrypt (salted)
- API keys hashed before storage
- Sensitive fields (answers, EHR data) encrypted

**In Transit:**
- All API calls use HTTPS/TLS
- Session tokens encrypted
- No sensitive data in URLs

### Rate Limiting

**Consumer API:**
- 100 requests per minute per IP address
- Prevents abuse of screening system
- Protects against DDoS attacks

**Partner API:**
- 1000 requests per minute per API key
- Allows high-volume verification
- Prevents API key sharing

**Admin API:**
- 300 requests per minute per user
- Protects admin functions
- Prevents automated attacks

---

## User Interfaces

The platform includes three complete frontend applications:

### 1. Super Admin UI

**Purpose:** Platform management by Aegis staff

**Login Page:**
- Two-column layout
- Left: Forest-green gradient with Aegis branding
- Right: Clean login form with email/password
- "Contact Support" link

**Dashboard:**
- Platform-wide statistics
- Total tenants, users, programs
- Recent activity feed
- System health indicators

**Tenants Page:**
- List of all pharmaceutical companies
- Create new tenant wizard
- Tenant status badges (trial, active, suspended)
- Search and filter capabilities

**Tenant Detail Page:**
- Company information
- License details
- User count and list
- Program count
- Activity metrics
- Actions: Invite admin, Update license, Change status

**Users Page:**
- All platform users
- System roles (super_admin, support_staff)
- Invite new staff members
- Revoke system roles

**Audit Logs:**
- Platform-wide activity
- Filter by tenant, user, action, date
- Export capabilities
- Detailed change tracking

**Sidebar Navigation:**
- Dashboard
- Tenants
- Users
- Audit Logs
- Settings

**Design:**
- Forest-green (#1D463A) theme
- Collapsible sidebar
- Dark mode support
- Inter/Manrope fonts

### 2. Pharma Admin UI

**Purpose:** Drug program management by pharmaceutical companies

**Login Page:**
- Same design as Super Admin
- Company branding can be customized

**Dashboard:**
- Tenant-specific statistics
- Active programs count
- Screening sessions chart
- Eligibility rate percentage
- Code redemption rate
- Recent activity

**Brand Configurations Page:**
- List of all brand configs
- Create new brand wizard with:
  - Brand name input
  - Logo URL input
  - Color picker for primary color
  - Color picker for secondary color
- Edit/delete existing brands
- Preview of how brand looks

**Drug Programs Page:**
- Grid or list of all programs
- Status badges (draft, active, archived)
- Quick stats per program
- Create new program button
- Search and filter

**Drug Program Detail Page:**
Tabbed interface:

**Tab 1: Overview**
- Program name and details
- QR code display/download
- Public URL
- Status toggle
- Associated brand config
- Statistics (sessions, codes, redemptions)

**Tab 2: Screener Versions**
- List of all versions
- Currently active version highlighted
- Create new version button
- Version history with notes
- Publish/unpublish actions

**Tab 3: Settings**
- Edit program details
- Change slug (with warning)
- Archive program
- Delete program (with confirmation)

**Screener Builder Page:**
Visual drag-and-drop interface:
- **Left Panel:** Question types palette
  - Multiple Choice
  - Numeric Input
  - Text Input
  - Date Picker
- **Center Canvas:** Question layout
  - Drag questions to reorder
  - Click to edit properties
  - Preview mode toggle
- **Right Panel:** Question properties
  - Question text
  - Required toggle
  - Validation rules
  - Help text
- **Bottom Panel:** Logic builder
  - Define "ok_to_use" conditions
  - Define "do_not_use" conditions
  - Visual condition builder
  - Test logic button

**Users Page:**
- List of all team members
- Roles (admin, editor, viewer)
- Invite new user form
- Remove users
- Pending invitations list

**Partners Page:**
- List of pharmacy partners
- Create new partner form
- Partner detail cards showing:
  - Name, type, status
  - Contact information
  - Active API keys count
  - Recent verification count
- Actions: Generate API key, View details, Deactivate

**Partner Detail Page:**
- Partner information
- API keys list with:
  - Key prefix (e.g., "ak_live_abc...")
  - Key name/description
  - Created date
  - Last used date
  - Status
  - Actions: Copy, Revoke
- Generate new key button (shows full key once)
- Configuration settings
- Usage statistics and graphs

**Audit Logs Page:**
- Tenant-scoped activity log
- Filters:
  - Date range picker
  - Entity type dropdown
  - Action type dropdown
  - User selector
- Real-time updates
- Export to CSV
- Detailed change viewer (before/after comparison)

**Sidebar Navigation:**
- Dashboard
- Drug Programs
- Brand Configs
- Users
- Partners
- Audit Logs
- Settings
- Profile

**Design:**
- Zend Design System
- Forest-green (#1D463A) primary color
- Sidebar with collapsible icon mode
- Responsive layout (mobile-friendly)
- Data tables with pagination
- Form validation with helpful errors
- Toast notifications for actions
- Loading skeletons

### 3. Consumer/Patient UI

**Purpose:** Patient screening and code generation

**Welcome Screen** (`/screen/:slug`):
- Full-height branded page
- Program logo (if available)
- Program name and description
- "What to expect" information
- Large "Start Screening" button
- Clean, approachable design
- Mobile-optimized

**Data Entry Choice Screen** (Optional):
Two large cards:
- **Manual Entry Card:**
  - "Answer Questions Myself"
  - Icon: Clipboard
  - Description: "Takes about 2 minutes"
  - Button: "Start Questionnaire"
  
- **EHR Connect Card:**
  - "Connect Health Records"
  - Icon: Shield
  - Description: "Auto-fill from your medical records"
  - Button: "Connect Securely"

**Questionnaire Screen** (`/screen/:slug/questions`):
- Progress indicator (Question 1 of 5)
- One question at a time OR all on one page
- Question types:
  - **Multiple Choice:** Large radio buttons
  - **Numeric:** Number input with +/- controls
  - **Text:** Text area with character count
- Validation errors inline
- "Previous" and "Next" buttons
- "Submit" button on last question
- Auto-save (prevents data loss)
- Mobile-friendly inputs

**Outcome Screen** (`/screen/:slug/outcome`):

**Variant A: OK to Use (Eligible)**
- Large green checkmark icon
- "Great News!" headline
- "You may be eligible for this medication"
- Explanation text
- "Generate My Code" button (prominent)
- "What happens next" information

**Variant B: Do Not Use**
- Large red X icon
- "Important Safety Information" headline
- "This medication may not be right for you based on your answers"
- List of concerning factors
- "Please consult your doctor" message
- "Find a Doctor" button (optional)
- No code generation

**Variant C: Ask a Doctor**
- Large yellow caution icon
- "Please Consult Your Doctor" headline
- "Your situation requires professional medical advice"
- Educational information
- "Find a Doctor" button (optional)
- No code generation

**Verification Code Screen** (`/screen/:slug/code`):
- Large display of code (e.g., AEGIS-A1B2-C3D4-E5F6)
- "Copy Code" button
- "Email Code to Me" button
- "Text Code to Me" button
- Expiration timer (e.g., "Expires in 47 hours")
- "How to Use" instructions:
  1. Visit participating pharmacy
  2. Show this code at checkout
  3. Receive your discount or free product
- List of participating pharmacies
- Terms and conditions
- "Print This Page" button

**EHR Connection Flow** (Popup):
1. Opens OAuth popup window
2. Redirects to health data aggregator
3. Patient logs into health provider
4. Grants permission to share data
5. Popup closes automatically
6. Main window shows "Connected!" message
7. Questions are pre-filled
8. Patient reviews and confirms answers

**Design:**
- Brand colors from drug program
- Large, touch-friendly buttons
- Minimal navigation (focused flow)
- Progress indicators
- Loading states
- Error recovery
- Accessibility (screen reader support)
- Works on all devices (phone, tablet, desktop)

---

## Technical Architecture

### Backend Stack

**Language & Runtime:**
- TypeScript (type-safe JavaScript)
- Node.js (JavaScript runtime)

**Framework:**
- Express.js (web application framework)
- Handles HTTP requests/responses
- Middleware-based architecture

**Database:**
- PostgreSQL (relational database)
- Neon Serverless (managed PostgreSQL)
- Drizzle ORM (database toolkit)
- Row-Level Security (RLS) for multi-tenancy

**Authentication:**
- JWT (JSON Web Tokens)
- bcrypt (password hashing)
- Session-based auth for consumers

**Validation:**
- Zod (runtime type validation)
- Validates all API inputs
- Type-safe schemas

**Project Structure:**
```
server/
├── index.ts                 # Application entry point
├── db/
│   ├── schema/             # Database table definitions
│   │   ├── public.ts       # Platform-wide tables
│   │   ├── core.ts         # Tenant membership, audit logs
│   │   ├── programs.ts     # Drug programs, screeners
│   │   ├── consumer.ts     # Screening sessions, codes
│   │   └── partners.ts     # Partner management
│   └── index.ts            # Database connection
├── routes/
│   ├── index.ts            # Route mounting
│   ├── auth.routes.ts      # Authentication endpoints
│   ├── superAdmin.routes.ts
│   ├── pharmaAdmin.routes.ts
│   ├── drugProgram.routes.ts
│   ├── brandConfig.routes.ts
│   ├── public.routes.ts    # Consumer endpoints
│   ├── ehr.routes.ts       # EHR integration
│   └── verification.routes.ts
├── services/
│   ├── superAdmin.service.ts
│   ├── pharmaAdmin.service.ts
│   ├── drugProgram.service.ts
│   ├── screener.service.ts
│   ├── screenerEngine.service.ts  # Evaluation logic
│   ├── consumer.service.ts
│   ├── ehr.service.ts
│   └── verification.service.ts
├── middleware/
│   ├── auth.middleware.ts       # JWT verification
│   ├── sessionAuth.middleware.ts # Consumer sessions
│   ├── apiKeyAuth.middleware.ts # Partner API keys
│   ├── rbac.middleware.ts       # Role-based access
│   ├── tenant.middleware.ts     # Tenant context
│   ├── rateLimit.middleware.ts  # Rate limiting
│   └── validation.middleware.ts # Zod validation
├── repositories/
│   ├── tenant.repository.ts
│   ├── user.repository.ts
│   ├── drugProgram.repository.ts
│   └── ... (one per table)
└── validations/
    ├── auth.validation.ts
    ├── drugProgram.validation.ts
    └── ... (Zod schemas)
```

**Request Flow:**
```
1. HTTP Request arrives
   ↓
2. Rate Limiting Middleware
   ↓
3. Authentication Middleware (JWT/API Key/Session)
   ↓
4. Tenant Context Middleware (sets current tenant)
   ↓
5. Authorization Middleware (checks role)
   ↓
6. Validation Middleware (Zod)
   ↓
7. Route Handler
   ↓
8. Service Layer (business logic)
   ↓
9. Repository Layer (database access)
   ↓
10. PostgreSQL (with RLS)
   ↓
11. Response sent back
```

### Frontend Stack

**Language & Framework:**
- TypeScript
- React 18 (UI library)
- Vite (build tool, extremely fast)

**Routing:**
- Wouter (lightweight router)

**UI Components:**
- shadcn/ui (based on Radix UI)
- Tailwind CSS (utility-first CSS)
- Lucide React (icon library)

**Forms:**
- React Hook Form (form state management)
- Zod (validation)
- @hookform/resolvers (connects Zod to React Hook Form)

**Data Fetching:**
- TanStack Query (formerly React Query)
- Automatic caching
- Optimistic updates
- Loading/error states

**State Management:**
- TanStack Query for server state
- React Context for consumer screening flow
- Local state with useState

**Project Structure:**
```
client/src/
├── main.tsx              # Application entry
├── App.tsx               # Root component with routing
├── index.css             # Global styles, design tokens
├── pages/
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── superadmin/
│   │   ├── Dashboard.tsx
│   │   ├── Tenants.tsx
│   │   ├── TenantDetail.tsx
│   │   ├── Users.tsx
│   │   └── AuditLogs.tsx
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── DrugPrograms.tsx
│   │   ├── DrugProgramDetail.tsx
│   │   ├── ScreenerBuilder.tsx
│   │   ├── BrandConfigs.tsx
│   │   ├── Users.tsx
│   │   ├── Partners.tsx
│   │   ├── PartnerDetail.tsx
│   │   └── AuditLogs.tsx
│   └── consumer/
│       ├── Welcome.tsx
│       ├── DataEntryChoice.tsx
│       ├── Screener.tsx
│       ├── Outcome.tsx
│       └── VerificationCode.tsx
├── components/
│   ├── ui/               # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   ├── dialog.tsx
│   │   ├── sidebar.tsx
│   │   └── ... (30+ components)
│   ├── AppSidebar.tsx    # Super admin sidebar
│   ├── PharmaAdminSidebar.tsx
│   ├── ConsumerLayout.tsx
│   └── ... (custom components)
├── lib/
│   ├── queryClient.ts    # TanStack Query setup
│   ├── schemas.ts        # Zod validation schemas
│   └── utils.ts          # Utility functions
├── hooks/
│   ├── use-toast.ts
│   ├── use-session.ts    # Consumer session management
│   └── ... (custom hooks)
└── types/
    └── index.ts          # TypeScript type definitions
```

**Component Example:**
```typescript
// Drug Program Create Form
export function CreateProgramDialog() {
  const form = useForm<CreateProgramInput>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: {
      name: '',
      brandName: '',
      slug: '',
      status: 'draft',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProgramInput) => {
      return apiRequest('/api/v1/admin/drug-programs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/drug-programs'] });
      toast({ title: 'Program created successfully' });
    },
  });

  return (
    <Dialog>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(createMutation.mutate)}>
          <FormField name="name" label="Program Name" />
          <FormField name="brandName" label="Brand Name" />
          <FormField name="slug" label="URL Slug" />
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Program'}
          </Button>
        </form>
      </Form>
    </Dialog>
  );
}
```

### Design System (Zend)

**Color Palette:**
```css
/* Primary - Forest Green */
--primary: 158 43% 20%;              /* #1D463A */
--primary-foreground: 0 0% 100%;     /* White text on primary */

/* Sidebar - Darker Forest Green */
--sidebar: 158 43% 16%;              /* Darker than primary */
--sidebar-foreground: 0 0% 100%;     /* White text */
--sidebar-primary: 158 43% 12%;      /* Active state - even darker */

/* Background Colors */
--background: 0 0% 100%;             /* White in light mode */
--foreground: 222 47% 11%;           /* Dark text */

/* Card/Panel Colors */
--card: 0 0% 100%;
--card-foreground: 222 47% 11%;

/* Dark Mode */
.dark {
  --background: 222 47% 11%;         /* #1A1D21 */
  --foreground: 210 40% 98%;         /* Off-white text */
  --primary: 158 60% 35%;            /* Brighter green in dark mode */
}
```

**Typography:**
- **UI Text:** Inter (sans-serif)
- **Headings:** Manrope (sans-serif, slightly rounded)
- **Code/Data:** JetBrains Mono (monospace)

**Spacing Scale:**
- Small: 0.5rem (8px)
- Medium: 1rem (16px)
- Large: 1.5rem (24px)
- XLarge: 2rem (32px)

**Border Radius:**
- Cards: 0.75rem (12px)
- Buttons: 0.375rem (6px)
- Inputs: 0.375rem (6px)

**Shadows:**
- Subtle: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- Medium: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- Large: `0 20px 25px -5px rgb(0 0 0 / 0.1)`

**Design Philosophy:**
- **Information Density:** Show important data without feeling cramped
- **Visual Breathing Space:** Adequate whitespace between elements
- **Tonal Hierarchy:** Use color and contrast to guide attention
- **Subtle Interactions:** Gentle hover/active states
- **Accessibility First:** WCAG 2.1 AA compliance

### Database Architecture

**PostgreSQL Features Used:**

**Row-Level Security (RLS):**
```sql
-- Example: Tenant isolation for drug programs
CREATE POLICY tenant_isolation ON drug_programs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Application sets context before queries
SET LOCAL app.current_tenant_id = '550e8400-e29b-41d4-a716-446655440000';

-- Now all queries are automatically filtered
SELECT * FROM drug_programs;
-- Only returns programs for tenant 550e8400...
```

**UUID Primary Keys:**
- More secure than auto-incrementing integers
- Harder to guess/enumerate
- Can be generated client-side

**JSONB Columns:**
- Flexible storage for config/metadata
- Can be queried and indexed
- Examples: brand config, screener JSON, answers

**Enums:**
```sql
CREATE TYPE tenant_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
CREATE TYPE program_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE screening_outcome AS ENUM ('ok_to_use', 'do_not_use', 'ask_a_doctor');
```

**Indexes:**
```sql
-- Fast lookups
CREATE INDEX dp_slug_idx ON drug_programs(slug);
CREATE INDEX dp_tenant_status_idx ON drug_programs(tenant_id, status);

-- Unique constraints
CREATE UNIQUE INDEX user_email_idx ON users(email);
```

**Audit Trail Pattern:**
All tables include:
```typescript
{
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}
```

### Deployment Architecture

**Development:**
- Runs on Replit
- Port 5000 for both frontend and backend
- Vite dev server with hot module reload
- PostgreSQL via Neon Serverless

**Production (Planned):**
- Frontend: Static build deployed to CDN
- Backend: Node.js server (containerized)
- Database: Neon PostgreSQL (production tier)
- SSL/TLS: Automatic HTTPS
- Domain: Custom domain support

---

## Summary

**Aegis Platform in One Paragraph:**

Aegis is a complete multi-tenant SaaS platform that helps pharmaceutical companies manage patient assistance programs for over-the-counter medications. It provides three user interfaces: a Super Admin UI for platform management, a Pharma Admin UI for creating drug programs and managing screening questionnaires, and a Consumer UI for patients to determine medication eligibility via QR codes. The platform uses PostgreSQL with Row-Level Security for strict data isolation, JWT authentication for security, and a React/TypeScript frontend with Express backend. Key features include a visual screener builder, real-time eligibility evaluation, verification code generation, pharmacy partner API for code redemption, comprehensive audit logging, and optional EHR integration for auto-filling patient data—all designed to be HIPAA-ready and regulatory-compliant.

**Key Benefits:**

1. **For Pharmaceutical Companies:**
   - Easy program setup and management
   - Complete control over eligibility criteria
   - Full audit trail for compliance
   - Secure partner integration
   - Real-time analytics

2. **For Patients:**
   - Instant eligibility determination
   - Simple QR code access
   - Privacy-focused (minimal data required)
   - Free verification codes
   - Mobile-friendly experience

3. **For Pharmacies:**
   - Simple API integration
   - Real-time code verification
   - Fraud prevention (single-use codes)
   - Reduced checkout friction

4. **For Aegis (Platform Owner):**
   - Scalable multi-tenant architecture
   - Enterprise-ready security
   - Comprehensive monitoring
   - Predictable revenue model
   - Easy onboarding of new pharma companies

---

**Document Version:** 1.0
**Last Updated:** October 28, 2024
**Platform Version:** Beta
