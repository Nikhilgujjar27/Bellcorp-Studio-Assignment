import { Router } from 'express';
import { WithdrawalController, withdrawSchema } from '../controllers/withdrawalController';
import { authenticateToken } from '../middleware/authMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

// Apply auth, rate limiter, validation specifically to /withdraw
router.post(
  '/withdraw',
  authenticateToken,
  rateLimiter({ windowSeconds: 60, maxRequests: 10 }),
  validateBody(withdrawSchema),
  WithdrawalController.withdraw
);

export default router;
