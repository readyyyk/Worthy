/*
import { FC } from 'react';

import { columnVisibility, columns } from '@/types/tableConfig';

import { mockTransactions } from '@/assets/mockData';
import DataTable from '@/components/dataTable';

interface Props {}

const Page: FC<Props> = ({}) => {
    const transactions = mockTransactions;
    return (
        <div>
            <h1 className={'text-center text-4xl'}>Transactions</h1>
            <div className={'m-auto mt-6 max-w-7xl overflow-x-auto'}>
                <DataTable
                    columns={columns}
                    data={transactions}
                    columnVisibility={columnVisibility}
                />
            </div>
        </div>
    );
};

export default Page;
*/
export { notFound as default } from 'next/navigation';

