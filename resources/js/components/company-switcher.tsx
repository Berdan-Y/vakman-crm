import { Link, router, usePage } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Building2, ChevronsUpDown } from 'lucide-react';
import type { SharedData } from '@/types';

export function CompanySwitcher() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const currentCompany = auth.currentCompany;
    const companies = auth.companies ?? [];

    if (!currentCompany) {
        return null;
    }

    if (companies.length <= 1) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" asChild>
                        <Link href="/companies" prefetch>
                            <Building2 className="size-4" />
                            <span className="truncate">
                                {currentCompany.name}
                            </span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent"
                        >
                            <Building2 className="size-4" />
                            <span className="truncate">
                                {currentCompany.name}
                            </span>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'right'
                                  : 'bottom'
                        }
                    >
                        {companies.map((company) => (
                            <DropdownMenuItem
                                key={company.id}
                                onClick={() =>
                                    router.post('/companies/switch', {
                                        company_id: company.id,
                                    })
                                }
                                className={
                                    company.id === currentCompany.id
                                        ? 'bg-sidebar-accent'
                                        : ''
                                }
                            >
                                <Building2 className="mr-2 size-4" />
                                {company.name}
                                {company.industry && (
                                    <span className="text-muted-foreground ml-1 text-xs">
                                        ({company.industry})
                                    </span>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
