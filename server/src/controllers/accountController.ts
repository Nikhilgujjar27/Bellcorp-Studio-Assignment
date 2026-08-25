import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/accountService';
import { ApiResponse } from '../utils/apiResponse';
import { UnauthorizedError } from '../utils/errors';

export class AccountController {
  static async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const balanceData = await AccountService.getBalance(req.user.accountId);
      return ApiResponse.success(res, balanceData, 'Account balance retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const limit = parseInt((req.query.limit as string) || '20', 10);
      const transactions = await AccountService.getTransactions(req.user.accountId, limit);
      return ApiResponse.success(res, transactions, 'Transaction history retrieved');
    } catch (error) {
      next(error);
    }
  }
}
