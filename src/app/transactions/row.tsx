import { type FC, useState } from 'react';
import { type RouterOutputs } from '@/trpc/shared';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogTrigger } from '@/app/_components/ui/alert-dialog';
import { Button } from '@/app/_components/ui/button';
import { PencilIcon, TrashIcon } from 'lucide-react';
import DeleteContent from '@/app/transactions/delete';
import { Badge } from '@/app/_components/ui/badge';


const tdClasses = 'p-3';

type Props = RouterOutputs['transactions']['getList'][0] & {
    searchTags: string[] | undefined;
    addSearchTag: (a: string) => void;
    removeSearchTag: (a: string) => void;
};
const Row: FC<Props> = (props) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const openDelete = () => setDeleteModal(true);
    const closeDelete = () => setDeleteModal(false);

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

    return (<tr className="bg-secondary/30 odd:bg-transparent border-b">
        <td className={cn(
            tdClasses,
            'w-8 bg-opacity-30',
            props.isIncome ? 'bg-green-500' : 'bg-red-700',
        )}>{props.amount}</td>
        <td className={cn(tdClasses, 'w-8')}>{props.currency}</td>
        <td className={cn(tdClasses, 'max-w-56')}>{props.description}</td>
        <td className={cn(tdClasses, 'w-20 text-center')}>{format(props.createdAt, 'dd.MM.yyyy HH:mm')}</td>
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

                <Button
                    disabled
                    variant="outline"
                    size="icon"
                    className="p-2.5"
                > <PencilIcon /> </Button>
            </div>
        </td>
    </tr>);
};

export default Row;
