import type { FC } from 'react';

import { Card, CardHeader, CardTitle } from '@/app/_components/ui/card';

import { formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/server';


const Balance: FC = async ({}) => {
    const { balance, currency } = await api.users.getBalance.query();

    const formatted = formatCurrency(balance, currency);

    return (
        <Card>
            <CardHeader
                className={'flex flex-row items-center justify-between py-3'}
            >
                <div className="text-xl">Balance</div>
                <CardTitle className="text-2xl font-semibold">
                    {formatted}
                </CardTitle>
            </CardHeader>
        </Card>
    );
};

export default Balance;
