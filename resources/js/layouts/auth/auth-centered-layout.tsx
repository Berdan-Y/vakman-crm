import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthCenteredLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
            <div className="w-full max-w-md">
                <div className="flex flex-col gap-6">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-3 font-medium"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                            <AppLogoIcon className="size-6 fill-primary-foreground text-primary-foreground" />
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>

                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
