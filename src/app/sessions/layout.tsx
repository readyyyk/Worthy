export default function SessionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 pt-24">
            {children}
        </main>
    );
}