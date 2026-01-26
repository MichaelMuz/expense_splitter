/**
 * Group management routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createGroupSchema,
  groupIdParamSchema,
  type JoinInviteInput,
  inviteCodeParamSchema,
  joinInviteSchema,
} from '../../shared/schemas/group.schema';
import { assertUnreachable } from '@/shared/utils/type-helpers';

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/groups
 * Create a new group (user becomes owner)
 */
router.post(
  '/',
  validateBody(createGroupSchema),
  async (req: Request, res: Response, next) => {
    try {
      const user = req.user! // checked in auth

      const { name } = req.body;

      // Create group with owner as first member
      const group = await prisma.group.create({
        data: {
          name,
          members: {
            create: {
              userId: user.userId,
              name: user.email.split('@')[0]!, // Default to email prefix
              role: 'owner',
            },
          },
        },
        include: {
          members: true,
        },
      });

      res.status(201).json({ group });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/groups
 * List all groups the user is a member of
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const user = req.user! // checked in auth

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: user.userId,
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            role: true,
            userId: true,
            joinedAt: true,
          },
        },
        _count: {
          select: {
            expenses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ groups });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/:groupId
 * Get detailed information about a specific group
 */
router.get(
  '/:groupId',
  validateParams(groupIdParamSchema),
  async (req: Request, res: Response, next) => {
    try {
      const user = req.user! // checked in auth

      const { groupId } = req.params;

      const group = await prisma.group.findFirst({
        where: {
          id: groupId,
          members: { some: { userId: user.userId } }
        },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              role: true,
              userId: true,
              joinedAt: true,
            },
          },
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });

      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      res.json({ group });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/groups/:groupId
 * Delete a group (owner only)
 */
router.delete(
  '/:groupId',
  validateParams(groupIdParamSchema),
  async (req: Request, res: Response, next) => {
    try {
      const user = req.user!
      const { groupId } = req.params;

      // Find group and check ownership
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });

      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      // Check if user is the owner
      const ownerMember = group.members.find(
        (member) => member.userId === user.userId && member.role === 'owner'
      );

      if (!ownerMember) {
        res.status(403).json({ error: 'Only the group owner can delete the group' });
        return;
      }

      // Delete group (cascade deletes members, expenses, etc.)
      await prisma.group.delete({
        where: { id: groupId },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/groups/join/:inviteCode
 * See virtual members of this group and start virtual person claiming workflow
 */
router.get(
  '/join/:inviteCode',
  validateParams(inviteCodeParamSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { inviteCode } = req.params;

      const group = await prisma.group.findFirst({
        where: { inviteCode },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              role: true,
              userId: true,
              joinedAt: true,
            },
          },
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });

      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      res.json({ group });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/groups/join/:inviteCode
 * Join a group using an invite code
 * If virtual person with matching name exists, claim it
 */
router.post(
  '/join/:inviteCode',
  validateParams(inviteCodeParamSchema),
  validateBody(joinInviteSchema),
  async (req: Request, res: Response, next) => {
    try {
      const user = req.user!
      const { inviteCode } = req.params;
      const joinInput = req.body as JoinInviteInput;

      // Find group by invite code
      const group = await prisma.group.findUnique({
        where: { inviteCode },
        include: {
          members: true,
        },
      });

      if (!group) {
        res.status(404).json({ error: 'Invalid invite code' });
        return;
      }

      // Check if user is already a member
      const existingMember = group.members.find(
        (member) => member.userId === req.user!.userId
      );

      if (existingMember) {
        res.status(409).json({ error: 'You are already a member of this group' });
        return
      }

      let member;
      if (joinInput.type === 'claim') {
        // Claim existing virtual user
        member = group.members.find(member => member.id === joinInput.memberId && !member.userId)
        if (!member) {
          res.status(403).json({ error: 'User not found or not virtual' });
          return;
        }
        // Update this member to have a real userId that points to logged in user
        member = await prisma.groupMember.update({
          where: { id: member.id },
          data: {
            userId: user.userId
          }
        });
      } else if (joinInput.type === 'new') {
        // Create new member
        member = await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: user.userId,
            name: joinInput.userName,
            role: 'member',
          },
        });
      } else {
        assertUnreachable(joinInput)
      }

      res.status(201).json({
        group: {
          id: group.id,
          name: group.name,
          inviteCode: group.inviteCode,
          createdAt: group.createdAt,
        },
        member,
      });
    } catch (error) {
      next(error);
    }
  }
);


export default router;
