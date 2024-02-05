import {
    type ReactNode,
    type FC,
    Suspense,
} from 'react';

interface Props {
    children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
    return (<Suspense> {children} </Suspense>);
};

export default Layout;
