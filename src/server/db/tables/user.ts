import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    primaryCurrency: text('primary_currency', { length: 3 }).notNull().default('BYN'),
    balance: integer('balance').notNull().default(0),
    username: text('username').notNull(),
    password: text('password').notNull(),
    image: text('image').notNull(),
});
