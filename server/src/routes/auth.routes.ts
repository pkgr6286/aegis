import { Router } from 'express';
import { validateRequest } from '../middleware/validation.middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, acceptInviteSchema } from '../validations/auth.validation';
import { authService } from '../services/auth.service';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const user = await authService.register({
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login a user
 */
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout a user (invalidate token)
 */
router.post('/logout', async (req, res) => {
  // TODO: Implement logout endpoint
  res.status(501).json({ message: 'Logout endpoint not implemented' });
});

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', validateRequest(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const result = await authService.forgotPassword(email);

    res.json({
      success: true,
      message: result.message,
      // In development: Include token for testing
      ...(process.env.NODE_ENV !== 'production' && { token: result.token }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', validateRequest(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    const result = await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/accept-invite
 * Accept invitation and create/link account
 */
router.post('/accept-invite', validateRequest(acceptInviteSchema), async (req, res, next) => {
  try {
    const { token, firstName, lastName, password } = req.body;
    
    const result = await authService.acceptInvite({
      token,
      firstName,
      lastName,
      password,
    });

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
