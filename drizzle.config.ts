import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const config: Config = {
    schema: 'src/db/*',
    out: '/drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.POSTGRES_URL!,
    },
};

export default config;
