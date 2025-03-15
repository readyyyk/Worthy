'use client';

import { type FC, type ReactNode, useEffect, useState } from 'react';
import { TrashIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';

interface HeaderLinkProps {
    href: string;
    className?: string;
    children: ReactNode;
}

const HeaderLink: FC<HeaderLinkProps> = ({ href, className, children }) => {
    const title = href.replace('/', '');
    return (
        <Link
            title={title || 'home'}
            href={href}
            className={cn(
                'rounded-full bg-background aspect-square h-full w-auto grid place-items-center p-1 shadow shadow-transparent hover:shadow-white transition',
                className,
            )}
        >
            {children}
        </Link>
    );
};

const Header: FC = ({}) => {
    const [image, setImage] = useState('');
    const [isDone, setIsDone] = useState(false);
    const session = useSession();
    const utils = api.useUtils();
    useEffect(() => {
        if (session.status !== 'authenticated') {
            return;
        }
        void (async () => {
            if (image.length) return;
            const a = await utils.users.me.fetch();
            setImage(a.image);
        })();
    }, [image.length, session, utils.users.me]);

    return <div
        className="fixed bottom-2 h-16 p-1.5 max-w-xl w-[95dvw] bg-secondary left-1/2 -translate-x-1/2 rounded-full flex justify-between">
        <HeaderLink href={'/'} className={'aspect-auto flex items-center gap-3 px-3'}>
            <Image src="/logo.svg" alt={'Worthy'} width={28} height={28} />
            <h1 className="text-xl">Worthy</h1>
        </HeaderLink>

        <div className='flex-1 flex justify-end gap-x-1.5'>
            <button
                onClick={()=>{
                    // i'm lazy, so no throttle
                    if (typeof window !== 'undefined') {
                        window.localStorage.clear();
                        setIsDone(true);
                        setTimeout(()=>setIsDone(false), 2000);
                    }
                }}
                className={cn(
                    'transition rounded-full bg-background aspect-square h-full w-auto grid place-items-center p-1 shadow shadow-transparent hover:shadow-white transition',
                    isDone ? 'bg-emerald-600' : 'bg-background',
                )}
            >
                <TrashIcon />
            </button>

            {session.status !== 'authenticated' || !image.length ?
                <HeaderLink href="/signin">
                    <UserIcon />
                </HeaderLink> :
                <HeaderLink href="/api/auth/signout" className="aspect-auto flex items-center gap-3 px-3">
                    <Image src={image} alt={'Logout'} width={28} height={28} />
                </HeaderLink>
            }
        </div>
        
    </div>;
};

export default Header;
