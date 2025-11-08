import type { Context, Next } from "koa";
import { AppDataSource } from "./data-source.js";
import { User } from "./entities/User.js";
import type { AuthContext, GroupContext, JWTContext } from "./contexts.js";
import { GroupMembership } from "./entities/Group.js";
import { Expense } from "./entities/Expense.js";

const userRepository = AppDataSource.getRepository(User);
const groupMembershipRepository = AppDataSource.getRepository(GroupMembership);
const expenseRepository = AppDataSource.getRepository(Expense);


export async function globalErrorHandler(ctx: Context, next: Next) {
    return next().catch(error => {
        ctx.status = 500;
        ctx.body = { error: "Internal Error" };
        console.error(error);
    })
}

export async function userHydration(rawCtx: Context, next: Next) {
    const ctx = (rawCtx as JWTContext)
    const user = await userRepository.findOne({ where: { id: ctx.state.user.id } })
    if (!user) {
        ctx.status = 401;
        ctx.body = { error: 'User not found' };
        return;
    }
    ctx.state.user = user;
    await next();
}


export async function expenseHydration(rawCtx: Context, next: Next) {
    const ctx = (rawCtx as GroupContext & { params: { expense_id: string } })
    const expenseId = Number(ctx.params.expense_id)

    if (isNaN(expenseId)) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid group id' };
        return;
    }
    const expense = await expenseRepository.findOne({
        where: {
            id: expenseId,
            paidByUserId: ctx.state.user.id,
            groupId: ctx.state.groupMembership.groupId
        }
    });
    if (!expense) {
        ctx.status = 403;
        ctx.body = { error: 'User does not own expense or expense does not exist' };
        return;
    }

    ctx.state.expense = expense
    await next();
}

export async function groupMembershipHydration(rawCtx: Context, next: Next) {
    const ctx = (rawCtx as AuthContext & { params: { group_id: string } })
    const groupId = Number(ctx.params.group_id)

    if (isNaN(groupId)) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid group id' };
        return;
    }
    const membership = await groupMembershipRepository.findOne({
        where: {
            userId: ctx.state.user.id,
            groupId
        }
    });
    if (!membership) {
        ctx.status = 403;
        ctx.body = { error: 'User not part of group or group does not exist' };
        return;
    }

    ctx.state.groupMembership = membership;
    await next();
}
