import type { FC } from 'react';

import { Card, CardHeader, CardTitle } from '@/app/_components/ui/card';
import BalanceValue from '@/app/_components/balance-value';

const Balance: FC = async ({}) => {
    return (
        <Card>
            <CardHeader
                className={'flex flex-row items-center justify-between py-3'}
            >
                <div className="text-xl">Balance</div>
                <CardTitle className="text-2xl font-semibold">
                    <BalanceValue />
                </CardTitle>
            </CardHeader>
        </Card>
    );
};

export default Balance;
