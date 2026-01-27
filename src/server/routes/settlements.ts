/**
 * Settlement routes
 * Handles recording and viewing settlements (payments) between group members
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { createSettlementSchema, settlementParamsSchema } from '../../shared/schemas/settlement.schema';
import {
  calculateNetBalances,
  getMemberBalances,
  type ExpenseData,
  type PayerData,
  type OwerData,
} from '../../shared/utils/calculations';
import { checkGroupMembership } from '../middleware/group-membership';
import { groupIdParamSchema } from '@/shared/schemas/group.schema';

const router = Router();

/**
 * GET /api/groups/:groupId/balances
 * Calculate net balances for all members in the group
 */
router.get(
  '/:groupId/balances',
  authenticateToken,
  validateParams(groupIdParamSchema),
  checkGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware

      // Fetch all expenses with payers and owers
      const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
          payers: true,
          owers: true,
        },
      });

      // Fetch all settlements
      const settlements = await prisma.settlement.findMany({
        where: { groupId },
      });

      // Prepare data for calculation
      const expenseData = expenses.map((expense) => ({
        expense: {
          baseAmount: expense.baseAmount,
          taxAmount: expense.taxAmount,
          taxType: expense.taxType,
          tipAmount: expense.tipAmount,
          tipType: expense.tipType,
        } as ExpenseData,
        payers: expense.payers.map((p) => ({
          groupMemberId: p.groupMemberId,
          splitMethod: p.splitMethod,
          splitValue: p.splitValue,
        })) as PayerData[],
        owers: expense.owers.map((o) => ({
          groupMemberId: o.groupMemberId,
          splitMethod: o.splitMethod,
          splitValue: o.splitValue,
        })) as OwerData[],
      }));

      const settlementData = settlements.map((s) => ({
        fromGroupMemberId: s.fromGroupMemberId,
        toGroupMemberId: s.toGroupMemberId,
        amount: s.amount,
      }));

      // Calculate net balances
      const netBalances = calculateNetBalances(expenseData, settlementData);
      const memberBalances = getMemberBalances(netBalances);

      // Fetch member details
      const members = await prisma.groupMember.findMany({
        where: { groupId },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });

      // Format response with detailed balances
      const detailedBalances = Array.from(netBalances.entries()).map(([key, amount]) => {
        const [fromId, toId] = key.split('->');
        const fromMember = members.find((m) => m.id === fromId);
        const toMember = members.find((m) => m.id === toId);

        return {
          from: {
            id: fromId,
            name: fromMember?.name || 'Unknown',
          },
          to: {
            id: toId,
            name: toMember?.name || 'Unknown',
          },
          amount,
        };
      });

      // Format member summary balances
      const summaryBalances = members.map((member) => ({
        member: {
          id: member.id,
          name: member.name,
        },
        balance: memberBalances.get(member.id) || 0,
      }));

      res.json({
        balances: detailedBalances,
        summary: summaryBalances,
      });
    } catch (error) {
      next(error);
    }
  }
);

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
      const userId = req.user!.userId;
      const { fromGroupMemberId, toGroupMemberId, amount, recordedBy } = req.body;

      // Verify all group member IDs belong to this group
      const memberIds = [fromGroupMemberId, toGroupMemberId, recordedBy];
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

      // Verify the recorder is the current user's member in this group
      const recorderMember = members.find((m) => m.id === recordedBy);
      if (!recorderMember || recorderMember.userId !== userId) {
        res.status(403).json({ error: 'You can only record settlements as yourself' });
        return;
      }

      // Fetch current balances to check if settlement makes sense
      const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
          payers: true,
          owers: true,
        },
      });

      const settlements = await prisma.settlement.findMany({
        where: { groupId },
      });

      const expenseData = expenses.map((expense) => ({
        expense: {
          baseAmount: expense.baseAmount,
          taxAmount: expense.taxAmount,
          taxType: expense.taxType,
          tipAmount: expense.tipAmount,
          tipType: expense.tipType,
        } as ExpenseData,
        payers: expense.payers.map((p) => ({
          groupMemberId: p.groupMemberId,
          splitMethod: p.splitMethod,
          splitValue: p.splitValue,
        })) as PayerData[],
        owers: expense.owers.map((o) => ({
          groupMemberId: o.groupMemberId,
          splitMethod: o.splitMethod,
          splitValue: o.splitValue,
        })) as OwerData[],
      }));

      const settlementData = settlements.map((s) => ({
        fromGroupMemberId: s.fromGroupMemberId,
        toGroupMemberId: s.toGroupMemberId,
        amount: s.amount,
      }));

      const netBalances = calculateNetBalances(expenseData, settlementData);
      const balanceKey = `${fromGroupMemberId}->${toGroupMemberId}`;
      const currentDebt = netBalances.get(balanceKey) || 0;

      // Warning if settlement is more than current debt (but allow it)
      if (amount > currentDebt && currentDebt > 0) {
        // This is just informational - we still allow the settlement
        console.warn(
          `Settlement amount (${amount}) exceeds current debt (${currentDebt}). This may create a reverse debt.`
        );
      }

      // Create settlement
      const settlement = await prisma.settlement.create({
        data: {
          groupId,
          fromGroupMemberId,
          toGroupMemberId,
          amount,
          recordedBy,
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
