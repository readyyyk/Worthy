import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from '@/server/db/tables/user';
import { sql } from 'drizzle-orm';

export const transactionsTable = sqliteTable('transactions', {
    id: int('id').primaryKey({ autoIncrement: true }).notNull(),
    ownerId: int('owner_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    amount: int('amount').notNull(),
    isIncome: int('is_income', { mode: 'boolean' }).notNull(),
    currency: text('currency', { length: 3 }).notNull(),
    createdAt: int('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    description: text('description').notNull(),
});
