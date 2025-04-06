'use client';

import { type FC, useState, Fragment } from 'react';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';
import Summary, { type Props as SummaryProps } from '@/app/transactions/summary';
import Row from '@/app/transactions/row';
import { Badge } from '@/app/_components/ui/badge';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/_components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/_components/ui/dialog';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Button } from '@/app/_components/ui/button';
import { PlusCircle } from 'lucide-react';
import CreateSessionDialog from './create-session-dialog';


interface Props {
    page: number;
    tags?: string[];
    perPage?: number;
    description?: string;
    startDate?: number;
    endDate?: number;
    sessionId?: number;
    groupBySession?: boolean;

    addSearchTag: (a: string) => void;
    removeSearchTag: (a: string) => void;
}

const thClasses = 'py-3';

const DataTable: FC<Props> = (props) => {
    const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
    const [isCreateSessionDialogOpen, setIsCreateSessionDialogOpen] = useState(false);
    const [expandedSessions, setExpandedSessions] = useState<number[]>([]);
    const [editSessionId, setEditSessionId] = useState<number | null>(null);
    const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
    const [sessionName, setSessionName] = useState('');
    const router = useRouter();
    
    const deleteSession = api.shoppingSessions.deleteSession.useMutation({
        onSuccess: () => {
            router.refresh();
            setDeleteSessionId(null);
        },
    });

    const updateSession = api.shoppingSessions.updateSession.useMutation({
        onSuccess: () => {
            router.refresh();
            setEditSessionId(null);
        },
    });

    const { data, error } = api.transactions.getList.useQuery({
        page: props.page,
        startDate: props.startDate,
        endDate: props.endDate === -1 ? undefined : props.endDate,
        tags: props.tags ?? [],
        perPage: props.perPage ?? 25,
        description: props.description ?? '',
        sessionId: props.sessionId,
        groupBySession: true, // Всегда запрашиваем данные с группировкой
    });

    if (!data) {
        if (error) {
            return (<h1 className="text-lg text-destructive"> {error.message} </h1>);
        }

        return (<h1 className="text-lg opacity-70 text-center"> Loading... </h1>);
    }

    // Проверяем, является ли data объектом с группировкой или массивом транзакций
    const isGroupedData = 'sessionGroups' in data;
    
    if (isGroupedData && data.sessionGroups.length === 0 && data.ungroupedTransactions.length === 0) {
        return (<h1 className="text-lg opacity-70 text-center"> No data found </h1>);
    } else if (!isGroupedData && data.length === 0) {
        return (<h1 className="text-lg opacity-70 text-center"> No data found </h1>);
    }

    // Вычисляем суммарные данные
    let summaryData: SummaryProps;
    
    if (isGroupedData) {
        // Если данные сгруппированы, суммируем по всем транзакциям из всех групп и негруппированных
        const allTransactions = [
            ...data.ungroupedTransactions,
            ...data.sessionGroups.flatMap(group => group.transactions)
        ];
        
        summaryData = allTransactions.reduce((acc, el) => {
            acc.total += el.amount;
            if (el.isIncome) {
                acc.increase += el.amount;
            } else {
                acc.decrease += el.amount;
            }
            return acc;
        }, { increase: 0, decrease: 0, total: 0 } satisfies SummaryProps);
    } else {
        // Если данные не сгруппированы, суммируем по всем транзакциям
        summaryData = data.reduce((acc, el) => {
            acc.total += el.amount;
            if (el.isIncome) {
                acc.increase += el.amount;
            } else {
                acc.decrease += el.amount;
            }
            return acc;
        }, { increase: 0, decrease: 0, total: 0 } satisfies SummaryProps);
    }
    
    // Обработчик выбора транзакций для создания сессии
    const toggleTransactionSelection = (id: number) => {
        console.log("Toggling transaction selection:", id);
        setSelectedTransactions(prev => {
            const newSelection = prev.includes(id)
                ? prev.filter(transId => transId !== id)
                : [...prev, id];
            console.log("New selection:", newSelection);
            return newSelection;
        });
    };
    
    const openCreateSessionDialog = () => {
        console.log("Opening create session dialog with transactions:", selectedTransactions);
        if (selectedTransactions.length > 0) {
            setIsCreateSessionDialogOpen(true);
        }
    };
    
    const toggleSessionExpand = (sessionId: number) => {
        setExpandedSessions(prev =>
            prev.includes(sessionId)
                ? prev.filter(id => id !== sessionId)
                : [...prev, sessionId]
        );
    };
    
    const handleEditSession = (sessionId: number, name: string | null) => {
        setEditSessionId(sessionId);
        setSessionName(name || '');
    };
    
    const handleDeleteSession = (sessionId: number) => {
        setDeleteSessionId(sessionId);
    };
    
    const confirmDeleteSession = () => {
        if (deleteSessionId) {
            deleteSession.mutate(deleteSessionId);
        }
    };
    
    const confirmEditSession = () => {
        if (editSessionId) {
            updateSession.mutate({
                id: editSessionId,
                name: sessionName || undefined,
            });
        }
    };

    return <>
        <div className="flex justify-between items-center mb-4">
            {selectedTransactions.length > 0 ? (
                <>
                    <span>Выбрано транзакций: {selectedTransactions.length}</span>
                    <Button
                        onClick={openCreateSessionDialog}
                        className="flex items-center gap-2"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Создать сессию
                    </Button>
                </>
            ) : (
                <span className="text-sm text-muted-foreground">
                    Выберите транзакции, чтобы создать сессию покупок
                </span>
            )}
        </div>
        
        <CreateSessionDialog
            transactionIds={selectedTransactions}
            open={isCreateSessionDialogOpen}
            onClose={() => {
                setIsCreateSessionDialogOpen(false);
                setSelectedTransactions([]);
            }}
        />
        
        {isGroupedData ? (
            <div className="m-auto mt-2 overflow-x-auto">
                {/* Диалог редактирования сессии */}
                <Dialog open={editSessionId !== null} onOpenChange={(open) => !open && setEditSessionId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Редактировать сессию</DialogTitle>
                            <DialogDescription>
                                Измените название сессии покупок.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">
                                    Название
                                </Label>
                                <Input
                                    id="edit-name"
                                    placeholder="Название сессии (опционально)"
                                    className="col-span-3"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditSessionId(null)}>
                                Отмена
                            </Button>
                            <Button onClick={confirmEditSession} disabled={updateSession.isLoading}>
                                {updateSession.isLoading ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Диалог удаления сессии */}
                <AlertDialog open={deleteSessionId !== null} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Удалить сессию?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие удалит сессию покупок. Транзакции не будут удалены.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDeleteSession} className="bg-destructive text-destructive-foreground">
                                {deleteSession.isLoading ? 'Удаление...' : 'Удалить'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <table className="rounded w-full overflow-hidden p-3">
                    <thead>
                        <tr className="bg-secondary">
                            <th className={thClasses}>
                                <div className="flex justify-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 cursor-pointer"
                                        onChange={() => {
                                            const allIds = [
                                                ...data.ungroupedTransactions.map(t => t.id),
                                                ...data.sessionGroups.flatMap(g => g.transactions.map(t => t.id))
                                            ];
                                            if (allIds.every(id => selectedTransactions.includes(id))) {
                                                setSelectedTransactions([]);
                                            } else {
                                                setSelectedTransactions(allIds);
                                            }
                                        }}
                                        checked={
                                            data.ungroupedTransactions.length > 0 &&
                                            data.sessionGroups.flatMap(g => g.transactions).length > 0 &&
                                            [...data.ungroupedTransactions, ...data.sessionGroups.flatMap(g => g.transactions)].every(t =>
                                                selectedTransactions.includes(t.id)
                                            )
                                        }
                                    />
                                </div>
                            </th>
                            <th className={thClasses}>Am.</th>
                            <th className={thClasses}>Curr.</th>
                            <th className={cn(thClasses, 'px-5')}>Description</th>
                            <th className={thClasses}>Date</th>
                            <th className={thClasses}>Tags</th>
                            <th className={thClasses}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Подготавливаем данные для отображения в хронологическом порядке */}
                        {(() => {
                            // Создаем массив для всех элементов (групп и отдельных транзакций)
                            type DisplayItem = {
                                type: 'group' | 'transaction';
                                id: number;
                                latestDate: Date;
                                data: any;
                            };
                            
                            const displayItems: DisplayItem[] = [];
                            
                            // Добавляем группы сессий
                            data.sessionGroups.forEach(group => {
                                // Находим самую последнюю транзакцию в группе
                                const latestTransaction = group.transactions.reduce(
                                    (latest, current) => {
                                        const currentDate = new Date(current.createdAt);
                                        return latest.getTime() > currentDate.getTime() ? latest : currentDate;
                                    },
                                    new Date(0) // начальное значение - самая ранняя возможная дата
                                );
                                
                                displayItems.push({
                                    type: 'group',
                                    id: group.id,
                                    latestDate: latestTransaction,
                                    data: group
                                });
                            });
                            
                            // Добавляем негруппированные транзакции
                            data.ungroupedTransactions.forEach(transaction => {
                                displayItems.push({
                                    type: 'transaction',
                                    id: transaction.id,
                                    latestDate: new Date(transaction.createdAt),
                                    data: transaction
                                });
                            });
                            
                            // Сортируем все элементы по дате (от новых к старым)
                            displayItems.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
                            
                            // Отображаем элементы в отсортированном порядке
                            return displayItems.map(item => {
                                if (item.type === 'group') {
                                    const group = item.data;
                                    return (
                                        <Fragment key={`session-group-${group.id}`}>
                                            {/* Заголовок группы */}
                                            <tr key={`session-header-${group.id}`} className={cn("bg-secondary/50", expandedSessions.includes(group.id) && 'border border-primary border-b-0')}>
                                                <td colSpan={7} className="p-2">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="p-1"
                                                                onClick={() => toggleSessionExpand(group.id)}
                                                            >
                                                                {expandedSessions.includes(group.id) ?
                                                                    <ChevronUp className="h-4 w-4" /> :
                                                                    <ChevronDown className="h-4 w-4" />
                                                                }
                                                            </Button>
                                                            <span className="font-semibold">
                                                                {group.name || format(new Date(), 'dd.MM.yyyy HH:mm')}
                                                            </span>
                                                            <div className="flex gap-1 ml-4">
                                                                {/* Вычисляем сумму транзакций в группе */}
                                                                {(() => {
                                                                    const totals: Record<string, number> = {};
                                                                    group.transactions.forEach((transaction: any) => {
                                                                        const { currency, amount, isIncome } = transaction;
                                                                        if (!totals[currency]) {
                                                                            totals[currency] = 0;
                                                                        }
                                                                        totals[currency] += isIncome ? amount : -amount;
                                                                    });
                                                                    
                                                                    return Object.entries(totals).map(([currency, amount]) => (
                                                                        <Badge key={currency} variant={amount >= 0 ? 'default' : 'destructive'}>
                                                                            {amount >= 0 ? '+' : ''}{amount} {currency}
                                                                        </Badge>
                                                                    ));
                                                                })()}
                                                                <Badge variant="secondary">{group.transactions.length} транзакций</Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="p-1"
                                                                onClick={() => handleEditSession(group.id, group.name)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="p-1"
                                                                onClick={() => handleDeleteSession(group.id)}
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {/* Транзакции группы */}
                                            {expandedSessions.includes(group.id) && group.transactions.map((row: any, idx: number) => (
                                                <tr key={`data-row-${row.id}`} className={cn("bg-secondary/10 odd:bg-secondary/20 border-primary", idx === group.transactions.length - 1 ? 'border border-t-0' : 'border-x')}>
                                                    <td className="p-3 text-center">
                                                        <div className="flex justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 cursor-pointer"
                                                                checked={selectedTransactions.includes(row.id)}
                                                                onChange={() => toggleTransactionSelection(row.id)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <Row
                                                        {...row}
                                                        isInTable={true}
                                                        removeSearchTag={props.removeSearchTag}
                                                        addSearchTag={props.addSearchTag}
                                                        searchTags={props.tags}
                                                    />
                                                </tr>
                                            ))}
                                        </Fragment>
                                    );
                                } else {
                                    // Отдельная транзакция
                                    const transaction = item.data;
                                    return (
                                        <tr key={`data-row-${transaction.id}`} className="bg-secondary/30 odd:bg-transparent border-b">
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 cursor-pointer"
                                                        checked={selectedTransactions.includes(transaction.id)}
                                                        onChange={() => toggleTransactionSelection(transaction.id)}
                                                    />
                                                </div>
                                            </td>
                                            <Row
                                                {...transaction}
                                                isInTable={true}
                                                removeSearchTag={props.removeSearchTag}
                                                addSearchTag={props.addSearchTag}
                                                searchTags={props.tags}
                                            />
                                        </tr>
                                    );
                                }
                            });
                        })()}
                    </tbody>
                </table>
            </div>
        ) : (
            // Отображаем обычный список транзакций
            <div className="m-auto mt-2 overflow-x-auto">
                <table className="rounded w-full overflow-hidden p-3">
                    <thead>
                    <tr className="bg-secondary">
                        <th className={thClasses}>
                            <div className="flex justify-center">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 cursor-pointer"
                                    onChange={() => {
                                        const ids = data.map(t => t.id);
                                        if (ids.every(id => selectedTransactions.includes(id))) {
                                            setSelectedTransactions([]);
                                        } else {
                                            setSelectedTransactions(ids);
                                        }
                                    }}
                                    checked={
                                        data.length > 0 &&
                                        data.every(t => selectedTransactions.includes(t.id))
                                    }
                                />
                            </div>
                        </th>
                        <th className={thClasses}>Am.</th>
                        <th className={thClasses}>Curr.</th>
                        <th className={cn(thClasses, 'px-5')}>Description</th>
                        <th className={thClasses}>Date</th>
                        <th className={thClasses}>Tags</th>
                        <th className={thClasses}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((row) => (
                        <tr key={`data-row-${row.id}`} className="bg-secondary/30 odd:bg-transparent border-b">
                            <td className="p-3 text-center">
                                <div className="flex justify-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 cursor-pointer"
                                        checked={selectedTransactions.includes(row.id)}
                                        onChange={() => toggleTransactionSelection(row.id)}
                                    />
                                </div>
                            </td>
                            <Row
                                {...row}
                                isInTable={true}
                                removeSearchTag={props.removeSearchTag}
                                addSearchTag={props.addSearchTag}
                                searchTags={props.tags}
                            />
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Суммарная информация */}
        <Summary {...summaryData} />
    </>;
};

export default DataTable;
