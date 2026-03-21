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
import { Activity } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { ReportFilters } from '@/components/report-filters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

type PerformanceData = {
    id: number;
    name: string;
    jobs_count: number;
    total_revenue: number;
};

type Props = {
    data: PerformanceData[];
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

export default function EmployeePerformance({ data, period, dateFrom, dateTo }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: t('nav.reports'), href: '/reports' },
            { title: t('reports.employeePerformance'), href: '/reports/employee-performance' },
        ],
        [t],
    );

    const chartData = data.map((item) => ({
        name: item.name.split(' ')[0],
        jobs: item.jobs_count,
        revenue: item.total_revenue,
    }));

    const totalJobs = data.reduce((sum, item) => sum + item.jobs_count, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.employeePerformance')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('reports.employeePerformance')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('reports.employeePerformanceDesc')}
                    </p>
                </div>

                <ReportFilters
                    period={period}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    routePath="/reports/employee-performance"
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('employees.totalJobs')}</CardTitle>
                            <Activity className="size-4 text-pink-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalJobs}</div>
                            <p className="text-muted-foreground text-xs mt-1">
                                {t('reports.completedInThisPeriod')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.totalRevenue')}</CardTitle>
                            <Activity className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                            <p className="text-muted-foreground text-xs mt-1">
                                {t('reports.fromPaidJobs')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="size-5 text-pink-600" />
                            {t('reports.performanceComparison')}
                        </CardTitle>
                        <CardDescription>
                            {formatPeriodLabel(period, dateFrom, dateTo, t)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#ec4899" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                                    <Tooltip
                                        formatter={(value, _name, item) => {
                                            if (item.dataKey === 'revenue' && typeof value === 'number') {
                                                return formatCurrency(value);
                                            }
                                            return value;
                                        }}
                                        labelFormatter={(label) => t('reports.employeeLabel', { name: label })}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="jobs" fill="#ec4899" name={t('jobs.title')} />
                                    <Bar yAxisId="right" dataKey="revenue" fill="#3b82f6" name={t('reports.revenueEuro')} />
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
                        <CardTitle>{t('reports.detailedPerformance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[600px]">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 font-medium">{t('jobs.employee')}</th>
                                        <th className="pb-2 font-medium text-right">{t('jobs.title')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.revenue')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.avgPerJob')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.percentOfTotalJobs')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row) => (
                                        <tr key={row.id} className="border-b">
                                            <td className="py-2">{row.name}</td>
                                            <td className="py-2 text-right">{row.jobs_count}</td>
                                            <td className="py-2 text-right font-medium">
                                                {formatCurrency(row.total_revenue)}
                                            </td>
                                            <td className="py-2 text-right text-muted-foreground">
                                                {row.jobs_count > 0
                                                    ? formatCurrency(row.total_revenue / row.jobs_count)
                                                    : '—'}
                                            </td>
                                            <td className="py-2 text-right text-muted-foreground">
                                                {totalJobs > 0
                                                    ? `${((row.jobs_count / totalJobs) * 100).toFixed(1)}%`
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-muted-foreground">
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
