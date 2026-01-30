/**
 * Validation schemas for expenses
 */

import { z } from 'zod';
import { uuid, splitValue, money } from './fields';
import { tuple } from '../utils/type-helpers';

// Param validation schema
export const expenseParamsSchema = z.object({
  groupId: uuid('Invalid group ID'),
  expenseId: uuid('Invalid expense ID'),
});

// Enums matching Prisma schema
export const TaxTipTypeEnum = z.enum(['FIXED', 'PERCENTAGE']);
export const SplitMethodEnum = z.enum(['EVEN', 'FIXED', 'PERCENTAGE']);

// Payer and Ower schema
export const expenseParticipant = z.object({
  groupMemberId: uuid('Invalid group member ID'),
  splitMethod: SplitMethodEnum,
  splitValue: splitValue,
});

function expenseParticipants(type: "payers" | "owers") {
  return z
    .array(expenseParticipant)
    .min(1, `At least one ${type} is required`)
    .refine(
      (participants) => {
        // All payers must use the same split method
        const methods = participants.map((p) => p.splitMethod);
        return methods.every((m) => m === methods[0]);
      },
      { message: 'All payers must use the same split method' }
    )
    .refine(
      (participants) => {
        // Validate PERCENTAGE sums to 10000 (100.00%)
        if (participants.length > 0 && participants[0]?.splitMethod === 'PERCENTAGE') {
          const total = participants.reduce((sum, p) => sum + (p.splitValue || 0), 0);
          return total === 10000;
        }
        return true;
      },
      { message: 'Percentage splits must sum to 100%' }
    )
}

function bothTaxTipOrNeither<K1 extends string, K2 extends string>(
  fieldName: 'Tax' | 'Tip',
  amountKey: K1,
  typeKey: K2,
) {
  return tuple(
    (data: Partial<Record<K1 | K2, unknown>>) => !!data[amountKey] === !!data[typeKey],
    {
      message: `${fieldName} requires both amount and type, or neither`,
      path: [typeKey]  // error points to the type field
    }
  );
}

// TODO: We have a lot of repeat logic here, should be dry'd up
// Create expense schema
export const createExpenseSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Expense name is required')
      .max(200, 'Expense name must be less than 200 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    baseAmount: money,
    // TODO: Do we need the nullable in the create?
    taxAmount: money.nullable().optional(),
    taxType: TaxTipTypeEnum.nullable().optional(),
    tipAmount: money.nullable().optional(),
    tipType: TaxTipTypeEnum.nullable().optional(),
    payers: expenseParticipants("payers"),
    owers: expenseParticipants("owers")
  })
  .refine(
    ...bothTaxTipOrNeither('Tax', 'taxAmount', 'taxType')
  )
  .refine(
    ...bothTaxTipOrNeither('Tip', 'tipAmount', 'tipType')
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
      .array(expenseParticipant)
      .min(1, 'At least one payer is required')
      .optional(),
    owers: z
      .array(expenseParticipant)
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

export type ExpenseParams = z.infer<typeof expenseParamsSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type PayerInput = z.infer<typeof expenseParticipant>;
export type OwerInput = z.infer<typeof expenseParticipant>;
