import request from 'supertest';
import { setupTestDb, teardownTestDb } from './setup';
import { Application } from 'express';
import { query } from '../db/pg';

describe('ATM Concurrency Safety Test', () => {
  let app: Application;
  let authToken: string;

  beforeAll(async () => {
    const testSetup = await setupTestDb();
    app = testSetup.app;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        accountNumber: '10000001',
        pin: '1234',
      });

    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('CRITICAL CONCURRENCY TEST: Sandbox Account #2 (₹3,000) with two simultaneous ₹2,000 withdrawals', async () => {
    // 1. Initial State: Account #1 is ₹10,000, Sandbox Account #2 is ₹3,000
    const initialAcc1Res = await request(app)
      .get('/api/account/balance')
      .set('Authorization', `Bearer ${authToken}`);
    expect(initialAcc1Res.body.data.balance).toBe(10000);

    // 2. Dispatch Concurrency Test via API
    const concRes = await request(app).post('/api/dev/concurrency-test');
    expect(concRes.status).toBe(200);
    expect(concRes.body.success).toBe(true);
    expect(concRes.body.data.accountId).toBe(2);
    expect(concRes.body.data.initialBalance).toBe(3000);
    expect(concRes.body.data.successfulWithdrawals).toBe(1);
    expect(concRes.body.data.failedWithdrawals).toBe(1);
    expect(concRes.body.data.finalBalance).toBe(1000);

    // 3. Assert Sandbox Account #2 is strictly ₹1,000.00 in PostgreSQL
    const sandboxDbRes = await query('SELECT balance FROM accounts WHERE id = 2');
    expect(parseFloat(sandboxDbRes.rows[0].balance.toString())).toBe(1000);

    // 4. Assert Normal Account #1 Balance remains completely ISOLATED and UNTOUCHED (₹10,000.00)
    const finalAcc1Res = await request(app)
      .get('/api/account/balance')
      .set('Authorization', `Bearer ${authToken}`);
    expect(finalAcc1Res.body.data.balance).toBe(10000);

    // 5. Assert PostgreSQL Ledger Records for Sandbox Account #2
    const withdrawalsRes = await query(
      'SELECT id, amount, status, failure_reason, balance_before, balance_after FROM withdrawals WHERE account_id = 2 ORDER BY created_at DESC'
    );

    const successRecords = withdrawalsRes.rows.filter((r) => r.status === 'SUCCESS');
    const failedRecords = withdrawalsRes.rows.filter((r) => r.status === 'FAILED');

    expect(successRecords.length).toBe(1);
    expect(failedRecords.length).toBe(1);
    expect(parseFloat(successRecords[0].amount.toString())).toBe(2000);
    expect(parseFloat(successRecords[0].balance_after.toString())).toBe(1000);
    expect(failedRecords[0].failure_reason).toBe('INSUFFICIENT_BALANCE');
  });
});
