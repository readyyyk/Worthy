import {
    boolean,
    integer,
    pgTable,
    serial,
    smallint,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';

/* Tables */
export const table_users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 64 }).notNull().unique(),
    password: text('password').notNull(),
    registeredAt: timestamp('created_at').defaultNow().notNull(),
    balance: integer('balance').notNull().default(0),
    primaryCurrency: varchar('primary_currency', { length: 3 }).notNull(),
});

export const table_transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    ownerId: smallint('owner_id')
        .notNull()
        .references(() => table_users.id),
    description: varchar('description', { length: 256 }).notNull(),
    amount: smallint('amount').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    isIncome: boolean('is_income').notNull(),
    date: timestamp('date').defaultNow().notNull(),
    tags: varchar('tags', { length: 64 }).array(),
});
