import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-sky-100/90 via-violet-100/70 to-indigo-100/90 p-6 md:p-10">
            <div className="w-full max-w-[400px]">
                <div className="rounded-2xl bg-white px-8 py-10 shadow-lg shadow-black/5">
                    <div className="flex flex-col items-center gap-6">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 shadow-sm">
                                <AppLogoIcon className="size-7 fill-white text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1 text-center">
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">
                                {title}
                            </h1>
                            <p className="text-center text-sm text-gray-500">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
