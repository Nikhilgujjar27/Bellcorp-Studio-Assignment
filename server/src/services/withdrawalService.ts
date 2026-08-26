import { getClient, query } from '../db/pg';
import { CacheService } from './cacheService';
import { AuditService } from './auditService';
import { InsufficientBalanceError, AtmCashUnavailableError, ValidationError, NotFoundError } from '../utils/errors';
import { WithdrawalResult } from '../models/types';
import { logger } from '../utils/logger';

export interface ExecuteWithdrawalParams {
  accountId: number;
  atmId?: number;
  amount: number;
}

export class WithdrawalService {
  /**
   * Concurrency-Safe Cash Withdrawal
   * 
   * Strict Execution Rules:
   * 1. Lock 1: Account row (SELECT ... FROM accounts WHERE id = $1 FOR UPDATE)
   * 2. Lock 2: ATM machine row (SELECT ... FROM atm WHERE id = $2 FOR UPDATE)
   * 3. Consistent lock order eliminates deadlocks.
   * 4. Every withdrawal attempt produces a PostgreSQL record in `withdrawals` table.
   * 5. Failed withdrawals do NOT modify account balance or ATM cash.
   * 6. PostgreSQL is the ONLY financial source of truth.
   * 7. Cache invalidation and MongoDB audit logging are post-commit and non-blocking.
   */
  static async withdraw(params: ExecuteWithdrawalParams): Promise<WithdrawalResult> {
    const { accountId, amount } = params;
    const atmId = params.atmId || 1;

    // 1. Validation Checks
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new ValidationError('Withdrawal amount must be a positive number');
    }

    if (amount > 100000) {
      throw new ValidationError('Withdrawal amount exceeds maximum per-transaction limit of ₹1,00,000');
    }

    const client = await getClient();
    let capturedBalanceBefore = 0;

