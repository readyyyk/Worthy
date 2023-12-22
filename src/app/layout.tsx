import { ReactNode } from 'react';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import TRPCProvider from '@/app/_trpc/Provider';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Worthy - the money management app',
    description:
        'Worthy is a money management app that helps you track your income and billings.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={'dark'}>
            <body
                className={cn(
                    'relative min-h-screen overflow-x-hidden bg-background px-4 font-sans antialiased',
                    inter.className,
                )}
            >
                <Header />
                {/*<AuthProvider>*/}
                <TRPCProvider>{children}</TRPCProvider>
                {/*</AuthProvider>*/}
            </body>
        </html>
    );
}
