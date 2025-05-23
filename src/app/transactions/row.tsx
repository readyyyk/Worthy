import { type FC, useState } from 'react';
import { type RouterOutputs } from '@/trpc/shared';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogTrigger } from '@/app/_components/ui/alert-dialog';
import { Dialog, DialogTrigger } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { PencilIcon, TrashIcon } from 'lucide-react';
import DeleteContent from '@/app/transactions/delete';
import EditContent from '@/app/transactions/edit';
import { Badge } from '@/app/_components/ui/badge';


const tdClasses = 'p-3';

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

type Props = Transaction & {
    searchTags: string[] | undefined;
    addSearchTag: (a: string) => void;
    removeSearchTag: (a: string) => void;
    isInTable?: boolean; // Флаг, указывающий, используется ли компонент внутри таблицы
};
const Row: FC<Props> = (props) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    
    const openDelete = () => setDeleteModal(true);
    const closeDelete = () => setDeleteModal(false);
    
    const openEdit = () => setEditModal(true);
    const closeEdit = () => setEditModal(false);

    const generateTags = (searchedTags: string[] | undefined, tags: Props['tags']) => {
        return tags.map((tag) => {
            const isSelected = searchedTags?.includes?.(tag);
            return <Badge
                className="inline-block"
                key={`tag-${props.id}-${tag}`}
                variant={isSelected ? 'default' : 'secondary'}
                onClick={() => isSelected ? props.removeSearchTag(tag) : props.addSearchTag(tag)}
            >{tag}</Badge>;
        });
    };

    // Если компонент используется внутри таблицы с чекбоксами, не нужно создавать tr
    const content = (
        <>
            <td className={cn(
                tdClasses,
                'w-8 bg-opacity-30',
                props.isIncome ? 'bg-green-500' : 'bg-red-700',
            )}>{props.amount}</td>
            <td className={cn(tdClasses, 'w-8')}>{props.currency}</td>
            <td className={cn(tdClasses, 'max-w-56')}>
                {props.description}
                {props.session && (
                    <Badge variant="outline" className="ml-2">
                        {props.session.name || 'Сессия'}
                    </Badge>
                )}
            </td>
            <td className={cn(tdClasses, 'w-20 text-center')}>
                {props.createdAt instanceof Date
                    ? format(props.createdAt, 'dd.MM.yyyy HH:mm')
                    : format(new Date(props.createdAt), 'dd.MM.yyyy HH:mm')}
            </td>
            <td className={cn(tdClasses, 'min-w-48')}>
                <div className="flex flex-wrap gap-2">
                    {generateTags(props.searchTags, props.tags)}
                </div>
            </td>
            <td className={cn(tdClasses, 'w-32')}>
                <div className="flex justify-center gap-2">
                    <AlertDialog open={deleteModal}>
                        <AlertDialogTrigger asChild onClick={openDelete}>
                            <Button
                                size="icon"
                                className="p-2.5"
                                variant="outline"
                            > <TrashIcon /> </Button>
                        </AlertDialogTrigger>
                        <DeleteContent id={props.id} close={closeDelete} />
                    </AlertDialog>

                    <Dialog open={editModal}>
                        <DialogTrigger asChild onClick={openEdit}>
                            <Button
                                variant="outline"
                                size="icon"
                                className="p-2.5"
                            > <PencilIcon /> </Button>
                        </DialogTrigger>
                        <EditContent id={props.id} close={closeEdit} />
                    </Dialog>
                </div>
            </td>
        </>
    );

    // Если компонент используется внутри таблицы, возвращаем только содержимое
    if (props.isInTable) {
        return content;
    }
    
    // Иначе возвращаем только содержимое
    return content;
};

export default Row;
