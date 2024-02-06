'use client';

import { type FC, type FormEvent, useState } from 'react';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
    initialValue?: string;
    setDescription: (a: string) => void;
}

const SearchBar: FC<Props> = ({ setDescription, className, initialValue }) => {
    const [inputValue, setInputValue] = useState(initialValue ?? '');
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setDescription(inputValue);
    };
    return (<form onSubmit={handleSubmit} className={cn('flex gap-3', className)}>
        <Input
            type="text"
            placeholder="Search..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
        />
        <Button
            size={'icon'}
            variant={inputValue !== initialValue ? 'success' : 'outline'}
            className="p-2"
        > <SearchIcon /> </Button>
    </form>);
};

export default SearchBar;
