'use client';

import { type FC, useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DataTable from '@/app/transactions/data-table';
import SearchBar from '@/app/transactions/search-bar';
import Pagination from '@/app/transactions/pagination';
import { Button } from '@/app/_components/ui/button';
import { Layers, LayersIcon } from 'lucide-react';

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

    let startDate = Number(searchParams.get('startDate') ? searchParams.get('startDate') : undefined);
    isNaN(startDate) && (startDate = 0);
    let endDate = Number(searchParams.get('endDate') ? searchParams.get('endDate') : undefined);
    isNaN(endDate) && (endDate = -1);

    // tags (format: [_tag1,ta_g2,tag_3])
    const searchTags = searchParams.get('tags') ?? '';
    if (searchTags !== '' && !searchRegex.test(searchTags)) {
        router.back();
    }
    const tags = searchTags.slice(1, -1).split(',').filter(Boolean);
    
    // Параметр группировки по сессиям
    const groupBySession = searchParams.get('groupBySession') === 'true';
    
    // Параметр фильтрации по ID сессии
    const sessionId = Number(searchParams.get('sessionId'));
    const hasSessionId = !isNaN(sessionId) && searchParams.has('sessionId');

    const newSearch = useCallback(({ newTags, newDescription, newPage, newStartDate, newEndDate, newGroupBySession, newSessionId }: {
        newTags?: string[],
        newDescription?: string,
        newPage?: number,
        newStartDate?: number,
        newEndDate?: number,
        newGroupBySession?: boolean,
        newSessionId?: number | null
    }) => {
        const params = new URLSearchParams();
        if (description) {
            params.append('description', description);
        }
        if (page > 1) {
            params.append('page', String(page));
        }
        if (startDate !== 0) {
            params.set('startDate', String(startDate));
        }
        if (endDate !== -1) {
            params.set('endDate', String(endDate));
        }
        let tagsString = tags.join(',');
        if (tagsString.length) {
            params.append('tags', '[' + tagsString + ']');
        }
        
        // Добавляем параметр группировки по сессиям
        if (groupBySession) {
            params.append('groupBySession', 'true');
        }
        
        // Добавляем параметр фильтрации по ID сессии
        if (hasSessionId) {
            params.append('sessionId', String(sessionId));
        }

        if (newDescription?.length) {
            params.set('description', newDescription);
        } else if (newDescription?.length === 0) {
            params.delete('description');
        }
        if (newPage) {
            params.set('page', String(newPage));
        }
        if (newStartDate) {
            params.set('startDate', String(newStartDate));
        }
        if (newEndDate) {
            params.set('endDate', String(newEndDate));
        }
        if (newTags?.length) {
            tagsString = [...new Set(newTags)].join(',');
            params.set('tags', '[' + tagsString + ']');
        } else if (newTags?.length === 0) {
            params.delete('tags');
        }
        
        // Обновляем параметр группировки по сессиям
        if (newGroupBySession !== undefined) {
            if (newGroupBySession) {
                params.set('groupBySession', 'true');
            } else {
                params.delete('groupBySession');
            }
        }
        
        // Обновляем параметр фильтрации по ID сессии
        if (newSessionId !== undefined) {
            if (newSessionId === null) {
                params.delete('sessionId');
            } else {
                params.set('sessionId', String(newSessionId));
            }
        }

        router.push(pathname + '?' + params.toString());
    }, [description, page, pathname, router, tags, startDate, endDate, groupBySession, hasSessionId, sessionId]);

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

    const setStartDate = useCallback((newStartDate: number) => {
        newSearch({ newStartDate });
    }, [newSearch]);
    const setEndDate = useCallback((newEndDate: number) => {
        newSearch({ newEndDate });
    }, [newSearch]);

    // search description
    const setPage = useCallback((newPage: number) => {
        newSearch({ newPage });
    }, [newSearch]);
    
    // Переключение группировки по сессиям
    const toggleGroupBySession = useCallback(() => {
        newSearch({ newGroupBySession: !groupBySession });
    }, [newSearch, groupBySession]);
    
    // Сброс фильтра по сессии
    const clearSessionFilter = useCallback(() => {
        newSearch({ newSessionId: null });
    }, [newSearch]);

    return (
        <div className="max-w-5xl m-auto">
            <div className="flex justify-between items-center">
                <h1 className={'text-center text-4xl'}>Transactions</h1>
                <div className="flex gap-2">
                    {hasSessionId && (
                        <Button
                            variant="outline"
                            onClick={clearSessionFilter}
                            className="flex items-center gap-2"
                        >
                            Сбросить фильтр сессии
                        </Button>
                    )}
                </div>
            </div>
            <SearchBar
                className="mt-6"
                initialValue={{description, startDate, endDate}}
                setDescription={setDescription}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
            />
            <DataTable
                startDate={startDate}
                endDate={endDate}
                page={page}
                tags={tags}
                perPage={25}
                description={description}
                groupBySession={true} // Всегда используем группировку
                sessionId={hasSessionId ? sessionId : undefined}

                addSearchTag={addTag}
                removeSearchTag={removeTag}
            />
            <Pagination setPage={setPage} current={page} />
        </div>
    );
};

export default Page;
