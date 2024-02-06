'use client';

import { type FC, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DataTable from '@/app/transactions/data-table';

const searchRegex = /^\[[a-zA-Z0-9_]+(,[a-zA-Z0-9_]+)*]$/;
const Page: FC = () => {
    const pathname = usePathname();
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

    const newSearch = (newTags?: string[], newDescription?: string, newPage?: number) => {
        const params = new URLSearchParams();
        if (description) {
            params.append('description', description);
        }
        if (page > 1) {
            params.append('page', String(page));
        }
        let tagsString = tags.join(',');
        if (tagsString.length) {
            params.append('tags', '[' + tagsString + ']');
        }

        if (newDescription) {
            params.set('description', newDescription);
        }
        if (newPage) {
            params.set('page', String(page));
        }
        if (newTags?.length) {
            tagsString = [...new Set(newTags)].join(',');
            params.set('tags', '[' + tagsString + ']');
        } else {
            params.delete('tags');
        }

        // console.log(params.toString());
        router.push(pathname + '?' + params.toString());
    };
    const addTag = useCallback((tag: string) => {
        newSearch([...tags, tag]);
    }, [searchParams, newSearch, tags]);
    const removeTag = useCallback((tag: string) => {
        newSearch(tags.filter(a => a !== tag));
    }, [searchParams, newSearch, tags]);

    return (
        <div>
            <h1 className={'text-center text-4xl'}>Transactions</h1>
            <div className={'m-auto mt-6 max-w-5xl overflow-x-auto'}>
                <DataTable
                    page={page}
                    tags={tags}
                    perPage={25}
                    description={description}

                    addTag={addTag}
                    removeTag={removeTag}
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

