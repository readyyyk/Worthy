import { z } from 'zod';

export const DataSchema = z.array(
    z.object({
        amount: z.number(),
        date: z.date(),
    }),
);

export type Data = z.infer<typeof DataSchema>;
