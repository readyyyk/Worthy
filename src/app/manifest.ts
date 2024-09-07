import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Worthy',
        short_name: 'Worthy',
        theme_color: '#6D28D9',
        background_color: '#030712',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        shortcuts: [
            {
                name: '+ Expense',
                url: '/new?isIncome=false',
            },
            {
                name: '- Income',
                url: '/new?isIncome=true',
            },
        ],
        icons: [
            {
                src: '/favicon.ico',
                sizes: '16x16',
                type: 'image/x-icon',
            },
            {
                src: '/logo-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo-384.png',
                sizes: '384x384',
                type: 'image/png',
            },
            {
                src: '/logo-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}