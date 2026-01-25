/**
 * Validation schemas for expenses
 */

import { z } from 'zod';

// Enums matching Prisma schema
export const TaxTipTypeEnum = z.enum(['FIXED', 'PERCENTAGE']);
export const SplitMethodEnum = z.enum(['EVEN', 'FIXED', 'PERCENTAGE']);

// Payer schema
export const payerSchema = z.object({
  groupMemberId: z.string().uuid('Invalid group member ID'),
  splitMethod: SplitMethodEnum,
  splitValue: z.number().int().nullable().optional(),
});

// Ower schema
export const owerSchema = z.object({
  groupMemberId: z.string().uuid('Invalid group member ID'),
  splitMethod: SplitMethodEnum,
  splitValue: z.number().int().nullable().optional(),
});

// TODO: We have a lot of repeat logic here, should be dry'd up
// Create expense schema
export const createExpenseSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Expense name is required')
      .max(200, 'Expense name must be less than 200 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    baseAmount: z
      .number()
      .int('Base amount must be in cents (integer)')
      .positive('Base amount must be positive'),
    taxAmount: z.number().int('Tax amount must be in cents or basis points (integer)').nullable().optional(),
    taxType: TaxTipTypeEnum.nullable().optional(),
    tipAmount: z.number().int('Tip amount must be in cents or basis points (integer)').nullable().optional(),
    tipType: TaxTipTypeEnum.nullable().optional(),
    payers: z
      .array(payerSchema)
      .min(1, 'At least one payer is required')
      .refine(
        (payers) => {
          // All payers must use the same split method
          const methods = payers.map((p) => p.splitMethod);
          return methods.every((m) => m === methods[0]);
        },
        { message: 'All payers must use the same split method' }
      )
      .refine(
        (payers) => {
          // Validate PERCENTAGE sums to 10000 (100.00%)
          if (payers.length > 0 && payers[0]?.splitMethod === 'PERCENTAGE') {
            const total = payers.reduce((sum, p) => sum + (p.splitValue || 0), 0);
            return total === 10000;
          }
          return true;
        },
        { message: 'Percentage splits must sum to 100%' }
      ),
    owers: z
      .array(owerSchema)
      .min(1, 'At least one ower is required')
      .refine(
        (owers) => {
          // All owers must use the same split method
          const methods = owers.map((o) => o.splitMethod);
          return methods.every((m) => m === methods[0]);
        },
        { message: 'All owers must use the same split method' }
      )
      .refine(
        (owers) => {
          // Validate PERCENTAGE sums to 10000 (100.00%)
          if (owers.length > 0 && owers[0]?.splitMethod === 'PERCENTAGE') {
            const total = owers.reduce((sum, o) => sum + (o.splitValue || 0), 0);
            return total === 10000;
          }
          return true;
        },
        { message: 'Percentage splits must sum to 100%' }
      ),
  })
  .refine(
    (data) => {
      // If taxAmount is provided, taxType must be provided
      if (data.taxAmount && !data.taxType) {
        return false;
      }
      return true;
    },
    { message: 'Tax type is required when tax amount is provided', path: ['taxType'] }
  )
  .refine(
    (data) => {
      // If tipAmount is provided, tipType must be provided
      if (data.tipAmount && !data.tipType) {
        return false;
      }
      return true;
    },
    { message: 'Tip type is required when tip amount is provided', path: ['tipType'] }
  )
  .refine(
    (data) => {
      // For FIXED payers, sum must match total expense amount
      if (data.payers.length > 0 && data.payers[0]?.splitMethod === 'FIXED') {
        // Calculate total expense
        let total = data.baseAmount;
        if (data.taxAmount) {
          if (data.taxType === 'PERCENTAGE') {
            total += Math.round((data.baseAmount * data.taxAmount) / 10000);
          } else {
            total += data.taxAmount;
          }
        }
        if (data.tipAmount) {
          if (data.tipType === 'PERCENTAGE') {
            total += Math.round((data.baseAmount * data.tipAmount) / 10000);
          } else {
            total += data.tipAmount;
          }
        }

        const payerSum = data.payers.reduce((sum, p) => sum + (p.splitValue || 0), 0);
        return payerSum === total;
      }
      return true;
    },
    { message: 'Fixed payer amounts must sum to total expense amount', path: ['payers'] }
  )
  .refine(
    (data) => {
      // For FIXED owers, sum must match base amount
      if (data.owers.length > 0 && data.owers[0]?.splitMethod === 'FIXED') {
        const owerSum = data.owers.reduce((sum, o) => sum + (o.splitValue || 0), 0);
        return owerSum === data.baseAmount;
      }
      return true;
    },
    { message: 'Fixed ower amounts must sum to base amount', path: ['owers'] }
  );

// Update expense schema (same as create but all fields optional except payers/owers validation)
export const updateExpenseSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Expense name is required')
      .max(200, 'Expense name must be less than 200 characters')
      .optional(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    baseAmount: z
      .number()
      .int('Base amount must be in cents (integer)')
      .positive('Base amount must be positive')
      .optional(),
    taxAmount: z.number().int('Tax amount must be in cents or basis points (integer)').nullable().optional(),
    taxType: TaxTipTypeEnum.nullable().optional(),
    tipAmount: z.number().int('Tip amount must be in cents or basis points (integer)').nullable().optional(),
    tipType: TaxTipTypeEnum.nullable().optional(),
    payers: z
      .array(payerSchema)
      .min(1, 'At least one payer is required')
      .optional(),
    owers: z
      .array(owerSchema)
      .min(1, 'At least one ower is required')
      .optional(),
  })
  .refine(
    (data) => {
      // If payers provided, all must use same split method
      if (data.payers) {
        const methods = data.payers.map((p) => p.splitMethod);
        return methods.every((m) => m === methods[0]);
      }
      return true;
    },
    { message: 'All payers must use the same split method', path: ['payers'] }
  )
  .refine(
    (data) => {
      // If payers provided with PERCENTAGE, must sum to 10000
      if (data.payers && data.payers.length > 0 && data.payers[0]?.splitMethod === 'PERCENTAGE') {
        const total = data.payers.reduce((sum, p) => sum + (p.splitValue || 0), 0);
        return total === 10000;
      }
      return true;
    },
    { message: 'Percentage splits must sum to 100%', path: ['payers'] }
  )
  .refine(
    (data) => {
      // If owers provided, all must use same split method
      if (data.owers) {
        const methods = data.owers.map((o) => o.splitMethod);
        return methods.every((m) => m === methods[0]);
      }
      return true;
    },
    { message: 'All owers must use the same split method', path: ['owers'] }
  )
  .refine(
    (data) => {
      // If owers provided with PERCENTAGE, must sum to 10000
      if (data.owers && data.owers.length > 0 && data.owers[0]?.splitMethod === 'PERCENTAGE') {
        const total = data.owers.reduce((sum, o) => sum + (o.splitValue || 0), 0);
        return total === 10000;
      }
      return true;
    },
    { message: 'Percentage splits must sum to 100%', path: ['owers'] }
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type PayerInput = z.infer<typeof payerSchema>;
export type OwerInput = z.infer<typeof owerSchema>;
