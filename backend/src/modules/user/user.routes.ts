import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { sanitizeMiddleware } from '../../middleware/sanitize';
import { validate } from '../../middleware/validate';
import * as userService from './user.service';
import { updateProfileSchema } from './user.service';
import { success } from '../../utils/apiResponse';

const router = Router();

// PUT /user/profile
router.put(
  '/profile',
  authenticate,
  sanitizeMiddleware,
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const updated = await userService.updateProfile(userId, req.body);
      res.json(success(updated, 'Profile updated'));
    } catch (error) {
      next(error);
    }
  }
);

// GET /user/stats
router.get(
  '/stats',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const stats = await userService.getUserStats(userId);
      res.json(success(stats));
    } catch (error) {
      next(error);
    }
  }
);

export const userRouter = router;
