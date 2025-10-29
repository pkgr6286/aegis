/**
 * EHR Utilities
 * Helper functions for EHR OAuth flow and data fetching
 */

import type { GetEhrConnectResponse, GetEhrDataResponse } from '@/types/consumer';

/**
 * Open EHR OAuth popup and wait for authorization
 * Returns { success: boolean, data?: any } with extracted EHR data if successful
 */
export async function openEhrOAuthPopup(
  sessionId: string,
  sessionToken: string
): Promise<{ success: boolean; data?: any }> {
  try {
    // Build EHR login URL with session context
    const ehrProvider = 'MyHealthPortal'; // Could be configurable
    const redirectUri = window.location.origin;
    const loginUrl = `/ehr/login?session_id=${sessionId}&redirect_uri=${encodeURIComponent(redirectUri)}&provider=${ehrProvider}`;

    // Open OAuth popup window
    const popup = window.open(
      loginUrl,
      'ehr-oauth',
      'width=600,height=800,left=100,top=50'
    );

    if (!popup) {
      throw new Error('Popup blocked - please allow popups for this site');
    }

    // Wait for OAuth success message with data or popup close
    return new Promise<{ success: boolean; data?: any }>((resolve) => {
      let resolved = false;

      // Listen for success message from popup
      const messageHandler = (event: MessageEvent) => {
        // Ensure message is from the same origin
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'EHR_AUTH_SUCCESS') {
          if (!resolved) {
            resolved = true;
            window.removeEventListener('message', messageHandler);
            clearInterval(popupChecker);
            resolve({ success: true, data: event.data.data });
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed
      const popupChecker = setInterval(() => {
        if (popup.closed && !resolved) {
          resolved = true;
          window.removeEventListener('message', messageHandler);
          clearInterval(popupChecker);
          resolve({ success: false });
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', messageHandler);
          clearInterval(popupChecker);
          if (!popup.closed) {
            popup.close();
          }
          resolve({ success: false });
        }
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error('EHR OAuth popup error:', error);
    return { success: false };
  }
}

/**
 * Fetch parsed EHR data for a session
 * Returns the EHR data or null if not available
 */
export async function fetchEhrData(
  sessionId: string,
  sessionToken: string
): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(`/api/v1/public/sessions/${sessionId}/ehr-data`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No EHR consent found
        return null;
      }
      throw new Error('Failed to fetch EHR data');
    }

    const result: GetEhrDataResponse = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Fetch EHR data error:', error);
    return null;
  }
}

/**
 * Extract value from EHR data based on FHIR path
 * Supports simple dot notation: 'Observation.ldl', 'Condition.diabetes'
 */
export function extractEhrValue(
  ehrData: Record<string, any> | null,
  fhirPath: string
): any {
  if (!ehrData || !fhirPath) return null;

  // Simple implementation - parse FHIR path like "Observation.ldl"
  const parts = fhirPath.split('.');
  
  if (parts.length === 2) {
    const [resourceType, field] = parts;
    
    // Check if data has this field directly (e.g., { ldl: 110 })
    if (field in ehrData) {
      return ehrData[field];
    }
    
    // Check if data has nested structure (e.g., { Observation: { ldl: 110 } })
    if (resourceType in ehrData && typeof ehrData[resourceType] === 'object') {
      return ehrData[resourceType][field];
    }
  }
  
  // Fallback: direct field access
  if (parts[0] in ehrData) {
    return ehrData[parts[0]];
  }
  
  return null;
}
