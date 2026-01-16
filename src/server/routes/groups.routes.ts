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
  inviteCodeParamSchema,
} from '../../shared/schemas/group.schema';
import { AppError } from '../middleware/error-handler';

const router = Router();

// All routes require authentication
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
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { name } = req.body;

      // Create group with owner as first member
      const group = await prisma.group.create({
        data: {
          name,
          members: {
            create: {
              userId: req.user.userId,
              name: req.user.email.split('@')[0]!, // Default to email prefix
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
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: req.user.userId,
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
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { groupId } = req.params;

      const group = await prisma.group.findUnique({
        where: { id: groupId },
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
        throw new AppError('Group not found', 404);
      }

      // Check if user is a member
      const isMember = group.members.some(
        (member) => member.userId === req.user!.userId
      );

      if (!isMember) {
        throw new AppError('You are not a member of this group', 403);
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
  async (req: Request, res: Response, next) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { inviteCode } = req.params;

      // Find group by invite code
      const group = await prisma.group.findUnique({
        where: { inviteCode },
        include: {
          members: true,
        },
      });

      if (!group) {
        throw new AppError('Invalid invite code', 404);
      }

      // Check if user is already a member
      const existingMember = group.members.find(
        (member) => member.userId === req.user!.userId
      );

      if (existingMember) {
        throw new AppError('You are already a member of this group', 409);
      }

      // Check for virtual person to claim (userId is null)
      const virtualPerson = group.members.find(
        (member) => member.userId === null
      );

      let member;

      if (virtualPerson) {
        // Claim the virtual person by updating userId
        member = await prisma.groupMember.update({
          where: { id: virtualPerson.id },
          data: {
            userId: req.user.userId,
          },
        });
      } else {
        // Create new member
        member = await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: req.user.userId,
            name: req.user.email.split('@')[0]!, // Default to email prefix
            role: 'member',
          },
        });
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

/**
 * DELETE /api/groups/:groupId
 * Delete a group (owner only)
 */
router.delete(
  '/:groupId',
  validateParams(groupIdParamSchema),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { groupId } = req.params;

      // Find group and check ownership
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      // Check if user is the owner
      const ownerMember = group.members.find(
        (member) => member.userId === req.user!.userId && member.role === 'owner'
      );

      if (!ownerMember) {
        throw new AppError('Only the group owner can delete the group', 403);
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

export default router;
