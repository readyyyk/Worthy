import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleTransaction } from '@/types/transaction';
import { mockTransactions } from '@/assets/mockData';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type SingleProps = SimpleTransaction;
const Single: FC<SingleProps> = ({
    description,
    amount,
    isIncome,
    currency,
}) => {
    const formatted = formatCurrency(amount, currency);
    return (
        <li className="flex justify-between md:grid grid-cols-2 space-x-3">
            <span className="font-medium w-2/3 truncate md:place-self-end">
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
const Transactions: FC<Props> = ({}) => {
    // 3 latest transactions
    const data: SimpleTransaction[] = mockTransactions.slice(0, 3);

    return (
        <Card className="mt-4">
            <CardContent className={'pt-5 pb-3'}>
                <ul className="space-y-2">
                    {data.map((el) => (
                        <Single {...el} key={`transaction-${el.id}`}></Single>
                    ))}
                </ul>
                <Button className="w-full text-lg mt-3" variant={'link'}>
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
