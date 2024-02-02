'use client';

import { type FC, useEffect, useState } from 'react';

import AuthForm from '@/app/_components/AuthForm';
import { api } from '@/trpc/react';
import { signIn } from 'next-auth/react';


const Page: FC = ({}) => {
    const { error: trpcError, mutateAsync } = api.auth.register.useMutation();
    const usernameState = useState('');
    const passwordState = useState('');
    const repeatedPasswordState = useState('');
    const errorState = useState('');

    const [username] = usernameState;
    const [password] = passwordState;
    const [repeatedPassword] = repeatedPasswordState;
    const [_, setError] = errorState;

    useEffect(() => {
        if (trpcError) {
            setError(trpcError.message);
        }
    }, [setError, trpcError]);

    const handleSubmit = async () => {
        setError('');
        if (!username || !password || !repeatedPassword) {
            setError('All fields are required');
            return;
        }
        if (password !== repeatedPassword) {
            setError('Passwords must be equal!');
            return;
        }

        const resp = await mutateAsync({ username, password });

        if (resp) {
            void signIn('credentials', {
                callbackUrl: '/',
                redirect: true,
                username,
                password,
            });
        }
    };

    return (
        <AuthForm
            type={'signup'}
            {...{
                handleSubmit,
                usernameState,
                passwordState,
                repeatedPasswordState,
                errorState,
            }}
        />
    );
};

export default Page;
