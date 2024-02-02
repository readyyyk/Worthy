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
        '/((?!api|_next/static|_next/image|favicon.ico|signin|signup).*)',
    ],
};
