import { FC } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { serverTrpc } from '@/app/_trpc/serverClient';

interface Props {}

const Balance: FC<Props> = async ({}) => {
    const { balance, currency } = await serverTrpc.getBalance();
    const formatted = formatCurrency(balance, currency);

    return (
        <Card>
            <CardHeader
                className={'flex justify-between flex-row items-center py-3'}
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
