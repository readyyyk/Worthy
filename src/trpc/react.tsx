'use client';

import { QueryClient } from '@tanstack/react-query';
import { loggerLink, unstable_httpBatchStreamLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import { type ReactNode, useState } from 'react';

import { type AppRouter } from '@/server/api/root';
import { getUrl, transformer } from './shared';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

export const api = createTRPCReact<AppRouter>();

/* eslint-disable @typescript-eslint/no-empty-function */
const mockStorage: Storage = {
    length: 0,
    clear() {
    },
    key(): string | null {
        return null;
    },
    getItem(): string | null {
        return null;
    },
    setItem() {
    },
    removeItem() {
    },
};

/* eslint-enable @typescript-eslint/no-empty-function */

export function TRPCReactProvider(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                staleTime: Infinity,
                cacheTime: Infinity,
            },
        },
    }));

    const [persister] = useState(() => createSyncStoragePersister({
        storage: typeof window === 'undefined' ? mockStorage : window.localStorage,
    }));

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
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: Infinity }}>
            <api.Provider client={trpcClient} queryClient={queryClient}>
                {props.children}
            </api.Provider>
        </PersistQueryClientProvider>
    );
}
