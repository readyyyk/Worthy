'use client';

import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from '@/components/LineChart';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Data } from '@/types/chart';

import { data as mockData } from '@/assets/mockData';

type Props = {};

const Chart: FC<Props> = ({}) => {
    const [data, setData] = useState<Data>(mockData);
    const [range, setRange] = useState(0);
    return (
        <Card className="mb-4">
            <CardContent>
                <LineChart data={data} className="w-full h-[300px]" />
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
