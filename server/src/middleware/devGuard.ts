import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors';

/**
 * Middleware to restrict development/testing endpoints.
 * Permitted in 'development' and 'test' environments, or when DEV_TOOLS_ENABLED=true.
 * Returns 404 in production environments.
 */
export const devGuard = (_req: Request, _res: Response, next: NextFunction) => {
  const env = process.env.NODE_ENV || 'development';
  const isDevOrTest = env === 'development' || env === 'test' || process.env.DEV_TOOLS_ENABLED === 'true';

  if (!isDevOrTest) {
    return next(new NotFoundError('API endpoint not found'));
  }
  next();
};
