'use client';

import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart,
    Bar,
    Rectangle,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';

import { data as mockData } from '@/assets/mockData';
import { Data } from '@/types/chart';

const CustomTooltip: FC<TooltipProps<number, ''>> = ({
    active,
    payload,
    label: date,
}) => {
    const label = `${date?.getDay()}.${date?.getMonth()} at ${date?.getHours()}`;

    if (active && payload && payload.length) {
        return (
            <div className="bg-background rounded-md p-3 shadow-md shadow-gray-500">
                date: {label} <br /> spent: {payload[0].value}
            </div>
        );
    }

    return null;
};
const Chart: FC = () => {
    const formatDate = (date: Date, range: number) => {
        if (range === 0 || range === 1) return `${date.getHours()}`;
        if (range === 14 || range === 30) return `${date.getDay()}`;
        return date.toLocaleDateString();
    };
    const [data, setData] = useState([] as Data);
    const [range, setRange] = useState(0);
    useEffect(() => {
        if (range === 0 || range === 1) {
            setData(mockData.slice(range ? 1 : 0, 24));
            return;
        }
        setData(mockData.slice(range ? 1 : 0, range));
    }, [range]);
    return (
        <Card className="mb-4 relative">
            <CardContent
                className={'w-[110%] -translate-x-[5%] h-64 mt-6 pb-0'}
            >
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    className={'relative -left-6'}
                >
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            bottom: 5,
                        }}
                        className={'w-full'}
                    >
                        <CartesianGrid />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(tick) => formatDate(tick, range)}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="amount"
                            fill="red"
                            activeBar={<Rectangle fill="gold" stroke="red" />}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    Expenses
                </CardTitle>
                <Select
                    onValueChange={(value) => {
                        setRange(Number(value));
                    }}
                    defaultValue={'0'}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a date range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value={'0'}>Today</SelectItem>
                            <SelectItem value={'1'}>Yesterday</SelectItem>
                            <SelectItem value={'14'}>Last 2 Weeks</SelectItem>
                            <SelectItem value={'30'}>Last Month</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </CardHeader>
        </Card>
    );
};

export default Chart;
