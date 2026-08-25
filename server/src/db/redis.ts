import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const initRedis = (): Redis => {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  redisClient.on('connect', () => {
    logger.info(`Connected to real Redis Docker container at ${config.redisUrl}`);
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
  });

  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

export const isRedisReady = (): boolean => {
  return redisClient !== null && redisClient.status === 'ready';
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // ignore
    }
    redisClient = null;
    logger.info('Redis connection closed');
  }
};
