import type { FC } from 'react';
import { Button } from '@/app/_components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface Props {
    current: number;
    setPage: (newPage: number) => void;
}

const Pagination: FC<Props> = ({ current, setPage }) => {
    const nextPage = () => setPage(current + 1);
    const prevPage = () => setPage(current - 1);

    return (<div className="flex gap-2 mt-2 justify-center">
        <Button size="icon" variant="outline" onClick={prevPage} disabled={current === 1}> <ChevronLeft /> </Button>
        <Button size="icon" variant="outline" className="disabled:opacity-100 text-lg" disabled> {current} </Button>
        <Button size="icon" variant="outline" onClick={nextPage}> <ChevronRight /> </Button>
    </div>);
};

export default Pagination;
