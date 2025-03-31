'use client';

import { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/app/_components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/_components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';

interface Props {
    onSelectSession: (sessionId: number | null) => void;
    onCreateSession: (name: string) => void;
}

export default function SessionSelector({ onSelectSession, onCreateSession }: Props) {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');

    // Получаем список сессий
    const { data: sessions, isLoading } = api.shoppingSessions.getSessionsList.useQuery({
        page: 1,
        perPage: 10,
    });

    // Обработчик выбора сессии
    const handleSelectSession = (value: string) => {
        setSelectedSessionId(value);
        if (value === 'new') {
            setIsCreateDialogOpen(true);
        } else if (value === 'none') {
            onSelectSession(null);
        } else {
            onSelectSession(Number(value));
        }
    };

    // Обработчик создания новой сессии
    const handleCreateSession = () => {
        onCreateSession(newSessionName);
        setIsCreateDialogOpen(false);
        setNewSessionName('');
    };

    return (
        <div className="mb-4">
            <Label htmlFor="session-select">Сессия покупок</Label>
            <div className="flex gap-2 mt-1">
                <Select value={selectedSessionId || 'none'} onValueChange={handleSelectSession}>
                    <SelectTrigger id="session-select" className="flex-1">
                        <SelectValue placeholder="Выберите сессию или создайте новую" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Без сессии</SelectItem>
                        <SelectItem value="new">
                            <div className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Создать новую сессию
                            </div>
                        </SelectItem>
                        {sessions?.map((session) => (
                            <SelectItem key={`session-${session.id}`} value={String(session.id)}>
                                {session.name || format(new Date(session.createdAt), 'dd.MM.yyyy HH:mm')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Диалог создания новой сессии */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Создать новую сессию</DialogTitle>
                        <DialogDescription>
                            Создайте новую сессию покупок для группировки транзакций.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="session-name">Название сессии (опционально)</Label>
                        <Input
                            id="session-name"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            placeholder="Введите название сессии"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleCreateSession}>
                            Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}