'use client';

import { type FC, useState } from 'react';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import AuthForm from '@/app/_components/AuthForm';


const Page: FC = ({}) => {
    const router = useRouter();
    const usernameState = useState('');
    const passwordState = useState('');
    const errorState = useState('');

    const [username] = usernameState;
    const [password] = passwordState;
    const [_, setError] = errorState;

    const handleSubmit = async () => {
        setError('');
        if (!username || !password) {
            setError('All fields are required');
            return;
        }
        const resp = await signIn('credentials', {
            redirect: false,
            username,
            password,
        });
        if (!resp) {
            setError('Error while signing in');
            return;
        }
        if (resp?.error) {
            setError(resp.error);
            return;
        }
        router.push('/');
    };

    return (
        <AuthForm
            type={'signin'}
            {...{ handleSubmit, passwordState, usernameState, errorState }}
        />
    );
};

export default Page;
