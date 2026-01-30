/**
 * Validation schemas for expenses
 */

import { z } from 'zod';
import { uuid, splitValue, money } from './fields';
import { tuple } from '../utils/type-helpers';
import { calculateTotalExpenseAmount } from '../utils/calculations';

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

const expenseName = z
  .string()
  .min(1, 'Expense name is required')
  .max(200, 'Expense name must be less than 200 characters');

function expenseParticipants(type: "payers" | "owers") {
  return z
    .array(expenseParticipant)
    .min(1, `At least one ${type} is required`)
    .refine(
      (participants) => {
        // All participants must use the same split method
        const methods = participants.map((p) => p.splitMethod);
        return methods.every((m) => m === methods[0]);
      },
      { message: `All ${type} must use the same split method`, path: [type] }
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

function applyExpenseRefinements<T extends z.ZodType<Partial<z.infer<typeof expenseBaseSchema>>>>(schema: T) {
  return schema
    .refine(...bothTaxTipOrNeither('Tax', 'taxAmount', 'taxType'))
    .refine(...bothTaxTipOrNeither('Tip', 'tipAmount', 'tipType'))
    .refine(
      (data) => {
        // For FIXED payers, sum must match total expense amount
        if (data.payers && data.baseAmount && data.payers.length > 0 && data.payers[0]?.splitMethod === 'FIXED') {
          const total = calculateTotalExpenseAmount({
            baseAmount: data.baseAmount,
            taxAmount: data.taxAmount,
            taxType: data.taxType,
            tipAmount: data.tipAmount,
            tipType: data.tipType,
          });

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
        if (data.owers && data.baseAmount && data.owers.length > 0 && data.owers[0]?.splitMethod === 'FIXED') {
          const owerSum = data.owers.reduce((sum, o) => sum + (o.splitValue || 0), 0);
          return owerSum === data.baseAmount;
        }
        return true;
      },
      { message: 'Fixed ower amounts must sum to base amount', path: ['owers'] }
    );
}


const expenseBaseSchema = z
  .object({
    name: expenseName,
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

export const createExpenseSchema = applyExpenseRefinements(expenseBaseSchema)
export const updateExpenseSchema = applyExpenseRefinements(expenseBaseSchema.partial())

export type ExpenseParams = z.infer<typeof expenseParamsSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type PayerInput = z.infer<typeof expenseParticipant>;
export type OwerInput = z.infer<typeof expenseParticipant>;
