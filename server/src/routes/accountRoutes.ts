import { Router } from 'express';
import { AccountController } from '../controllers/accountController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/balance', AccountController.getBalance);
router.get('/transactions', AccountController.getTransactions);

export default router;
