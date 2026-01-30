/**
 * Reusable zod fields
 */

import { z } from 'zod';

export const email = z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
export const splitValue = z.number().int().nullable().optional()
export const money = z
    .number()
    .int('Money amount must be in cents or basis points (integer)')
    .positive('Money amount must be positive')

export function uuid(message?: string) {
    return z.string().uuid(message || 'Invalid ID')
}



