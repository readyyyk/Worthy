import { FC } from 'react';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Transaction } from '@/types/transaction';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { serverTrpc } from '@/app/_trpc/serverClient';
import { formatCurrency } from '@/lib/utils';

type SingleProps = Transaction;
const Single: FC<SingleProps> = ({
    description,
    amount,
    isIncome,
    currency,
}) => {
    const formatted = formatCurrency(amount, currency);
    return (
        <li className="flex grid-cols-2 justify-between space-x-3 md:grid">
            <span className="w-2/3 truncate font-medium md:place-self-end">
                {description}
            </span>
            <span className={isIncome ? 'text-green-500' : 'text-red-500'}>
                {isIncome ? '+' : '-'}
                {formatted}
            </span>
        </li>
    );
};

interface Props {}
const Transactions: FC<Props> = async ({}) => {
    const data = await serverTrpc.getRecentTransactions();

    return (
        <Card className="mt-4">
            <CardContent className={'pb-3 pt-5'}>
                <ul className="space-y-2">
                    {data.map((el) => (
                        <Single {...el} key={`transaction-${el.id}`}></Single>
                    ))}
                </ul>
                <Button className="mt-3 w-full text-lg" variant={'link'}>
                    <Link
                        href={'/transactions'}
                        className={'flex items-center space-x-1'}
                    >
                        <span>View all transactions</span>
                        <ArrowRight />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
};

export default Transactions;
