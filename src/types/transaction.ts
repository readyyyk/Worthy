import { z } from 'zod';

export const TagsSchema = z.array(z.string());

export const SimpleTransactionSchema = z.object({
    id: z.string().or(z.number()),
    description: z.string(),
    amount: z.number(),
    isIncome: z.boolean(),
});

export const TransactionSchema = SimpleTransactionSchema.extend({
    date: z.string(),
    tags: TagsSchema,
});

export type SimpleTransaction = z.infer<typeof SimpleTransactionSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
