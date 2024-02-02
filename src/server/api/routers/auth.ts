import { z } from 'zod';

import {
    createTRPCRouter,
    publicProcedure,
} from '@/server/api/trpc';

import { usersTable } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const authRouter = createTRPCRouter({
    login: publicProcedure.input(z.object({
        username: z.string(),
        password: z.string(),
    })).query(async ({ ctx, input }) => {
        const usersRes = await ctx.db.select().from(usersTable).where(eq(usersTable.username, input.username));

        const user = usersRes[0];
        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found.',
            });
        }

        const isValid = await bcrypt.compare(input.password, user.password);

        if (!isValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid password.',
            });
        }

        const { password: _, ...rest } = user;
        return rest;
    }),

    register: publicProcedure.input(z.object({
        username: z.string(),
        password: z.string(),
        image: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const usersRes = await ctx.db.select().from(usersTable).where(eq(usersTable.username, input.username));

        if (usersRes.length > 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'User already exists.',
            });
        }

        const password = await bcrypt.hash(input.password, SALT_ROUNDS);
        input.image = input.image ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(input.username)}`;

        await ctx.db.insert(usersTable).values({
            username: input.username,
            password: password,
            image: input.image,
        });

        return true;
    }),
});
