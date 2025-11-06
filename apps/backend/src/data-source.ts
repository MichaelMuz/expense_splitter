import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { POSTGRES_DB, POSTGRES_PASSWORD } from './env-const.js';
import { Group, GroupMembership } from './entities/Group.js';


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
