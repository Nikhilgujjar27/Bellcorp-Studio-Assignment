import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

let isConnected = false;

export const connectMongo = async (): Promise<boolean> => {
  if (isConnected && mongoose.connection.readyState === 1) return true;

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info(`Connected to real MongoDB Docker container at ${config.mongoUri}`);
    return true;
  } catch (error: any) {
    isConnected = false;
    logger.error('Failed to connect to real MongoDB container:', error.message);
    throw error;
  }
};

export const isMongoConnected = (): boolean => isConnected && mongoose.connection.readyState === 1;

export const closeMongo = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB connection closed');
  }
};
