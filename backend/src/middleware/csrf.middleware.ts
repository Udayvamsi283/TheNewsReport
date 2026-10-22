import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { getCsrfCookieOptions } from '../utils/cookie.js';

export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Middleware that ensures a CSRF cookie is set on GET requests if missing,
 * and validates the X-CSRF-Token header against the cookie on state-changing requests.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  const cookieOptions = getCsrfCookieOptions(req);

  // If client doesn't have a CSRF cookie yet, generate and set one
  let existingToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (!existingToken) {
    existingToken = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, existingToken, cookieOptions);
  }
  res.locals.csrfToken = existingToken;

  // Safe HTTP methods do not require CSRF validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public authentication entry points (login & register establish new sessions)
  // and public read-only paths
  const exemptPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/csrf-token'
  ];
  if (exemptPaths.some((p) => req.path.startsWith(p)) || req.path.endsWith('/view')) {
    return next();
  }

  // For state-changing requests (POST, PUT, PATCH, DELETE)
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers[CSRF_HEADER_NAME.toLowerCase()];

  // In test environment, allow test bypass if specified
  if (env.NODE_ENV === 'test' && !headerToken && !req.cookies?.[CSRF_COOKIE_NAME]) {
    return next();
  }

  if (!headerToken || !existingToken || headerToken !== existingToken) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or missing CSRF token.'
    });
    return;
  }

  next();
};
