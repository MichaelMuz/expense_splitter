/**
 * Group member management routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  groupIdParamSchema,
  memberIdParamSchema,
  createMemberSchema,
  updateMemberSchema,
} from '../../shared/schemas/group.schema';
import { AppError } from '../middleware/error-handler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/groups/:groupId/members
 * List all members of a group
 */
router.get(
  '/:groupId/members',
  validateParams(groupIdParamSchema),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { groupId } = req.params;

      // Verify group exists and user is a member
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const isMember = group.members.some(
        (member) => member.userId === req.user!.userId
      );

      if (!isMember) {
        throw new AppError('You are not a member of this group', 403);
      }

      // Get members with additional details
      const members = await prisma.groupMember.findMany({
        where: { groupId },
        select: {
          id: true,
          name: true,
          role: true,
          userId: true,
          joinedAt: true,
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      });

      res.json({ members });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/groups/:groupId/members
 * Add a virtual person (not linked to a user account)
 */
router.post(
  '/:groupId/members',
  validateParams(groupIdParamSchema),
  validateBody(createMemberSchema),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { groupId } = req.params;
      const { name } = req.body;

      // Verify group exists and user is a member
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const isMember = group.members.some(
        (member) => member.userId === req.user!.userId
      );

      if (!isMember) {
        throw new AppError('You are not a member of this group', 403);
      }

      // Create virtual person (userId = null)
      const member = await prisma.groupMember.create({
        data: {
          groupId,
          userId: null, // Virtual person
          name,
          role: 'member',
        },
      });

      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/groups/:groupId/members/:memberId
 * Update member name
 */
router.patch(
  '/:groupId/members/:memberId',
  validateParams(memberIdParamSchema),
  validateBody(updateMemberSchema),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { groupId, memberId } = req.params;
      const { name } = req.body;

      // Verify group exists and user is a member
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const currentUserMember = group.members.find(
        (member) => member.userId === req.user!.userId
      );

      if (!currentUserMember) {
        throw new AppError('You are not a member of this group', 403);
      }

      // Find the member to update
      const memberToUpdate = group.members.find((member) => member.id === memberId);

      if (!memberToUpdate) {
        throw new AppError('Member not found', 404);
      }

      // Check if member belongs to this group
      if (memberToUpdate.groupId !== groupId) {
        throw new AppError('Member does not belong to this group', 400);
      }

      // Only allow updating own name or if user is owner
      const isOwner = currentUserMember.role === 'owner';
      const isOwnProfile = memberToUpdate.id === currentUserMember.id;

      if (!isOwner && !isOwnProfile) {
        throw new AppError(
          'You can only update your own name unless you are the group owner',
          403
        );
      }

      // Update member name
      const updatedMember = await prisma.groupMember.update({
        where: { id: memberId },
        data: { name },
      });

      res.json({ member: updatedMember });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/groups/:groupId/members/:memberId
 * Remove a member from the group
 */
router.delete(
  '/:groupId/members/:memberId',
  validateParams(memberIdParamSchema),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { groupId, memberId } = req.params;

      // Verify group exists and user is a member
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const currentUserMember = group.members.find(
        (member) => member.userId === req.user!.userId
      );

      if (!currentUserMember) {
        throw new AppError('You are not a member of this group', 403);
      }

      // Find the member to remove
      const memberToRemove = group.members.find((member) => member.id === memberId);

      if (!memberToRemove) {
        throw new AppError('Member not found', 404);
      }

      // Check if member belongs to this group
      if (memberToRemove.groupId !== groupId) {
        throw new AppError('Member does not belong to this group', 400);
      }

      // Cannot remove the owner
      if (memberToRemove.role === 'owner') {
        throw new AppError('Cannot remove the group owner', 403);
      }

      // Only owner can remove other members, members can remove themselves
      const isOwner = currentUserMember.role === 'owner';
      const isLeavingSelf = memberToRemove.id === currentUserMember.id;

      if (!isOwner && !isLeavingSelf) {
        throw new AppError(
          'Only the group owner can remove other members',
          403
        );
      }

      // Check if member has any expenses
      const memberExpenses = await prisma.groupMember.findUnique({
        where: { id: memberId },
        include: {
          paidExpenses: true,
          owedExpenses: true,
        },
      });

      if (
        memberExpenses &&
        (memberExpenses.paidExpenses.length > 0 ||
          memberExpenses.owedExpenses.length > 0)
      ) {
        throw new AppError(
          'Cannot remove member with existing expenses. Delete expenses first.',
          409
        );
      }

      // Delete member
      await prisma.groupMember.delete({
        where: { id: memberId },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
