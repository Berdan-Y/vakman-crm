import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Briefcase,
    Calendar,
    FileText,
    Folder,
    LayoutGrid,
    MapPin,
    Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CompanySwitcher } from '@/components/company-switcher';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const userRole = auth?.currentCompany?.role;
    const { t } = useTranslation();

    const allNavItems: NavItem[] = [
        {
            title: t('nav.dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: t('nav.addressSearch'),
            href: '/address-search',
            icon: MapPin,
        },
        {
            title: t('nav.employees'),
            href: '/employees',
            icon: Users,
            ownerOnly: true,
        },
        {
            title: t('nav.jobs'),
            href: '/jobs',
            icon: Briefcase,
        },
        {
            title: t('nav.invoices'),
            href: '/invoices',
            icon: FileText,
        },
        {
            title: t('nav.calendar'),
            href: '/calendar',
            icon: Calendar,
        },
        {
            title: t('nav.reports'),
            href: '/reports',
            icon: BarChart3,
        },
    ];

    // Filter nav items based on user role - hide ownerOnly items from employees
    const mainNavItems = allNavItems.filter(
        (item) => !item.ownerOnly || userRole !== 'employee',
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <CompanySwitcher />
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
