import { Router } from 'express';
import { DevController } from '../controllers/devController';
import { devGuard } from '../middleware/devGuard';

const router = Router();

// Apply devGuard: strictly returns 404 in production
router.use(devGuard);

router.post('/reset-seed', DevController.resetSeed);
router.post('/concurrency-test', DevController.runConcurrencyTest);
router.get('/audit-logs', DevController.getAuditLogs);

export default router;
