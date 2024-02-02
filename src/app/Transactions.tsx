import type { FC } from 'react';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import type { Transaction } from '@/types/transaction';

import { Button } from '@/app/_components/ui/button';
import { Card, CardContent } from '@/app/_components/ui/card';

import { formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/server';

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

const Transactions: FC = async ({}) => {
    const data = await api.transactions.getRecent.query();

    return (
        <Card className="mt-4">
            <CardContent className={'pb-3 pt-5'}>
                {data ? <>
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
                </> : <h1 className="text-lg">
                    You have no transactions yet
                </h1>
                }
            </CardContent>
        </Card>
    );
};

export default Transactions;
