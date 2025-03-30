'use client';

import { type FC, useState, useTransition, useEffect, useCallback } from 'react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/app/_components/ui/dialog';
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
import { Edit2 } from 'lucide-react';

interface Props {
    template: {
        id: number;
        name: string;
        amount: number;
        isIncome: boolean;
        currency: string;
        description: string;
        tags: string[];
    };
}

const EditTemplate: FC<Props> = ({ template }) => {
    const [isOpen, setIsOpen] = useState(false);
    const utils = api.useUtils();
    const { mutateAsync, isLoading: isUpdating, error } = api.templates.update.useMutation();
    const [isPending, startTransition] = useTransition();

    const [nameInput, setNameInput] = useState<string>('');
    const [amountInput, setAmountInput] = useState<string>('');
    const [descriptionInput, setDescriptionInput] = useState<string>('');
    const [currencyInput, setCurrencyInput] = useState<string>('BYN');
    const [isIncome, setIsIncome] = useState<boolean>(false);
    const [tagsInputValue, setTagsInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Заполняем форму данными шаблона при открытии
    useEffect(() => {
        if (isOpen) {
            setNameInput(template.name);
            setAmountInput(String(template.amount));
            setDescriptionInput(template.description);
            setCurrencyInput(template.currency);
            setIsIncome(template.isIncome);
            setTags(template.tags || []);
        }
    }, [isOpen, template]);

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

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!nameInput.trim()) {
            setErrorMessage("Название шаблона не может быть пустым");
            return;
        }

        if (!amountInput) {
            setErrorMessage("Сумма не может быть пустой");
            return;
        }

        try {
            setErrorMessage(null);
            
            const result = await mutateAsync({
                id: template.id,
                name: nameInput,
                description: descriptionInput,
                isIncome: isIncome,
                amount: Number(amountInput),
                currency: currencyInput,
                tags: tags,
            });

            if (result) {
                // Инвалидируем кэш после успешного обновления
                await utils.templates.invalidate(undefined, { refetchType: 'all' });
                setIsOpen(false);
            } else {
                setErrorMessage("Не удалось обновить шаблон");
            }
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Произошла ошибка при обновлении шаблона");
        }
    }, [template.id, nameInput, descriptionInput, isIncome, amountInput, currencyInput, tags, mutateAsync, utils, setErrorMessage]);

    const isLoading = isUpdating || isPending;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Редактировать шаблон</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        startTransition(handleSubmit);
                    }}
                    className="flex flex-col space-y-3"
                >
                    {/* Название шаблона */}
                    <Label>
                        <span className="mb-1 block">Название шаблона</span>
                        <Input
                            placeholder="Название шаблона"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                        />
                    </Label>

                    {/* Тип транзакции */}
                    <div className="flex justify-center space-x-4">
                        <Label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                checked={isIncome}
                                onChange={() => setIsIncome(true)}
                                className="h-4 w-4"
                            />
                            <span className="text-green-500">Доход</span>
                        </Label>
                        <Label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                checked={!isIncome}
                                onChange={() => setIsIncome(false)}
                                className="h-4 w-4"
                            />
                            <span className="text-red-500">Расход</span>
                        </Label>
                    </div>

                    {/* Сумма и валюта */}
                    <div className="grid grid-cols-2 gap-3">
                        <Label>
                            <Input
                                value={amountInput}
                                onChange={(e) =>
                                    /^[0-9]*\.?[0-9]*?$/.test(e.target.value) &&
                                    setAmountInput(e.target.value)
                                }
                                placeholder="Сумма"
                            />
                        </Label>
                        <Select value={currencyInput} onValueChange={(v) => setCurrencyInput(v)}
                                disabled // TODO remove
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Валюта" />
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

                    {/* Описание */}
                    <Label>
                        <Input
                            placeholder="Описание"
                            value={descriptionInput}
                            onChange={(e) => setDescriptionInput(e.target.value)}
                        />
                    </Label>

                    {/* Теги */}
                    <div className="flex flex-wrap items-baseline gap-2">
                        {tags.map((el, i) => (
                            <Badge
                                key={`tag-${el}-${i}`}
                                variant="secondary"
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
                            placeholder="тег"
                            className="h-8 w-24 p-2"
                        />
                        {!tags.length && (
                            <span className="text-gray-600">
                                Разделяйте пробелом или запятой
                            </span>
                        )}
                    </div>

                    {(!!error || !!errorMessage) ? (
                        <div className="text-destructive font-medium">
                            {error?.message ?? errorMessage}
                        </div>
                    ) : null}

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditTemplate;