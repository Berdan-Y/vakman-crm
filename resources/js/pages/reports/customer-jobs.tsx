import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Users } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { ReportFilters } from '@/components/report-filters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type CustomerData = {
    id: number;
    name: string;
    jobs_count: number;
};

type Props = {
    data: CustomerData[];
    period: string;
    dateFrom: string;
    dateTo: string;
};

function formatPeriodLabel(period: string, dateFrom: string, dateTo: string, t: TFunction): string {
    if (period === 'custom') {
        return `${dateFrom} – ${dateTo}`;
    }

    const labels: Record<string, string> = {
        week: t('dashboard.thisWeek'),
        month: t('dashboard.thisMonth'),
        year: t('dashboard.thisYear'),
    };

    return labels[period] || `${dateFrom} – ${dateTo}`;
}

export default function CustomerJobs({ data, period, dateFrom, dateTo }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: t('nav.reports'), href: '/reports' },
            { title: t('reports.customerJobs'), href: '/reports/customer-jobs' },
        ],
        [t],
    );

    const chartData = data.slice(0, 10).map((item) => ({
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        jobs: item.jobs_count,
    }));

    const totalJobs = data.reduce((sum, item) => sum + item.jobs_count, 0);

    const periodLabel = formatPeriodLabel(period, dateFrom, dateTo, t);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.customerJobs')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('reports.customerJobs')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('reports.customerJobsDesc')}
                    </p>
                </div>

                <ReportFilters
                    period={period}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    routePath="/reports/customer-jobs"
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5 text-amber-600" />
                            {t('reports.topCustomers')}
                        </CardTitle>
                        <CardDescription>
                            {t('reports.showingTop10', { period: periodLabel })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="jobs" fill="#f59e0b" name={t('jobs.title')} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                {t('reports.noDataForPeriod')}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('reports.allCustomers')}</CardTitle>
                        <CardDescription>
                            {t('reports.showingUpTo20Customers')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[500px]">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 font-medium">{t('reports.rank')}</th>
                                        <th className="pb-2 font-medium">{t('jobs.customer')}</th>
                                        <th className="pb-2 font-medium text-right">{t('jobs.title')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.percentOfTotal')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, index) => (
                                        <tr key={row.id} className="border-b">
                                            <td className="py-2 text-muted-foreground">{index + 1}</td>
                                            <td className="py-2">{row.name}</td>
                                            <td className="py-2 text-right font-medium">{row.jobs_count}</td>
                                            <td className="py-2 text-right text-muted-foreground">
                                                {totalJobs > 0
                                                    ? `${((row.jobs_count / totalJobs) * 100).toFixed(1)}%`
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-muted-foreground">
                                                {t('reports.noDataInPeriod')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
