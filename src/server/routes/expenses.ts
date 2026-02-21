/**
 * Expense routes
 * Handles CRUD operations for expenses within groups
 */

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { prisma } from '../lib/prisma';
import { checkGroupMembership } from '../middleware/group-membership';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createExpenseSchema,
  type CreateExpenseInput,
  expenseParamsSchema,
  type ExpenseResponse,
  type ExpensesResponse,
  type ExpenseData,
  type PayerInput,
  type OwerInput,
} from '../../shared/schemas/expense';
import {
  calculateTotalExpenseAmount,
  calculatePayerAmounts,
  calculateOwerAmounts,
} from '../../shared/utils/calculations';
import { Prisma } from '@prisma/client';
import { groupIdParamSchema } from '@/shared/schemas/group';

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
type ExpenseWithRelations = Prisma.ExpenseGetPayload<
  typeof expenseWithRelations
>;

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

  const payers: PayerInput[] = expense.payers.map((p) => ({
    groupMemberId: p.groupMemberId,
    splitMethod: p.splitMethod,
    splitValue: p.splitValue,
  }));

  const owers: OwerInput[] = expense.owers.map((o) => ({
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
    payers: expense.payers.map((p) => ({
      groupMemberId: p.groupMemberId,
      groupMember: p.groupMember,
      splitMethod: p.splitMethod,
      splitValue: p.splitValue,
      calculatedAmount: payerAmounts.get(p.groupMemberId) || 0,
    })),
    owers: expense.owers.map((o) => ({
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
async function checkOwersPayersGroupMembership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const groupId = req.params.groupId!; // Validated by middleware running before this
  const owers = req.body.owers as CreateExpenseInput['owers'];
  const payers = req.body.payers as CreateExpenseInput['payers'];

  const allMemberIds = [
    ...payers.map((p) => p.groupMemberId),
    ...owers.map((o) => o.groupMemberId),
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
  validateParams(groupIdParamSchema),
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

      const responseData: ExpensesResponse = {
        expenses: formattedExpenses,
      };
      res.json(responseData);
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
  validateParams(groupIdParamSchema),
  validateBody(createExpenseSchema),
  checkGroupMembership,
  checkOwersPayersGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const { payers, owers, ...baseInfo } = req.body as CreateExpenseInput;

      // Create expense with payers and owers
      const expense = await prisma.expense.create({
        data: {
          groupId,
          ...baseInfo,
          payers: { create: payers },
          owers: { create: owers },
        },
        ...expenseWithRelations,
      });

      // Format with calculations
      const formattedExpense = formatExpenseWithCalculations(expense);

      const responseData: ExpenseResponse = {
        expense: formattedExpense,
      };
      res.status(201).json(responseData);
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
        ...expenseWithRelations,
      });

      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      // Format with calculations
      const formattedExpense = formatExpenseWithCalculations(expense);

      const responseData: ExpenseResponse = {
        expense: formattedExpense,
      };
      res.json(responseData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/groups/:groupId/expenses/:expenseId
 * Update an expense
 */
router.put(
  '/:groupId/expenses/:expenseId',
  validateParams(expenseParamsSchema),
  validateBody(createExpenseSchema),
  checkGroupMembership,
  checkOwersPayersGroupMembership,
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId!; // Validated by middleware
      const expenseId = req.params.expenseId!; // Validated by middleware
      const { payers, owers, ...baseInfo } = req.body as CreateExpenseInput;

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
          ...baseInfo,
          payers: { deleteMany: {}, create: payers },
          owers: { deleteMany: {}, create: owers },
        },
        ...expenseWithRelations,
      });

      // Format with calculations
      const formattedExpense = formatExpenseWithCalculations(expense);

      const responseData: ExpenseResponse = {
        expense: formattedExpense,
      };
      res.json(responseData);
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

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
