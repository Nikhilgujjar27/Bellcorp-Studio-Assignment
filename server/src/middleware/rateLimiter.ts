import { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisReady } from '../db/redis';
import { config } from '../config';
import { RateLimitError } from '../utils/errors';
import { logger } from '../utils/logger';

// In-memory fallback map when Redis is unavailable
const memoryRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (options?: { windowSeconds?: number; maxRequests?: number }) => {
  const windowSeconds = options?.windowSeconds || config.rateLimitWindowSeconds;
  const maxRequests = options?.maxRequests || config.rateLimitMaxRequests;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Identifier based on authenticated account ID or client IP
    const identifier = req.user?.accountId ? `acc:${req.user.accountId}` : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const key = `ratelimit:withdraw:${identifier}`;

    // 1. Try Redis Rate Limiting
    if (isRedisReady()) {
      try {
        const client = getRedisClient();
        if (client) {
          const current = await client.incr(key);
          if (current === 1) {
            await client.expire(key, windowSeconds);
          }

          const ttl = await client.ttl(key);
          res.setHeader('X-RateLimit-Limit', maxRequests);
          res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
          res.setHeader('X-RateLimit-Reset', Date.now() + ttl * 1000);

          if (current > maxRequests) {
            logger.warn(`Rate limit exceeded for ${identifier} via Redis. Count: ${current}`);
            return next(new RateLimitError(`Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds.`));
          }

          return next();
        }
      } catch (error: any) {
        logger.warn('Redis rate limiter failed, falling back to in-memory limiter:', error.message);
      }
    }

    // 2. In-memory Rate Limiting Fallback (if Redis is down)
    const now = Date.now();
    const entry = memoryRateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      memoryRateLimitMap.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    entry.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));

    if (entry.count > maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier} via memory fallback. Count: ${entry.count}`);
      return next(new RateLimitError(`Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds.`));
    }

    next();
  };
};
