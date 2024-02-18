'use client';

import { type FC } from 'react';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';
import Summary, { type Props as SummaryProps } from '@/app/transactions/summary';
import Row from '@/app/transactions/row';


interface Props {
    page: number;
    tags?: string[];
    perPage?: number;
    description?: string;

    addSearchTag: (a: string) => void;
    removeSearchTag: (a: string) => void;
}

const thClasses = 'py-3';

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
                    <th className={thClasses}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {data.map((row) => (
                    <Row
                        {...row}
                        removeSearchTag={props.removeSearchTag}
                        addSearchTag={props.removeSearchTag}
                        searchTags={props.tags}
                        key={`data-row-${row.id}`}
                    />
                ))}
                </tbody>
            </table>
        </div>

        {/* BAD PRACTISE (component named data-table, but summary included) */}
        <Summary {...summaryData} />
    </>;
};

export default DataTable;
