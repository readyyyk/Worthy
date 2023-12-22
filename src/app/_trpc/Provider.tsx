'use client';

import { FC, ReactNode, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';

import { trpc } from './trpc';

interface Props {
    children: ReactNode;
}
const TRPCProvider: FC<Props> = ({ children }) => {
    const [queryClient, _] = useState(() => new QueryClient({}));
    const [trpcClient, __] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: '/api/trpc',
                }),
            ],
        }),
    );
    return (
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
};

export default TRPCProvider;
