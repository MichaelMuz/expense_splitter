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
import {
  signupSchema,
  loginSchema,
  type SignupInput,
  type LoginInput,
  type LoginResponse,
  type MeResponse,
} from '../../shared/schemas/auth';

const router = Router();

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
        res.status(409).json({ error: 'User with this email already exists' });
        return;
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

      const responseData: LoginResponse = {
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
      res.status(201).json(responseData);
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
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        email: user.email,
      });

      const responseData: LoginResponse = {
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
      res.json(responseData);
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
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const responseData: MeResponse = {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
      res.json(responseData);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
