/**
 * Expense routes
 * Handles CRUD operations for expenses within groups
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { createExpenseSchema, updateExpenseSchema } from '../../shared/schemas/expense.schema';
import { z } from 'zod';
import {
  calculateTotalExpenseAmount,
  calculatePayerAmounts,
  calculateOwerAmounts,
  type ExpenseData,
  type PayerData,
  type OwerData,
} from '../../shared/utils/calculations';

const router = Router();

// Param validation schema
const expenseParamsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  expenseId: z.string().uuid('Invalid expense ID'),
});

const groupParamsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

/**
 * Helper function to check if user is a member of a group
 */
async function checkGroupMembership(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
    },
  });
  return membership;
}

/**
 * Helper function to format expense with calculated amounts
 * TODO: Make this strongly typed. I think we can extract this from prisma directly
 */
function formatExpenseWithCalculations(expense: any) {
  const expenseData: ExpenseData = {
    baseAmount: expense.baseAmount,
    taxAmount: expense.taxAmount,
    taxType: expense.taxType,
    tipAmount: expense.tipAmount,
    tipType: expense.tipType,
  };

  const payers: PayerData[] = expense.payers.map((p: any) => ({
    groupMemberId: p.groupMemberId,
    splitMethod: p.splitMethod,
    splitValue: p.splitValue,
  }));

  const owers: OwerData[] = expense.owers.map((o: any) => ({
    groupMemberId: o.groupMemberId,
    splitMethod: o.splitMethod,
    splitValue: o.splitValue,
  }));

  const totalAmount = calculateTotalExpenseAmount(expenseData);
  const payerAmounts = calculatePayerAmounts(expenseData, payers);
  const owerAmounts = calculateOwerAmounts(expenseData, owers);

  return {
    id: expense.id,
    groupId: expense.groupId,
    name: expense.name,
    description: expense.description,
    baseAmount: expense.baseAmount,
    taxAmount: expense.taxAmount,
    taxType: expense.taxType,
    tipAmount: expense.tipAmount,
    tipType: expense.tipType,
    totalAmount,
    createdAt: expense.createdAt,
    payers: expense.payers.map((p: any) => ({
      groupMemberId: p.groupMemberId,
      groupMember: p.groupMember,
      splitMethod: p.splitMethod,
      splitValue: p.splitValue,
      calculatedAmount: payerAmounts.get(p.groupMemberId) || 0,
    })),
    owers: expense.owers.map((o: any) => ({
      groupMemberId: o.groupMemberId,
      groupMember: o.groupMember,
      splitMethod: o.splitMethod,
      splitValue: o.splitValue,
      calculatedAmount: owerAmounts.get(o.groupMemberId) || 0,
    })),
  };
}

/**
 * GET /api/groups/:groupId/expenses
 * List all expenses in a group with calculations
 * TODO: We should literally never have a if check followed by a return in a route. If that ever happens it implies that we should be using that check as middleware.
 */
