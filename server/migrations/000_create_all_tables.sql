-- ============================================================================
-- AEGIS PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This script creates all tables, enums, and indexes for the Aegis Platform
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE ALL ENUMS
-- ============================================================================

-- Public Schema Enums
CREATE TYPE system_role AS ENUM ('super_admin', 'support_staff');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'trial');

-- Core Schema Enums
CREATE TYPE tenant_role AS ENUM ('admin', 'editor', 'viewer');

-- Programs Schema Enums
CREATE TYPE program_status AS ENUM ('draft', 'active', 'archived');

-- Consumer Schema Enums
CREATE TYPE session_status AS ENUM ('started', 'completed');
CREATE TYPE session_outcome AS ENUM ('ok_to_use', 'ask_a_doctor', 'do_not_use');
CREATE TYPE session_path AS ENUM ('manual', 'ehr_assisted', 'ehr_mandatory');
CREATE TYPE consent_status AS ENUM ('granted', 'revoked', 'failed');
CREATE TYPE code_status AS ENUM ('unused', 'used', 'expired');
CREATE TYPE code_type AS ENUM ('pos_barcode', 'ecommerce_jwt');

-- Partners Schema Enums  
CREATE TYPE partner_type AS ENUM ('ecommerce', 'retail_pos');
CREATE TYPE partner_status AS ENUM ('active', 'inactive');
CREATE TYPE key_status AS ENUM ('active', 'revoked');

-- ============================================================================
-- SECTION 2: CREATE PUBLIC SCHEMA TABLES (No RLS)
-- ============================================================================

-- Tenants table (master directory of all platform tenants)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status tenant_status NOT NULL DEFAULT 'trial',
  license_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX tenants_slug_idx ON tenants(slug);
CREATE INDEX tenants_status_idx ON tenants(status);

-- Users table (master directory of all user accounts)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users(email);

-- User system roles table (links users to system-level roles)
CREATE TABLE user_system_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role system_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE INDEX usr_user_id_idx ON user_system_roles(user_id);

-- ============================================================================
-- SECTION 3: CREATE CORE SCHEMA TABLES (RLS Required)
-- ============================================================================

-- Tenant users table (many-to-many: users to tenants with roles)
CREATE TABLE tenant_users (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMP,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX tu_tenant_id_idx ON tenant_users(tenant_id);
CREATE INDEX tu_user_id_idx ON tenant_users(user_id);
CREATE INDEX tu_tenant_role_idx ON tenant_users(tenant_id, role);

-- Audit logs table (compliance tracking for all sensitive operations)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX al_tenant_id_idx ON audit_logs(tenant_id);
CREATE INDEX al_created_at_idx ON audit_logs(created_at);
CREATE INDEX al_resource_idx ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- SECTION 4: CREATE PROGRAMS SCHEMA TABLES (RLS Required)
-- ============================================================================

-- Brand configs table (tenant-specific branding assets)
CREATE TABLE brand_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX bc_tenant_name_idx ON brand_configs(tenant_id, name);

-- Drug programs table (core business entity - drug programs)
CREATE TABLE drug_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_config_id UUID REFERENCES brand_configs(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  status program_status NOT NULL DEFAULT 'draft',
  active_screener_version_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX dp_tenant_idx ON drug_programs(tenant_id);
CREATE INDEX dp_status_idx ON drug_programs(tenant_id, status);

-- Screener versions table (versioned screener configurations)
CREATE TABLE screener_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_program_id UUID NOT NULL REFERENCES drug_programs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  screener_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(drug_program_id, version_number)
);

CREATE INDEX sv_program_version_idx ON screener_versions(drug_program_id, version_number);

-- ============================================================================
-- SECTION 5: CREATE CONSUMER SCHEMA TABLES (RLS Required)
-- ============================================================================

-- Screening sessions table (patient screening data - PHI)
CREATE TABLE screening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_program_id UUID NOT NULL REFERENCES drug_programs(id) ON DELETE CASCADE,
  screener_version_id UUID NOT NULL REFERENCES screener_versions(id) ON DELETE RESTRICT,
  status session_status NOT NULL DEFAULT 'started',
  outcome session_outcome,
  path session_path NOT NULL DEFAULT 'manual',
  answers_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX ss_program_outcome_idx ON screening_sessions(tenant_id, drug_program_id, outcome);
CREATE INDEX ss_program_time_idx ON screening_sessions(tenant_id, drug_program_id, created_at);

-- Verification codes table (single-use codes for POS/ecommerce)
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES screening_sessions(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE,
  type code_type NOT NULL,
  status code_status NOT NULL DEFAULT 'unused',
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX vc_code_idx ON verification_codes(code);
CREATE INDEX vc_session_idx ON verification_codes(session_id);
CREATE INDEX vc_status_expires_idx ON verification_codes(status, expires_at);

-- EHR consents table (EHR consent records - PHI)
CREATE TABLE ehr_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES screening_sessions(id) ON DELETE CASCADE,
  consent_status consent_status NOT NULL,
  consent_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ehr_patient_id TEXT,
  revoked_at TIMESTAMP
);

CREATE INDEX ec_session_idx ON ehr_consents(session_id);

-- ============================================================================
-- SECTION 6: CREATE PARTNERS SCHEMA TABLES (RLS Required)
-- ============================================================================

-- Partners table (partner entities like CVS, Walgreens, Amazon)
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type partner_type NOT NULL,
  status partner_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX p_tenant_name_idx ON partners(tenant_id, name);

-- Partner API keys table (secure API credentials for partners)
CREATE TABLE partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  key_prefix VARCHAR(12) NOT NULL UNIQUE,
  hashed_key VARCHAR(255) NOT NULL,
  status key_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX pak_key_prefix_idx ON partner_api_keys(key_prefix);
CREATE INDEX pak_partner_idx ON partner_api_keys(partner_id);

-- Partner configs table (partner-specific integration configurations)
CREATE TABLE partner_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(partner_id)
);

CREATE UNIQUE INDEX pc_partner_idx ON partner_configs(partner_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
