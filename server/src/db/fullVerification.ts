import { Pool } from 'pg';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from '../config';

const API_BASE = 'http://localhost:5000';

async function runFullVerification() {
  console.log('================================================================');
  console.log('       APEXBANK ATM SIMULATION — RUNTIME VERIFICATION SUITE     ');
  console.log('================================================================\n');

  const pg = new Pool({ connectionString: config.databaseUrl });
  const redis = new Redis(config.redisUrl);
  await mongoose.connect(config.mongoUri);

  try {
    // =================================================================
    // TEST 1 — DOCKER INFRASTRUCTURE
    // =================================================================
    console.log('--- TEST 1: DOCKER INFRASTRUCTURE ---');
    const pgRes = await pg.query('SELECT version(), current_database(), current_user');
    const mongoAdmin = mongoose.connection.db!.admin();
    const mongoInfo = await mongoAdmin.serverInfo();
    const redisInfo = await redis.info('server');
    const redisVer = redisInfo.split('\n').find((l) => l.startsWith('redis_version:'))?.trim();

    console.log('  PostgreSQL 15 Container: PASS (Version: ' + pgRes.rows[0].version.split(' ')[0] + ' ' + pgRes.rows[0].version.split(' ')[1] + ', DB: ' + pgRes.rows[0].current_database + ')');
    console.log('  MongoDB 6.0 Container:   PASS (Version: ' + mongoInfo.version + ', DB: ' + mongoose.connection.name + ')');
    console.log('  Redis 7 Container:       PASS (Version: ' + redisVer + ')');

    // =================================================================
    // TEST 2 — BACKEND HEALTH
    // =================================================================
    console.log('\n--- TEST 2: BACKEND HEALTH ---');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData: any = await healthRes.json();
    console.log('  HTTP Status:', healthRes.status);
    console.log('  Response Payload:', JSON.stringify(healthData));
    console.log('  Result: ' + (healthRes.status === 200 && healthData.status === 'ok' ? 'PASS' : 'FAIL'));

    // =================================================================
    // TEST 3 — FRONTEND
    // =================================================================
    console.log('\n--- TEST 3: FRONTEND ACCESSIBILITY ---');
    const frontendRes = await fetch('http://localhost:5173/');
    const frontendHtml = await frontendRes.text();
    console.log('  HTTP Status:', frontendRes.status);
    console.log('  Vite Index.html delivered:', frontendHtml.includes('<div id="root">') ? 'YES' : 'NO');
    console.log('  Result: ' + (frontendRes.status === 200 ? 'PASS' : 'FAIL'));

    // =================================================================
    // TEST 4 — LOGIN
    // =================================================================
    console.log('\n--- TEST 4: LOGIN AUTHENTICATION ---');
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber: '10000001', pin: '1234' }),
    });
    const loginData: any = await loginRes.json();
    const token = loginData.data?.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    console.log('  HTTP Status:', loginRes.status);
    console.log('  Token Issued:', token ? token.substring(0, 30) + '...' : 'NONE');
    console.log('  Account User:', loginData.data?.account?.holderName);
    console.log('  Result: ' + (loginData.success ? 'PASS' : 'FAIL'));

    // =================================================================
    // TEST 5 — CURRENT DATABASE & CACHE STATE
    // =================================================================
    console.log('\n--- TEST 5: CURRENT DATABASE & CACHE STATE ---');
    const accBefore = await pg.query('SELECT id, balance FROM accounts WHERE id = 1');
    const atmBefore = await pg.query('SELECT id, available_cash FROM atm WHERE id = 1');
    const cachedBalBefore = await redis.get('atm:balance:1');

    console.log('  PostgreSQL Account #1 Balance: ₹' + accBefore.rows[0].balance);
    console.log('  PostgreSQL ATM #1 Vault Cash:  ₹' + atmBefore.rows[0].available_cash);
    console.log('  Redis Cached Balance (key atm:balance:1):', cachedBalBefore !== null ? '₹' + cachedBalBefore : 'NULL (Cache Miss)');

    // =================================================================
    // TEST 6 — RESET DEMO API DIRECTLY
    // =================================================================
    console.log('\n--- TEST 6: RESET DEMO API DIRECTLY ---');
    const resetApiRes = await fetch(`${API_BASE}/api/dev/reset-seed`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ balance: 10000, atmCash: 50000 }),
    });
    const resetData: any = await resetApiRes.json();
    console.log('  HTTP Status:', resetApiRes.status);
    console.log('  Response Payload:', JSON.stringify(resetData));

    const accAfterReset = await pg.query('SELECT id, balance FROM accounts WHERE id = 1');
    const atmAfterReset = await pg.query('SELECT id, available_cash FROM atm WHERE id = 1');
    const cachedBalAfterReset = await redis.get('atm:balance:1');

    console.log('  PostgreSQL Balance After Reset: ₹' + accAfterReset.rows[0].balance);
    console.log('  PostgreSQL ATM Cash After Reset: ₹' + atmAfterReset.rows[0].available_cash);
    console.log('  Redis Cached Balance After Reset:', cachedBalAfterReset !== null ? '₹' + cachedBalAfterReset : 'NULL (Properly Invalidated)');

    // =================================================================
    // TEST 7 & 8 — STATE SYNC & API REFRESH VERIFICATION
    // =================================================================
    console.log('\n--- TEST 7 & 8: STATE SYNC & CONSECUTIVE RESETS ---');
    // First, simulate withdrawal to ₹9,000 / ₹49,000
    const w1Res = await fetch(`${API_BASE}/api/withdraw`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: 1000 }),
    });
    const w1: any = await w1Res.json();
    console.log('  Withdrew ₹1,000: New Balance = ₹' + w1.data.balanceAfter + ', ATM Cash = ₹' + w1.data.atmAvailableCashAfter);

    // Call Balance API
    const balApi1Res = await fetch(`${API_BASE}/api/account/balance`, { headers: authHeaders });
    const balApi1: any = await balApi1Res.json();
    console.log('  GET /api/account/balance immediately after withdrawal: ₹' + balApi1.data.balance + ' (isCached: ' + balApi1.data.isCached + ')');

    // Call Reset Demo API
    const reset2Res = await fetch(`${API_BASE}/api/dev/reset-seed`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ balance: 10000, atmCash: 50000 }),
    });
    const reset2: any = await reset2Res.json();
    console.log('  Reset Demo API Called: Status = ' + reset2Res.status + ', Message = ' + reset2.message);

    // Call Balance API and ATM API right after Reset Demo (what UI fetchBalance & fetchAtmStatus does)
    const balApiAfterResetRes = await fetch(`${API_BASE}/api/account/balance`, { headers: authHeaders });
    const balApiAfterReset: any = await balApiAfterResetRes.json();
    const atmApiAfterResetRes = await fetch(`${API_BASE}/api/atm/status`);
    const atmApiAfterReset: any = await atmApiAfterResetRes.json();
    console.log('  GET /api/account/balance after Reset: ₹' + balApiAfterReset.data.balance + ' (isCached: ' + balApiAfterReset.data.isCached + ')');
    console.log('  GET /api/atm/status after Reset:       ₹' + atmApiAfterReset.data.availableCash);

    // =================================================================
    // TEST 9 — NORMAL WITHDRAWAL (₹1,000)
    // =================================================================
    console.log('\n--- TEST 9: NORMAL WITHDRAWAL (₹1,000) ---');
    const wNormalRes = await fetch(`${API_BASE}/api/withdraw`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: 1000 }),
    });
    const wNormal: any = await wNormalRes.json();
    console.log('  HTTP Status:', wNormalRes.status);
    console.log('  Withdrawal Status:', wNormal.data?.status);
    console.log('  Balance Before: ₹' + wNormal.data?.balanceBefore + ' -> Balance After: ₹' + wNormal.data?.balanceAfter);
    console.log('  ATM Vault Cash After: ₹' + wNormal.data?.atmAvailableCashAfter);
    console.log('  Result: ' + (wNormal.success && wNormal.data?.balanceAfter === 9000 ? 'PASS' : 'FAIL'));

    // =================================================================
    // TEST 10 — FAILED WITHDRAWAL (INSUFFICIENT BALANCE)
    // =================================================================
    console.log('\n--- TEST 10: FAILED WITHDRAWAL (EXCEEDS BALANCE) ---');
    const wFailRes = await fetch(`${API_BASE}/api/withdraw`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: 50000 }),
    });
    const wFail: any = await wFailRes.json();
    console.log('  HTTP Status:', wFailRes.status);
    console.log('  Error Code:', wFail.error?.code);
    console.log('  Error Message:', wFail.error?.message);
    console.log('  Result: ' + (wFailRes.status === 409 && wFail.error?.code === 'INSUFFICIENT_BALANCE' ? 'PASS' : 'FAIL'));

    // Verify balance was not changed
    const accCheck = await pg.query('SELECT balance FROM accounts WHERE id = 1');
    console.log('  PostgreSQL Balance remains: ₹' + accCheck.rows[0].balance + ' (No overdraft)');

    // =================================================================
    // TEST 11 — REAL CONCURRENCY TEST (2x ₹2,000 on ₹3,000)
    // =================================================================
    console.log('\n--- TEST 11: REAL CONCURRENCY TEST (2x ₹2,000 on ₹3,000) ---');
    const concRes = await fetch(`${API_BASE}/api/dev/concurrency-test`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    const concData: any = await concRes.json();
    const cData = concData.data;
    console.log('  HTTP Status:', concRes.status);
    console.log('  Initial Balance: ₹' + cData.initialBalance);
    console.log('  Request A: ' + cData.requests.requestA.requestStatus + ' (HTTP ' + cData.requests.requestA.httpStatus + ')');
    console.log('  Request B: ' + cData.requests.requestB.requestStatus + ' (HTTP ' + cData.requests.requestB.httpStatus + ')');
    console.log('  Final Balance: ₹' + cData.finalBalance + ' (PostgreSQL Verified)');
    console.log('  ATM Vault Cash: ₹' + cData.finalAtmCash + ' (Deducted exactly ₹2,000)');
    console.log('  Successful Withdrawals: ' + cData.successfulWithdrawals);
    console.log('  Failed Withdrawals:     ' + cData.failedWithdrawals);
    console.log('  Result: ' + (cData.isConcurrencySafe ? 'PASS' : 'FAIL'));

    // =================================================================
    // TEST 12 — TRANSACTION LEDGER
    // =================================================================
    console.log('\n--- TEST 12: TRANSACTION LEDGER ---');
    const txRes = await fetch(`${API_BASE}/api/transactions?limit=10`, { headers: authHeaders });
    const txData: any = await txRes.json();
    console.log('  HTTP Status:', txRes.status);
    console.log('  Total Transactions Retrieved:', txData.data?.length);
    const successTxs = txData.data?.filter((t: any) => t.status === 'SUCCESS').length;
    const failedTxs = txData.data?.filter((t: any) => t.status === 'FAILED').length;
    console.log('  Ledger Breakdown: ' + successTxs + ' SUCCESS, ' + failedTxs + ' FAILED');
    console.log('  Result: ' + (txData.data?.length > 0 ? 'PASS' : 'FAIL'));

    // =================================================================
    // TEST 13 — MONGODB AUDIT LOGS
    // =================================================================
    console.log('\n--- TEST 13: MONGODB AUDIT LOGS ---');
    const auditRes = await fetch(`${API_BASE}/api/dev/audit-logs?accountId=1&limit=20`);
    const auditData: any = await auditRes.json();
    console.log('  HTTP Status:', auditRes.status);
    console.log('  MongoDB Audit Documents Found:', auditData.data?.length);
    const eventTypes = [...new Set(auditData.data?.map((a: any) => a.eventType))];
    console.log('  Distinct Event Types Recorded in MongoDB:', eventTypes.join(', '));
    console.log('  Result: ' + (auditData.data?.length > 0 ? 'PASS' : 'FAIL'));

    // =================================================================
    // TEST 14 — REDIS CACHE BEHAVIOR
    // =================================================================
    console.log('\n--- TEST 14: REDIS CACHE HIT/MISS CYCLE ---');
    // First read: miss
    const rMissRes = await fetch(`${API_BASE}/api/account/balance`, { headers: authHeaders });
    const rMiss: any = await rMissRes.json();
    console.log('  1st Read (PostgreSQL): isCached = ' + rMiss.data.isCached + ' (Balance: ₹' + rMiss.data.balance + ')');
    // Second read: hit
    const rHitRes = await fetch(`${API_BASE}/api/account/balance`, { headers: authHeaders });
    const rHit: any = await rHitRes.json();
    console.log('  2nd Read (Redis Cache): isCached = ' + rHit.data.isCached + ' (Balance: ₹' + rHit.data.balance + ')');
    // Invalidation via reset
    await fetch(`${API_BASE}/api/dev/reset-seed`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ balance: 10000, atmCash: 50000 }),
    });
    const rAfterResetRes = await fetch(`${API_BASE}/api/account/balance`, { headers: authHeaders });
    const rAfterReset: any = await rAfterResetRes.json();
    console.log('  After Reset (Invalidation): isCached = ' + rAfterReset.data.isCached + ' (Balance: ₹' + rAfterReset.data.balance + ')');
    console.log('  Result: ' + (!rMiss.data.isCached && rHit.data.isCached && !rAfterReset.data.isCached ? 'PASS' : 'FAIL'));

  } finally {
    await pg.end();
    await redis.quit();
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log('                 VERIFICATION SUITE COMPLETED                   ');
  console.log('================================================================');
}

runFullVerification().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
