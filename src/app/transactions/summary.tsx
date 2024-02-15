import type { FC } from 'react';
import { formatCurrency } from '@/lib/utils';

export type Props = {
    total: number;
    increase: number;
    decrease: number;
}

const Summary: FC<Props> = ({ increase, decrease, total }) => {
    const percentages = {
        i: Math.floor(increase / total * 100),
        d: Math.floor(decrease / total * 100),
    };

    const formatted = {
        i: formatCurrency(increase, 'BYN'),
        d: formatCurrency(decrease, 'BYN'),
    };

    return (<div className="rounded w-full border p-3 mt-2 transition-all">
        <h1 className="text-center text-2xl">Total:</h1>
        <div className="flex flex-col gap-2">
            <div className="flex">
                <h2 className="text-emerald-500 flex w-1/2 justify-center text-xl"> Inc: {formatted.i} </h2>
                <h2 className="text-red-500 flex w-1/2 justify-center text-xl"> Exp: {formatted.d} </h2>
            </div>
            <div className="grid grid-cols-2">
                {percentages.i !== 0 ? <div
                    className="justify-self-end bg-emerald-500 rounded-l-lg h-8 border-r p-1 font-extrabold text-emerald-950 text-end"
                    style={{ width: percentages.i + '%' }}
                >
                    {percentages.i + '%'}
                </div> : <div />}
                {percentages.d !== 0 ? <div
                    className="bg-red-500 rounded-r-lg h-8 border-l p-1 font-extrabold text-red-950"
                    style={{ width: percentages.d + '%' }}
                >
                    {percentages.d + '%'}
                </div> : <div />}
            </div>
        </div>
    </div>);
};

export default Summary;
