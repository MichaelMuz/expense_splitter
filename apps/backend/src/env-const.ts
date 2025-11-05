function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

const POSTGRES_PASSWORD = getEnv('POSTGRES_PASSWORD');
const POSTGRES_DB = getEnv('POSTGRES_DB');
const JWT_SECRET = getEnv('JWT_SECRET');

export { POSTGRES_DB, POSTGRES_PASSWORD, JWT_SECRET };;
