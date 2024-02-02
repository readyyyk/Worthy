/*
'use client';

import type { FC } from 'react';

import {
    compareDesc,
    differenceInDays,
    differenceInWeeks,
    format,
} from 'date-fns';

/!*import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';*!/
import {
    Bar,
    BarChart,
    CartesianGrid,
    Rectangle,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis,
} from 'recharts';

import { Data, DataSerialized, DataSerializedSchema } from '@/types/chart';
import { Transaction } from '@/types/transaction';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { trpc } from '@/app/_trpc/trpc';
import { primaryCurrency } from '@/assets/mockData';
import { formatCurrency } from '@/lib/utils';

const dateToDate = (data: DataSerialized): Data => {
    return data.map((el) => ({
        amount: el.amount,
        date: new Date(el.date),
    }));
};

const CustomTooltip: FC<TooltipProps<number, ''>> = ({
                                                         active,
                                                         payload,
                                                         label: date,
                                                     }) => {
    if (!active || !payload || !payload.length) {
        return null;
    }
    const label = format(date, 'dd.MM');
    const formatted = formatCurrency(payload?.[0].value ?? 0, primaryCurrency);

    return (
        <div className="rounded-md bg-background p-3 shadow-md shadow-gray-500">
            date: {label} <br /> spent: {formatted}
        </div>
    );
};
const Chart: FC = () => {
    const { data } = trpc.getChartData.useQuery({ range: 14 });
    const formatDate = (date: string, range: number) => {
        const _date = new Date(date);
        if (range === 0 || range === 1) return `${_date.getHours()}`;
        if (range === 14 || range === 30) return `${_date.getDay()}`;
        return _date.toLocaleDateString();
    };
    const padData = (data: Data, range: number): Data => {
        const result: Data = [];
        for (let i = 0; i < range; i++) {
            result[i] = {
                date: new Date(new Date().setDate(new Date().getDate() - i)),
                amount: 0,
            };

            const existing = data.find(
                (el) => differenceInDays(new Date(), el.date) === i,
            );
            if (existing) {
                result[i].amount += existing.amount;
            }
        }
        return result.reverse();
    };
    return (
        <Card className="relative mb-4">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    Expenses during last 2 weeks:
                </CardTitle>
                {/!*<Select*!/}
                {/!*    onValueChange={(value) => {*!/}
                {/!*        setRange(Number(value));*!/}
                {/!*    }}*!/}
                {/!*    defaultValue={'0'}*!/}
                {/!*>*!/}
                {/!*    <SelectTrigger className="w-[180px]">*!/}
                {/!*        <SelectValue placeholder="Select a date range" />*!/}
                {/!*    </SelectTrigger>*!/}
                {/!*    <SelectContent>*!/}
                {/!*        <SelectGroup>*!/}
                {/!*            <SelectItem value={'0'}>Today</SelectItem>*!/}
                {/!*            <SelectItem value={'1'}>Yesterday</SelectItem>*!/}
                {/!*            <SelectItem value={'14'}>Last 2 Weeks</SelectItem>*!/}
                {/!*            <SelectItem value={'30'}>Last Month</SelectItem>*!/}
                {/!*        </SelectGroup>*!/}
                {/!*    </SelectContent>*!/}
                {/!*</Select>*!/}
            </CardHeader>

            {data ? (
                <CardContent className={'h-64 w-[110%] -translate-x-[5%] pb-0'}>
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        className={'relative -left-6'}
                    >
                        <BarChart
                            data={padData(dateToDate(data), 31)}
                            margin={{
                                top: 5,
                                bottom: 5,
                            }}
                            className={'w-full'}
                        >
                            <CartesianGrid />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(tick) => formatDate(tick, 14)}
                            />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="amount"
                                fill="red"
                                activeBar={
                                    <Rectangle fill="gold" stroke="red" />
                                }
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            ) : (
                <Skeleton className={'h-64 w-full'} />
            )}
        </Card>
    );
};

export default Chart;
*/
