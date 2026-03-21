import AuthCenteredLayout from '@/layouts/auth/auth-centered-layout';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <AuthCenteredLayout title={title} description={description} {...props}>
            {children}
        </AuthCenteredLayout>
    );
}
