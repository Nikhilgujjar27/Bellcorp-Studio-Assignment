import { query } from '../db/pg';
import { CacheService } from './cacheService';
import { AuditService } from './auditService';
import { NotFoundError } from '../utils/errors';
import { Account, Withdrawal } from '../models/types';
import { logger } from '../utils/logger';

export class AccountService {
  /**
   * Get account balance with Redis caching layer
   */
  static async getBalance(accountId: number): Promise<{ balance: number; isCached: boolean; account: { id: number; accountNumber: string; holderName: string } }> {
    // 1. Check Redis Cache
    const cachedBalance = await CacheService.getCachedBalance(accountId);
    
    // Fetch account details
    const accountRes = await query<Account>(
      'SELECT id, account_number, holder_name, balance FROM accounts WHERE id = $1',
      [accountId]
    );

    if (accountRes.rows.length === 0) {
      throw new NotFoundError('Account not found');
    }

    const account = accountRes.rows[0];
    const freshBalance = parseFloat(account.balance.toString());

    if (cachedBalance !== null) {
      AuditService.log({
        eventType: 'BALANCE_CHECK',
        accountId,
        status: 'SUCCESS',
        metadata: { source: 'REDIS_CACHE', balance: cachedBalance },
      });

      return {
        balance: cachedBalance,
        isCached: true,
        account: {
          id: account.id,
          accountNumber: account.account_number,
          holderName: account.holder_name,
        },
      };
    }

    // 2. Cache Miss: Populate Redis Cache
    await CacheService.setCachedBalance(accountId, freshBalance);

    AuditService.log({
      eventType: 'BALANCE_CHECK',
      accountId,
      status: 'SUCCESS',
      metadata: { source: 'POSTGRES_DB', balance: freshBalance },
    });

    return {
      balance: freshBalance,
      isCached: false,
      account: {
        id: account.id,
        accountNumber: account.account_number,
        holderName: account.holder_name,
      },
    };
  }

  /**
   * Get transaction history for an account
   */
  static async getTransactions(accountId: number, limit: number = 20): Promise<Withdrawal[]> {
    const res = await query<Withdrawal>(
      `SELECT id, account_id, atm_id, amount, status, failure_reason, balance_before, balance_after, created_at 
       FROM withdrawals 
       WHERE account_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [accountId, limit]
    );

    return res.rows.map((row) => ({
      ...row,
      amount: parseFloat(row.amount.toString()),
      balance_before: row.balance_before !== null ? parseFloat(row.balance_before.toString()) : null,
      balance_after: row.balance_after !== null ? parseFloat(row.balance_after.toString()) : null,
    }));
  }
}
