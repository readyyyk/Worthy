'use client';

import { FC } from 'react';

import { redirect, useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import Form from '@/app/new/form';

interface Props {}

const Page: FC<Props> = ({}) => {
    const params = useSearchParams();
    const isIncome: boolean | null =
        params.get('isIncome') === 'true'
            ? true
            : params.get('isIncome') === 'false'
              ? false
              : null;
    if (isIncome === null) redirect('/');

    return (
        <Card className={'z-20 w-full'}>
            <CardHeader>
                <CardTitle className={'text-center text-4xl'}>
                    New {isIncome ? 'income' : 'expense'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form />
            </CardContent>
        </Card>
    );
};

export default Page;
