import { getRedisClient, isRedisReady } from '../db/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export class CacheService {
  private static getBalanceKey(accountId: number): string {
    return `atm:balance:${accountId}`;
  }

  /**
   * Get cached account balance from Redis
   */
  static async getCachedBalance(accountId: number): Promise<number | null> {
    if (!isRedisReady()) return null;

    try {
      const client = getRedisClient();
      if (!client) return null;

      const cached = await client.get(this.getBalanceKey(accountId));
      if (cached !== null) {
        logger.debug(`Redis Cache HIT for account ${accountId}: ${cached}`);
        return parseFloat(cached);
      }
      logger.debug(`Redis Cache MISS for account ${accountId}`);
      return null;
    } catch (error: any) {
      logger.warn(`Redis getCachedBalance error for account ${accountId}:`, error.message);
      return null;
    }
  }

  /**
   * Set cached balance in Redis with TTL
   */
  static async setCachedBalance(accountId: number, balance: number): Promise<void> {
    if (!isRedisReady()) return;

    try {
      const client = getRedisClient();
      if (!client) return;

      await client.set(
        this.getBalanceKey(accountId),
        balance.toString(),
        'EX',
        config.balanceCacheTtlSeconds
      );
      logger.debug(`Redis Cached balance for account ${accountId}: ${balance} (TTL: ${config.balanceCacheTtlSeconds}s)`);
    } catch (error: any) {
      logger.warn(`Redis setCachedBalance error for account ${accountId}:`, error.message);
    }
  }

  /**
   * Invalidate cached balance in Redis after withdrawal/modification
   */
  static async invalidateBalance(accountId: number): Promise<void> {
    if (!isRedisReady()) return;

    try {
      const client = getRedisClient();
      if (!client) return;

      await client.del(this.getBalanceKey(accountId));
      logger.info(`Redis Cache INVALIDATED for account ${accountId}`);
    } catch (error: any) {
      logger.warn(`Redis invalidateBalance error for account ${accountId}:`, error.message);
    }
  }
}
