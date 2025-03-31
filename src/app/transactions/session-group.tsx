'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';
import { Badge } from '@/app/_components/ui/badge';
import { type RouterOutputs } from '@/trpc/shared';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/_components/ui/alert-dialog';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/_components/ui/dialog';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import Row from './row';
// Определяем тип транзакции на основе возвращаемого значения API
type Transaction = {
    id: number;
    amount: number;
    isIncome: boolean;
    currency: string;
    description: string;
    createdAt: Date;
    tags: string[];
    session: { id: number; name: string | null } | null;
};

interface SessionGroupProps {
    id: number;
    name: string | null;
    createdAt: Date;
    transactions: Transaction[];
    totals: Record<string, number>;
    addSearchTag: (tag: string) => void;
    removeSearchTag: (tag: string) => void;
    searchTags?: string[];
}

export default function SessionGroup({ id, name, createdAt, transactions, totals, addSearchTag, removeSearchTag, searchTags }: SessionGroupProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [sessionName, setSessionName] = useState(name || '');
    const router = useRouter();

    const deleteSession = api.shoppingSessions.deleteSession.useMutation({
        onSuccess: () => {
            router.refresh();
            setIsDeleteDialogOpen(false);
        },
    });

    const updateSession = api.shoppingSessions.updateSession.useMutation({
        onSuccess: () => {
            router.refresh();
            setIsEditDialogOpen(false);
        },
    });

    const handleDelete = () => {
        deleteSession.mutate(id);
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSession.mutate({
            id,
            name: sessionName || undefined,
        });
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const displayName = name || format(createdAt, 'dd.MM.yyyy HH:mm');

    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{displayName}</CardTitle>
                    <div className="flex gap-2">
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Редактировать сессию</DialogTitle>
                                    <DialogDescription>
                                        Измените название сессии покупок.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleEdit}>
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
                                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                            Отмена
                                        </Button>
                                        <Button type="submit" disabled={updateSession.isLoading}>
                                            {updateSession.isLoading ? 'Сохранение...' : 'Сохранить'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить сессию?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие удалит сессию покупок. Транзакции не будут удалены.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                        {deleteSession.isLoading ? 'Удаление...' : 'Удалить'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" size="icon" onClick={toggleExpand}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    Создана: {format(createdAt, 'dd.MM.yyyy HH:mm')}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2">
                    {Object.entries(totals).map(([currency, amount]) => (
                        <Badge key={currency} variant={amount >= 0 ? 'default' : 'destructive'}>
                            {amount >= 0 ? '+' : ''}{amount} {currency}
                        </Badge>
                    ))}
                    <Badge variant="secondary">{transactions.length} транзакций</Badge>
                </div>
            </CardContent>
            {isExpanded && (
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-secondary">
                                    <th className="py-3">Сумма</th>
                                    <th className="py-3">Валюта</th>
                                    <th className="px-5 py-3">Описание</th>
                                    <th className="py-3">Дата</th>
                                    <th className="py-3">Теги</th>
                                    <th className="py-3">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <Row
                                        key={`session-transaction-${transaction.id}`}
                                        {...transaction}
                                        addSearchTag={addSearchTag}
                                        removeSearchTag={removeSearchTag}
                                        searchTags={searchTags}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            )}
            <CardFooter className="pt-2">
                <Button variant="ghost" onClick={toggleExpand} className="w-full">
                    {isExpanded ? 'Свернуть' : 'Показать транзакции'}
                </Button>
            </CardFooter>
        </Card>
    );
}