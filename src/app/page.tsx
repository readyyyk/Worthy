import { LayersIcon, MinusIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/app/_components/ui/button';

import Balance from '@/app/Balance';
import Transactions from '@/app/Transactions';

// import Chart from './Chart';

export const dynamic = 'force-dynamic';

export default function Page() {
    return (
        <div className="m-auto max-w-5xl">
            <Balance />

            <Transactions />

            <div className="my-16 flex justify-center space-x-8">
                <Link href={'/new?isIncome=false'}>
                    <Button
                        className="h-32 w-32 rounded-full border-4 border-red-500 bg-red-950 shadow-xl shadow-slate-900 hover:bg-red-950 active:bg-red-900">
                        <MinusIcon className={'h-16 w-16 text-red-500'} />
                    </Button>
                </Link>
                <Link href={'/new?isIncome=true'}>
                    <Button
                        className="h-32 w-32 rounded-full border-4 border-green-500 bg-green-950 shadow-xl shadow-slate-900 hover:bg-green-950 active:bg-green-900">
                        <PlusIcon className={'h-16 w-16 text-green-500'} />
                    </Button>
                </Link>
            </div>

            {/*'@mantine/charts'*/}
        </div>
    );
}
