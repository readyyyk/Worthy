'use client';

import { type FC } from 'react';
import {
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/app/_components/ui/alert-dialog';
import { api } from '@/trpc/react';
import { Button } from '@/app/_components/ui/button';

interface ModalProps {
    id: number;
    close: () => void;
}

const DeleteContent: FC<ModalProps> = ({ id, close }) => {
    const utils = api.useUtils();
    const { isLoading, error, mutateAsync } = api.transactions.delete.useMutation();

    const handleSubmit = async () => {
        const res = await mutateAsync(id);
        console.log(res);
        if (!res) {
            return;
        }

        console.log(1);
        close();
        await utils.transactions.invalidate(undefined, { refetchType: 'all' });
        await utils.users.getBalance.invalidate(undefined, { refetchType: 'all' });
    };

    return (<AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone.
            </AlertDialogDescription>
            {!!error && <code className="text-destructive"> {error.message} </code>}
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={close}>Cancel</AlertDialogCancel>
            <Button onClick={handleSubmit} loading={isLoading}>Continue</Button>
        </AlertDialogFooter>
    </AlertDialogContent>);
};

export default DeleteContent;
