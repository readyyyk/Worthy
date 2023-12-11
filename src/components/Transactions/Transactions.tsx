import { FC, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionsDialog from '@/components/Transactions/TransactionsDialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { SimpleTransaction } from '@/types/transaction';
import { mockTransactions } from '@/assets/mockData';

type SingleProps = SimpleTransaction;
const Single: FC<SingleProps> = ({ description, amount, isIncome, id }) => {
    return (
        <li className="flex justify-between md:grid grid-cols-2 space-x-3">
            <span className="font-medium md:place-self-end">{description}</span>
            <span className={isIncome ? 'text-green-500' : 'text-red-500'}>
                {isIncome && '-'}
                {amount}
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
            <CardContent className={'mt-6'}>
                <ul className="space-y-2">
                    {data.map((el) => (
                        <Single {...el} key={`transaction-${el.id}`}></Single>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-full">
                            View all transactions
                        </Button>
                    </DialogTrigger>
                    <TransactionsDialog />
                </Dialog>
            </CardFooter>
        </Card>
    );
};

export default Transactions;
