import { FC, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
    return (
        <div
            className={
                'h-screen absolute top-0 left-1/2 -translate-x-1/2 flex items-center w-[95dvw] max-w-md'
            }
        >
            {children}
        </div>
    );
};

export default Layout;
