'use client';

import { FC, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { primaryCurrency } from '@/assets/mockData';
import currencySymbols from '@/assets/symbols';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';
import { Button } from '@/components/ui/button';

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
            <div className={'grid gap-3 grid-cols-2'}>
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

            <div className={'gap-3 grid grid-cols-2'}>
                <Label>
                    <Input
                        type={'date'}
                        className={'text-center'}
                        defaultValue={moment().format('YYYY-MM-DD')}
                    />
                </Label>
                <Label>
                    <Input
                        type={'time'}
                        className={'text-center'}
                        defaultValue={moment().format('hh:mm')}
                    />
                </Label>
            </div>

            {/* Tags */}
            <div className={'flex flex-wrap gap-2 items-baseline'}>
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
                    className={'w-24 p-2 h-8'}
                />
                {!tags.length && (
                    <span className={'text-gray-600'}>
                        Divide with space or comma
                    </span>
                )}
            </div>

            <div className={'pt-3 w-1/2 m-auto'}>
                <Button type={'submit'} className={'w-full'}>
                    Submit
                </Button>
            </div>
        </form>
    );
};

export default Form;
