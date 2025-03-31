import { int, sqliteTable } from 'drizzle-orm/sqlite-core';
import { shoppingSessionsTable } from '@/server/db/tables/shopping_session';
import { transactionsTable } from '@/server/db/tables/transaction';

export const sessionTransactionsTable = sqliteTable('session_transactions', {
    id: int('id').primaryKey({ autoIncrement: true }).notNull(),
    sessionId: int('session_id').notNull().references(() => shoppingSessionsTable.id, { onDelete: 'cascade' }),
    transactionId: int('transaction_id').notNull().references(() => transactionsTable.id, { onDelete: 'cascade' }),
});