import { createApp } from './app';
import { config } from './config';
import { connectPg, closePgPool } from './db/pg';
import { connectMongo, closeMongo } from './db/mongo';
import { initRedis, closeRedis } from './db/redis';
import { seedDatabase } from './db/seed';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    logger.info('Initializing ATM Simulation Server with real Docker services...');

    // 1. Connect to real PostgreSQL Docker container & apply schema/seed
    await connectPg();
    await seedDatabase();

    // 2. Connect to real MongoDB Docker container
    await connectMongo();

    // 3. Connect to real Redis Docker container
    initRedis();

    // 4. Start Express HTTP Server
    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info(`=======================================================`);
      logger.info(` ATM Simulation Backend is running on port ${config.port}`);
      logger.info(` Environment: ${config.nodeEnv}`);
      logger.info(` Primary DB (PostgreSQL 15): ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
      logger.info(` Secondary DB (MongoDB 6.0): ${config.mongoUri}`);
      logger.info(` Cache / Rate Limit (Redis 7): ${config.redisUrl}`);
      logger.info(` Health check: http://localhost:${config.port}/health`);
      logger.info(` Demo Account: #10000001 (PIN: 1234)`);
      logger.info(`=======================================================`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closePgPool();
        await closeMongo();
        await closeRedis();
        logger.info('ATM Server stopped cleanly');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
