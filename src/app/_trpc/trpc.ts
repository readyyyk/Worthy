import { createTRPCReact } from '@trpc/react-query';
import { appRouter, AppRouter } from '@/server';

export const trpc = createTRPCReact<AppRouter>({});
