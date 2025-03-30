import { type FC, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
            <div className="z-10 w-full max-w-5xl">
                {children}
            </div>
        </main>
    );
};

export default Layout;