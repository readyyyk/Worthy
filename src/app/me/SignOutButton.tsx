'use client';

import { FC } from 'react';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

interface Props {}

const SignOutButton: FC<Props> = ({}) => {
    return (
        <Button variant={'outline'} onClick={() => signOut()}>
            Sign out
        </Button>
    );
};

export default SignOutButton;
