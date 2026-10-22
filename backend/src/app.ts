import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { csrfProtection } from './middleware/csrf.middleware.js';
import apiRouter from './routes/index.js';

export const createApp = (): Application => {
  const app = express();

  // Trust reverse proxy for secure cookies and accurate IP rate limiting on Render
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet());

  // CORS Configuration - Explicitly parse configured client origins from CLIENT_URL
  const configuredOrigins = env.CLIENT_URL
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or same-origin server healthchecks)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.trim().replace(/\/$/, '');

        // 1. Check explicitly configured origins (works in both development and production)
        const isConfigured = configuredOrigins.some(
          (allowed) => allowed.toLowerCase() === normalizedOrigin.toLowerCase()
        );
        if (isConfigured) {
          return callback(null, true);
        }

        // 2. In local development, dynamically permit any localhost / 127.0.0.1 port (e.g. 5173, 5174, etc.)
        if (env.NODE_ENV !== 'production') {
          const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);
          if (isLocalhost) {
            return callback(null, true);
          }
        }

        // Refuse disallowed origin without throwing an unhandled Express 500 error
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token']
    })
  );

  // Cookie Parser
  app.use(cookieParser(env.COOKIE_SECRET));

  // CSRF Protection
  app.use(csrfProtection);

  // Rate Limiting
  app.use('/api', apiRateLimiter);

  // Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Versioned API Routes
  app.use('/api/v1', apiRouter);

  // 404 Handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
