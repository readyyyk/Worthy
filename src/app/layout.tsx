import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';

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
                    'min-h-screen bg-background font-sans antialiased overflow-x-hidden px-4 relative',
                    inter.className,
                )}
            >
                <Header />
                {/*<AuthProvider>*/}
                {children}
                {/*</AuthProvider>*/}
            </body>
        </html>
    );
}
