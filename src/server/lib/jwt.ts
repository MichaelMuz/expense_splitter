/**
 * JWT token utilities for authentication
 */

import jwt from 'jsonwebtoken';
import {z} from 'zod';

const JWT_SECRET = z.string().min(32).parse(process.env.JWT_SECRET);
const JWT_EXPIRES_IN = '7d';

const TokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string()
});
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

/**
 * Sign a JWT token
 * @param payload - Data to encode in token
 * @returns Signed JWT token
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = TokenPayloadSchema.parse(jwt.verify(token, JWT_SECRET))
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}
