import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const getHealth = (_req: Request, res: Response): void => {
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(200).json({
    success: true,
    message: 'The News API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: isDbConnected,
      name: mongoose.connection.name || 'the_news',
      ...(env.NODE_ENV !== 'production' ? { host: mongoose.connection.host || 'unknown' } : {})
    }
  });
};
