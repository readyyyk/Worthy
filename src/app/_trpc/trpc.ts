import { createTRPCReact } from '@trpc/react-query';

import { AppRouter, appRouter } from '@/server';

export const trpc = createTRPCReact<AppRouter>({});
