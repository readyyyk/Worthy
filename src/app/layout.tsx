import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AuthProvider from '@/components/AuthProvider';

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
                    'min-h-screen bg-background font-sans antialiased',
                    inter.className,
                )}
            >
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
