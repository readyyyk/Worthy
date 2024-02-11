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

            const r1 = ctx.db.select({
                    id: transactionsTable.id,
                    isIncome: transactionsTable.isIncome,
                    amount: transactionsTable.amount,
                    currency: transactionsTable.currency,
                    description: transactionsTable.description,
                    createdAt: transactionsTable.createdAt,
                    tags: sql<string | null>`GROUP_CONCAT(${tagsTable.text})`.as('tags'),
                })
                .from(transactionsTable)
                .where(and(
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                    like(transactionsTable.description, `%${input.description}%`),
                ))
                .offset((input.page - 1) * input.perPage)
                .groupBy(transactionsTable.id)
                .orderBy(desc(transactionsTable.createdAt))
                .limit(input.perPage)
                .leftJoin(tagsTable, eq(tagsTable.transactionId, transactionsTable.id));

            let resp: (Transaction & { tags: string | null })[];

            if (input.tags?.length) {
                const sq = r1.as('sq');
                resp = await ctx.db
                    .select()
                    .from(sq)
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore - according to drizzleOrm docs, aliased field is used correctly, but aliased have different signature
                    .where(like(sq.tags, `%${input.tags.sort().join('%')}%`));
            } else {
                resp = await r1.execute();
            }

            const result = resp.reduce((acc, el) => {
                const tags = el.tags?.split(',') ?? [];
                return [
                    ...acc,
                    {
                        ...el,
                        tags: tags,
                        amount: el.amount / 100,
                    },
                ];
            }, [] as (Transaction & { tags: string[] })[]);

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
