import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { GroupMembership} from '../entities/User.js';

const router = new Router({ prefix: '/api/users' });
const groupMembershipRepository = AppDataSource.getRepository(GroupMembership);

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

export default router;
