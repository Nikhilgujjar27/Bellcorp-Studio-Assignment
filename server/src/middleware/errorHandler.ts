import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Unhandled Error: ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.errorCode, err.statusCode, err.details);
  }

  // Handle unexpected errors (500)
  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : err.message || 'Internal Server Error',
    'INTERNAL_ERROR',
    500
  );
};
