import withAuth from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(function middleware(_) {
    return NextResponse.next();
});

export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico|signin|signup).*)',
};