    try {
      // 2. Start PostgreSQL ACID Transaction
      await client.query('BEGIN');

      // 3. Strict Lock Order 1: Lock target account row
      const accountRes = await client.query(
        'SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE',
        [accountId]
      );

      if (accountRes.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundError(`Account #${accountId} not found`);
      }

      const balanceBefore = parseFloat(accountRes.rows[0].balance.toString());
      capturedBalanceBefore = balanceBefore;

      // 4. Strict Lock Order 2: Lock target ATM vault row
      const atmRes = await client.query(
        'SELECT id, available_cash FROM atm WHERE id = $1 FOR UPDATE',
        [atmId]
      );

      if (atmRes.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundError(`ATM #${atmId} not found`);
      }

      const atmCashBefore = parseFloat(atmRes.rows[0].available_cash.toString());

      // 5. Balance Validation
      if (balanceBefore < amount) {
        // Record FAILED withdrawal attempt in PostgreSQL without altering balances
        await client.query(
          `INSERT INTO withdrawals 
           (account_id, atm_id, amount, status, failure_reason, balance_before, balance_after, created_at) 
           VALUES ($1, $2, $3, 'FAILED', 'INSUFFICIENT_BALANCE', $4, $4, CURRENT_TIMESTAMP)`,
          [accountId, atmId, amount, balanceBefore]
        );

        await client.query('COMMIT');

        // Non-blocking MongoDB audit log
        AuditService.log({
          eventType: 'WITHDRAWAL_FAILED',
          accountId,
          amount,
          status: 'FAILED',
          metadata: {
            reason: 'INSUFFICIENT_BALANCE',
            balance: balanceBefore,
            requestedAmount: amount,
          },
        });

        logger.warn(`Withdrawal REJECTED: Insufficient balance. Account: ${accountId}, Balance: ₹${balanceBefore}, Requested: ₹${amount}`);
        throw new InsufficientBalanceError(`Insufficient account balance. Available: ₹${balanceBefore}, Requested: ₹${amount}`);
      }

      // 6. ATM Vault Cash Validation
      if (atmCashBefore < amount) {
        await client.query(
          `INSERT INTO withdrawals 
           (account_id, atm_id, amount, status, failure_reason, balance_before, balance_after, created_at) 
           VALUES ($1, $2, $3, 'FAILED', 'ATM_CASH_UNAVAILABLE', $4, $4, CURRENT_TIMESTAMP)`,
          [accountId, atmId, amount, balanceBefore]
        );

        await client.query('COMMIT');

        AuditService.log({
          eventType: 'WITHDRAWAL_FAILED',
          accountId,
          amount,
          status: 'FAILED',
          metadata: {
            reason: 'ATM_CASH_UNAVAILABLE',
            atmCash: atmCashBefore,
            requestedAmount: amount,
          },
        });

        logger.warn(`Withdrawal REJECTED: ATM cash unavailable. ATM: ${atmId}, Cash: ₹${atmCashBefore}, Requested: ₹${amount}`);
        throw new AtmCashUnavailableError(`ATM does not have sufficient cash. Available: ₹${atmCashBefore}, Requested: ₹${amount}`);
      }

      // 7. Deduct Account Balance
      const balanceAfter = parseFloat((balanceBefore - amount).toFixed(2));
      await client.query(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [amount, accountId]
      );

      // 8. Deduct ATM Physical Vault Cash
      const atmCashAfter = parseFloat((atmCashBefore - amount).toFixed(2));
      await client.query(
        'UPDATE atm SET available_cash = available_cash - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [amount, atmId]
      );

      // 9. Record Successful Withdrawal in PostgreSQL
      const insertRes = await client.query(
        `INSERT INTO withdrawals 
         (account_id, atm_id, amount, status, failure_reason, balance_before, balance_after, created_at) 
         VALUES ($1, $2, $3, 'SUCCESS', NULL, $4, $5, CURRENT_TIMESTAMP) 
         RETURNING id, created_at`,
        [accountId, atmId, amount, balanceBefore, balanceAfter]
      );

      const withdrawalId = insertRes.rows[0].id;
      const createdAt = insertRes.rows[0].created_at;

      // 10. Commit PostgreSQL Transaction (Releases all locks)
      await client.query('COMMIT');
      logger.info(`Withdrawal SUCCESS: Account #${accountId}, Amount: ₹${amount}, Balance After: ₹${balanceAfter}`);

      // 11. Post-Commit: Invalidate Redis Balance Cache
      await CacheService.invalidateBalance(accountId);

      // 12. Post-Commit: Asynchronous MongoDB Activity Logging (Non-blocking)
      AuditService.log({
        eventType: 'WITHDRAWAL_SUCCESS',
        accountId,
        withdrawalId,
        amount,
        status: 'SUCCESS',
        metadata: {
          balanceBefore,
          balanceAfter,
          atmId,
          atmCashAfter,
        },
      });

      return {
        withdrawalId,
        accountId,
        atmId,
        amount,
        balanceBefore,
        balanceAfter,
        atmAvailableCashAfter: atmCashAfter,
        status: 'SUCCESS',
        timestamp: typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString(),
      };
    } catch (error: any) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback errors
      }

      if (
        error?.code === '23514' ||
        error?.message?.toLowerCase().includes('check constraint') ||
        error?.message?.toLowerCase().includes('violat')
      ) {
        // Record failed withdrawal attempt in autonomous insert
        await this.recordFailedWithdrawal(accountId, atmId, amount, 'INSUFFICIENT_BALANCE', capturedBalanceBefore);
        throw new InsufficientBalanceError('Insufficient account balance (Database constraint check)');
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper to persist failed withdrawal attempt in PostgreSQL for transaction audit trail
   */
  private static async recordFailedWithdrawal(
    accountId: number,
    atmId: number,
    amount: number,
    reason: string,
    balanceBefore: number
  ): Promise<void> {
    try {
      let resolvedBalance = balanceBefore;
      if (!resolvedBalance || resolvedBalance === 0) {
        const accRes = await query('SELECT balance FROM accounts WHERE id = $1', [accountId]);
        if (accRes.rows.length > 0) {
          resolvedBalance = parseFloat(accRes.rows[0].balance.toString());
        }
      }

      await query(
        `INSERT INTO withdrawals 
         (account_id, atm_id, amount, status, failure_reason, balance_before, balance_after, created_at) 
         VALUES ($1, $2, $3, 'FAILED', $4, $5, $5, CURRENT_TIMESTAMP)`,
        [accountId, atmId, amount, reason, resolvedBalance]
      );
    } catch (err: any) {
      logger.warn('Failed to record failed withdrawal in ledger:', err.message);
    }
  }
}
