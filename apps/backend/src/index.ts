import Koa from 'koa';
import jwt from 'koa-jwt';
import bodyParser from 'koa-bodyparser';
import { AppDataSource } from './data-source.js';
import authRouter from './routes/auth.js';
import groupRouter from './routes/group.js';
import { JWT_SECRET } from './env-const.js';

const app = new Koa();

app.use(async function (ctx, next) {
    return next().catch((err) => {
        if (401 == err.status) {
                ctx.body = { error: "Unauthorized", message: "Token required" };
        } else {
            throw err;
        }
    });
});

app.use(bodyParser());

app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

app.use(jwt({ secret: JWT_SECRET, passthrough: false }));

app.use(groupRouter.routes());
app.use(groupRouter.allowedMethods());

AppDataSource.initialize()
    .then(() => {
        console.log('Database connected!');
        app.listen(3000, () => {
            console.log('Server running on http://localhost:3000');
        });
    })
    .catch((error) => console.log('Database connection error:', error));
