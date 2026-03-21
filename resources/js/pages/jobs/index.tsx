import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Briefcase, Plus, X } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

type Job = {
    id: number;
    description: string | null;
    date: string;
    scheduled_time: string | null;
    job_type: string | null;
    price: number;
    is_paid: boolean;
    invoice_number: string | null;
    customer: { id: number; name: string } | null;
    employee: { id: number; name: string } | null;
};

type EmployeeOption = { id: number; name: string };

type Props = {
    jobs: Job[];
    employees: EmployeeOption[];
    filters: {
        status?: string;
        employee_id?: string;
        date_from?: string;
        date_to?: string;
    };
};

export default function JobsIndex({ jobs, employees, filters }: Props) {
    const { auth } = usePage().props as any;
    const userRole = auth?.currentCompany?.role;
    const isEmployee = userRole === 'employee';
    const { t } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('jobs.title'), href: '/jobs' },
    ];
    
    const applyFilters = (newFilters: Record<string, string | undefined>) => {
        router.get('/jobs', { ...filters, ...newFilters }, { preserveState: true });
    };

    const resetFilters = () => {
        router.get('/jobs', {}, { preserveState: true });
    };

    const hasActiveFilters =
        filters.status || filters.employee_id || filters.date_from || filters.date_to;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('jobs.title')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">{t('jobs.title')}</h2>
                        <p className="text-muted-foreground text-sm">
                            {t('jobs.description')}
                        </p>
                    </div>
                    {!isEmployee && (
                        <Button asChild>
                            <Link href="/jobs/create">
                                <Plus className="size-4" />
                                {t('jobs.createJob')}
                            </Link>
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{t('jobs.filters')}</CardTitle>
                                <CardDescription>
                                    {t('jobs.filtersDesc')}
                                </CardDescription>
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetFilters}
                                >
                                    <X className="size-4" />
                                    {t('jobs.resetFilters')}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <div className="grid gap-2">
                            <Label>{t('common.status')}</Label>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilters({
                                        status: v === 'all' ? undefined : v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="paid">{t('jobs.paid')}</SelectItem>
                                    <SelectItem value="unpaid">{t('jobs.unpaid')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('jobs.employee')}</Label>
                            <Select
                                value={filters.employee_id ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilters({
                                        employee_id:
                                            v === 'all' ? undefined : v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t('common.all')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {employees.map((e) => (
                                        <SelectItem
                                            key={e.id}
                                            value={String(e.id)}
                                        >
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('jobs.fromDate')}</Label>
                            <Input
                                type="date"
                                value={filters.date_from ?? ''}
                                onChange={(e) =>
                                    applyFilters({
                                        date_from: e.target.value || undefined,
                                    })
                                }
                                className="w-[140px]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('jobs.toDate')}</Label>
                            <Input
                                type="date"
                                value={filters.date_to ?? ''}
                                onChange={(e) =>
                                    applyFilters({
                                        date_to: e.target.value || undefined,
                                    })
                                }
                                className="w-[140px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {jobs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Briefcase className="text-muted-foreground size-12" />
                            <p className="text-muted-foreground mt-2 text-sm">
                                {t('jobs.noJobsMatch')}
                            </p>
                            <Button asChild className="mt-4" variant="outline">
                                <Link href="/jobs/create">
                                    <Plus className="size-4" />
                                    {t('jobs.createAJob')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[700px]">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('common.date')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('common.time')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('common.description')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('common.type')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('jobs.customer')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('jobs.employee')}
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                {t('common.price')}
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                {t('common.status')}
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job) => (
                                            <tr
                                                key={job.id}
                                                className="border-b border-sidebar-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-2">
                                                    {job.date}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.scheduled_time ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.description || '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.job_type ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.customer?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.employee?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(job.price)}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {job.is_paid ? (
                                                        <span className="text-green-600">
                                                            {t('jobs.paid')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600">
                                                            {t('jobs.unpaid')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/jobs/${job.id}`}
                                                        >
                                                            {t('common.view')}
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
