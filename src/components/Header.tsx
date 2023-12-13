import { FC } from 'react';
import Image from 'next/image';
import logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';
import { UserIcon } from 'lucide-react';
import Link from 'next/link';

interface Props {}

const Header: FC<Props> = ({}) => {
    return (
        <header className="flex items-center justify-between mb-6 max-w-5xl m-auto sticky top-0 py-4 z-50 bg-background">
            <Link className={'flex items-center space-x-2'} href={'/'}>
                <Image className={'w-12 h-12'} src={logo} alt={'Worthy logo'} />
                <h1 className="text-2xl font-bold">Worthy</h1>
            </Link>
            <Button
                size="icon"
                variant="outline"
                className={'shadow-lg shadow-slate-800'}
            >
                <UserIcon />
            </Button>
        </header>
    );
};

export default Header;
