'use client';

import { type FC } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DataTable from '@/app/transactions/data-table';

const searchRegex = /^\[[a-zA-Z0-9_]+(,[a-zA-Z0-9_]+)*]$/;
const Page: FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // search description
    const description = searchParams.get('description') ?? '';

    // page n
    const searchPage = Number(searchParams.get('page'));
    if (searchParams.has('page') && (isNaN(searchPage) || searchPage < 1)) {
        router.back();
    }
    const page = !searchParams.has('page') ? 1 : Number(searchPage);

    // tags (format: [_tag1,ta_g2,tag_3])
    const searchTags = searchParams.get('tags') ?? '';
    if (searchTags !== '' && !searchRegex.test(searchTags)) {
        router.back();
    }
    const tags = searchTags.slice(1, -1).split(',').filter(Boolean);

    return (
        <div>
            <h1 className={'text-center text-4xl'}>Transactions</h1>
            <div className={'m-auto mt-6 max-w-5xl overflow-x-auto'}>
                <DataTable
                    page={page}
                    tags={tags}
                    perPage={25}
                    description={description}
                />
                {/*<DataTable*/}
                {/*    columns={columns}*/}
                {/*    data={transactions}*/}
                {/*    columnVisibility={columnVisibility}*/}
                {/*/>*/}
            </div>
        </div>
    );
};

export default Page;

// export { notFound as default } from 'next/navigation';

