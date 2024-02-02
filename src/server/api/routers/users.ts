import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { usersTable } from '@/server/db/tables/user';
import { eq } from 'drizzle-orm';


export const usersRouter = createTRPCRouter({
    me: protectedProcedure.query(async ({ ctx }) => {
        const usersRes = await ctx.db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, ctx.session.user.id))
            .limit(1);

        if (!usersRes[0]) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found.',
            });
        }

        const { password: _, ...rest } = usersRes[0];
        return rest;
    }),

    getBalance: protectedProcedure.query(async ({ ctx }) => {
        const res = await ctx.db
            .select({
                balance: usersTable.balance,
                currency: usersTable.primaryCurrency,
            })
            .from(usersTable)
            .where(eq(usersTable.id, ctx.session.user.id))
            .limit(1);

        if (!res[0]) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found.',
            });
        }

        res[0].balance /= 100;
        return res[0];
    }),
});
