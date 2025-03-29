'use client';

import { type FC, useState, useTransition, useEffect, useCallback } from 'react';

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { format } from 'date-fns';

interface EditProps {
    id: number;
    close: () => void;
}

const EditContent: FC<EditProps> = ({ id, close }) => {
    const utils = api.useUtils();
    const { data: transaction, isLoading: isLoadingTransaction } = api.transactions.getSingle.useQuery(id);
    const { mutateAsync, isLoading: isUpdating, error } = api.transactions.update.useMutation();
    const [isPending, startTransition] = useTransition();

    const [amountInput, setAmountInput] = useState<string>('');
    const [descriptionInput, setDescriptionInput] = useState<string>('');
    const [currencyInput, setCurrencyInput] = useState<string>('BYN');
    const [isIncome, setIsIncome] = useState<boolean>(false);
    const [tagsInputValue, setTagsInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [dateInput, setDateInput] = useState<string>('');

    // Заполняем форму данными транзакции при загрузке
    useEffect(() => {
        if (!transaction) {
            return;
        }
        
        // Устанавливаем все поля формы
        setAmountInput(String(transaction.amount));
        setDescriptionInput(transaction.description);
        setCurrencyInput(transaction.currency);
        setIsIncome(transaction.isIncome);
        setTags(transaction.tags ?? []);
        
        // Устанавливаем дату
        try {
            const date = new Date(transaction.createdAt);
            const formattedDate = format(date, 'yyyy-MM-dd') + 'T' + format(date, 'HH:mm');
            setDateInput(formattedDate);
        } catch (err) {
            setErrorMessage("Ошибка при установке даты");
        }
    }, [transaction]);

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
        if (!transaction) {
            setErrorMessage("Транзакция не найдена");
            return;
        }
        
        if (!dateInput) {
            setErrorMessage("Поле даты не заполнено");
            return;
        }

        try {
            setErrorMessage(null);
            const date = new Date(dateInput);
            
            const result = await mutateAsync({
                id: id,
                description: descriptionInput,
                isIncome: isIncome,
                amount: Number(amountInput),
                currency: currencyInput,
                createdAt: date,
                tags: tags,
            });

            if (result) {
                // Инвалидируем кэш после успешного обновления
                await utils.transactions.invalidate(undefined, { refetchType: 'all' });
                await utils.users.getBalance.invalidate(undefined, { refetchType: 'all' });
                close();
            } else {
                setErrorMessage("Не удалось обновить транзакцию");
            }
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Произошла ошибка при обновлении транзакции");
        }
    }, [transaction, id, descriptionInput, isIncome, amountInput, currencyInput, tags, dateInput, mutateAsync, utils, close, setErrorMessage]);

    const isLoading = isLoadingTransaction || isUpdating || isPending;

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Редактировать транзакцию</DialogTitle>
            </DialogHeader>

            {isLoadingTransaction ? (
                <div className="flex justify-center py-4">Загрузка...</div>
            ) : !transaction ? (
                <div className="text-center text-destructive">Транзакция не найдена</div>
            ) : (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        startTransition(handleSubmit);
                    }}
                    className="flex flex-col space-y-3"
                >
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

                    {/* Дата */}
                    <div>
                        <Label>
                            <Input
                                type="datetime-local"
                                className="text-center"
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                            />
                        </Label>
                    </div>

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
                        <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
    );
};

export default EditContent;