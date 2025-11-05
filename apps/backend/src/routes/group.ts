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

    const group = groupRepository.create({name:groupName})
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

export default router;
