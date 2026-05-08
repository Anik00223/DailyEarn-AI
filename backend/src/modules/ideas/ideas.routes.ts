import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { generateIdeasLimiter } from '../../middleware/rateLimiter';
import { sanitizeMiddleware } from '../../middleware/sanitize';
import { validate } from '../../middleware/validate';
import { generateIdeasSchema } from './ideas.schema';
import * as ideasService from './ideas.service';
import { success } from '../../utils/apiResponse';

const router = Router();

// POST /ideas/generate
router.post(
  '/generate',
  authenticate,
  generateIdeasLimiter,
  sanitizeMiddleware,
  validate(generateIdeasSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const generatedIdeas = await ideasService.generateIdeas(userId, req.body);
      res.json(success(generatedIdeas, 'Ideas generated successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// GET /ideas
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const result = await ideasService.getIdeas(userId, page, limit);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /ideas/:id/save
router.put(
  '/:id/save',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ideaId = req.params.id;
      const updatedIdea = await ideasService.saveIdea(ideaId, userId);
      res.json(success(updatedIdea));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /ideas/:id/dismiss
router.put(
  '/:id/dismiss',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ideaId = req.params.id;
      await ideasService.dismissIdea(ideaId, userId);
      res.json(success(null, 'Idea dismissed'));
    } catch (error) {
      next(error);
    }
  }
);

// GET /ideas/saved
router.get(
  '/saved',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const savedIdeas = await ideasService.getSavedIdeas(userId);
      res.json(success(savedIdeas));
    } catch (error) {
      next(error);
    }
  }
);

export const ideasRouter = router;
