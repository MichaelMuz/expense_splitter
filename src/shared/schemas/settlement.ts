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

const settlementMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  userId: z.string().uuid().nullable(),
});

export const settlementSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  amount: z.number().int(),
  paidAt: z.coerce.date(),
  recordedBy: z.string().uuid(),
  fromGroupMemberId: z.string().uuid(),
  toGroupMemberId: z.string().uuid(),
  fromMember: settlementMemberSchema,
  toMember: settlementMemberSchema,
});

export const settlementResponseSchema = z.object({
  settlement: settlementSchema,
})

export const settlementsResponseSchema = z.object({
  settlements: z.array(settlementSchema)
});

export type Settlement = z.infer<typeof settlementSchema>;
export type SettlementResponse = z.infer<typeof settlementResponseSchema>;
export type SettlementsResponse = z.infer<typeof settlementsResponseSchema>;
