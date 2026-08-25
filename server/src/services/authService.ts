import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pg';
import { config } from '../config';
import { Account, UserPayload } from '../models/types';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { AuditService } from './auditService';

export class AuthService {
  /**
   * Authenticate user with account number and PIN
   */
  static async login(accountNumber: string, pin: string): Promise<{ token: string; account: { id: number; accountNumber: string; holderName: string; balance: number } }> {
    if (!accountNumber || !pin) {
      throw new ValidationError('Account number and PIN are required');
    }

    const res = await query<Account>(
      'SELECT id, account_number, holder_name, pin_hash, balance FROM accounts WHERE account_number = $1',
      [accountNumber.trim()]
    );

    if (res.rows.length === 0) {
      throw new UnauthorizedError('Invalid account number or PIN');
    }

    const account = res.rows[0];
    const isPinValid = await bcrypt.compare(pin.toString(), account.pin_hash);

    if (!isPinValid) {
      throw new UnauthorizedError('Invalid account number or PIN');
    }

    const payload: UserPayload = {
      accountId: account.id,
      accountNumber: account.account_number,
      holderName: account.holder_name,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    AuditService.log({
      eventType: 'LOGIN',
      accountId: account.id,
      status: 'SUCCESS',
      metadata: { accountNumber: account.account_number },
    });

    return {
      token,
      account: {
        id: account.id,
        accountNumber: account.account_number,
        holderName: account.holder_name,
        balance: parseFloat(account.balance.toString()),
      },
    };
  }
}
