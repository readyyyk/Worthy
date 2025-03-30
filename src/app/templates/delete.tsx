'use client';

import { type FC, useState } from 'react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/app/_components/ui/alert-dialog';
import { api } from '@/trpc/react';
import { Button } from '@/app/_components/ui/button';
import { Trash2 } from 'lucide-react';

interface Props {
    templateId: number;
}

const DeleteTemplate: FC<Props> = ({ templateId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const utils = api.useUtils();
    const { isLoading, error, mutateAsync } = api.templates.delete.useMutation();

    const handleDelete = async () => {
        const res = await mutateAsync(templateId);
        
        if (!res) {
            return;
        }

        setIsOpen(false);
        await utils.templates.invalidate(undefined, { refetchType: 'all' });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие нельзя отменить. Шаблон будет удален навсегда.
                    </AlertDialogDescription>
                    {!!error && <code className="text-destructive"> {error.message} </code>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
                    <Button 
                        variant="destructive" 
                        onClick={handleDelete} 
                        disabled={isLoading}
                    >
                        Удалить
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteTemplate;