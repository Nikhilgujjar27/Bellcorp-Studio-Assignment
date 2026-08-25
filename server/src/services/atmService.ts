import { query } from '../db/pg';
import { Atm } from '../models/types';
import { NotFoundError } from '../utils/errors';

export class AtmService {
  /**
   * Get ATM status & available cash
   */
  static async getAtmStatus(atmId: number = 1): Promise<{ id: number; availableCash: number; updatedAt: Date }> {
    const res = await query<Atm>(
      'SELECT id, available_cash, updated_at FROM atm WHERE id = $1',
      [atmId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`ATM #${atmId} not found`);
    }

    const atm = res.rows[0];
    return {
      id: atm.id,
      availableCash: parseFloat(atm.available_cash.toString()),
      updatedAt: atm.updated_at,
    };
  }

  /**
   * Replenish ATM cash
   */
  static async replenishCash(atmId: number = 1, amount: number): Promise<{ id: number; availableCash: number }> {
    const res = await query<Atm>(
      `UPDATE atm 
       SET available_cash = available_cash + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, available_cash`,
      [amount, atmId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`ATM #${atmId} not found`);
    }

    return {
      id: res.rows[0].id,
      availableCash: parseFloat(res.rows[0].available_cash.toString()),
    };
  }
}
