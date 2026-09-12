import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateQuery } from '../../middleware/validate';
import { locationLimiter } from '../../middleware/rateLimiter';
import { searchLocations } from './locations.service';
import { success } from '../../utils/apiResponse';

const router = Router();

const searchSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(100),
});

router.get(
  '/search',
  locationLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawQ = req.query.q;
      const q = typeof rawQ === 'string' ? rawQ.trim() : '';
      if (q.length < 2) {
        res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Query must be at least 2 characters',
          errors: [{ field: 'q', message: 'Query must be at least 2 characters' }],
        });
        return;
      }
      const suggestions = await searchLocations(q);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
      res.json(success(suggestions));
    } catch (error) {
      console.error('[Locations] Unexpected search route error:', error);
      res.json(success([]));
    }
  }
);

export const locationsRouter = router;
