import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { table_transactions } from '@/db/schemas';
import transactions from '@/app/Transactions';

/*
{
    id: z.ZodNumber,
    date: z.ZodOptional<z.ZodDate>,
    ownerId: z.ZodNumber,
    description: z.ZodString,
    amount: z.ZodNumber,
    currency: z.ZodString,
    isIncome: z.ZodBoolean,
    tags: z.ZodOptional<z.ZodString>,
}
*/

export const TransactionSchema = createSelectSchema(table_transactions, {
    tags: z.array(z.string()).optional(),
});
export const SerializedTransactionSchema = TransactionSchema.setKey(
    'date',
    z.string(),
);
export const InsertTransactionSchema = createInsertSchema(table_transactions, {
    id: z.null(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type InsertTransaction = z.infer<typeof InsertTransactionSchema>;
export type SerializedTransaction = z.infer<typeof SerializedTransactionSchema>;
