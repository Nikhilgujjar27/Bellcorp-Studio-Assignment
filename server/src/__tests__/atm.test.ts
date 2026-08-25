import request from 'supertest';
import { setupTestDb, teardownTestDb } from './setup';
import { Application } from 'express';

describe('ATM Simulation API Tests', () => {
  let app: Application;
  let authToken: string;

  beforeAll(async () => {
    const testSetup = await setupTestDb();
    app = testSetup.app;

    // Login to get JWT auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        accountNumber: '10000001',
        pin: '1234',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('1. Authentication & Status', () => {
    it('should reject login with incorrect PIN', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          accountNumber: '10000001',
          pin: '9999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should fetch ATM status', async () => {
      const res = await request(app).get('/api/atm/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availableCash).toBe(50000);
    });

    it('should fetch initial account balance of ₹10,000', async () => {
      const res = await request(app)
        .get('/api/account/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(10000);
    });
  });

  describe('2. Withdrawal Scenarios', () => {
    it('Scenario 1: should execute a successful withdrawal of ₹1,000', async () => {
      const res = await request(app)
        .post('/api/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(1000);
      expect(res.body.data.balanceBefore).toBe(10000);
      expect(res.body.data.balanceAfter).toBe(9000);
      expect(res.body.data.status).toBe('SUCCESS');

      // Verify updated balance
      const balanceRes = await request(app)
        .get('/api/account/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(balanceRes.body.data.balance).toBe(9000);
    });

    it('Scenario 2: should reject withdrawal with invalid amounts (negative, zero, non-numeric)', async () => {
      // Negative amount
      const resNeg = await request(app)
        .post('/api/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: -500 });
      expect(resNeg.status).toBe(400);
      expect(resNeg.body.success).toBe(false);

      // Zero amount
      const resZero = await request(app)
        .post('/api/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 0 });
      expect(resZero.status).toBe(400);
      expect(resZero.body.success).toBe(false);

      // String amount
      const resStr = await request(app)
        .post('/api/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 'invalid' });
      expect(resStr.status).toBe(400);
      expect(resStr.body.success).toBe(false);
    });

    it('Scenario 3: should reject withdrawal when account balance is insufficient', async () => {
      // Balance is currently 9000. Try withdrawing 15000.
      const res = await request(app)
        .post('/api/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 15000 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');

      // Ensure balance was NOT deducted
      const balanceRes = await request(app)
        .get('/api/account/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(balanceRes.body.data.balance).toBe(9000);
    });

    it('Scenario 4: should reject withdrawal when ATM available cash is insufficient', async () => {
      // First, set ATM cash to 500 via dev endpoint
      await request(app)
        .post('/api/dev/reset-seed')
        .send({ balance: 9000, atmCash: 500 });

      // Request 1000 (user has 9000 balance, but ATM only has 500)
      const res = await request(app)
        .post('/api/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 1000 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATM_CASH_UNAVAILABLE');
    });

    it('Scenario 5: should fetch transaction history including status', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
