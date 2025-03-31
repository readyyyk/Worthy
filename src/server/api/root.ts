import { createTRPCRouter } from '@/server/api/trpc';
import { authRouter } from '@/server/api/routers/auth';
import { usersRouter } from '@/server/api/routers/users';
import { transactionsRouter } from '@/server/api/routers/transactions';
import { templatesRouter } from '@/server/api/routers/templates';
import { shoppingSessionsRouter } from '@/server/api/routers/shopping-sessions';


export const appRouter = createTRPCRouter({
    auth: authRouter,
    users: usersRouter,
    transactions: transactionsRouter,
    templates: templatesRouter,
    shoppingSessions: shoppingSessionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
