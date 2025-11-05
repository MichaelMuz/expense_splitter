import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Group, GroupMembership, User } from './entities/User.js';
import { POSTGRES_DB, POSTGRES_PASSWORD } from './env-const.js';


export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
    synchronize: true,
    logging: true,
    entities: [User, Group, GroupMembership],
});
