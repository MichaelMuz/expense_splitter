/**
 * Validation schemas for authentication
 */

import { z } from 'zod';

const email = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required');

export const signupSchema = z.object({
  email: email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: email,
  createdAt: z.coerce.date(),
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
})

export type User = z.infer<typeof userSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
