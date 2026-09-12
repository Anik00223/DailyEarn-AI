import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { decisionLimiter } from '../../middleware/rateLimiter';
import {
  evaluateDecisionSchema,
  simulatorRecalculateSchema,
  savePlanSchema,
  recordOutcomeSchema,
} from './decision.schema';
import * as decisionService from './decision.service';
import { VERIFIED_OPPORTUNITIES_SEED } from '../../db/seeds/verifiedOpportunities';
import { success } from '../../utils/apiResponse';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

const router = Router();

// Optional user extractor helper for guest + authenticated evaluation with algorithm enforcement
function getOptionalUserId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
      }) as { userId: string };
      return decoded.userId;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// POST /api/decision/evaluate
router.post(
  '/evaluate',
  decisionLimiter,
  validate(evaluateDecisionSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getOptionalUserId(req);
      const result = await decisionService.evaluateDecision(userId, req.body);
      res.json(success(result, 'Decision evaluated successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/decision/simulator
router.post(
  '/simulator',
  validate(simulatorRecalculateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recalculated = decisionService.recalculateSimulator(req.body);
      res.json(success(recalculated));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/decision/plans (Protected by authenticate middleware to prevent IDOR)
router.post(
  '/plans',
  authenticate,
  validate(savePlanSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const plan = await decisionService.saveExecutionPlan(userId, req.body);
      res.status(201).json(success(plan, 'Execution plan saved'));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/decision/outcomes (Protected by authenticate middleware to prevent IDOR)
router.post(
  '/outcomes',
  authenticate,
  validate(recordOutcomeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const outcome = await decisionService.recordUserOutcome(userId, req.body);
      res.status(201).json(success(outcome, 'Outcome recorded. Thank you for contributing to real-world calibration!'));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/decision/analytics (Edge & CDN cacheable)
router.get(
  '/analytics',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      const analyticsData = await decisionService.getDecisionAnalytics();
      res.json(success(analyticsData));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/decision/catalog (Immutable / Static catalog — Edge & CDN cacheable)
router.get(
  '/catalog',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      res.json(success(VERIFIED_OPPORTUNITIES_SEED));
    } catch (error) {
      next(error);
    }
  }
);

export const decisionRouter = router;
