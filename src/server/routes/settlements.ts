/**
 * Settlement routes
 * Handles recording and viewing settlements (payments) between group members
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { createSettlementSchema, settlementParamsSchema, type CreateSettlementInput } from '../../shared/schemas/settlement.schema';
import { checkGroupMembership } from '../middleware/group-membership';
import { groupIdParamSchema } from '@/shared/schemas/group.schema';

const router = Router();

/**
 * POST /api/groups/:groupId/settlements
 * Record a settlement (payment) between members
 */
router.post(
  '/:groupId/settlements',
  authenticateToken,
  validateParams(groupIdParamSchema),
  validateBody(createSettlementSchema),
  checkGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const groupMembership = req.groupMembership!;
      const createSettlement = req.body as CreateSettlementInput
      const { fromGroupMemberId, toGroupMemberId, amount } = createSettlement;

      // Verify all group member IDs belong to this group
      const memberIds = [fromGroupMemberId, toGroupMemberId];
      const members = await prisma.groupMember.findMany({
        where: {
          id: { in: memberIds },
          groupId,
        },
      });

      if (members.length !== memberIds.length) {
        res.status(400).json({ error: 'Invalid group member IDs' });
        return;
      }

      // Create settlement
      const settlement = await prisma.settlement.create({
        data: {
          groupId,
          fromGroupMemberId,
          toGroupMemberId,
          amount,
          recordedBy: groupMembership.id,
        },
        include: {
          fromMember: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
          toMember: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
        },
      });

      res.status(201).json({ settlement });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/groups/:groupId/settlements
 * List all settlements in a group
 */
router.get(
  '/:groupId/settlements',
  authenticateToken,
  validateParams(groupIdParamSchema),
  checkGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware

      // Fetch all settlements
      const settlements = await prisma.settlement.findMany({
        where: { groupId },
        include: {
          fromMember: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
          toMember: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
      });

      const formattedSettlements = settlements.map((s) => ({
        id: s.id,
        groupId: s.groupId,
        from: {
          id: s.fromMember.id,
          name: s.fromMember.name,
        },
        to: {
          id: s.toMember.id,
          name: s.toMember.name,
        },
        amount: s.amount,
        paidAt: s.paidAt,
        recordedBy: s.recordedBy,
      }));

      res.json({ settlements: formattedSettlements });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/groups/:groupId/settlements/:settlementId
 * Delete a settlement
 */
router.delete(
  '/:groupId/settlements/:settlementId',
  authenticateToken,
  validateParams(settlementParamsSchema),
  checkGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const settlementId = req.params.settlementId!; // Validated by middleware

      // Verify settlement exists and belongs to this group
      const settlement = await prisma.settlement.findFirst({
        where: {
          id: settlementId,
          groupId,
        },
      });

      if (!settlement) {
        res.status(404).json({ error: 'Settlement not found' });
        return;
      }

      // Delete settlement
      await prisma.settlement.delete({
        where: { id: settlementId },
      });

      res.json({ message: 'Settlement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
