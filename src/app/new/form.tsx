'use client';

import { type FC, useState, useTransition, useRef, useEffect } from 'react';

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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/app/_components/ui/dialog';
import currencySymbols from '@/lib/currencySymblos';
import { api } from '@/trpc/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import TemplateSelector from './template-selector';

interface Props {
    isIncome: boolean;
}

const Form: FC<Props> = ({ isIncome }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateIdParam = searchParams.get('template');
    
    const { mutateAsync: createTransaction } = api.transactions.create.useMutation();
    const { mutateAsync: createTemplate } = api.templates.create.useMutation();
    const utils = api.useUtils();
    const [isPending, startTransition] = useTransition();

    // Состояния для формы транзакции
    const [amountInput, setAmountInput] = useState<string>('');
    const [descriptionInput, setDescriptionInput] = useState<string>('');
    const [currencyInput, setCurrencyInput] = useState<string>('BYN');  // HARDCODED
    const [tagsInputValue, setTagsInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([] as string[]);
    const dateRef = useRef<null | HTMLInputElement>(null);
    
    // Состояния для работы с шаблонами
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // Получение данных шаблона при выборе
    const { data: template, refetch: refetchTemplate } = api.templates.getSingle.useQuery(
        Number(selectedTemplateId),
        { enabled: !!selectedTemplateId }
    );

    // Загрузка шаблона из URL параметра при первом рендере
    useEffect(() => {
        if (templateIdParam) {
            const templateId = Number(templateIdParam);
            setSelectedTemplateId(templateId);
        }
    }, [templateIdParam]);

    // Заполнение формы данными из шаблона при его загрузке
    useEffect(() => {
        if (template) {
            setAmountInput(String(template.amount));
            setDescriptionInput(template.description);
            setCurrencyInput(template.currency);
            setTags(template.tags);
        }
    }, [template]);

    // Обработчики для тегов
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

    // Обработчик выбора шаблона
    const handleSelectTemplate = async (templateId: number) => {
        setSelectedTemplateId(templateId);
        await refetchTemplate();
    };

    // Обработчик сохранения транзакции
    const handleSubmit = async () => {
        if (!dateRef.current?.value) {
            return;
        }
        const date = new Date(dateRef.current.value);
        const result = await createTransaction({
            description: descriptionInput,
            isIncome: isIncome,
            amount: Number(amountInput),
            currency: currencyInput,
            createdAt: date,
            tags: tags,
        });

        if (result) {
            await utils.transactions.invalidate(undefined, { refetchType: 'all' }); // TODO fix: refetches all searches with every parameters sets
            await utils.users.getBalance.invalidate(undefined, { refetchType: 'all' });
            router.push('/');
        }
    };

    // Обработчик сохранения шаблона
    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !amountInput) {
            return;
        }
        
        const result = await createTemplate({
            name: templateName,
            description: descriptionInput,
            isIncome: isIncome,
            amount: Number(amountInput),
            currency: currencyInput,
            tags: tags,
        });

        if (result) {
            setIsTemplateDialogOpen(false);
            setTemplateName('');
            await utils.templates.invalidate();
        }
    };

    return (
        <>
            <TemplateSelector onSelectTemplate={handleSelectTemplate} />
            
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
                            type="datetime-local"
                            className="text-center"
                            defaultValue={format(new Date(), 'yyyy-MM-dd') + 'T' + format(new Date(), 'HH:mm')}
                            ref={dateRef}
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

                <div className={'flex justify-between pt-3'}>
                    <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsTemplateDialogOpen(true)}
                        disabled={!amountInput || !descriptionInput}
                    >
                        Сохранить как шаблон
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Submit
                    </Button>
                </div>
            </form>
            
            {/* Диалоговое окно для сохранения шаблона */}
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Сохранить как шаблон</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="template-name">Название шаблона</Label>
                        <Input
                            id="template-name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Введите название шаблона"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Form;
