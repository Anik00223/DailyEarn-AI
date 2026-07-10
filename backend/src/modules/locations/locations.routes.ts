import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { searchLocations } from './locations.service';
import { success } from '../../utils/apiResponse';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting specifically for locations autocomplete: 60 requests per minute per IP
const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many search requests. Please slow down.',
  },
});

const searchSchema = z.object({
  query: z.object({
    q: z.string().min(2, 'Query must be at least 2 characters').max(100),
  }),
});

router.get(
  '/search',
  locationLimiter,
  validate(searchSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query.q as string;
      const suggestions = await searchLocations(q);
      res.json(success(suggestions));
    } catch (error) {
      next(error);
    }
  }
);

export const locationsRouter = router;
