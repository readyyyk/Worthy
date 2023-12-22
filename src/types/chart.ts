import { z } from 'zod';
import { TransactionSchema } from '@/types/transaction';

export const DataItem = TransactionSchema.pick({ amount: true, date: true });
export const DataSchema = z.array(DataItem);
export const DataItemSerializedSchema = DataItem.merge(
    z.object({ date: z.string() }),
);
export const DataSerializedSchema = z.array(DataItemSerializedSchema);

export type Data = z.infer<typeof DataSchema>;
export type DataSerialized = z.infer<typeof DataSerializedSchema>;
