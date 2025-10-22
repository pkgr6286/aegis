import { Router } from 'express';
import { validateRequest } from '../middleware/validation.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validations/auth.validation';
import { accountService } from '../services/account.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * All account routes require authentication
 */
router.use(authenticateToken);

/**
 * GET /api/v1/account/me
 * Get current user profile
 */
router.get('/me', async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const profile = await accountService.getProfile(req.user.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/account/me
 * Update current user profile
 */
router.put('/me', validateRequest(updateProfileSchema), async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { firstName, lastName } = req.body;

    const updatedProfile = await accountService.updateProfile(req.user.id, {
      firstName,
      lastName,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/account/me/password
 * Change current user password
 */
router.put('/me/password', validateRequest(changePasswordSchema), async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { currentPassword, newPassword } = req.body;

    const result = await accountService.changePassword(req.user.id, {
      currentPassword,
      newPassword,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
