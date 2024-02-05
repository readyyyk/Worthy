'use client';

import { type FC, useState, useTransition, useRef } from 'react';

import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/_components/ui/select';
import currencySymbols from '@/lib/currencySymblos';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';

import { format } from 'date-fns';

interface Props {
    isIncome: boolean;
}

const Form: FC<Props> = ({ isIncome }) => {
    const router = useRouter();
    const { mutateAsync } = api.transactions.create.useMutation();
    const utils = api.useUtils();
    const [isPending, startTransition] = useTransition();

    const [amountInput, setAmountInput] = useState<string>('');
    const [descriptionInput, setDescriptionInput] = useState<string>('');
    const [currencyInput, setCurrencyInput] = useState<string>('BYN');  // HARDCODED
    const [tagsInputValue, setTagsInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([] as string[]);
    const dateRef = useRef<null | HTMLInputElement>(null);
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
    const handleSubmit = async () => {
        if(!dateRef.current?.value) {
            return;
        }
        const date = new Date(dateRef.current.value);
        const result = await mutateAsync({
            description: descriptionInput,
            isIncome: isIncome,
            amount: Number(amountInput),
            currency: currencyInput,
            createdAt: date,
            tags: tags,
        });

        if (result) {
            await utils.transactions.getRecent.invalidate(undefined, { refetchType: 'all' });
            await utils.users.getBalance.invalidate(undefined, { refetchType: 'all' });
            router.push('/');
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                startTransition(handleSubmit);
            }}
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
                <Select value={currencyInput} onValueChange={(v) => setCurrencyInput(v)}
                        disabled // TODO remove
                >
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
                <Input
                    placeholder="Description"
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)} />
            </Label>

            <div>
                <Label>
                    <Input
                        type='datetime-local'
                        className='text-center'
                        defaultValue={format(new Date(), 'yyyy-MM-dd') + 'T' + format(new Date(), 'hh:mm')}
                        ref={dateRef}
                    />
                </Label>
                {/* <Label>
                    <Input
                        type={'time'}
                        className={'text-center'}
                        defaultValue={format(new Date(), 'hh:mm')}
                    />
                </Label> */}
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
                <Button type="submit" className="w-full" loading={isPending}>
                    Submit
                </Button>
            </div>
        </form>
    );
};

export default Form;
