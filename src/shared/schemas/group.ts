/**
 * Validation schemas for groups and members
 */

import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    //TODO: add trime to basically every string, we rarely basically never want pure whitespace
    .trim()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters'),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

export const inviteCodeParamSchema = z.object({
  inviteCode: z.string().uuid('Invalid invite code'),
});

const memberName = z
  .string()
  .min(1, 'Member name is required')
  .max(100, 'Member name must be less than 100 characters');

export const joinInviteSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('claim'),
    memberId: z.string().uuid('Invalid member id'),
  }),
  z.object({
    type: z.literal('new'),
    memberName: memberName,
  }),
]);

// Member schemas
export const memberIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  memberId: z.string().uuid('Invalid member ID'),
});

export const createMemberSchema = z.object({
  name: memberName,
});

export const updateMemberSchema = z.object({
  name: memberName,
});

// Type exports
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type GroupIdParam = z.infer<typeof groupIdParamSchema>;
export type InviteCodeParam = z.infer<typeof inviteCodeParamSchema>;
export type MemberIdParam = z.infer<typeof memberIdParamSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type JoinInviteInput = z.infer<typeof joinInviteSchema>;

// This is a superset of the groupMemberSchema used in expense. If we need this data there we can consolidate later.
const groupMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  userId: z.string().uuid().nullable(),
  joinedAt: z.coerce.date(),
});

const groupBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  inviteCode: z.string().uuid(),
  createdAt: z.coerce.date(),
});

const groupSchema = groupBaseSchema.extend({
  members: z.array(groupMemberSchema),
  _count: z.object({
    expenses: z.number().int(),
  }),
});

const createGroupDataSchema = groupBaseSchema.extend({
  members: z.array(groupMemberSchema),
});

export const groupResponseSchema = z.object({
  group: groupSchema,
});

export const groupsResponseSchema = z.object({
  groups: z.array(groupSchema),
});

export const createGroupResponseSchema = z.object({
  group: createGroupDataSchema,
});

export const joinGroupResponseSchema = z.object({
  group: groupBaseSchema,
  member: groupMemberSchema,
});

export type GroupMember = z.infer<typeof groupMemberSchema>;
export type Group = z.infer<typeof groupSchema>;
export type GroupResponse = z.infer<typeof groupResponseSchema>;
export type GroupsResponse = z.infer<typeof groupsResponseSchema>;
export type CreateGroupResponse = z.infer<typeof createGroupResponseSchema>;
export type JoinGroupResponse = z.infer<typeof joinGroupResponseSchema>;
