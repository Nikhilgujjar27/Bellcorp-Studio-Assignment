import { Router } from 'express';
import { AuthController, loginSchema } from '../controllers/authController';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.post('/login', validateBody(loginSchema), AuthController.login);

export default router;
