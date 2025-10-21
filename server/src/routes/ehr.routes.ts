/**
 * EHR Integration Routes
 * 
 * Public API endpoints for EHR "Fast Path" integration:
 * - GET /sessions/:id/ehr/connect: Generate OAuth connect URL
 * - GET /ehr/callback: Handle OAuth callback from aggregator
 * - GET /sessions/:id/ehr-data: Fetch parsed EHR data
 */

import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/sessionAuth.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { ehrService } from '../services/ehr.service';
import { ehrCallbackSchema } from '../validations/ehr.validation';

const router = Router();

/**
 * GET /sessions/:id/ehr/connect
 * 
 * Generate EHR OAuth connect URL for a session
 * Protected by session JWT
 */
router.get(
  '/sessions/:id/ehr/connect',
  authenticateSession,
  async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.id;
      
      // Verify session JWT matches the requested session
      if (req.sessionId !== sessionId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Session token does not match requested session',
        });
      }

      // Generate EHR connect URL (service will fetch tenant context from session)
      const connectUrl = await ehrService.getEhrConnectUrl(sessionId);

      res.json({
        success: true,
        connectUrl,
        message: 'Redirect user to this URL to connect their EHR',
      });
    } catch (error: any) {
      console.error('EHR connect error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to generate EHR connect URL',
      });
    }
  }
);

/**
 * GET /ehr/callback
 * 
 * Handle OAuth callback from EHR aggregator
 * Public endpoint (no auth required)
 * Validates code and state parameters
 */
router.get(
  '/ehr/callback',
  validateQuery(ehrCallbackSchema),
  async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query as { code: string; state: string };

      const result = await ehrService.handleEhrCallback(code, state);

      // Return HTML to close the popup/redirect window
      // This provides user feedback and closes the OAuth window
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>EHR Connection Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            .checkmark {
              width: 64px;
              height: 64px;
              margin: 0 auto 1rem;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .checkmark svg {
              width: 40px;
              height: 40px;
              stroke: white;
              stroke-width: 3;
            }
            h1 {
              margin: 0 0 0.5rem;
              color: #111827;
              font-size: 1.5rem;
            }
            p {
              margin: 0 0 1.5rem;
              color: #6b7280;
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              font-size: 1rem;
              cursor: pointer;
              transition: background 0.2s;
            }
            button:hover {
              background: #5568d3;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="checkmark">
              <svg fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1>EHR Connected Successfully!</h1>
            <p>Your health records have been securely connected. You can now close this window.</p>
            <button onclick="window.close()">Close Window</button>
          </div>
          <script>
            // Auto-close after 3 seconds if opened in popup
            if (window.opener) {
              setTimeout(() => window.close(), 3000);
            }
          </script>
        </body>
        </html>
      `);
    } catch (error: any) {
      console.error('EHR callback error:', error);
      
      // Return error HTML
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>EHR Connection Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            .error-icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 1rem;
              background: #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .error-icon svg {
              width: 40px;
              height: 40px;
              stroke: white;
              stroke-width: 3;
            }
            h1 {
              margin: 0 0 0.5rem;
              color: #111827;
              font-size: 1.5rem;
            }
            p {
              margin: 0 0 1.5rem;
              color: #6b7280;
            }
            button {
              background: #ef4444;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              font-size: 1rem;
              cursor: pointer;
              transition: background 0.2s;
            }
            button:hover {
              background: #dc2626;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="error-icon">
              <svg fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1>Connection Failed</h1>
            <p>${error.message || 'Failed to connect your health records. Please try again.'}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
        </html>
      `);
    }
  }
);

/**
 * GET /sessions/:id/ehr-data
 * 
 * Fetch parsed EHR data for a session
 * Protected by session JWT
 * Requires active EHR consent
 */
router.get(
  '/sessions/:id/ehr-data',
  authenticateSession,
  async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.id;
      
      // Verify session JWT matches the requested session
      if (req.sessionId !== sessionId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Session token does not match requested session',
        });
      }

      // Fetch parsed EHR data (service will fetch tenant context from session)
      const ehrData = await ehrService.getEhrData(sessionId);

      res.json({
        success: true,
        data: ehrData,
      });
    } catch (error: any) {
      console.error('EHR data fetch error:', error);
      
      // Check if it's a consent error
      if (error.message.includes('consent')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to fetch EHR data',
      });
    }
  }
);

export default router;
