import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  errors?: unknown;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  if (err instanceof ZodError || err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors?.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message
    })) || err.issues;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier format.';
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    message = 'A resource with conflicting unique attributes already exists.';
  } else if (statusCode >= 500 && env.NODE_ENV === 'production') {
    message = 'An unexpected internal error occurred. Please try again later.';
  }

  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${err.message || message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};
