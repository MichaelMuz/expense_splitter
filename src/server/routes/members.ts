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
import { checkGroupMembership } from '../middleware/group-membership';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/groups/:groupId/members
 * List all members of a group
 */
router.get(
  '/:groupId/members',
  validateParams(groupIdParamSchema),
  checkGroupMembership,
  async (req: Request, res: Response, next) => {
    try {
      const { groupId } = req.params;

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
  checkGroupMembership,
  async (req: Request, res: Response, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const { name } = req.body;

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
  checkGroupMembership,
  async (req: Request, res: Response, next) => {
    try {
      const groupId = req.params!.groupId!; // Validated by middleware
      const memberId = req.params!.memberId!;
      const name = req.body.name as string;
      const groupMembership = req.groupMembership!;

      // Only allow updating own name or if user is owner
      const isOwner = groupMembership.role === 'owner';
      const isOwnProfile = memberId === groupMembership.id;
      if (!isOwner && !isOwnProfile) {
        res.status(403).json({ error: 'You can only update your own name unless you are the group owner' });
        return;
      }

      const updatedMember = await (async () => {
        // update the member if they belong to the group
        const result = await prisma.groupMember.updateMany({
          where: { groupId: groupId, id: memberId },
          data: { name: name }
        });
        if (result.count === 0) {
          return null;
        }
        // return the updated member
        const updatedMember = await prisma.groupMember.findUnique({
          where: { id: memberId },
        })
        return updatedMember
      })()
      if (!updatedMember) {
        res.status(404).json({ error: 'Member not found' });
        return
      }
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
  checkGroupMembership,
  async (req: Request, res: Response, next) => {
    try {
      const groupId = req.params!.groupId!; // Validated by middleware
      const memberId = req.params!.memberId!;
      const groupMembership = req.groupMembership!;

      // Only owner can remove other members, members can remove themselves
      const isOwner = groupMembership.role === 'owner';
      const isOwnProfile = memberId === groupMembership.id;
      if (!isOwner && !isOwnProfile) {
        res.status(403).json({ error: 'Only the group owner can remove other members' });
        return;
      }

      // Check if member exists in group, has any expenses, or is the owner
      const memberToRemove = await prisma.groupMember.findFirst({
        where: { groupId: groupId, id: memberId },
        include: {
          _count: {
            select: { owedExpenses: true, paidExpenses: true }
          }
        }
      })

      if (!memberToRemove) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }
      if (memberToRemove._count.paidExpenses > 0 || memberToRemove._count.owedExpenses > 0) {
        res.status(409).json({ error: 'Cannot remove member with existing expenses. Delete expenses first.' });
        return
      }
      if (memberToRemove.role === 'owner') {
        res.status(403).json({ error: 'Cannot remove the group owner' });
        return
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
