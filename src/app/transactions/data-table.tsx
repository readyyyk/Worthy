'use client';

import { type FC } from 'react';
import { api } from '@/trpc/react';
import { format } from 'date-fns';
import { Badge } from '@/app/_components/ui/badge';
import { cn } from '@/lib/utils';
import Summary, { type Props as SummaryProps } from '@/app/transactions/summary';


interface Props {
    page: number;
    tags?: string[];
    perPage?: number;
    description?: string;

    addTag: (a: string) => void;
    removeTag: (a: string) => void;
}

const thClasses = 'py-3';
const tdClasses = 'p-3';

const DataTable: FC<Props> = (props) => {
    const { data, error } = api.transactions.getList.useQuery({
        page: props.page,
        tags: props.tags ?? [],
        perPage: props.perPage ?? 25,
        description: props.description ?? '',
    });

    if (!data) {
        if (error) {
            return (<h1 className="text-lg text-destructive"> {error.message} </h1>);
        }

        return (<h1 className="text-lg opacity-70 text-center"> Loading... </h1>);
    }

    if (!data.length) {
        return (<h1 className="text-lg opacity-70 text-center"> No data found </h1>);
    }

    const generateTags = (row: typeof data[0]) => {
        return row.tags.map((tag) => {
            const isSelected = props.tags?.includes?.(tag);
            return <Badge
                key={`tag-${row.id}-${tag}`}
                variant={isSelected ? 'default' : 'secondary'}
                onClick={() => isSelected ? props.removeTag(tag) : props.addTag(tag)}
            >{tag}</Badge>;
        });
    };

    // should be on server
    const summaryData = data.reduce((acc, el) => {
        acc.total += el.amount;
        if (el.isIncome) {
            acc.increase += el.amount;
        } else {
            acc.decrease += el.amount;
        }

        return acc;
    }, { increase: 0, decrease: 0, total: 0 } satisfies SummaryProps);

    return <>
        <div className="m-auto mt-2 overflow-x-auto">
            <table className="rounded w-full overflow-hidden p-3 ">
                <thead>
                <tr className="bg-secondary">
                    <th className={thClasses}>Am.</th>
                    <th className={thClasses}>Curr.</th>
                    <th className={cn(thClasses, 'px-5')}>Description</th>
                    <th className={thClasses}>Date</th>
                    <th className={thClasses}>Tags</th>
                </tr>
                </thead>
                <tbody>
                {data.map((row) => (
                    <tr key={row.id} className="bg-secondary/30 odd:bg-transparent border-b">
                        <td className={cn(
                            tdClasses,
                            'w-8 bg-opacity-30',
                            row.isIncome ? 'bg-green-500' : 'bg-red-700',
                        )}>{row.amount}</td>
                        <td className={cn(tdClasses, 'w-8')}>{row.currency}</td>
                        <td className={cn(tdClasses, 'max-w-56')}>{row.description}</td>
                        <td className={cn(tdClasses, 'w-20 text-center')}>{format(row.createdAt, 'dd.MM.yyyy HH:mm')}</td>
                        <td className={cn(tdClasses, 'flex flex-wrap min-w-48 gap-2')}>
                            {generateTags(row)}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>

        {/* BAD PRACTISE (component named data-table, but summary included) */}
        <Summary {...summaryData} />
    </>;
};

export default DataTable;
