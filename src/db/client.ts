import env from 'dotenv';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { createPool } from '@vercel/postgres';
import * as schema from './schemas';

env.config();
env.config({ path: `.env.local`, override: true });

const pool = createPool({
    connectionString: process.env.POSTGRES_URL!,
});

export const db = drizzle(pool, { schema });
