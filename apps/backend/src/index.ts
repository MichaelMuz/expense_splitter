import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { AppDataSource } from './data-source.js';
import userRouter from './routes/users.js';

const app = new Koa();

app.use(bodyParser());
app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

AppDataSource.initialize()
    .then(() => {
        console.log('Database connected!');
        app.listen(3000, () => {
            console.log('Server running on http://localhost:3000');
        });
    })
    .catch((error) => console.log('Database connection error:', error));
