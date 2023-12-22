'use client';

import { FC, useState } from 'react';

import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { primaryCurrency } from '@/assets/mockData';
import currencySymbols from '@/assets/symbols';

interface Props {}

const Form: FC<Props> = ({}) => {
    const [amountInput, setAmountInput] = useState<string>('');
    const [tagsInputValue, setTagsInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([] as string[]);
    const removeTag = (tag: string) => setTags(tags.filter((a) => a !== tag));
    const handleTags = (newValue: string) => {
        if (newValue.trim().length && [' ', ','].includes(newValue.at(-1)!)) {
            newValue = newValue.slice(0, -1);
            setTags((p) => [...p, newValue.trim()]);
            setTagsInputValue('');
            return;
        }
        setTagsInputValue(newValue);
    };
    const handleSubmit = async () => {};

    return (
        <form
            onSubmit={void handleSubmit}
            className={'flex flex-col space-y-3'}
        >
            {/* Amount */}
            <div className={'grid grid-cols-2 gap-3'}>
                <Label>
                    <Input
                        value={amountInput}
                        onChange={(e) =>
                            /^[0-9]*\.?[0-9]*?$/.test(e.target.value) &&
                            setAmountInput(e.target.value)
                        }
                        placeholder={'Amount'}
                    />
                </Label>
                <Select defaultValue={primaryCurrency}>
                    <SelectTrigger>
                        <SelectValue placeholder="cur" />
                    </SelectTrigger>
                    <SelectContent>
                        {currencySymbols.map((el) => (
                            <SelectItem key={`currency-${el}`} value={el}>
                                {el}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Label>
                <Input placeholder={'Description'} />
            </Label>

            <div className={'grid grid-cols-2 gap-3'}>
                <Label>
                    <Input
                        type={'date'}
                        className={'text-center'}
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    />
                </Label>
                <Label>
                    <Input
                        type={'time'}
                        className={'text-center'}
                        defaultValue={format(new Date(), 'hh:mm')}
                    />
                </Label>
            </div>

            {/* Tags */}
            <div className={'flex flex-wrap items-baseline gap-2'}>
                {tags.map((el, i) => (
                    <Badge
                        key={`tag-${el}-${i}`}
                        variant={'secondary'}
                        onClick={() => removeTag(el)}
                        removable
                    >
                        {el}
                    </Badge>
                ))}
                <Input
                    value={tagsInputValue}
                    onChange={(e) => handleTags(e.target.value)}
                    onKeyDown={(e) =>
                        e.key === 'Enter' && handleTags(tagsInputValue + ' ')
                    }
                    placeholder={'tag'}
                    className={'h-8 w-24 p-2'}
                />
                {!tags.length && (
                    <span className={'text-gray-600'}>
                        Divide with space or comma
                    </span>
                )}
            </div>

            <div className={'m-auto w-1/2 pt-3'}>
                <Button type={'submit'} className={'w-full'}>
                    Submit
                </Button>
            </div>
        </form>
    );
};

export default Form;
