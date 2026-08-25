import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes';
import withdrawalRoutes from './routes/withdrawalRoutes';
import atmRoutes from './routes/atmRoutes';
import devRoutes from './routes/devRoutes';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';
import { AccountController } from './controllers/accountController';
import { authenticateToken } from './middleware/authMiddleware';

export const createApp = (): Application => {
  const app = express();

  // Global Middleware
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health Check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api', withdrawalRoutes); // POST /api/withdraw
  app.get('/api/transactions', authenticateToken, AccountController.getTransactions);
  app.use('/api/atm', atmRoutes);
  app.use('/api/dev', devRoutes);

  // 404 Handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('API endpoint not found'));
  });

  // Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
