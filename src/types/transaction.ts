import { z } from 'zod';

export const TagsSchema = z.array(z.string());

export const SimpleTransactionSchema = z.object({
    id: z.number(),
    ownerId: z.number(),
    description: z.string(),
    amount: z.number(),
    currency: z.string(),
    isIncome: z.boolean(),
});

export const TransactionSchema = SimpleTransactionSchema.extend({
    date: z.date(),
    tags: TagsSchema,
});

export type SimpleTransaction = z.infer<typeof SimpleTransactionSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
