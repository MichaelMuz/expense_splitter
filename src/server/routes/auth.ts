/**
 * Authentication routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/password';
import { signToken } from '../lib/jwt';
import { validateBody } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { signupSchema, loginSchema, type SignupInput, type LoginInput } from '../../shared/schemas/auth.schema';
import { AppError } from '../middleware/error-handler';

const router = Router();

// TODO: Big problem, we are not sharing these return types in a file so the frontend duplicates these. We are losing out on big type safety.
// TODO: We also want to have the api routes themselves be constants with maybe functions that read from them so the front/backend don't go out of sync

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post(
  '/signup',
  validateBody(signupSchema),
  async (req: Request, res: Response, next) => {
    try {
      const signupData = req.body as SignupInput;
      const { email, password } = signupData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        email: user.email,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next) => {
    try {
      const loginData = req.body as LoginInput;
      const { email, password } = loginData;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        email: user.email,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authenticateToken,
  async (req: Request, res: Response, next) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
