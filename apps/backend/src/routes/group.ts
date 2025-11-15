import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { Group, GroupMembership } from '../entities/Group.js';
import { groupMembershipHydration } from '../middleware.js';
import type { AuthContext, GroupContext } from '../contexts.js';
import type { CreateGroupRequest, CreateGroupResponse, GetGroupResponse, GetGroupsResponse, JoinGroupRequest, JoinGroupResponse } from "lib/route-types/group-types.js"

const router = new Router({ prefix: '/api/groups' });
const groupMembershipRepository = AppDataSource.getRepository(GroupMembership);
const groupRepository = AppDataSource.getRepository(Group);

router.post('/', async (rawCtx) => {
    const ctx = rawCtx as AuthContext;

    const { name: groupName } = ctx.request.body as CreateGroupRequest
    if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { error: 'Group name is required.' };
        return;
    }

    const result = await AppDataSource.transaction(async (entityManager) => {
        const group = entityManager.create(Group, { name: groupName });
        await entityManager.save(group);

        const groupMembership = entityManager.create(GroupMembership, {
            userId: ctx.state.user.id,
            groupId: group.id,
            role: 'admin'
        });
        await entityManager.save(groupMembership);

        return { group } satisfies CreateGroupResponse;
    });

    ctx.status = 201
    ctx.body = result;
})


router.get('/', async (rawCtx) => {
    const ctx = rawCtx as AuthContext
    const memberships = await groupMembershipRepository.find({
        where: { userId: ctx.state.user.id },
        relations: ['group']
    })
    const groups = { groups: memberships.map(m => m.group) } satisfies GetGroupsResponse

    ctx.body = groups
})


// in the future this will be api/groups/:id/members and a put/post with no body, will validate against invite table
router.post('/join', async (rawCtx) => {
    const ctx = rawCtx as AuthContext
    const { inviteCode } = ctx.request.body as JoinGroupRequest
    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { error: 'Invite code is required.' };
        return;
    }

    const group = await groupRepository.findOne({ where: { inviteCode: inviteCode.trim() } })
    if (!group) {
        ctx.status = 404
        ctx.body = { error: 'Invalid invite code' }
        return
    }

    const existingMembership = await groupMembershipRepository.findOne({
        where: { userId: ctx.state.user.id, groupId: group.id }
    });
    if (existingMembership) {
        ctx.status = 400;
        ctx.body = { error: 'Already a member of this group' };
        return;
    }
    const membership = groupMembershipRepository.create({ userId: ctx.state.user.id, groupId: group.id, role: 'member' })
    await groupMembershipRepository.save(membership)
    ctx.status = 201;
    ctx.body = { group } satisfies JoinGroupResponse;
})

router.use('/:group_id', groupMembershipHydration)

router.get('/:group_id', async rawCtx => {
    const ctx = rawCtx as GroupContext
    const group = ctx.state.groupMembership.group

    const memberships = await groupMembershipRepository.find(
        { where: { groupId: group.id }, relations: ['user'] }
    )
    const members = memberships.map(m => ({ user: m.user, role: m.role, joinedAt: m.joinedAt }))

    // later balance per user
    // total group expenses
    // my balance
    // all expenses from most recent
    ctx.body = { group, members } satisfies GetGroupResponse
})

export default router;
