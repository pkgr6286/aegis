/**
 * EHR Service
 * 
 * Handles the EHR "Fast Path" integration flow:
 * 1. Generate OAuth connect URL with state JWT
 * 2. Handle OAuth callback, exchange code for token, record consent
 * 3. Fetch and parse EHR data (FHIR) for a session
 */

import jwt from 'jsonwebtoken';
import { ehrConsentRepository } from '../db/repositories/ehrConsent.repository';
import { screeningSessionRepository } from '../db/repositories/screeningSession.repository';
import { auditLogService } from './auditLog.service';
import type { EhrStateJwtPayload } from '../validations/ehr.validation';

// Mock EHR aggregator configuration
const EHR_AGGREGATOR_URL = 'https://sandbox.healthgorilla.example.com/oauth/authorize';
const EHR_CALLBACK_URL = process.env.REPLIT_DOMAINS 
  ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/v1/public/ehr/callback`
  : 'http://localhost:5000/api/v1/public/ehr/callback';

// Use the same secret as session JWTs for consistency
const JWT_SECRET: string = (() => {
  const secret = process.env.SESSION_JWT_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET or SESSION_JWT_SECRET or SESSION_SECRET must be set for EHR OAuth state tokens');
  }
  return secret;
})();

export const ehrService = {
  /**
   * Generate EHR OAuth connect URL with state JWT
   * 
   * The state JWT contains sessionId and tenantId to prevent CSRF
   * and maintain context after OAuth callback.
   */
  async getEhrConnectUrl(sessionId: string): Promise<string> {
    // Verify session exists and get tenant context
    const session = await screeningSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const tenantId = session.tenantId;

    // Create state JWT with session context
    const statePayload: EhrStateJwtPayload = {
      sessionId,
      tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };

    const stateToken = jwt.sign(statePayload, JWT_SECRET);

    // Construct OAuth URL (mock aggregator)
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'aegis_platform_sandbox',
      redirect_uri: EHR_CALLBACK_URL,
      state: stateToken,
      scope: 'patient/*.read',
    });

    return `${EHR_AGGREGATOR_URL}?${params.toString()}`;
  },

  /**
   * Handle OAuth callback from EHR aggregator
   * 
   * Steps:
   * 1. Verify state JWT
   * 2. Mock token exchange (would be real server-to-server call in production)
   * 3. Create consent record
   * 4. Update session path to 'ehr_assisted'
   * 5. Audit log the consent grant
   */
  async handleEhrCallback(code: string, state: string) {
    // Verify state JWT
    let statePayload: EhrStateJwtPayload;
    try {
      statePayload = jwt.verify(state, JWT_SECRET) as EhrStateJwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired state token');
    }

    const { sessionId, tenantId } = statePayload;

    // Verify session still exists
    const session = await screeningSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Mock token exchange with aggregator
    // In production, this would be a server-to-server POST to:
    // https://sandbox.healthgorilla.example.com/oauth/token
    // with code, client_id, client_secret, redirect_uri
    const mockAccessToken = `mock_token_${sessionId}_${Date.now()}`;
    const mockProviderName = 'MyChart - Example Hospital';
    const mockScopes = ['patient/*.read', 'Observation.read', 'MedicationStatement.read'];

    // Check if consent already exists (idempotency)
    const existingConsent = await ehrConsentRepository.findBySessionId(sessionId);
    if (existingConsent) {
      // Audit duplicate attempt but don't create new consent
      await auditLogService.createAuditLog({
        tenantId,
        userId: null,
        action: 'ehr_consent.duplicate_attempt',
        entityType: 'ehr_consent',
        entityId: existingConsent.id,
        changes: {
          after: {
            sessionId,
            message: 'Duplicate OAuth callback ignored - consent already exists',
          },
        },
      });

      return {
        success: true,
        consentId: existingConsent.id,
        sessionId,
      };
    }

    // Record consent in database with access token
    // PRODUCTION NOTE: In a real implementation:
    // 1. The access token MUST be encrypted before storage (use AES-256 or similar)
    // 2. Store refresh_token alongside access_token for token renewal
    // 3. Implement token refresh logic before making FHIR API calls
    // 4. Set appropriate token expiry (typically 1 hour for access tokens)
    // Current mock stores unencrypted token for development/testing only
    const tokenExpiresAt = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour from now
    
    const consent = await ehrConsentRepository.create({
      tenantId,
      screeningSessionId: sessionId,
      status: 'granted',
      providerName: mockProviderName,
      scopesGranted: mockScopes,
      accessToken: mockAccessToken, // Stored for audit trail and future API calls
      tokenExpiresAt,
    });

    // Update session path to 'ehr_assisted'
    await screeningSessionRepository.updatePath(sessionId, 'ehr_assisted');

    // Audit log the consent grant
    await auditLogService.createAuditLog({
      tenantId,
      userId: null, // Consumer action, no user ID
      action: 'ehr_consent.granted',
      entityType: 'ehr_consent',
      entityId: consent.id,
      changes: {
        after: {
          sessionId,
          providerName: mockProviderName,
          scopesGranted: mockScopes,
        },
      },
    });

    return {
      success: true,
      consentId: consent.id,
      sessionId,
    };
  },

  /**
   * Fetch and parse EHR data for a session
   * 
   * Steps:
   * 1. Verify session exists and validate tenant isolation
   * 2. Verify consent exists and is active
   * 3. Mock FHIR API call to fetch health data (using consent/token)
   * 4. Parse FHIR data into structured format
   * 5. Return parsed data (NOT raw FHIR)
   */
  async getEhrData(sessionId: string) {
    // Verify session exists and get tenant context
    const session = await screeningSessionRepository.findByIdWithConsent(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // CRITICAL: Verify tenant isolation
    // Ensure the session belongs to the expected tenant context
    const tenantId = session.tenantId;

    // Verify active consent exists for THIS tenant
    if (!session.ehrConsent) {
      throw new Error('No EHR consent found for this session');
    }

    if (session.ehrConsent.status !== 'granted') {
      throw new Error('EHR consent is not active (status: ' + session.ehrConsent.status + ')');
    }

    // Verify consent belongs to the same tenant (additional safety check)
    if (session.ehrConsent.tenantId !== tenantId) {
      throw new Error('Tenant isolation violation: consent tenant mismatch');
    }

    // Mock FHIR API call
    // In production, this would:
    // 1. Retrieve the stored access token from ehr_consents or tokens table
    // 2. Check token expiry and refresh if needed
    // 3. Use the access token to call FHIR API:
    //    https://sandbox.healthgorilla.example.com/fhir/r4/Observation?patient=XXX&code=2093-3
    //    (2093-3 is LOINC code for LDL cholesterol)
    // 4. Handle API errors and token refresh
    // Current mock bypasses token storage and uses static FHIR data
    const mockFhirData = {
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            resourceType: 'Observation',
            code: {
              coding: [{ system: 'http://loinc.org', code: '2093-3', display: 'LDL Cholesterol' }],
            },
            valueQuantity: { value: 145, unit: 'mg/dL' },
            effectiveDateTime: '2024-10-15T10:30:00Z',
          },
        },
        {
          resource: {
            resourceType: 'MedicationStatement',
            medicationCodeableConcept: {
              coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '83367', display: 'Atorvastatin 20 MG' }],
            },
            status: 'active',
          },
        },
        {
          resource: {
            resourceType: 'MedicationStatement',
            medicationCodeableConcept: {
              coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '308136', display: 'Metformin 500 MG' }],
            },
            status: 'active',
          },
        },
      ],
    };

    // Parse FHIR data into structured format
    const parsedData = this._parseFhirBundle(mockFhirData);

    return parsedData;
  },

  /**
   * Internal helper: Parse FHIR bundle into structured data
   * Extracts relevant health information in a consumer-friendly format
   */
  _parseFhirBundle(fhirBundle: any) {
    const labResults: Array<{ test: string; value: number; unit: string; date: string }> = [];
    const medications: Array<{ name: string; status: string }> = [];

    if (fhirBundle.entry) {
      for (const entry of fhirBundle.entry) {
        const resource = entry.resource;

        if (resource.resourceType === 'Observation') {
          const testName = resource.code?.coding?.[0]?.display || 'Unknown Test';
          const value = resource.valueQuantity?.value;
          const unit = resource.valueQuantity?.unit;
          const date = resource.effectiveDateTime;

          if (value !== undefined) {
            labResults.push({
              test: testName,
              value,
              unit: unit || '',
              date: date || '',
            });
          }
        } else if (resource.resourceType === 'MedicationStatement') {
          const medName = resource.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown Medication';
          const status = resource.status || 'unknown';

          medications.push({
            name: medName,
            status,
          });
        }
      }
    }

    return {
      labResults,
      medications,
      retrievedAt: new Date().toISOString(),
    };
  },
};
