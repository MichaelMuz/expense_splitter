/**
 * Validation schemas for expenses
 */

import { z } from 'zod';
import { $Enums } from '@prisma/client';
import { tuple } from '../utils/type-helpers';
import { calculateTotalExpenseAmount } from '../utils/calculations';
import { money } from './fields';

// TODO Would be really cool to use postgres data validation features for things like this
export const TaxTipTypeEnum = z.nativeEnum($Enums.TaxTipType);
export const SplitMethodEnum = z.nativeEnum($Enums.SplitMethod);

// Param validation schema
export const expenseParamsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  expenseId: z.string().uuid('Invalid expense ID'),
});

// Payer and Ower schema
export const expenseParticipant = z.object({
  groupMemberId: z.string().uuid('Invalid group member ID'),
  splitMethod: SplitMethodEnum,
  splitValue: z.number().int().nullable().optional(),
});

const expenseName = z
  .string()
  .min(1, 'Expense name is required')
  .max(200, 'Expense name must be less than 200 characters');

function expenseParticipants(type: 'payers' | 'owers') {
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
        if (
          participants.length > 0 &&
          participants[0]?.splitMethod === 'PERCENTAGE'
        ) {
          const total = participants.reduce(
            (sum, p) => sum + (p.splitValue || 0),
            0
          );
          return total === 10000;
        }
        return true;
      },
      { message: 'Percentage splits must sum to 100%' }
    );
}

function bothTaxTipOrNeither<K1 extends string, K2 extends string>(
  fieldName: 'Tax' | 'Tip',
  amountKey: K1,
  typeKey: K2
) {
  return tuple(
    (data: Partial<Record<K1 | K2, unknown>>) =>
      !!data[amountKey] === !!data[typeKey],
    {
      message: `${fieldName} requires both amount and type, or neither`,
      path: [typeKey], // error points to the type field
    }
  );
}

function fixedSumsCorrectly(participantType: 'payers' | 'owers') {
  return tuple(
    (data: Partial<z.infer<typeof expenseBaseSchema>>) => {
      const participants = data[participantType];
      // TODO: We can get rid of this if we eventually move to mixed splitability in the future
      // require participant updates also update base amount to not break fixes split methods invariants
      if (!!participants !== !!data.baseAmount) {
        return false;
      }
      // they can be both undefined for an update
      else if (!participants || !data.baseAmount) {
        return true;
      }

      if (participants.length > 0 && participants[0]?.splitMethod === 'FIXED') {
        const sum = participants.reduce(
          (sum, p) => sum + (p.splitValue || 0),
          0
        );

        if (participantType === 'payers') {
          const total = calculateTotalExpenseAmount({
            baseAmount: data.baseAmount,
            taxAmount: data.taxAmount,
            taxType: data.taxType,
            tipAmount: data.tipAmount,
            tipType: data.tipType,
          });
          return sum === total;
        } else {
          return sum === data.baseAmount;
        }
      }
      return true;
    },
    {
      message: `Fixed ${participantType} must sum correctly and require base amount to be specified`,
      path: [participantType],
    }
  );
}

function applyExpenseRefinements<
  Io extends z.infer<typeof expenseBaseSchema> | Partial<z.infer<typeof expenseBaseSchema>>,
>(schema: z.ZodType<Io, z.ZodTypeDef, Io>) {
  return schema
    .refine(...bothTaxTipOrNeither('Tax', 'taxAmount', 'taxType'))
    .refine(...bothTaxTipOrNeither('Tip', 'tipAmount', 'tipType'))
    .refine(...fixedSumsCorrectly('payers'))
    .refine(...fixedSumsCorrectly('owers'));
}

const expenseData = z.object({
  baseAmount: money,
  taxAmount: money.nullable().optional(),
  taxType: TaxTipTypeEnum.nullable().optional(),
  tipAmount: money.nullable().optional(),
  tipType: TaxTipTypeEnum.nullable().optional(),
});

const expenseBaseSchema = expenseData.extend({
  name: expenseName,
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  payers: expenseParticipants('payers'),
  owers: expenseParticipants('owers'),
});

export const createExpenseSchema = applyExpenseRefinements(expenseBaseSchema);
export const updateExpenseSchema = applyExpenseRefinements(
  expenseBaseSchema.partial()
);

export type ExpenseData = z.infer<typeof expenseData>;
export type ExpenseParams = z.infer<typeof expenseParamsSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type PayerInput = z.infer<typeof expenseParticipant>;
export type OwerInput = z.infer<typeof expenseParticipant>;

const groupMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  userId: z.string().uuid().nullable(),
});

const expenseParticipantWithAmount = expenseParticipant.extend({
  groupMember: groupMemberSchema,
  calculatedAmount: z.number().int(),
});

const expenseSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  baseAmount: z.number().int(),
  taxAmount: z.number().int().nullable(),
  taxType: TaxTipTypeEnum.nullable(),
  tipAmount: z.number().int().nullable(),
  tipType: TaxTipTypeEnum.nullable(),
  totalAmount: z.number().int(),
  createdAt: z.coerce.date(),
  payers: z.array(expenseParticipantWithAmount),
  owers: z.array(expenseParticipantWithAmount),
});

export const expenseResponseSchema = z.object({
  expense: expenseSchema,
});

export const expensesResponseSchema = z.object({
  expenses: z.array(expenseSchema),
});

export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;
export type ExpensesResponse = z.infer<typeof expensesResponseSchema>;
