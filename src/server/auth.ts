import CredentialsProvider from 'next-auth/providers/credentials';
import {
    getServerSession,
    type DefaultSession,
    type NextAuthOptions,
    type DefaultUser,
    type User,
} from 'next-auth';

import { api } from '@/trpc/server';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
    interface User extends Omit<DefaultUser, 'id'> {
        id: number;
    }

    interface Session extends DefaultSession {
        user: User,
    }
}
declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        user: User,
    }
}

export const authOptions: NextAuthOptions = {
    pages: {
        'signIn': '/signin',
    },
    theme: { colorScheme: 'dark', brandColor: '#7533b0', logo: '/logo.svg', buttonText: 'Sign in' },
    callbacks: {
        jwt: ({ token, user }) => {
            if (user) {
                token.user = {
                    id: user.id as number,
                };
            }
            return token;
        },
        session: ({ session, token }) => {
            token && (session.user.id = token.user.id);
            return session;
        },
    },
    providers: [
        CredentialsProvider({
            type: 'credentials',
            name: 'password',
            credentials: {
                username: { label: 'Username', type: 'text', placeholder: 'Username' },
                password: { label: 'Password', type: 'password' },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials.password) {
                    return null;
                }

                const user = await api.auth.login.query({
                    username: credentials.username,
                    password: credentials.password,
                });

                return {
                    id: user.id,
                };
            },
        }),
    ],
};

export const getServerAuthSession = () => getServerSession(authOptions);
