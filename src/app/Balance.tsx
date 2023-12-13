import { FC } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { balance, primaryCurrency } from '@/assets/mockData';
import { formatCurrency } from '@/lib/utils';

interface Props {}

const Balance: FC<Props> = ({}) => {
    const formatted = formatCurrency(balance, primaryCurrency);

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
