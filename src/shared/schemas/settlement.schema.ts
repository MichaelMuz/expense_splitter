/**
 * Validation schemas for settlements
 */

import { z } from 'zod';

export const createSettlementSchema = z
  .object({
    fromGroupMemberId: z.string().uuid('Invalid from member ID'),
    toGroupMemberId: z.string().uuid('Invalid to member ID'),
    amount: z
      .number()
      .int('Amount must be in cents (integer)')
      .positive('Amount must be positive'),
    recordedBy: z.string().uuid('Invalid recorded by member ID'),
  })
  .refine(
    (data) => {
      // Can't pay yourself
      return data.fromGroupMemberId !== data.toGroupMemberId;
    },
    { message: 'Cannot settle payment to yourself', path: ['toGroupMemberId'] }
  );

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
