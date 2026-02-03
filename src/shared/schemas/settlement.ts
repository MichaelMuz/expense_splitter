/**
 * Validation schemas for settlements
 */

import { z } from 'zod';
import { money } from './fields';

export const settlementParamsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  settlementId: z.string().uuid('Invalid settlement ID'),
});

export const createSettlementSchema = z
  .object({
    fromGroupMemberId: z.string().uuid('Invalid from member ID'),
    toGroupMemberId: z.string().uuid('Invalid to member ID'),
    amount: money,
  })
  .refine(
    (data) => {
      return data.fromGroupMemberId !== data.toGroupMemberId;
    },
    { message: 'Cannot settle payment to yourself', path: ['toGroupMemberId'] }
  );

export type SettlementParams = z.infer<typeof settlementParamsSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
