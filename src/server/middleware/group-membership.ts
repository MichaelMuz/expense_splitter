import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { GroupMember } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      groupMembership?: GroupMember;
    }
  }
}

/**
 * Middleware to check that the currently authenticated user is part of the group they are accessing
 */
export async function checkGroupMembership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const groupId = req.params.groupId!; // Validated by middleware run before this
  const userId = req.user!.userId;

  // Check membership
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
    },
  });
  if (!membership) {
    res.status(403).json({ error: 'Not a member of this group' });
    return;
  }
  req.groupMembership = membership;
  next();
}
