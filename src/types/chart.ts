import { z } from 'zod';

export const DataSchema = z.array(
    z.object({
        id: z.string().or(z.number()),
        data: z.array(
            z.object({
                x: z.number().or(z.string()).or(z.date()),
                y: z.number().or(z.string()).or(z.date()),
            }),
        ),
    }),
);

export type Data = z.infer<typeof DataSchema>;
