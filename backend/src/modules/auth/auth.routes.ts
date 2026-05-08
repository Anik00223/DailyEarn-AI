import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimiter';
import { sanitizeMiddleware } from '../../middleware/sanitize';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  getMeController,
} from './auth.controller';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  sanitizeMiddleware,
  validate(registerSchema),
  registerController
);

router.post(
  '/login',
  loginLimiter,
  sanitizeMiddleware,
  validate(loginSchema),
  loginController
);

router.post('/logout', authenticate, logoutController);

router.post('/refresh', refreshController);

router.get('/me', authenticate, getMeController);

export const authRouter = router;
