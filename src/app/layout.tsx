import '@/styles/globals.css';

import { Ubuntu } from 'next/font/google';

import { TRPCReactProvider } from '@/trpc/react';
import type { ReactNode } from 'react';
import Header from '@/app/header';
import NextAuthProvider from '@/app/_components/NextAuthProvider';

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

// https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Safari-Textbox-Zooming#selective-maximum-scale-for-safari-on-ios
export const disableIosZoomToInput = () => {
    // adds maximum-scale=1 to the viewport meta tag on iOS devices
    if (typeof window === 'undefined') {
        return;
    }

    if (navigator.userAgent.indexOf('iPhone') === -1) {
        return;
    }

    const metaViewport = document.querySelector('meta[name=viewport]');
    if (!metaViewport) {
        return;
    }

    const content = metaViewport.getAttribute('content') || '';
    if (content.indexOf('maximum-scale') === -1) {
        metaViewport.setAttribute('content', `${content}, maximum-scale=1`);
    }
};

const RootLayout = ({ children }: { children: ReactNode }) => {
    disableIosZoomToInput();
    return (
        <html lang="en">
        <body className={`font-sans ${font.variable} dark p-3 pb-20`}>
        <TRPCReactProvider>
            <NextAuthProvider>
                {children}
                <Header />
            </NextAuthProvider>
        </TRPCReactProvider>
        </body>
        </html>
    );
};

export default RootLayout;
