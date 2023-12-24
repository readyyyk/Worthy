import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const options = {
    pages: {
        signIn: '/signin',
    },
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                username: {
                    label: 'Username',
                    type: 'text',
                },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (
                    !credentials ||
                    !credentials.username ||
                    !credentials.password
                )
                    return null;

                return {
                    id: '1',
                    name: credentials.username,
                    email: credentials.username,
                };
                // return null;
            },
        }),
    ],
} satisfies NextAuthOptions;
