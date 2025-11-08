import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { Group, GroupMembership } from '../entities/Group.js';
import { groupMembershipHydration } from '../middleware.js';
import type { AuthContext, GroupContext } from '../contexts.js';

const router = new Router({ prefix: '/api/groups' });
const groupMembershipRepository = AppDataSource.getRepository(GroupMembership);
const groupRepository = AppDataSource.getRepository(Group);

router.post('/', async (rawCtx) => {
    const ctx = rawCtx as AuthContext;

    const { name: groupName } = ctx.request.body as { name: string }
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

        return { group, membership: groupMembership };
    });

    ctx.status = 201
    ctx.body = {
        message: 'Group created successfully',
        group: result.group,
        membership: result.membership
    };
})


router.get('/', async (rawCtx) => {
    const ctx = rawCtx as AuthContext
    const memberships = await groupMembershipRepository.find({
        where: { userId: ctx.state.user.id },
        relations: ['group']
    })
    const groups = memberships.map(m => m.group)

    ctx.body = groups
})


// in the future this will be api/groups/:id/members and a put/post with no body, will validate against invite table
router.post('/join', async (rawCtx) => {
    const ctx = rawCtx as AuthContext
    const { inviteCode } = ctx.request.body as { inviteCode: string }
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
})

router.use('/:group_id', groupMembershipHydration)

router.get('', async rawCtx => {
    const ctx = rawCtx as GroupContext

    const members = await groupMembershipRepository.find(
        { where: { groupId: ctx.state.groupMembership.groupId }, relations: ['group', 'user'] }
    )
    const group = ctx.state.groupMembership.group

    ctx.body = {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt,
        members: members.map(m => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt,
            // later balance per user
        }))
        // total group expenses
        // my balance
        // all expenses from most recent
    }

})

export default router;
