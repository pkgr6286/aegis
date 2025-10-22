/**
 * Session API Client for Consumer Screening Flow
 * Handles session-token based authentication (not JWT user auth)
 * Session tokens are short-lived and tied to a specific screening session
 */

const API_BASE_URL = '/api/v1';

class SessionClient {
  private sessionToken: string | null = null;

  /**
   * Set the session token for authenticated requests
   */
  setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (token) {
      sessionStorage.setItem('screening_session_token', token);
    } else {
      sessionStorage.removeItem('screening_session_token');
    }
  }

  /**
   * Get the current session token
   */
  getSessionToken(): string | null {
    if (!this.sessionToken) {
      // Try to restore from sessionStorage
      this.sessionToken = sessionStorage.getItem('screening_session_token');
    }
    return this.sessionToken;
  }

  /**
   * Clear the session token
   */
  clearSession() {
    this.sessionToken = null;
    sessionStorage.removeItem('screening_session_token');
  }

  /**
   * Build headers for API requests
   */
  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': contentType,
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 401 Unauthorized - session expired
    if (response.status === 401) {
      this.clearSession();
      throw new Error('Session expired - please start over');
    }

    // Handle 403 Forbidden - session mismatch
    if (response.status === 403) {
      this.clearSession();
      throw new Error('Invalid session - please start over');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

// Export a singleton instance
export const sessionClient = new SessionClient();
