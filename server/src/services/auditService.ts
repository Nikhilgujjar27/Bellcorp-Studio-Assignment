import { ActivityLog } from '../models/ActivityLog';
import { isMongoConnected } from '../db/mongo';
import { logger } from '../utils/logger';

export interface LogAuditParams {
  eventType: 'WITHDRAWAL_SUCCESS' | 'WITHDRAWAL_FAILED' | 'BALANCE_CHECK' | 'LOGIN' | 'ATM_STATUS_CHECK';
  accountId: number;
  withdrawalId?: number;
  amount?: number;
  status: 'SUCCESS' | 'FAILED' | 'INFO';
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Asynchronous, non-blocking audit logger writing directly to MongoDB.
   */
  static async log(params: LogAuditParams): Promise<void> {
    const entry = {
      eventType: params.eventType,
      accountId: params.accountId,
      withdrawalId: params.withdrawalId,
      amount: params.amount,
      status: params.status,
      metadata: params.metadata || {},
      timestamp: new Date(),
    };

    if (!isMongoConnected()) {
      logger.warn('MongoDB connection not ready for audit log write', { eventType: params.eventType, accountId: params.accountId });
      return;
    }

    try {
      await ActivityLog.create(entry);
      logger.debug('Audit log successfully persisted in MongoDB', { eventType: params.eventType, accountId: params.accountId });
    } catch (error: any) {
      logger.warn('Failed to write audit log to MongoDB:', error.message);
    }
  }

  static async getLogs(accountId: number, limit: number = 20) {
    if (!isMongoConnected()) {
      logger.warn('MongoDB not connected when querying audit logs');
      return [];
    }

    try {
      const logs = await ActivityLog.find({ accountId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return logs;
    } catch (error) {
      logger.error('Failed to fetch activity logs from MongoDB:', error);
      return [];
    }
  }
}
