'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '@/types/transaction';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<Transaction>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'isIncome',
        header: '+/-',
        cell: (cell) =>
            cell.getValue() ? (
                <PlusIcon className={'h-4 w-4 text-green-500'} />
            ) : (
                <MinusIcon className={'h-4 w-4 text-red-500'} />
            ),
    },
    {
        accessorKey: 'amount',
        cell: ({ cell, row }) =>
            row.getValue('isIncome') ? (
                <span className={'text-green-500 text-lg'}>
                    +{String(cell.getValue())}
                </span>
            ) : (
                <span className={'text-red-500 text-lg'}>
                    -{String(cell.getValue())}
                </span>
            ),
        header: 'Amount',
    },
    {
        accessorKey: 'date',
        header: 'Date',
        cell: (cell) => (
            <span className={'whitespace-nowrap'}>
                {String(cell.getValue())}
            </span>
        ),
    },
    {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ cell, row }) => (
            <div className={'flex flex-wrap w-32 gap-1'}>
                {String(cell.getValue())
                    .split(',')
                    .map((el) => (
                        <Badge
                            key={`badge-${el}-${cell.id}`}
                            variant="secondary"
                        >
                            {String(el)}
                        </Badge>
                    ))}
            </div>
        ),
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ cell, row }) => (
            <div className={'w-44'}>{String(cell.getValue())}</div>
        ),
    },
];
