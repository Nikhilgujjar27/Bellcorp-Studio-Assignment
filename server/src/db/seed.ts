import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getPgPool, query, closePgPool } from './pg';
import { connectMongo, closeMongo } from './mongo';
import { initRedis, closeRedis } from './redis';
import { logger } from '../utils/logger';

export const seedDatabase = async () => {
  try {
    logger.info('Running database migration & seeding...');

    // 1. Read and execute PostgreSQL schema DDL
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await query(schemaSql);
    logger.info('PostgreSQL schema applied successfully');

    // 2. Hash PIN for Demo Accounts
    const demoPin = '1234';
    const pinHash = await bcrypt.hash(demoPin, 10);

    // 3. Upsert Demo Account #1 (Main User Account)
    // ID: 1, Account Number: 10000001, Name: Demo User, Balance: 10000.00
    const accountCheck = await query('SELECT id FROM accounts WHERE id = 1');
    if (accountCheck.rows.length === 0) {
      await query(
        `INSERT INTO accounts (id, account_number, holder_name, pin_hash, balance, created_at, updated_at) 
         VALUES (1, '10000001', 'Demo User', $1, 10000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [pinHash]
      );
      logger.info('Seeded Demo Account #1: #10000001 (Demo User) with ₹10,000.00');
    } else {
      await query(
        `UPDATE accounts 
         SET account_number = '10000001', holder_name = 'Demo User', pin_hash = $1, balance = 10000.00, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1`,
        [pinHash]
      );
      logger.info('Reset Demo Account #1 to ₹10,000.00');
    }

    // 4. Upsert Dedicated Concurrency Sandbox Account #2 (Isolated Test Account)
    // ID: 2, Account Number: 10000002, Name: Concurrency Sandbox, Balance: 3000.00
    const sandboxCheck = await query('SELECT id FROM accounts WHERE id = 2');
    if (sandboxCheck.rows.length === 0) {
      await query(
        `INSERT INTO accounts (id, account_number, holder_name, pin_hash, balance, created_at, updated_at) 
         VALUES (2, '10000002', 'Concurrency Sandbox', $1, 3000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [pinHash]
      );
      logger.info('Seeded Concurrency Sandbox Account #2: #10000002 with ₹3,000.00');
    } else {
      await query(
        `UPDATE accounts 
         SET account_number = '10000002', holder_name = 'Concurrency Sandbox', pin_hash = $1, balance = 3000.00, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 2`,
        [pinHash]
      );
      logger.info('Reset Concurrency Sandbox Account #2 to ₹3,000.00');
    }

    // Advance serial sequence to avoid conflicts with auto-generated IDs
    await query(`SELECT setval(pg_get_serial_sequence('accounts', 'id'), coalesce((SELECT max(id) FROM accounts), 1))`);

    // 5. Upsert ATM Machine
    // ID: 1, Available Cash: ₹50,000.00
    const atmCheck = await query('SELECT id FROM atm WHERE id = 1');
    if (atmCheck.rows.length === 0) {
      await query(
        `INSERT INTO atm (id, available_cash, updated_at) 
         VALUES (1, 50000.00, CURRENT_TIMESTAMP)`
      );
      await query(`SELECT setval(pg_get_serial_sequence('atm', 'id'), coalesce((SELECT max(id) FROM atm), 1))`);
      logger.info('Seeded ATM #1 with ₹50,000.00 available cash');
    } else {
      await query('UPDATE atm SET available_cash = 50000.00, updated_at = CURRENT_TIMESTAMP WHERE id = 1');
      logger.info('Reset ATM #1 cash to ₹50,000.00');
    }

    // Connect Mongo and Redis checks
    await connectMongo();
    initRedis();

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};

// Run directly if invoked as script
if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await closePgPool();
      await closeMongo();
      await closeRedis();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await closePgPool();
      await closeMongo();
      await closeRedis();
      process.exit(1);
    });
}
