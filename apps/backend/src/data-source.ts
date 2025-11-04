import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Group, GroupMembership, User } from './entities/User.js';

const { POSTGRES_PASSWORD, POSTGRES_DB } = process.env;

if (!POSTGRES_PASSWORD || !POSTGRES_DB) {
    throw new Error('Missing required environment variables');
}

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
