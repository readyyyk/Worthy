import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const errors: Record<string, (props?: any) => NextResponse<ApiError>> = {
    noBody: () =>
        NextResponse.json(
            {
                isZod: false,
                message: 'Request body was not provided',
            },
            {
                status: 400,
            },
        ),
    zod: (error: ZodError) =>
        NextResponse.json({ isZod: true, message: error }, { status: 400 }),
};

export type ApiError =
    | { isZod: false; message: string }
    | { isZod: true; message: ZodError };
