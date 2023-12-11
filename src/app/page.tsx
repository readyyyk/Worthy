import { Button } from '@/components/ui/button';
import { CardTitle, CardHeader, Card } from '@/components/ui/card';
import { MinusIcon, PlusIcon, UserIcon } from 'lucide-react';
import Image from 'next/image';
import logo from '@/assets/logo.svg';
import Chart from './Chart';
import Transactions from '@/components/Transactions/Transactions';

export default function Page() {
    return (
        <div className="min-h-screen p-4 max-w-5xl m-auto">
            <header className="flex items-center justify-between mb-6">
                <div className={'flex items-center space-x-2'}>
                    <Image
                        className={'w-12 h-12'}
                        src={logo}
                        alt={'Worthy logo'}
                    />
                    <h1 className="text-2xl font-bold">Worthy</h1>
                </div>
                <Button size="icon" variant="outline">
                    <UserIcon />
                </Button>
            </header>

            <Card>
                <CardHeader
                    className={'flex justify-between flex-row items-center'}
                >
                    <div className="text-xl">Balance</div>
                    <CardTitle className="text-2xl font-semibold">
                        $2,500.00
                    </CardTitle>
                </CardHeader>
            </Card>

            <Transactions />

            <div className="flex space-x-8 justify-center my-16">
                <Button className="rounded-full w-32 h-32 bg-red-950 border-4 border-red-500 shadow-xl shadow-slate-900">
                    <MinusIcon className={'h-16 w-16 text-red-500'} />
                </Button>
                <Button className="rounded-full w-32 h-32 bg-green-950 border-4 border-green-500 shadow-xl shadow-slate-900">
                    <PlusIcon className={'h-16 w-16 text-green-500'} />
                </Button>
            </div>

            <Chart />
        </div>
    );
}
