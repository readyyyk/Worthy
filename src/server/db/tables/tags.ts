import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { transactionsTable } from '@/server/db/tables/transaction';

export const tagsTable = sqliteTable('tags', {
    id: int('id').primaryKey({ autoIncrement: true }).notNull(),
    transactionId: int('transaction_id').notNull().references(() => transactionsTable.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
});
