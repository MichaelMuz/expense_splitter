import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { Group, GroupMembership } from '../entities/Group.js';
import { Expense, ExpenseSplit } from '../entities/Expense.js';

const router = new Router({ prefix: '/api' });
const groupMembershipRepository = AppDataSource.getRepository(GroupMembership);
const groupRepository = AppDataSource.getRepository(Group);
const expenseRepository = AppDataSource.getRepository(Expense);
const expenseSplitRepository = AppDataSource.getRepository(ExpenseSplit);

router.get('/groups/:group_id/expenses', async (ctx) => {
    const userId = Number(ctx.state['user']['id'])
    if (isNaN(userId)) {
        ctx.status = 500
        // Impossible state
        ctx.body = { error: 'Internal Error' }
        return
    }
    const groupId = Number(ctx.params['group_id'])
    if (isNaN(groupId)) {
        ctx.status = 400
        ctx.body = { error: 'Group id required' }
        return
    }
    const group = await groupMembershipRepository.findOne({
        where: { userId, groupId },
    })
    if (!group) {
        ctx.status = 403
        ctx.body = { error: 'User not part of group or group does not exist' }
        return

    }
    const expenses = await expenseRepository.find({
        where: { groupId },
    })

    ctx.body = expenses
})

router.post('/groups/:group_id/expenses', async (ctx) => {
    const userId = Number(ctx.state['user']['id'])
    if (isNaN(userId)) {
        ctx.status = 500
        // Impossible state
        ctx.body = { error: 'Internal Error' }
        return
    }
    const groupId = Number(ctx.params['group_id'])
    if (isNaN(groupId)) {
        ctx.status = 400
        ctx.body = { error: 'Group id required' }
        return
    }
    const group = await groupMembershipRepository.findOne({
        where: { userId, groupId },
    })
    if (!group) {
        ctx.status = 403
        ctx.body = { error: 'User not part of group or group does not exist' }
        return

    }
    const { description, amount, fee } = ctx.request.body as { description: string, amount: number, fee: number }
    if (!description || typeof amount !== 'number' || typeof fee !== 'number') {
        ctx.status = 400
        ctx.body = { error: 'Invalid expense data' }
        return
    }
    const expense = expenseRepository.create({ paidByUserId: userId, groupId, description, amount, fee })
    await expenseRepository.save(expense)

    ctx.status = 201
    ctx.body = expense
})

router.put('/groups/:group_id/expenses/:expense_id', async (ctx) => {
    const userId = Number(ctx.state['user']['id'])
    if (isNaN(userId)) {
        ctx.status = 500
        // Impossible state
        ctx.body = { error: 'Internal Error' }
        return
    }
    const groupId = Number(ctx.params['group_id'])
    if (isNaN(groupId)) {
        ctx.status = 400
        ctx.body = { error: 'Group id required' }
        return
    }

    const expenseId = Number(ctx.params['expense_id'])
    if (isNaN(expenseId)) {
        ctx.status = 400
        ctx.body = { error: 'Expense id required' }
        return
    }

    const { description, amount, fee } = ctx.request.body as { description: string, amount: number, fee: number }
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
        ctx.status = 400
        ctx.body = { error: 'Invalid amount' }
        return
    }
    if (fee !== undefined && (typeof fee !== 'number' || fee <= 0)) {
        ctx.status = 400
        ctx.body = { error: 'Invalid fee' }
        return
    }

    const expense = await expenseRepository.findOne({ where: { id: expenseId, paidByUserId: userId, groupId } })
    if (!expense) {
        ctx.status = 404
        ctx.body = { error: 'Expense not found or you do not have permission to edit it' }
        return
    }

    expense.description = description ?? expense.description
    expense.amount = amount ?? expense.amount
    expense.fee = fee ?? expense.fee
    await expenseRepository.save(expense)

    ctx.status = 200
    ctx.body = expense
})

router.delete('/groups/:group_id/expenses/:expense_id', async (ctx) => {
    const userId = Number(ctx.state['user']['id'])
    if (isNaN(userId)) {
        ctx.status = 500
        // Impossible state
        ctx.body = { error: 'Internal Error' }
        return
    }
    const groupId = Number(ctx.params['group_id'])
    if (isNaN(groupId)) {
        ctx.status = 400
        ctx.body = { error: 'Group id required' }
        return
    }

    const expenseId = Number(ctx.params['expense_id'])
    if (isNaN(expenseId)) {
        ctx.status = 400
        ctx.body = { error: 'Expense id required' }
        return
    }

    const delRes = await expenseRepository.delete({ id: expenseId, paidByUserId: userId, groupId })
    if (!delRes.affected) {
        ctx.status = 404
        ctx.body = { error: 'Expense not found or you do not have permission to delete it' }
        return
    }

    ctx.status = 204
})

export default router;
