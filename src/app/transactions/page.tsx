'use client';

import { type FC, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DataTable from '@/app/transactions/data-table';
import SearchBar from '@/app/transactions/search-bar';
import Pagination from '@/app/transactions/pagination';

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

    const newSearch = useCallback(({ newTags, newDescription, newPage }: {
        newTags?: string[], newDescription?: string, newPage?: number
    }) => {
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

        if (newDescription?.length) {
            params.set('description', newDescription);
        } else if (newDescription?.length === 0) {
            params.delete('description');
        }
        if (newPage) {
            params.set('page', String(newPage));
        }
        if (newTags?.length) {
            tagsString = [...new Set(newTags)].join(',');
            params.set('tags', '[' + tagsString + ']');
        } else if (newTags?.length === 0) {
            params.delete('tags');
        }

        router.push(pathname + '?' + params.toString());
    }, [description, page, pathname, router, tags]);

    // search tags
    const addTag = useCallback((tag: string) => {
        newSearch({
            newTags: [...tags, tag],
        });
    }, [searchParams, newSearch, tags]);
    const removeTag = useCallback((tag: string) => {
        newSearch({
            newTags: tags.filter(a => a !== tag),
        });
    }, [searchParams, newSearch, tags]);

    // search description
    const setDescription = useCallback((newDescription: string) => {
        newSearch({ newDescription });
    }, [newSearch]);

    // search description
    const setPage = useCallback((newPage: number) => {
        newSearch({ newPage });
    }, [newSearch]);

    return (
        <div className="max-w-5xl m-auto">
            <h1 className={'text-center text-4xl'}>Transactions</h1>
            <SearchBar
                className="mt-6"
                initialValue={description}
                setDescription={setDescription}
            />
            <DataTable
                page={page}
                tags={tags}
                perPage={25}
                description={description}

                addSearchTag={addTag}
                removeSearchTag={removeTag}
            />
            <Pagination setPage={setPage} current={page} />
        </div>
    );
};

export default Page;
