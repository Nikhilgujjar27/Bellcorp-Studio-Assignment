import { Pool } from 'pg';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from '../config';

const API_BASE = 'http://localhost:5000';

async function main() {
  console.log('================================================================');
  console.log('       SANDBOX ACCOUNT ISOLATION & RUNTIME VERIFICATION        ');
  console.log('================================================================\n');

  const pg = new Pool({ connectionString: config.databaseUrl });
  const redis = new Redis(config.redisUrl);
  await mongoose.connect(config.mongoUri);

  try {
    // 1. Reset Demo State
    console.log('[STEP 1] Resetting Demo State...');
    const resetRes = await fetch(`${API_BASE}/api/dev/reset-seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: 10000, atmCash: 50000 }),
    });
    const resetData: any = await resetRes.json();
    console.log('  Status:', resetRes.status);
    console.log('  Message:', resetData.message);

    // Verify initial balances in PostgreSQL
    const acc1_init = await pg.query('SELECT balance FROM accounts WHERE id = 1');
    const acc2_init = await pg.query('SELECT balance FROM accounts WHERE id = 2');
    const atm_init = await pg.query('SELECT available_cash FROM atm WHERE id = 1');
    console.log('  PostgreSQL Account #1 (Demo User):          ₹' + acc1_init.rows[0].balance);
    console.log('  PostgreSQL Account #2 (Concurrency Sandbox): ₹' + acc2_init.rows[0].balance);
    console.log('  PostgreSQL ATM #1 Vault Cash:               ₹' + atm_init.rows[0].available_cash);

    // 2. Authenticate as Account #1 (Demo User)
    console.log('\n[STEP 2] Authenticating as Account #1...');
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
    console.log('  Authenticated user:', loginData.data?.account?.holderName);

    // 3. Normal Withdrawal: Withdraw ₹1,000 on Account #1
    console.log('\n[STEP 3] Performing Normal Withdrawal of ₹1,000 on Account #1...');
    const wRes = await fetch(`${API_BASE}/api/withdraw`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: 1000 }),
    });
    const wData: any = await wRes.json();
    console.log('  Withdrawal Message:', wData.message);
    console.log('  Account #1 Balance After:', '₹' + wData.data?.balanceAfter);

    const acc1_after_w = await pg.query('SELECT balance FROM accounts WHERE id = 1');
    console.log('  PostgreSQL Account #1 Balance:', '₹' + acc1_after_w.rows[0].balance);

    // 4. Run Concurrency Test on Sandbox Account #2
    console.log('\n[STEP 4] Running Concurrency Test (2x ₹2,000 on Sandbox Account #2)...');
    const concRes = await fetch(`${API_BASE}/api/dev/concurrency-test`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    const concData: any = await concRes.json();
    console.log('  Concurrency API Message:', concData.message);
    console.log('  Target Account:', concData.data?.accountName);
    console.log('  Sandbox Initial Balance:', '₹' + concData.data?.initialBalance);
    console.log('  Request A:', concData.data?.requests?.requestA?.requestStatus + ' (HTTP ' + concData.data?.requests?.requestA?.httpStatus + ')');
    console.log('  Request B:', concData.data?.requests?.requestB?.requestStatus + ' (HTTP ' + concData.data?.requests?.requestB?.httpStatus + ')');
    console.log('  Sandbox Final Balance:', '₹' + concData.data?.finalBalance);

    // 5. CRITICAL ISOLATION VERIFICATION
    console.log('\n[STEP 5] *** CRITICAL ISOLATION VERIFICATION ***');
    const acc1_final = await pg.query('SELECT balance FROM accounts WHERE id = 1');
    const acc2_final = await pg.query('SELECT balance FROM accounts WHERE id = 2');
    const atm_final = await pg.query('SELECT available_cash FROM atm WHERE id = 1');

    console.log('  Account #1 Balance (BEFORE Concurrency Test): ₹' + acc1_after_w.rows[0].balance);
    console.log('  Account #1 Balance (AFTER Concurrency Test):  ₹' + acc1_final.rows[0].balance);
    console.log('  Account #2 Balance (AFTER Concurrency Test):  ₹' + acc2_final.rows[0].balance);
    console.log('  ATM #1 Vault Cash (AFTER Concurrency Test):   ₹' + atm_final.rows[0].available_cash);

    const isIsolated = parseFloat(acc1_final.rows[0].balance) === 9000.0 && parseFloat(acc2_final.rows[0].balance) === 1000.0;
    console.log('\n  ISOLATION TEST RESULT:', isIsolated ? '✅ PASS (Account #1 remained strictly ₹9,000.00)' : '❌ FAIL');

    // 6. Reset to clean demo state
    await fetch(`${API_BASE}/api/dev/reset-seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: 10000, atmCash: 50000 }),
    });

  } finally {
    await pg.end();
    await redis.quit();
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log('             VERIFICATION COMPLETED SUCCESSFULLY                ');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Isolation Verification Failed:', err);
  process.exit(1);
});
