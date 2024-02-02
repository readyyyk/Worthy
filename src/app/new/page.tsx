'use client';

import { type FC, Suspense } from 'react';

import { redirect, useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';

import Form from '@/app/new/form';

const Data: FC = ({}) => {
    const params = useSearchParams();
    const isIncome: boolean | null =
        params.get('isIncome') === 'true'
            ? true
            : params.get('isIncome') === 'false'
                ? false
                : null;
    if (isIncome === null) {
        redirect('/');
    }

    return (
        <Card className={'z-20 w-full'}>
            <CardHeader>
                <CardTitle className={'text-center text-4xl'}>
                    New {isIncome ? 'income' : 'expense'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form isIncome={isIncome} />
            </CardContent>
        </Card>
    );
};
const Page: FC = ({}) => {
    return (
        <Suspense>
            <Data />
        </Suspense>
    );
};

export default Page;
