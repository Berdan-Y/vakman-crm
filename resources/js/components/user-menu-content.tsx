import { Link, router } from '@inertiajs/react';
import { Building2, LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { t } = useTranslation();

    const handleLogout = () => {
        cleanup();
        sessionStorage.clear();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href="/companies"
                        prefetch
                        onClick={cleanup}
                    >
                        <Building2 className="mr-2" />
                        {t('companies.switchCompany')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        {t('nav.settings')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button
                    type="button"
                    className="flex w-full cursor-pointer items-center"
                    onClick={() => {
                        handleLogout();
                        router.post(logout());
                    }}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    {t('auth.logout')}
                </button>
            </DropdownMenuItem>
        </>
    );
}
