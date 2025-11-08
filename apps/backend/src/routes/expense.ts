import Router from "@koa/router";
import { AppDataSource } from "../data-source.js";
import { Expense, ExpenseSplit } from "../entities/Expense.js";
import type { ExpenseRequest, SplitIntent, ExpenseResponse } from 'lib'
import { expenseHydration, groupMembershipHydration } from "../middleware.js";
import type { ExpenseContext, GroupContext } from "../contexts.js";

const expenseRepository = AppDataSource.getRepository(Expense);

function calcSplits(splitIntents: SplitIntent[], amount: number, fee: number): Record<number, number> {
    const initialAmount = amount
    const order = { "fixed": 0, "percentage": 1, "even_split": 2 }
    const sortedSplitIntents = [...splitIntents].sort((a, b) => order[a.type] - order[b.type])
    let idToAmount: Record<number, number> = {}
    let i: number;
    for (i = 0; i < sortedSplitIntents.length; i++) {
        const splitIntent = sortedSplitIntents[i]!;
        if (splitIntent.type === "fixed") {
            idToAmount[splitIntent.userId] = splitIntent.value
            amount -= splitIntent.value
        } else if (splitIntent.type === "percentage") {
            const portion = amount * splitIntent.value
            idToAmount[splitIntent.userId] = portion
            amount -= portion
        } else if (splitIntent.type === "even_split")
            break;
    }
    const left = sortedSplitIntents.length - i
    const even_split = amount / left;
    for (; i < sortedSplitIntents.length; i++) {
        const splitIntent = sortedSplitIntents[i]!;
        idToAmount[splitIntent.userId] = even_split
    }

    for (const userId in idToAmount) {
        const userAmount = idToAmount[userId]!
        idToAmount[userId]! += fee * (userAmount / initialAmount)
    }

    return idToAmount
}

const router = new Router({ prefix: "/api/groups/:group_id/expenses" });
router.use('/', groupMembershipHydration)

router.get("/", async (rawCtx) => {
    const ctx = rawCtx as GroupContext
    const expenses = await expenseRepository.find({
        where: { groupId: ctx.state.groupMembership.groupId },
        relations: ['paidByUser', 'splits', 'splits.user']
    });

    const resp: ExpenseResponse[] = expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        fee: expense.fee,
        createdAt: expense.createdAt,
        paidByUser: {
            id: expense.paidByUser.id,
            name: expense.paidByUser.name,
            email: expense.paidByUser.email
        },
        splits: expense.splits.map(split => ({
            userId: split.userId,
            amountOwed: split.amountOwed,
            paid: split.paid,
            user: {
                id: split.user.id,
                name: split.user.name,
                email: split.user.email
            }
        }))
    }));
    ctx.body = resp;
})


router.post("/", async (rawCtx) => {
    const ctx = rawCtx as GroupContext
    const userId = ctx.state.user.id
    const groupId = ctx.state.groupMembership.groupId
    const expenseRequest = ctx.request.body as ExpenseRequest
    const idToAmount = calcSplits(expenseRequest.splits, expenseRequest.amount, expenseRequest.fee)
    // still need to check to make sure that the users assigned to pay are all in the group
    try {
        const expenseId = await AppDataSource.transaction(async entityManager => {
            const expense = entityManager.create(Expense, {
                paidByUserId: userId,
                groupId,
                description: expenseRequest.description,
                amount: expenseRequest.amount,
                fee: expenseRequest.fee,
            })
            await entityManager.save(expense)
            const expenseSplits = expenseRequest.splits.map(expenseSplit =>
                entityManager.create(ExpenseSplit, {
                    expenseId: expense.id,
                    userId: expenseSplit.userId,
                    amountOwed: idToAmount[expenseSplit.userId]!,
                    paid: expenseSplit.userId === userId,
                })
            )
            await entityManager.save(expenseSplits)
            return expense.id
        })
        const expense = await expenseRepository.findOne({
            where: { id: expenseId },
            relations: ['paidByUser', 'splits', 'splits.user']
        });

        if (!expense) {
            ctx.status = 500;
            ctx.body = { error: "Failed to create expense" };
            return
        }

        const expenseResponse: ExpenseResponse = {
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            fee: expense.fee,
            createdAt: expense.createdAt,
            paidByUser: {
                id: expense.paidByUser.id,
                name: expense.paidByUser.name,
                email: expense.paidByUser.email,
            },
            splits: expense.splits.map(expenseSplit => ({
                userId: expenseSplit.userId,
                amountOwed: expenseSplit.amountOwed,
                paid: expenseSplit.paid,
                user: {
                    id: expenseSplit.user.id,
                    name: expenseSplit.user.name,
                    email: expenseSplit.user.email,

                }
            }))

        }
        ctx.status = 201;
        ctx.body = expenseResponse;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: "Failed to create expense" };
    }
});

router.use('/:expense_id', expenseHydration)

router.put("/:expense_id", async (rawCtx) => {
    const ctx = rawCtx as ExpenseContext
    const expense = ctx.state.expense
    const { description, amount, fee } = ctx.request.body as {
        description: string;
        amount: number;
        fee: number;
    };
    if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
        ctx.status = 400;
        ctx.body = { error: "Invalid amount" };
        return;
    }
    if (fee !== undefined && (typeof fee !== "number" || fee <= 0)) {
        ctx.status = 400;
        ctx.body = { error: "Invalid fee" };
        return;
    }


    expense.description = description ?? expense.description;
    expense.amount = amount ?? expense.amount;
    expense.fee = fee ?? expense.fee;
    await expenseRepository.save(expense);

    ctx.status = 200;
    ctx.body = expense;
});

router.delete(":expense_id", async (rawCtx) => {
    const ctx = rawCtx as ExpenseContext
    const expense = ctx.state.expense

    const delRes = await expenseRepository.delete({
        id: expense.id,
        paidByUserId: expense.paidByUserId,
        groupId: expense.groupId,
    });
    if (!delRes.affected) {
        ctx.status = 404;
        ctx.body = {
            error: "Expense not found or you do not have permission to delete it",
        };
        return;
    }

    ctx.status = 204;
});

export default router;
