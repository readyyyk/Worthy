'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loggerLink, unstable_httpBatchStreamLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import { type ReactNode, useState, useEffect } from 'react';

import { type AppRouter } from '@/server/api/root';
import { getUrl, transformer } from './shared';
import { setupPersistentQueryClient, CACHE_CONFIG } from '@/lib/persistQueryClient';
import { registerServiceWorker } from '@/lib/serviceWorker';

export const api = createTRPCReact<AppRouter>();


export function TRPCReactProvider(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                staleTime: CACHE_CONFIG.default.staleTime,
                cacheTime: CACHE_CONFIG.default.cacheTime,
            },
        },
    }));

    // Настраиваем персистентное хранение кеша
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Настраиваем персистентное хранение кеша
            setupPersistentQueryClient(queryClient);
            
            // Регистрируем Service Worker для PWA
            registerServiceWorker();
        }
    }, [queryClient]);

    const [trpcClient] = useState(() =>
        api.createClient({
            transformer,
            links: [
                loggerLink({
                    enabled: (op) =>
                        process.env.NODE_ENV === 'development' ||
                        (op.direction === 'down' && op.result instanceof Error),
                }),
                unstable_httpBatchStreamLink({
                    url: getUrl(),
                }),
            ],
        }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <api.Provider client={trpcClient} queryClient={queryClient}>
                {props.children}
            </api.Provider>
        </QueryClientProvider>
    );
}
