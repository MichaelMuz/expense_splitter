/**
 * Validation schemas for groups and members
 */

import { z } from 'zod';

// Group schemas
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters'),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

export const inviteCodeParamSchema = z.object({
  inviteCode: z.string().uuid('Invalid invite code'),
});

// Member schemas
export const memberIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  memberId: z.string().uuid('Invalid member ID'),
});

export const createMemberSchema = z.object({
  name: z
    .string()
    .min(1, 'Member name is required')
    .max(100, 'Member name must be less than 100 characters'),
});

export const updateMemberSchema = z.object({
  name: z
    .string()
    .min(1, 'Member name is required')
    .max(100, 'Member name must be less than 100 characters'),
});

// Type exports
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type GroupIdParam = z.infer<typeof groupIdParamSchema>;
export type InviteCodeParam = z.infer<typeof inviteCodeParamSchema>;
export type MemberIdParam = z.infer<typeof memberIdParamSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
