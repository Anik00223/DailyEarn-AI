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
  validateQuery(searchSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query.q as string;
      const suggestions = await searchLocations(q);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
      res.json(success(suggestions));
    } catch (error) {
      next(error);
    }
  }
);

export const locationsRouter = router;
