import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { env } from '../config/env.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CSRF_COOKIE_NAME } from '../middleware/csrf.middleware.js';
import {
  getAuthCookieOptions,
  getAuthClearCookieOptions,
  getCsrfCookieOptions
} from '../utils/cookie.js';

const COOKIE_NAME = 'token';
const BCRYPT_SALT_ROUNDS = 10;

const sendAuthToken = (req: Request, res: Response, userId: string, role: string) => {
  const token = jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: '7d'
  });

  res.cookie(COOKIE_NAME, token, getAuthCookieOptions(req));
};

export const getCsrfToken = (req: Request, res: Response): void => {
  const token = res.locals.csrfToken || req.cookies?.[CSRF_COOKIE_NAME];

  res.status(200).json({
    success: true,
    csrfToken: token,
    data: { csrfToken: token }
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: 'user',
      status: 'active'
    });

    sendAuthToken(req, res, user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Fetch user including passwordHash for comparison
    const user = await User.findOne({ email: validatedData.email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact the administrator.'
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(validatedData.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    sendAuthToken(req, res, user._id.toString(), user.role);

    // Remove passwordHash from user object before sending
    user.passwordHash = undefined as any;

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, getAuthClearCookieOptions(req));
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfCookieOptions(req));

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    // Populate interests categories for the profile
    const populatedUser = await User.findById(req.user._id).populate('interests', 'name slug');

    res.status(200).json({
      success: true,
      data: {
        user: populatedUser || req.user
      }
    });
  } catch (error) {
    next(error);
  }
};
