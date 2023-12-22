'use client';

import { FC, useState } from 'react';

import AuthForm from '@/components/AuthForm';

interface Props {}

const Page: FC<Props> = ({}) => {
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
        try {
            if (false) {
                window.location.href = '/';
            } else {
                setError('Invalid credentials');
            }
        } catch (e) {
            setError('Invalid credentials');
        }
    };

    return (
        <AuthForm
            type={'signin'}
            {...{ handleSubmit, passwordState, usernameState, errorState }}
        />
    );
};

export default Page;
