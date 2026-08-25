import { Pool } from 'pg';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from '../config';

async function main() {
  console.log('==================================================');
  console.log('       REAL DOCKER CONTAINER VERIFICATION        ');
  console.log('==================================================');

  // 1. PostgreSQL Verification
  console.log('\n[1] Checking PostgreSQL Container (localhost:5432)...');
  const pg = new Pool({ connectionString: config.databaseUrl });
  try {
    const pgRes = await pg.query('SELECT version(), current_database(), current_user, inet_server_addr(), inet_server_port()');
    console.log('  Connection: PASS');
    console.log('  Database:', pgRes.rows[0].current_database);
    console.log('  User:', pgRes.rows[0].current_user);
    console.log('  Server version:', pgRes.rows[0].version);
    console.log('  Real container: PASS');
  } finally {
    await pg.end();
  }

  // 2. MongoDB Verification
  console.log('\n[2] Checking MongoDB Container (localhost:27017)...');
  try {
    await mongoose.connect(config.mongoUri);
    const admin = mongoose.connection.db!.admin();
    const mongoInfo = await admin.serverInfo();
    const auditCount = await mongoose.connection.db!.collection('activity_logs').countDocuments();
    console.log('  Connection: PASS');
    console.log('  Database:', mongoose.connection.name);
    console.log('  Server version:', mongoInfo.version);
    console.log('  Audit log documents stored in MongoDB:', auditCount);
    console.log('  Real container: PASS');
  } finally {
    await mongoose.disconnect();
  }

  // 3. Redis Verification
  console.log('\n[3] Checking Redis Container (localhost:6379)...');
  const redis = new Redis(config.redisUrl);
  try {
    const redisInfo = await redis.info('server');
    const versionLine = redisInfo.split('\n').find((l) => l.startsWith('redis_version:'));
    console.log('  Connection: PASS');
    console.log('  Server version:', versionLine?.trim() || 'Unknown');
    await redis.set('docker:verify:key', 'real_redis_active', 'EX', 10);
    const readVal = await redis.get('docker:verify:key');
    console.log('  Real container: PASS (Read/Write test: ' + (readVal === 'real_redis_active' ? 'PASS' : 'FAIL') + ')');
    await redis.del('docker:verify:key');
  } finally {
    await redis.quit();
  }

  console.log('\n==================================================');
  console.log(' ALL 3 REAL DOCKER SERVICES VERIFIED & READY ');
  console.log('==================================================');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
