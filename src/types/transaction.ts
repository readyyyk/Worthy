import type { InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { transactionsTable } from '@/server/db/tables/transaction';

export type Transaction = InferSelectModel<typeof transactionsTable>;
export const TransactionCreateSchema = createInsertSchema(transactionsTable);
