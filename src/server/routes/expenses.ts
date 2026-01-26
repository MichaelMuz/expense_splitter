/**
 * Expense routes
 * Handles CRUD operations for expenses within groups
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { checkGroupMembership } from '../middleware/group-membership';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { createExpenseSchema, updateExpenseSchema, type CreateExpenseInput, type UpdateExpenseInput } from '../../shared/schemas/expense.schema';
import { z } from 'zod';
import {
  calculateTotalExpenseAmount,
  calculatePayerAmounts,
  calculateOwerAmounts,
  type ExpenseData,
  type PayerData,
  type OwerData,
} from '../../shared/utils/calculations';
import { Prisma } from '@prisma/client';


// Param validation schema
const expenseParamsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  expenseId: z.string().uuid('Invalid expense ID'),
});

const groupParamsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

const expenseWithRelations = Prisma.validator<Prisma.ExpenseDefaultArgs>()({
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
type ExpenseWithRelations = Prisma.ExpenseGetPayload<typeof expenseWithRelations>;

/**
 * Helper function to format expense with calculated amounts
 */
function formatExpenseWithCalculations(expense: ExpenseWithRelations) {
  const expenseData: ExpenseData = {
    baseAmount: expense.baseAmount,
    taxAmount: expense.taxAmount,
    taxType: expense.taxType,
    tipAmount: expense.tipAmount,
    tipType: expense.tipType,
  };

  const payers: PayerData[] = expense.payers.map(p => ({
    groupMemberId: p.groupMemberId,
    splitMethod: p.splitMethod,
    splitValue: p.splitValue,
  }));

  const owers: OwerData[] = expense.owers.map(o => ({
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
    payers: expense.payers.map(p => ({
      groupMemberId: p.groupMemberId,
      groupMember: p.groupMember,
      splitMethod: p.splitMethod,
      splitValue: p.splitValue,
      calculatedAmount: payerAmounts.get(p.groupMemberId) || 0,
    })),
    owers: expense.owers.map(o => ({
      groupMemberId: o.groupMemberId,
      groupMember: o.groupMember,
      splitMethod: o.splitMethod,
      splitValue: o.splitValue,
      calculatedAmount: owerAmounts.get(o.groupMemberId) || 0,
    })),
  };
}

/**
 * Middleware to check that the owers and payers specified are part of the group
 */
async function checkOwersPayersGroupMembership(req: Request, res: Response, next: NextFunction) {
  const groupId = req.params.groupId!; // Validated by middleware running before this
  const owers = req.body.owers as UpdateExpenseInput['owers'];
  const payers = req.body.payers as UpdateExpenseInput['payers'];

  const allMemberIds = [
    ...(payers?.map(p => p.groupMemberId) || []),
    ...(owers?.map(o => o.groupMemberId) || []),
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

  next();
}

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/groups/:groupId/expenses
 * List all expenses in a group with calculations
 */
router.get(
  '/:groupId/expenses',
  validateParams(groupParamsSchema),
  checkGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware

      // Fetch all expenses for the group
      const expenses = await prisma.expense.findMany({
        where: { groupId },
        ...expenseWithRelations,
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
  validateParams(groupParamsSchema),
  validateBody(createExpenseSchema),
  checkGroupMembership,
  checkOwersPayersGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseData = req.body as CreateExpenseInput;

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
            create: expenseData.payers.map(p => ({
              groupMemberId: p.groupMemberId,
              splitMethod: p.splitMethod,
              splitValue: p.splitValue,
            })),
          },
          owers: {
            create: expenseData.owers.map(o => ({
              groupMemberId: o.groupMemberId,
              splitMethod: o.splitMethod,
              splitValue: o.splitValue,
            })),
          },
        },
        ...expenseWithRelations
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
  validateParams(expenseParamsSchema),
  checkGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseId = req.params.expenseId!; // Validated by middleware

      // Fetch expense
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          groupId,
        },
        ...expenseWithRelations
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
  validateParams(expenseParamsSchema),
  validateBody(updateExpenseSchema),
  checkGroupMembership,
  checkOwersPayersGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseId = req.params.expenseId!; // Validated by middleware
      const updateData = req.body as UpdateExpenseInput;

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
              create: updateData.payers.map(p => ({
                groupMemberId: p.groupMemberId,
                splitMethod: p.splitMethod,
                splitValue: p.splitValue,
              })),
            },
          }),
          ...(updateData.owers && {
            owers: {
              deleteMany: {},
              create: updateData.owers.map(o => ({
                groupMemberId: o.groupMemberId,
                splitMethod: o.splitMethod,
                splitValue: o.splitValue,
              })),
            },
          }),
        },
        ...expenseWithRelations
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
  validateParams(expenseParamsSchema),
  checkGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseId = req.params.expenseId!; // Validated by middleware

      // Delete expense (cascade will delete payers and owers)
      const result = await prisma.expense.deleteMany({
        where: {
          id: expenseId,
          groupId,
        },
      });

      if (result.count === 0) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      res.status(204).send()
    } catch (error) {
      next(error);
    }
  }
);

export default router;
