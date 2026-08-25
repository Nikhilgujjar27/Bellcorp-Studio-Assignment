import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { WithdrawalService } from '../services/withdrawalService';
import { ApiResponse } from '../utils/apiResponse';
import { UnauthorizedError } from '../utils/errors';

export const withdrawSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .max(100000, 'Maximum withdrawal limit is ₹1,00,000')
    .refine((val) => Number.isFinite(val), { message: 'Amount must be a valid number' })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
      message: 'Amount cannot have more than 2 decimal places',
    }),
  atmId: z.number().int().positive().optional().default(1),
});

export class WithdrawalController {
  static async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const { amount, atmId } = req.body;
      const result = await WithdrawalService.withdraw({
        accountId: req.user.accountId,
        atmId: atmId || 1,
        amount,
      });

      return ApiResponse.success(res, result, 'Withdrawal successful', 200);
    } catch (error) {
      next(error);
    }
  }
}
