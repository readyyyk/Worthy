import { appRouter } from '@/server';
import { httpBatchLink } from '@trpc/client';

export const serverTrpc = appRouter.createCaller({
    links: [httpBatchLink({ url: '/api/trpc' })],
});
