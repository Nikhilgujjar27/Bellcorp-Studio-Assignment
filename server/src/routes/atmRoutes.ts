import { Router } from 'express';
import { AtmController } from '../controllers/atmController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/status', AtmController.getStatus);
router.post('/replenish', authenticateToken, AtmController.replenish);

export default router;
