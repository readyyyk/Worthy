'use client';

import { FC, useState } from 'react';

import { useRouter } from 'next/navigation';

import AuthForm from '@/components/AuthForm';

interface Props {}

const Page: FC<Props> = ({}) => {
    const router = useRouter();
    const usernameState = useState('');
    const passwordState = useState('');
    const repeatedPasswordState = useState('');
    const errorState = useState('');

    const [username] = usernameState;
    const [password] = passwordState;
    const [repeatedPassword] = repeatedPasswordState;
    const [_, setError] = errorState;

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

        // smth like trpc.signUp(username, password)
        if (false) {
            router.push('/');
        } else {
            setError('User already exists');
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
