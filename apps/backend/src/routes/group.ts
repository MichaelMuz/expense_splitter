import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { Group, GroupMembership } from '../entities/User.js';

const router = new Router({ prefix: '/api/groups' });
const groupMembershipRepository = AppDataSource.getRepository(GroupMembership);
const groupRepository = AppDataSource.getRepository(Group);

router.get('/', async (ctx) => {
    const userId = Number(ctx.state['user']['id'])
    if (isNaN(userId)) {
        ctx.status = 500
        // Impossible state
        ctx.body = { error: 'Internal Error' }
        return
    }
    const memberships = await groupMembershipRepository.find({
        where: { userId },
        relations: ['group']
    })
    const groups = memberships.map(m => m.group)

    ctx.body = groups
})

router.post('/', async (ctx) => {
    const userId = Number(ctx.state['user']['id'])
    if (isNaN(userId)) {
        ctx.status = 500
        // Impossible state
        ctx.body = { error: 'Internal Error' }
        return
    }
    const { name: groupName } = ctx.request.body as { name: string }
    if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { error: 'Group name is required.' };
        return;
    }

    const group = groupRepository.create({ name: groupName })
    await groupRepository.save(group)

    const groupMembership = groupMembershipRepository.create({ userId, groupId: group.id, role: 'admin' })
    await groupMembershipRepository.save(groupMembership)

    ctx.status = 201
    ctx.body = {
        message: 'Group created successfully',
        group: group,
        membership: groupMembership
    };
})

// in the future this will be api/groups/:id/members and a put/post with no body, will validate against invite table
router.post('/join', async (ctx) => {
    const userId = Number(ctx.state['user']['id'])
    if (isNaN(userId)) {
        ctx.status = 500
        // Impossible state
        ctx.body = { error: 'Internal Error' }
        return
    }
    const { inviteCode } = ctx.request.body as { inviteCode: string }
    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { error: 'Invite code is required.' };
        return;
    }
    const group = await groupRepository.findOne({ where: { inviteCode: inviteCode.trim() } })
    if (!group) {
        ctx.status = 404
        // Impossible state
        ctx.body = { error: 'Invalid invite code' }
        return
    }
    const membership = groupMembershipRepository.create({ userId, groupId: group.id, role: 'member' })
    await groupMembershipRepository.save(membership)
})

export default router;
