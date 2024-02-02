import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';


export const env = createEnv({
    server: {
        DATABASE_URL: z
            .string()
            .url()
            .refine(
                (str) => !str.includes('YOUR_MYSQL_URL_HERE'),
                'You forgot to change the default URL',
            ),
        DATABASE_TOKEN: z.string(),
        NODE_ENV: z
            .enum(['development', 'test', 'production'])
            .default('development'),
        NEXTAUTH_SECRET:
            process.env.NODE_ENV === 'production'
                ? z.string()
                : z.string().optional(),
        NEXTAUTH_URL: z.preprocess(
            // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
            // Since NextAuth.js automatically uses the VERCEL_URL if present.
            (str) => process.env.VERCEL_URL ?? str,
            // VERCEL_URL doesn't include `https` so it cant be validated as a URL
            process.env.VERCEL ? z.string() : z.string().url(),
        ),
    },

    client: {
        // NEXT_PUBLIC_CLIENTVAR: z.string(),
    },

    /**
     * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
     * middlewares) or client-side so we need to destruct manually.
     */
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        DATABASE_TOKEN: process.env.DATABASE_TOKEN,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
});
