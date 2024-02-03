'use client';

import type { FC } from 'react';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/app/_components/ui/button';
import { Card, CardContent } from '@/app/_components/ui/card';

import { api } from '@/trpc/react';
import Single, { SingleSkeleton } from '@/app/SingleRecent';


const LoadingSkeletons: FC = () => {
    return <ul className="space-y-2">
        <SingleSkeleton />
        <SingleSkeleton />
        <SingleSkeleton />
        <Button className="mt-3 w-full text-lg" variant={'link'}>
            <Link
                href={'/transactions'}
                className={'flex items-center space-x-1'}
            >
                <span>View all transactions</span>
                <ArrowRight />
            </Link>
        </Button>
    </ul>;
};


const Transactions: FC = ({}) => {
    const { data, isLoading, error } = api.transactions.getRecent.useQuery();

    return (
        <Card className="mt-4">
            <CardContent className={'pb-3 pt-5'}>
                {data?.length ? <>
                        <ul className="space-y-2">
                            {data.map((el) => (
                                <Single {...el} key={`transaction-${el.id}`} />
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
                    </> :
                    isLoading ?
                        <LoadingSkeletons /> :
                        error ?
                            <h1 className="text-lg text-destructive"> {error.message} </h1> :
                            <h1 className="text-lg opacity-70 text-center"> You have no transactions yet </h1>
                }
            </CardContent>
        </Card>
    );
};

export default Transactions;
