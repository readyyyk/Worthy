import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from '@/server/db/tables/user';

export const templatesTable = sqliteTable('templates', {
    id: int('id').primaryKey({ autoIncrement: true }).notNull(),
    ownerId: int('owner_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    amount: int('amount').notNull(),
    isIncome: int('is_income', { mode: 'boolean' }).notNull(),
    currency: text('currency', { length: 3 }).notNull(),
    description: text('description').notNull(),
});