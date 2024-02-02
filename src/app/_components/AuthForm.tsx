'use client';

/*
 * React-Hook-Form isn't used here because it's not needed.
 * This is a simple form with minimal validation.
 */
import type { Dispatch, FC, SetStateAction } from 'react';

import Link from 'next/link';

import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';

interface SharedProps {
    errorState: [string, Dispatch<SetStateAction<string>>];
    usernameState: [string, Dispatch<SetStateAction<string>>];
    passwordState: [string, Dispatch<SetStateAction<string>>];
    handleSubmit: () => Promise<void>;
}

interface SignInProps extends SharedProps {
    type: 'signin';
}

interface SignUpProps extends SharedProps {
    type: 'signup';
    repeatedPasswordState: [string, Dispatch<SetStateAction<string>>];
}

type Props = SignInProps | SignUpProps;
const AuthForm: FC<Props> = (props) => {
    const { type } = props;
    const {
        handleSubmit,
        errorState: [error],
        usernameState: [username, setUsername],
        passwordState: [password, setPassword],
    } = props;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className={'text-center'}>
                    Sign {type === 'signin' ? 'in' : 'up'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <p className={'text-center text-red-500 mb-4'}>{error}</p>
                )}
                <form
                    className={'grid gap-3'}
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                >
                    <Label>
                        <Input
                            type={'text'}
                            name={'username'}
                            placeholder={'Username'}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </Label>
                    <Label>
                        <Input
                            type={'password'}
                            name={'password'}
                            placeholder={'Password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Label>
                    {type === 'signup' && (
                        <Label>
                            <Input
                                type={'password'}
                                name={'password'}
                                placeholder={'Repeat password'}
                                value={props.repeatedPasswordState[0]}
                                onChange={(e) =>
                                    props.repeatedPasswordState[1](
                                        e.target.value,
                                    )
                                }
                            />
                        </Label>
                    )}

                    <div className={'flex gap-3'}>
                        <Button type={'submit'} className={'w-fit'}>
                            Submit
                        </Button>
                        <Button
                            type={'button'}
                            className={'w-fit'}
                            variant={'outline'}
                            asChild
                        >
                            <Link
                                href={`/sign${type === 'signin' ? 'up' : 'in'}`}
                            >
                                Sign {type === 'signin' ? 'up' : 'in'}
                            </Link>
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AuthForm;
