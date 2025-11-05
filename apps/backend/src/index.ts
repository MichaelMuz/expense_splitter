import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { AppDataSource } from './data-source.js';
import authRouter from './routes/auth.js';

const app = new Koa();

app.use(bodyParser());
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

AppDataSource.initialize()
    .then(() => {
        console.log('Database connected!');
        app.listen(3000, () => {
            console.log('Server running on http://localhost:3000');
        });
    })
    .catch((error) => console.log('Database connection error:', error));
