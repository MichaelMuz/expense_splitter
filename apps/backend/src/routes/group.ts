import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { Group, GroupMembership } from '../entities/User.js';

const router = new Router({ prefix: '/api/users' });
const groupMembershipRepository = AppDataSource.getRepository(GroupMembership);
const groupRepository = AppDataSource.getRepository(Group);

router.get('/:id/groups', async (ctx) => {
    const userId = Number(ctx.params['id'])
    if (isNaN(userId)) {
        ctx.status = 400
        ctx.body = { error: 'Invalid Id' }
        return
    }
    const memberships = await groupMembershipRepository.find({
        where: { userId },
        relations: ['group']
    })
    const groups = memberships.map(m => m.group)

    ctx.body = groups
})

router.post('/groups', async (ctx) => {
    const groupName = ctx.request.body as {name: string}
    const group = groupRepository.create(groupName)
    await groupRepository.save(group)
})

export default router;
