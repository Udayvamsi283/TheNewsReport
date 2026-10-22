import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { startPostScheduler, stopPostScheduler } from './services/scheduler.service.js';
import mongoose from 'mongoose';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    logger.info('Initializing MongoDB connection...');
    await connectDatabase();

    // 2. Start post scheduler
    startPostScheduler();

    // 3. Create Express application
    const app = createApp();

    // 4. Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`The News API server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      logger.info(`Health check endpoint: /api/v1/health`);
    });

    // Graceful Shutdown Handlers
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      stopPostScheduler();
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed.');
          process.exit(0);
        } catch (dbErr) {
          logger.error('Error closing MongoDB connection:', dbErr);
          process.exit(1);
        }
      });

      // Force close after 10s if hung
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    logger.error('Fatal server startup failure:', error);
    process.exit(1);
  }
};

startServer();
