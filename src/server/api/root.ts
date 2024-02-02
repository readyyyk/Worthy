import { createTRPCRouter } from '@/server/api/trpc';
import { authRouter } from '@/server/api/routers/auth';
import { usersRouter } from '@/server/api/routers/users';
import { transactionsRouter } from '@/server/api/routers/transactions';


export const appRouter = createTRPCRouter({
    auth: authRouter,
    users: usersRouter,
    transactions: transactionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
