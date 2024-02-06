import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { transactionsTable } from '@/server/db/tables/transaction';
import { TransactionCreateSchema } from '@/types/transaction';
import { z } from 'zod';
import { tagsTable } from '@/server/db/tables/tags';
import { usersTable } from '@/server/db/tables/user';

export const transactionsRouter = createTRPCRouter({
    getList: protectedProcedure
        .input(z.object({
            page: z.number(),
            perPage: z.number(),
            description: z.string().optional(),
            tags: z.array(z.string()).optional(),
        }))
        .query(async ({ ctx, input }) => {
            type Transaction = Omit<typeof transactionsTable.$inferSelect, 'ownerId'>;
            const resp = await ctx.db
                .select({
                    id: transactionsTable.id,
                    isIncome: transactionsTable.isIncome,
                    amount: transactionsTable.amount,
                    currency: transactionsTable.currency,
                    description: transactionsTable.description,
                    createdAt: transactionsTable.createdAt,
                    tagText: tagsTable.text,
                    tagId: tagsTable.id,
                })
                .from(transactionsTable)
                .where(and(
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                    like(transactionsTable.description, `%${input.description}%`),
                ))
                .orderBy(desc(transactionsTable.createdAt))
                .offset((input.page - 1) * input.perPage)
                .limit(input.perPage)
                .leftJoin(tagsTable, eq(tagsTable.transactionId, transactionsTable.id));

            const result = resp.reduce((acc, el) => {
                const found = acc.find((cur) => cur.id === el.id);
                if (found) {
                    if (!el.tagId || !el.tagText) {
                        return acc;
                    }
                    found.tags.push({
                        id: el.tagId,
                        text: el.tagText,
                    });
                    return acc;
                }

                acc.push({
                    ...el,
                    amount: el.amount / 100,
                    tags: el.tagId && el.tagText ? [{ id: el.tagId, text: el.tagText }] : [],
                });
                return acc;
            }, [] as (Transaction & { tags: { id: number, text: string }[] })[]);

            if (input.tags?.length) {
                return result.filter((el) => {
                    return input.tags?.every((tag) =>
                        el.tags.some(a => a.text === tag),
                    );
                });
            }
            return result;
        }),
    getRecent: protectedProcedure.query(async ({ ctx }) => {
        const resp = await ctx.db
            .select()
            .from(transactionsTable)
            .where(eq(transactionsTable.ownerId, ctx.session.user.id))
            .orderBy(desc(transactionsTable.createdAt))
            .limit(3);


        return resp?.map(el => {
            return {
                ...el,
                amount: el.amount / 100,
            };
        });
    }),

    create: protectedProcedure
        .input(TransactionCreateSchema
            .omit({ ownerId: true })
            .extend({ tags: z.array(z.string()) }),
        )
        .mutation(async ({ ctx, input }) => {
            // TODO use Transaction
            const { tags, ...rest } = input;
            const formatted = Math.floor(input.amount * 100);
            const toInsert: (typeof transactionsTable.$inferInsert) = {
                ...rest,
                amount: formatted,
                ownerId: ctx.session.user.id,
            };

            const resp = await ctx.db
                .insert(transactionsTable)
                .values(toInsert)
                .returning({ insertedId: transactionsTable.id });


            // const b =
            if (input.isIncome) {
                await ctx.db
                    .update(usersTable)
                    .set({ balance: sql`${usersTable.balance} + ${formatted}` })
                    .where(eq(usersTable.id, ctx.session.user.id));
            } else {
                await ctx.db
                    .update(usersTable)
                    .set({ balance: sql`${usersTable.balance} - ${formatted}` })
                    .where(eq(usersTable.id, ctx.session.user.id));
            }

            if (!tags?.length) {
                return true;
            }

            const tagsValues: (typeof tagsTable.$inferInsert)[] = tags.map((el) => {
                return {
                    transactionId: Number(resp[0]!.insertedId),
                    text: el,
                };
            });

            await ctx.db
                .insert(tagsTable)
                .values(tagsValues);

            return true;
        }),
});
