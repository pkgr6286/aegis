/**
 * EHR Utilities
 * Helper functions for EHR OAuth flow and data fetching
 */

import type { GetEhrConnectResponse, GetEhrDataResponse } from '@/types/consumer';

/**
 * Open EHR OAuth popup and wait for authorization
 * Returns true if successful, false if user closed popup or error occurred
 */
export async function openEhrOAuthPopup(
  sessionId: string,
  sessionToken: string
): Promise<boolean> {
  try {
    // Get the EHR connect URL from backend
    const response = await fetch(`/api/v1/public/sessions/${sessionId}/ehr/connect`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get EHR connect URL');
    }

    const data: GetEhrConnectResponse = await response.json();
    const { connectUrl } = data;

    // Open OAuth popup window
    const popup = window.open(
      connectUrl,
      'ehr-oauth',
      'width=600,height=700,left=100,top=100'
    );

    if (!popup) {
      throw new Error('Popup blocked - please allow popups for this site');
    }

    // Wait for OAuth success message or popup close
    return new Promise<boolean>((resolve) => {
      let resolved = false;

      // Listen for success message from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.data === 'ehr-auth-success') {
          if (!resolved) {
            resolved = true;
            window.removeEventListener('message', messageHandler);
            clearInterval(popupChecker);
            resolve(true);
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
          resolve(false);
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
          resolve(false);
        }
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error('EHR OAuth popup error:', error);
    return false;
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
