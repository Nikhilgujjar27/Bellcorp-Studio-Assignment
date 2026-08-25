import { Request, Response, NextFunction } from 'express';
import { AtmService } from '../services/atmService';
import { ApiResponse } from '../utils/apiResponse';

export class AtmController {
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const atmId = parseInt((req.query.atmId as string) || '1', 10);
      const status = await AtmService.getAtmStatus(atmId);
      return ApiResponse.success(res, status, 'ATM status retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async replenish(req: Request, res: Response, next: NextFunction) {
    try {
      const atmId = parseInt((req.body.atmId as string) || '1', 10);
      const amount = parseFloat(req.body.amount || '50000');
      const result = await AtmService.replenishCash(atmId, amount);
      return ApiResponse.success(res, result, 'ATM cash replenished');
    } catch (error) {
      next(error);
    }
  }
}
