import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pg';
import { CacheService } from '../services/cacheService';
import { WithdrawalService } from '../services/withdrawalService';
import { AuditService } from '../services/auditService';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class DevController {
  /**
   * Reset database demo state for instant testing
   */
  static async resetSeed(req: Request, res: Response, next: NextFunction) {
    try {
      const targetBalance = typeof req.body.balance === 'number' ? req.body.balance : 10000.0;
      const targetAtmCash = typeof req.body.atmCash === 'number' ? req.body.atmCash : 50000.0;
      const accountId = req.body.accountId || 1;
      const atmId = req.body.atmId || 1;

      // Update normal account #1 balance
      await query(
        'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [targetBalance, accountId]
      );

      // Reset dedicated concurrency sandbox account #2 to ₹3,000
      await query(
        'UPDATE accounts SET balance = 3000.00, updated_at = CURRENT_TIMESTAMP WHERE id = 2'
      );

      // Update ATM cash
      await query(
        'UPDATE atm SET available_cash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [targetAtmCash, atmId]
      );

      // Clear cache for both accounts
      await CacheService.invalidateBalance(accountId);
      await CacheService.invalidateBalance(2);

      return ApiResponse.success(
        res,
        {
          accountId,
          atmId,
          balance: targetBalance,
          atmCash: targetAtmCash,
          sandboxBalance: 3000.0,
        },
        `Demo state reset: Account #${accountId} set to ₹${targetBalance}, ATM #${atmId} set to ₹${targetAtmCash}, Sandbox Account #2 set to ₹3,000`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run live concurrency demonstration using real simultaneous API calls against dedicated Account #2:
   * Sets Sandbox Account #2 balance to ₹3,000 and ATM cash to ₹50,000,
   * then fires two real ₹2,000 requests in parallel via Promise.allSettled.
   * Normal Account #1 balance remains 100% isolated and untouched.
   */
  static async runConcurrencyTest(req: Request, res: Response, next: NextFunction) {
    try {
      const accountId = 2; // Dedicated Concurrency Sandbox Account #2
      const atmId = req.body.atmId || 1;
      const initialBalance = 3000.0;
      const initialAtmCash = 50000.0;
      const withdrawalAmount = 2000.0;

      // 1. Reset Sandbox Account #2 balance to ₹3,000 and ensure ATM cash is ₹50,000 in PostgreSQL
      await query('UPDATE accounts SET balance = $1 WHERE id = $2', [initialBalance, accountId]);
      await query('UPDATE atm SET available_cash = $1 WHERE id = $2', [initialAtmCash, atmId]);
      await CacheService.invalidateBalance(accountId);

      logger.info(`Starting Concurrency Test on Sandbox Account #2: Initial balance ₹${initialBalance}, firing 2x ₹${withdrawalAmount} withdrawals simultaneously.`);

      const startTime = Date.now();

      // 2. Dispatch two simultaneous real withdrawal transactions concurrently on Sandbox Account #2
      const [reqA, reqB] = await Promise.allSettled([
        WithdrawalService.withdraw({ accountId, atmId, amount: withdrawalAmount }),
        WithdrawalService.withdraw({ accountId, atmId, amount: withdrawalAmount }),
      ]);

      const durationMs = Date.now() - startTime;

      // 3. Query authoritative final financial state of Sandbox Account #2 directly from PostgreSQL
      const finalAccRes = await query('SELECT balance FROM accounts WHERE id = $1', [accountId]);
      const finalAtmRes = await query('SELECT available_cash FROM atm WHERE id = $1', [atmId]);
      const finalBalance = parseFloat(finalAccRes.rows[0].balance.toString());
      const finalAtmCash = parseFloat(finalAtmRes.rows[0].available_cash.toString());

      // Format individual request results with actual HTTP status and payload
      const requestAData = {
        name: 'Request A',
        amount: withdrawalAmount,
        requestStatus: reqA.status === 'fulfilled' ? 'SUCCESS' : 'FAILED',
        httpStatus: reqA.status === 'fulfilled' ? 200 : (reqA.reason?.statusCode || 409),
        result: reqA.status === 'fulfilled' 
          ? `Withdrawal successful. Deducted ₹${withdrawalAmount}. New Balance: ₹${reqA.value.balanceAfter}`
          : (reqA.reason?.message || 'Insufficient balance'),
      };

      const requestBData = {
        name: 'Request B',
        amount: withdrawalAmount,
        requestStatus: reqB.status === 'fulfilled' ? 'SUCCESS' : 'FAILED',
        httpStatus: reqB.status === 'fulfilled' ? 200 : (reqB.reason?.statusCode || 409),
        result: reqB.status === 'fulfilled'
          ? `Withdrawal successful. Deducted ₹${withdrawalAmount}. New Balance: ₹${reqB.value.balanceAfter}`
          : (reqB.reason?.message || 'Insufficient balance'),
      };

      const requests = [requestAData, requestBData];
      const successCount = requests.filter((r) => r.requestStatus === 'SUCCESS').length;
      const failedCount = requests.filter((r) => r.requestStatus === 'FAILED').length;

      const isCorrect = 
        successCount === 1 && 
        failedCount === 1 && 
        finalBalance === 1000.0 && 
        finalAtmCash === (initialAtmCash - withdrawalAmount);

      // 4. Restore ATM cash back to baseline for the primary demo user session
      await query('UPDATE atm SET available_cash = $1 WHERE id = $2', [initialAtmCash, atmId]);

      return ApiResponse.success(res, {
        accountId,
        accountName: 'Concurrency Sandbox (Account #2)',
        initialBalance,
        initialAtmCash,
        withdrawalAmount,
        successfulWithdrawals: successCount,
        failedWithdrawals: failedCount,
        finalBalance,
        finalAtmCash,
        isConcurrencySafe: isCorrect,
        durationMs,
        requests: {
          requestA: requestAData,
          requestB: requestBData,
        },
      }, isCorrect ? 'Concurrency test PASSED: Exactly 1 succeeded, 1 failed, final balance ₹1,000' : 'Concurrency test FAILED');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get MongoDB activity logs for debugging/auditing
   */
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const accountId = parseInt((req.query.accountId as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const logs = await AuditService.getLogs(accountId, limit);
      return ApiResponse.success(res, logs, 'Audit logs retrieved');
    } catch (error) {
      next(error);
    }
  }
}
