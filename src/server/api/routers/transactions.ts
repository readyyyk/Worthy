import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { desc, eq, sql } from 'drizzle-orm';
import { transactionsTable } from '@/server/db/tables/transaction';
import { TransactionCreateSchema } from '@/types/transaction';
import { z } from 'zod';
import { tagsTable } from '@/server/db/tables/tags';
import { usersTable } from '@/server/db/tables/user';

export const transactionsRouter = createTRPCRouter({
    getRecent: protectedProcedure.query(async ({ ctx }) => {
        const resp = await ctx.db.select()
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
