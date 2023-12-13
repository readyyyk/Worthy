import { FC } from 'react';
import DataTable from '@/components/dataTable';
import { columns, columnVisibility } from '@/types/tableConfig';
import { mockTransactions } from '@/assets/mockData';

interface Props {}

const Page: FC<Props> = ({}) => {
    const transactions = mockTransactions;
    return (
        <div>
            <h1 className={'text-4xl text-center'}>Transactions</h1>
            <div className={'overflow-x-auto mt-6 max-w-7xl m-auto'}>
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
