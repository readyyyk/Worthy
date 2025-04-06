'use client';

import { useState } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';

interface Props {
    transactionIds: (number | string)[];
    open: boolean;
    onClose: () => void;
}

export default function CreateSessionDialog({ transactionIds, open, onClose }: Props) {
    const [sessionName, setSessionName] = useState('');
    const router = useRouter();

    const createSession = api.shoppingSessions.createSession.useMutation({
        onSuccess: () => {
            router.refresh();
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Преобразуем все идентификаторы в числа
        const numericIds = transactionIds.map(id => typeof id === 'string' ? parseInt(id.replace('local_', '')) : id);
        createSession.mutate({
            name: sessionName || undefined,
            transactionIds: numericIds,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Создать сессию покупок</DialogTitle>
                    <DialogDescription>
                        Объедините выбранные транзакции в сессию покупок для удобного отслеживания.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Название
                            </Label>
                            <Input
                                id="name"
                                placeholder="Название сессии (опционально)"
                                className="col-span-3"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Транзакции</Label>
                            <div className="col-span-3">
                                <p className="text-sm text-muted-foreground">
                                    Выбрано транзакций: {transactionIds.length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={createSession.isLoading || transactionIds.length === 0}>
                            {createSession.isLoading ? 'Создание...' : 'Создать сессию'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}