router.get(
  '/:groupId/expenses',
  authenticateToken,
  validateParams(groupParamsSchema),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const userId = req.user!.userId;

      // Check membership
      const membership = await checkGroupMembership(userId, groupId);
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Fetch all expenses for the group
      const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
          payers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
          owers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Format with calculations
      const formattedExpenses = expenses.map(formatExpenseWithCalculations);

      res.json({ expenses: formattedExpenses });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/groups/:groupId/expenses
 * Create a new expense
 */
router.post(
  '/:groupId/expenses',
  authenticateToken,
  validateParams(groupParamsSchema),
  validateBody(createExpenseSchema),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const userId = req.user!.userId;
      const expenseData = req.body;

      // Check membership
      const membership = await checkGroupMembership(userId, groupId);
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Verify all payers and owers are members of the group
      const allMemberIds = [
        ...expenseData.payers.map((p: any) => p.groupMemberId),
        ...expenseData.owers.map((o: any) => o.groupMemberId),
      ];
      const uniqueMemberIds = [...new Set(allMemberIds)];

      const members = await prisma.groupMember.findMany({
        where: {
          id: { in: uniqueMemberIds },
          groupId,
        },
      });

      if (members.length !== uniqueMemberIds.length) {
        res.status(400).json({ error: 'Invalid group member IDs' });
        return;
      }

      // Create expense with payers and owers
      const expense = await prisma.expense.create({
        data: {
          groupId,
          name: expenseData.name,
          description: expenseData.description || '',
          baseAmount: expenseData.baseAmount,
          taxAmount: expenseData.taxAmount,
          taxType: expenseData.taxType,
          tipAmount: expenseData.tipAmount,
          tipType: expenseData.tipType,
          payers: {
            create: expenseData.payers.map((p: any) => ({
              groupMemberId: p.groupMemberId,
              splitMethod: p.splitMethod,
              splitValue: p.splitValue,
            })),
          },
          owers: {
            create: expenseData.owers.map((o: any) => ({
              groupMemberId: o.groupMemberId,
              splitMethod: o.splitMethod,
              splitValue: o.splitValue,
            })),
          },
        },
        include: {
          payers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
          owers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
        },
      });

      // Format with calculations
      const formattedExpense = formatExpenseWithCalculations(expense);

      res.status(201).json({ expense: formattedExpense });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/groups/:groupId/expenses/:expenseId
 * Get a single expense with calculations
 */
router.get(
  '/:groupId/expenses/:expenseId',
  authenticateToken,
  validateParams(expenseParamsSchema),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseId = req.params.expenseId!; // Validated by middleware
      const userId = req.user!.userId;

      // Check membership
      const membership = await checkGroupMembership(userId, groupId);
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Fetch expense
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          groupId,
        },
        include: {
          payers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
          owers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      // Format with calculations
      const formattedExpense = formatExpenseWithCalculations(expense);

      res.json({ expense: formattedExpense });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/groups/:groupId/expenses/:expenseId
 * Update an expense
 */
router.patch(
  '/:groupId/expenses/:expenseId',
  authenticateToken,
  validateParams(expenseParamsSchema),
  validateBody(updateExpenseSchema),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseId = req.params.expenseId!; // Validated by middleware
      const userId = req.user!.userId;
      const updateData = req.body;

      // Check membership
      const membership = await checkGroupMembership(userId, groupId);
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Verify expense exists
      const existingExpense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          groupId,
        },
      });

      if (!existingExpense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      // If updating payers or owers, verify member IDs
      if (updateData.payers || updateData.owers) {
        const allMemberIds = [
          ...(updateData.payers?.map((p: any) => p.groupMemberId) || []),
          ...(updateData.owers?.map((o: any) => o.groupMemberId) || []),
        ];
        const uniqueMemberIds = [...new Set(allMemberIds)];

        if (uniqueMemberIds.length > 0) {
          const members = await prisma.groupMember.findMany({
            where: {
              id: { in: uniqueMemberIds },
              groupId,
            },
          });

          if (members.length !== uniqueMemberIds.length) {
            res.status(400).json({ error: 'Invalid group member IDs' });
            return;
          }
        }
      }

      // Update expense
      const expense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          name: updateData.name,
          description: updateData.description,
          baseAmount: updateData.baseAmount,
          taxAmount: updateData.taxAmount,
          taxType: updateData.taxType,
          tipAmount: updateData.tipAmount,
          tipType: updateData.tipType,
          ...(updateData.payers && {
            payers: {
              deleteMany: {},
              create: updateData.payers.map((p: any) => ({
                groupMemberId: p.groupMemberId,
                splitMethod: p.splitMethod,
                splitValue: p.splitValue,
              })),
            },
          }),
          ...(updateData.owers && {
            owers: {
              deleteMany: {},
              create: updateData.owers.map((o: any) => ({
                groupMemberId: o.groupMemberId,
                splitMethod: o.splitMethod,
                splitValue: o.splitValue,
              })),
            },
          }),
        },
        include: {
          payers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
          owers: {
            include: {
              groupMember: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
        },
      });

      // Format with calculations
      const formattedExpense = formatExpenseWithCalculations(expense);

      res.json({ expense: formattedExpense });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/groups/:groupId/expenses/:expenseId
 * Delete an expense
 */
router.delete(
  '/:groupId/expenses/:expenseId',
  authenticateToken,
  validateParams(expenseParamsSchema),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseId = req.params.expenseId!; // Validated by middleware
      const userId = req.user!.userId;

      // Check membership
      const membership = await checkGroupMembership(userId, groupId);
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }

      // Verify expense exists
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          groupId,
        },
      });

      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      // Delete expense (cascade will delete payers and owers)
      await prisma.expense.delete({
        where: { id: expenseId },
      });

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
