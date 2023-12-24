import { FC } from 'react';

import { UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import logo from '@/assets/logo.svg';

interface Props {}

const Header: FC<Props> = ({}) => {
    return (
        <header className="sticky top-0 z-50 m-auto mb-6 flex max-w-5xl items-center justify-between bg-background py-4">
            <Link className={'flex items-center space-x-2'} href={'/'}>
                <Image className={'h-12 w-12'} src={logo} alt={'Worthy logo'} />
                <h1 className="text-2xl font-bold">Worthy</h1>
            </Link>
            <Button
                size="icon"
                variant="outline"
                className={'shadow-lg shadow-slate-800'}
                asChild
            >
                <Link href={'/me'}>
                    <UserIcon />
                </Link>
            </Button>
        </header>
    );
};

export default Header;
