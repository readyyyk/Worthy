import { FC } from 'react';
import {
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/dataTable';

import { columns } from '@/types/tableConfig';
import { mockTransactions } from '@/assets/mockData';

interface Props {}

const TransactionsDialog: FC<Props> = ({}) => {
    const transactions = mockTransactions;
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Transactions</DialogTitle>
            </DialogHeader>
            <div className={'overflow-x-scroll'}>
                <DataTable columns={columns} data={transactions} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant={'secondary'}>Close</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};

export default TransactionsDialog;
