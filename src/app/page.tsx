import { Button } from '@/components/ui/button';
import { MinusIcon, PlusIcon } from 'lucide-react';
import Chart from './Chart';
import Transactions from '@/app/Transactions';
import Link from 'next/link';

import Balance from '@/app/Balance';

export default function Page() {
    return (
        <div className="max-w-5xl m-auto">
            <Balance />

            <Transactions />

            <div className="flex space-x-8 justify-center my-16">
                <Link href={'/new?isIncome=false'}>
                    <Button className="rounded-full w-32 h-32 bg-red-950 border-4 border-red-500 shadow-xl shadow-slate-900 active:bg-red-900 hover:bg-red-950">
                        <MinusIcon className={'h-16 w-16 text-red-500'} />
                    </Button>
                </Link>
                <Link href={'/new?isIncome=true'}>
                    <Button className="rounded-full w-32 h-32 bg-green-950 border-4 border-green-500 shadow-xl shadow-slate-900 active:bg-green-900 hover:bg-green-950">
                        <PlusIcon className={'h-16 w-16 text-green-500'} />
                    </Button>
                </Link>
            </div>

            <Chart />
        </div>
    );
}
