import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/User.js';

const router = new Router({ prefix: '/api/users' });
const userRepository = AppDataSource.getRepository(User);

router.get('/', async (ctx) => {
    const users = await userRepository.find();
    ctx.body = users;
});

router.post('/', async (ctx) => {
    const userData = ctx.request.body as { name: string; email: string }
    const user = userRepository.create(userData);
    await userRepository.save(user);
    ctx.body = user;
    ctx.status = 201;
});

export default router;
