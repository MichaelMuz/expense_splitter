import Router from '@koa/router';
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/User.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../env-const.js';
import type { RegisterResponse, LoginResponse, RegisterRequest, LoginRequest } from 'lib/route-types/auth-types.js';

const router = new Router({ prefix: '/api/auth' });
const userRepository = AppDataSource.getRepository(User);

router.post('/register', async (ctx) => {
    const { name, email } = ctx.request.body as RegisterRequest
    if (!name || !email) {
        ctx.status = 400
        ctx.body = { error: 'Name and email are required' };
        return
    }

    const newUser = userRepository.create({ name, email });
    try {
        await userRepository.save(newUser);

        ctx.status = 201;
        ctx.body = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
        } satisfies RegisterResponse;

    } catch (error: any) {
        if (error.code === '23505') {
            ctx.status = 409;
            ctx.body = { error: 'Email already exists' };
        }
        else {
            throw error;
        }
    }
});

router.post('/login', async (ctx) => {
    const { email } = ctx.request.body as LoginRequest
    if (!email) {
        ctx.status = 400
        ctx.body = { error: 'Email not provided' };
        return
    }
    const user = await userRepository.findOneBy({ email });
    if (!user) {
        ctx.status = 401
        ctx.body = { error: 'Invalid email or password' };
        return
    }

    const payload = {
        id: user.id,
        email: user.email,
        name: user.name
    };

    const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1d'
    });

    ctx.status = 200;
    ctx.body = {
        token: token,
        user: payload
    } satisfies LoginResponse;

});

export default router;
