import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { table_users } from '@/db/schemas';

/*
{
    id: ZodNumber,
    username: ZodString,
    password: ZodString,
    registeredAt: ZodOptional<ZodDate>,
    balance: ZodOptional<ZodNumber>,
    primaryCurrency: ZodString,
}
*/

export const InsertUserSchema = createInsertSchema(table_users).omit({
    id: true,
});
export const UserSchema = createSelectSchema(table_users);

export type User = z.infer<typeof UserSchema>;
export type InsertUser = z.infer<typeof InsertUserSchema>;
