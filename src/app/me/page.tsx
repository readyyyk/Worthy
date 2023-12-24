import { FC } from 'react';

import { getServerSession } from 'next-auth';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { options } from '@/app/api/auth/[...nextauth]/options';
import SignOutButton from '@/app/me/SignOutButton';

interface Props {}
const Page: FC<Props> = async ({}) => {
    const session = await getServerSession(options);
    return (
        <Card className={'w-full items-center flex flex-col'}>
            <CardHeader>
                <CardTitle>{session?.user?.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <SignOutButton />
            </CardContent>
        </Card>
    );
};

export default Page;
