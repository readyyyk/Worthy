import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '@/env';
import * as schema from './schema';
import { DefaultLogger } from 'drizzle-orm/logger';

const logger = env.NODE_ENV === 'development' ? new DefaultLogger() : undefined;
const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_TOKEN });
export const db = drizzle(client, { schema, logger });
