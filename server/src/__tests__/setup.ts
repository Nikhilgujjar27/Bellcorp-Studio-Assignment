import { newDb, IMemoryDb } from 'pg-mem';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { initPgPool, closePgPool } from '../db/pg';
import { createApp } from '../app';

let memDb: IMemoryDb;
let mockPool: any;

export const setupTestDb = async () => {
  memDb = newDb({
    autoCreateForeignKeyIndices: true,
  });

  const schemaSql = `
    CREATE TABLE accounts (
      id SERIAL PRIMARY KEY,
      account_number VARCHAR(20) UNIQUE NOT NULL,
      holder_name VARCHAR(100) NOT NULL,
      pin_hash VARCHAR(255) NOT NULL,
      balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE atm (
      id SERIAL PRIMARY KEY,
      available_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (available_cash >= 0),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE withdrawals (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL,
      atm_id INTEGER NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      status VARCHAR(20) NOT NULL,
      failure_reason VARCHAR(255),
      balance_before NUMERIC(12, 2),
      balance_after NUMERIC(12, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  memDb.public.none(schemaSql);

  const pinHash = await bcrypt.hash('1234', 10);
  memDb.public.none(`
    INSERT INTO accounts (id, account_number, holder_name, pin_hash, balance) 
    VALUES (1, '10000001', 'Demo User', '${pinHash}', 10000.00);
    INSERT INTO accounts (id, account_number, holder_name, pin_hash, balance) 
    VALUES (2, '10000002', 'Concurrency Sandbox', '${pinHash}', 3000.00);
    INSERT INTO atm (id, available_cash) VALUES (1, 50000.00);
  `);

  const pgAdapter = memDb.adapters.createPg();
  mockPool = new pgAdapter.Pool();

  initPgPool(mockPool as unknown as Pool);

  return { memDb, pool: mockPool, app: createApp() };
};

export const teardownTestDb = async () => {
  await closePgPool();
};
