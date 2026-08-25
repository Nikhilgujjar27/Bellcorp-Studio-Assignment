import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export const initPgPool = (customPool?: Pool): Pool => {
  if (customPool) {
    pool = customPool;
    return pool;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });

    logger.info(`PostgreSQL pool initialized with connection string: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
  }
  return pool;
};

export const getPgPool = (): Pool => {
  if (!pool) {
    return initPgPool();
  }
  return pool;
};

export const connectPg = async (): Promise<void> => {
  const poolInstance = getPgPool();
  const client = await poolInstance.connect();
  try {
    const res = await client.query('SELECT version(), current_database()');
    logger.info(`Connected to real PostgreSQL Docker container: ${res.rows[0].current_database} (${res.rows[0].version})`);
  } finally {
    client.release();
  }
};

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const poolInstance = getPgPool();
  try {
    const res = await poolInstance.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('PostgreSQL query error', { text, params, error });
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  const poolInstance = getPgPool();
  return await poolInstance.connect();
};

export const closePgPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL pool closed');
  }
};
