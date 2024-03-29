export { default } from 'next-auth/middleware';

/*const except: string[] = [
    // from NextJS example
    'api',
    '_next/static',
    '_next/image',
    'favicon.ico',

    // added
    'signin',
    'signup',
] as const;*/

// console.info('/((?!' + except.join('|') + ').*)');
export const config = {
    matcher: [
        '/',
        '/transactions',
        '/new',
        '/me',
        // '/((?!api|_next/static|_next/image|favicon.ico|signin|signup|public|static|\.next/static/logo\.svg).*)'
    ],
};
