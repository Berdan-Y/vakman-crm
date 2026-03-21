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
import { TrendingUp } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { ReportFilters } from '@/components/report-filters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

type EmployeeData = {
    id: number;
    name: string;
    total_revenue: number;
    jobs_count: number;
};

type Props = {
    data: EmployeeData[];
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

export default function RevenueByEmployee({ data, period, dateFrom, dateTo }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: t('nav.reports'), href: '/reports' },
            { title: t('reports.revenueByEmployee'), href: '/reports/revenue-by-employee' },
        ],
        [t],
    );

    const chartData = data.map((item) => ({
        name: item.name.split(' ')[0],
        revenue: item.total_revenue,
        jobs: item.jobs_count,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.revenueByEmployee')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('reports.revenueByEmployee')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('reports.revenueByEmployeeDesc')}
                    </p>
                </div>

                <ReportFilters
                    period={period}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    routePath="/reports/revenue-by-employee"
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="size-5 text-blue-600" />
                            {t('reports.revenueOverview')}
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
                                    <YAxis />
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
                                    <Bar dataKey="revenue" fill="#3b82f6" name={t('reports.revenueEuro')} />
                                    <Bar dataKey="jobs" fill="#10b981" name={t('jobs.title')} />
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
                        <CardTitle>{t('reports.detailedBreakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[550px]">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 font-medium">{t('jobs.employee')}</th>
                                        <th className="pb-2 font-medium text-right">{t('jobs.title')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.revenue')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.avgPerJob')}</th>
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
