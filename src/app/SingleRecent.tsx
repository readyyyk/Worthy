import { type FC } from 'react';
import { type Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/app/_components/ui/skeleton';

export const SingleSkeleton: FC = () => {
    return <li className="flex grid-cols-2 justify-between space-x-3 md:grid my-1">
        <Skeleton className="w-2/3 truncate font-medium md:place-self-end h-6" />
        <Skeleton className="w-20 h-6" />
    </li>;
};

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

export default Single;
