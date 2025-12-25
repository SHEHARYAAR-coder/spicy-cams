// Public layout for model profiles - no authentication required
export default function PublicModelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
