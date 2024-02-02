import type { FC, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
    return (
        <div className="absolute left-1/2 top-0 flex h-screen w-[95dvw] max-w-md -translate-x-1/2 items-center">
            {children}
        </div>
    );
};

export default Layout;
