'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '@/types/transaction';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

export const columnVisibility: Readonly<Record<string, boolean>> = {
    isIncome: false,
    currency: false,
};

export const columns: ColumnDef<Transaction>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'currency',
        header: 'Currency',
    },
    {
        accessorKey: 'isIncome',
        header: '+/-',
    },
    {
        accessorKey: 'amount',
        cell: ({ cell, row }) => {
            const formatted = formatCurrency(
                Number(cell.getValue()),
                row.getValue('currency'),
            );
            return (
                <div
                    className={
                        (row.getValue('isIncome')
                            ? 'text-green-500'
                            : 'text-red-500') + ' whitespace-nowrap text-lg'
                    }
                >
                    {row.getValue('isIncome') ? '+' : '-'}
                    {formatted}
                </div>
            );
        },
        header: 'Amount',
    },
    {
        accessorKey: 'date',
        header: 'Date',
        cell: (cell) => (
            <div className={'w-20'}>
                {String(
                    format(
                        new Date(cell.getValue()!.toString()),
                        'dd-MM-yyyy HH:mm',
                    ),
                )}
            </div>
        ),
    },
    {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ cell }) => (
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
        cell: ({ cell }) => (
            <div className={'w-44'}>{String(cell.getValue())}</div>
        ),
    },
];
