CREATE TYPE "public"."system_role" AS ENUM('super_admin', 'support_staff');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'trial');--> statement-breakpoint
CREATE TYPE "public"."token_status" AS ENUM('active', 'used', 'expired');--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."code_status" AS ENUM('unused', 'used', 'expired');--> statement-breakpoint
CREATE TYPE "public"."code_type" AS ENUM('pos_barcode', 'ecommerce_jwt');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('granted', 'revoked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."session_outcome" AS ENUM('ok_to_use', 'ask_a_doctor', 'do_not_use');--> statement-breakpoint
CREATE TYPE "public"."session_path" AS ENUM('manual', 'ehr_assisted', 'ehr_mandatory');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('started', 'completed');--> statement-breakpoint
CREATE TYPE "public"."key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('ecommerce', 'retail_pos');--> statement-breakpoint
CREATE TABLE "invitation_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" "token_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" "token_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "tenant_status" DEFAULT 'trial' NOT NULL,
	"metadata" jsonb,
	"retired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_system_roles" (
	"user_id" uuid NOT NULL,
	"role" "system_role" NOT NULL,
	CONSTRAINT "user_system_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"hashed_password" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(255) NOT NULL,
	"entity_type" varchar(255),
	"entity_id" uuid,
	"changes" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "tenant_role" DEFAULT 'viewer' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "brand_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "drug_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"brand_config_id" uuid,
	"name" varchar(255) NOT NULL,
	"brand_name" varchar(255),
	"slug" varchar(255),
	"status" "program_status" DEFAULT 'draft' NOT NULL,
	"active_screener_version_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "drug_programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "screener_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drug_program_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"screener_json" jsonb DEFAULT '{}' NOT NULL,
	"notes" varchar(1024),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ehr_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"screening_session_id" uuid NOT NULL,
	"status" "consent_status" NOT NULL,
	"provider_name" varchar(255),
	"scopes_granted" text[],
	"access_token" text,
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drug_program_id" uuid NOT NULL,
	"screener_version_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'started' NOT NULL,
	"outcome" "session_outcome",
	"path" "session_path" DEFAULT 'manual' NOT NULL,
	"answers_json" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"screening_session_id" uuid NOT NULL,
	"code" varchar(32) NOT NULL,
	"type" "code_type" DEFAULT 'pos_barcode' NOT NULL,
	"status" "code_status" DEFAULT 'unused' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"hashed_key" varchar(255) NOT NULL,
	"status" "key_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "partner_api_keys_key_prefix_unique" UNIQUE("key_prefix")
);
--> statement-breakpoint
CREATE TABLE "partner_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"whitelisted_redirect_urls" text[],
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "partner_type" NOT NULL,
	"status" "partner_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_system_roles" ADD CONSTRAINT "user_system_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_configs" ADD CONSTRAINT "brand_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_configs" ADD CONSTRAINT "brand_configs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_configs" ADD CONSTRAINT "brand_configs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_programs" ADD CONSTRAINT "drug_programs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_programs" ADD CONSTRAINT "drug_programs_brand_config_id_brand_configs_id_fk" FOREIGN KEY ("brand_config_id") REFERENCES "public"."brand_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_programs" ADD CONSTRAINT "drug_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_programs" ADD CONSTRAINT "drug_programs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screener_versions" ADD CONSTRAINT "screener_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screener_versions" ADD CONSTRAINT "screener_versions_drug_program_id_drug_programs_id_fk" FOREIGN KEY ("drug_program_id") REFERENCES "public"."drug_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screener_versions" ADD CONSTRAINT "screener_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screener_versions" ADD CONSTRAINT "screener_versions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehr_consents" ADD CONSTRAINT "ehr_consents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ehr_consents" ADD CONSTRAINT "ehr_consents_screening_session_id_screening_sessions_id_fk" FOREIGN KEY ("screening_session_id") REFERENCES "public"."screening_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_drug_program_id_drug_programs_id_fk" FOREIGN KEY ("drug_program_id") REFERENCES "public"."drug_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_screener_version_id_screener_versions_id_fk" FOREIGN KEY ("screener_version_id") REFERENCES "public"."screener_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_screening_session_id_screening_sessions_id_fk" FOREIGN KEY ("screening_session_id") REFERENCES "public"."screening_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_api_keys" ADD CONSTRAINT "partner_api_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_api_keys" ADD CONSTRAINT "partner_api_keys_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_api_keys" ADD CONSTRAINT "partner_api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_api_keys" ADD CONSTRAINT "partner_api_keys_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_configs" ADD CONSTRAINT "partner_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_configs" ADD CONSTRAINT "partner_configs_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_configs" ADD CONSTRAINT "partner_configs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_configs" ADD CONSTRAINT "partner_configs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_token_idx" ON "invitation_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "tu_user_id_idx" ON "tenant_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tu_tenant_user_idx" ON "tenant_users" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "bc_tenant_name_idx" ON "brand_configs" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "dp_tenant_status_idx" ON "drug_programs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "dp_slug_idx" ON "drug_programs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sv_program_version_idx" ON "screener_versions" USING btree ("tenant_id","drug_program_id","version");--> statement-breakpoint
CREATE INDEX "ec_session_idx" ON "ehr_consents" USING btree ("tenant_id","screening_session_id");--> statement-breakpoint
CREATE INDEX "ss_program_outcome_idx" ON "screening_sessions" USING btree ("tenant_id","drug_program_id","outcome");--> statement-breakpoint
CREATE INDEX "ss_program_time_idx" ON "screening_sessions" USING btree ("tenant_id","drug_program_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vc_code_idx" ON "verification_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "vc_session_idx" ON "verification_codes" USING btree ("screening_session_id");--> statement-breakpoint
CREATE INDEX "vc_status_expires_idx" ON "verification_codes" USING btree ("tenant_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "pak_partner_idx" ON "partner_api_keys" USING btree ("tenant_id","partner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pc_partner_idx" ON "partner_configs" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "p_tenant_name_idx" ON "partners" USING btree ("tenant_id","name");