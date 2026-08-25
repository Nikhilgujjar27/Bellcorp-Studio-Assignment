import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../utils/apiResponse';

export const loginSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  pin: z.string().min(1, 'PIN is required'),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNumber, pin } = req.body;
      const result = await AuthService.login(accountNumber, pin);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }
}
