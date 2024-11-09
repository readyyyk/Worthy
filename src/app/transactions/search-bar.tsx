'use client';

import { type FC, type FormEvent, useRef, useState } from 'react';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    className?: string;
    initialValue: {description?: string, startDate: number, endDate: number};
    setDescription: (a: string) => void;
    setStartDate: (a: number) => void;
    setEndDate: (a: number) => void;
}

const isValid = (value?: string): boolean => {
    return !isNaN(new Date(value ?? "")?.getTime());
}

const SearchBar: FC<Props> = ({ setDescription,setStartDate, setEndDate, className, initialValue }) => {
    const [inputValue, setInputValue] = useState(initialValue.description ?? '');
    const sDateInput = useRef<null | HTMLInputElement>(null);
    const eDateInput = useRef<null | HTMLInputElement>(null);
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        inputValue !== initialValue.description && (setDescription(inputValue));

        const toSetStart = new Date(sDateInput.current!.value).getTime();
        initialValue.startDate !== toSetStart && isValid(sDateInput.current?.value) && (setStartDate(toSetStart));

        const toSetEnd = new Date(eDateInput.current!.value).getTime();
        initialValue.endDate !== toSetEnd && isValid(eDateInput.current?.value) && (setEndDate(toSetEnd));
    };

    if (typeof window === "undefined") { return <></> }
    return (<form onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
        <div className='flex gap-3'>
            <Input
                type="text"
                placeholder="Search..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
            <Button
                size={'icon'}
                variant={'success'}
                className="p-2"
            > <SearchIcon /> </Button>
        </div>
        <div className='grid grid-cols-2 gap-3'>
            <Input
                type="datetime-local"
                defaultValue={format(new Date(initialValue.startDate), 'yyyy-MM-dd') + 'T' + format(new Date(initialValue.startDate), 'HH:mm')}
                ref={sDateInput}
            />
            <Input
                type="datetime-local"
                defaultValue={initialValue.endDate !== -1 ? format(new Date(initialValue.endDate), 'yyyy-MM-dd') + 'T' + format(new Date(initialValue.endDate), 'HH:mm') : undefined}
                ref={eDateInput}
            />
            <div
                className={cn(
                    'bg-red-600 bg-opacity-20 p-4 rounded-xl border-2 border-red-900 col-span-2 text-balance text-center',
                    localStorage.getItem("ALERT_SINGLE_FILTER") && "hidden"
                )}
                onClick={()=>localStorage.setItem("ALERT_SINGLE_FILTER", "1")}
            >
                Автор криворучка, поэтому на кнопочку поиска меняется только один из параметров. Чтобы обновить несколько ... *барабанная дробь* ... нужно нажать на кнопочку поиск несколько раз)
                <hr/>
                Клик + перезагрузка страницы чтобы убрать
            </div>
        </div>

    </form>);
};

export default SearchBar;
