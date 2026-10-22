import { Request, CookieOptions } from 'express';
import { env } from '../config/env.js';

/**
 * Determines whether the current request/environment requires secure cross-site cookies.
 * In production or cross-origin HTTPS (e.g. Vercel -> Render), cookies must be:
 * - SameSite='None'
 * - Secure=true
 * In local development (HTTP localhost), SameSite='Lax' and Secure=false are required
 * because browsers reject SameSite='None' without HTTPS, and reject Secure over plain HTTP.
 */
export const isSecureCrossSiteContext = (req?: Request): boolean => {
  // 1. Explicit production environment configuration
  if (env.NODE_ENV === 'production') {
    return true;
  }

  // 2. Render cloud hosting platform environment indicator
  if (process.env.RENDER === 'true' || Boolean(process.env.RENDER_SERVICE_ID)) {
    return true;
  }

  // 3. Inspect incoming request protocol / headers
  if (req) {
    // Direct HTTPS or reverse-proxy forwarded HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return true;
    }

    // HTTPS Origin or Referer header (e.g. cross-site calls from Vercel)
    const origin = req.headers.origin;
    if (typeof origin === 'string' && origin.startsWith('https://')) {
      return true;
    }

    const referer = req.headers.referer;
    if (typeof referer === 'string' && referer.startsWith('https://')) {
      return true;
    }
  }

  return false;
};

/**
 * Returns standard authentication cookie options.
 */
export const getAuthCookieOptions = (req?: Request): CookieOptions => {
  const isSecure = isSecureCrossSiteContext(req);
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ('none' as const) : ('lax' as const),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
};

/**
 * Returns cookie options matching auth cookie attributes for clearing/logout.
 */
export const getAuthClearCookieOptions = (req?: Request): CookieOptions => {
  const isSecure = isSecureCrossSiteContext(req);
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ('none' as const) : ('lax' as const),
    path: '/'
  };
};

/**
 * Returns CSRF cookie options compatible with double-submit cookie pattern.
 * httpOnly is false so client-side JavaScript can read/validate if needed on same-site,
 * while SameSite=None and Secure=true allow cross-site cookie transmission with credentials.
 */
export const getCsrfCookieOptions = (req?: Request): CookieOptions => {
  const isSecure = isSecureCrossSiteContext(req);
  return {
    httpOnly: false,
    secure: isSecure,
    sameSite: isSecure ? ('none' as const) : ('lax' as const),
    path: '/'
  };
};
