import '@/styles/globals.css';

import { Ubuntu } from 'next/font/google';

import { TRPCReactProvider } from '@/trpc/react';
import type { ReactNode } from 'react';
import Header from '@/app/header';
import NextAuthProvider from '@/app/_components/NextAuthProvider';
import { NetworkStatus } from '@/app/_components/NetworkStatus';
import { ConflictResolutionDialog } from '@/app/_components/ConflictResolutionDialog';

const font = Ubuntu({
    weight: ['400', '500'],
    subsets: ['latin', 'cyrillic'],
    variable: '--font-ubuntu',
});

export const metadata = {
    title: 'worthy',
    description: 'Embrace simplicity with Worthy - manage your money',
    icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

const RootLayout = ({ children }: { children: ReactNode }) => {
    return (
        <html lang="en">
        <body className={`font-sans ${font.variable} dark p-3 pb-20`}>
        <TRPCReactProvider>
            <NextAuthProvider>
                {children}
                <Header />
                <NetworkStatus />
                <ConflictResolutionDialog />
            </NextAuthProvider>
        </TRPCReactProvider>
        </body>
        </html>
    );
};

export default RootLayout;
