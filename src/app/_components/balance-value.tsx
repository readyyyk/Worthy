'use client';

import { type FC, useEffect, useState } from 'react';
import { api } from '@/trpc/react';
import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/app/_components/ui/skeleton';

type Props = {
    className?: string;
}
const BalanceValue: FC<Props> = ({ className }) => {
    const [isShow, setIsShow] = useState(false);
    const { data, isLoading, error } = api.users.getBalance.useQuery();

    const [formatted, setFormatted] = useState('');
    useEffect(() => {
        if (!data) {
            return;
        }
        const { balance, currency } = data;
        const _formatted = formatCurrency(balance, currency);
        setFormatted(_formatted);
    }, [data, setFormatted]);

    if (!data) {
        if (isLoading) {
            return <Skeleton className="w-28 h-8" />;
        }
        if (!error) {
            return error;
        }
    }

    return <span className={cn(className)} onClick={()=>setIsShow((p)=>!p)}> {isShow ? formatted : '****'} </span>;
};

export default BalanceValue;
