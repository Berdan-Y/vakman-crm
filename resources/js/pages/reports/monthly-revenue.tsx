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
import { BarChart3 } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { ReportFilters } from '@/components/report-filters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

type MonthlyData = {
    month: string;
    monthKey: string;
    total: number;
};

type Props = {
    data: MonthlyData[];
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

export default function MonthlyRevenue({ data, period, dateFrom, dateTo }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: t('nav.reports'), href: '/reports' },
            { title: t('reports.monthlyRevenue'), href: '/reports/monthly-revenue' },
        ],
        [t],
    );

    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
    const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.monthlyRevenue')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('reports.monthlyRevenue')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('reports.monthlyRevenueDesc')}
                    </p>
                </div>

                <ReportFilters
                    period={period}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    routePath="/reports/monthly-revenue"
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.totalRevenue')}</CardTitle>
                            <BarChart3 className="size-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                            <p className="text-muted-foreground text-xs mt-1">
                                {t('reports.forSelectedPeriod')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.averagePerMonth')}</CardTitle>
                            <BarChart3 className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(avgRevenue)}</div>
                            <p className="text-muted-foreground text-xs mt-1">
                                {t('reports.basedOnMonths', { count: data.length })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="size-5 text-purple-600" />
                            {t('reports.revenueTrend')}
                        </CardTitle>
                        <CardDescription>
                            {formatPeriodLabel(period, dateFrom, dateTo, t)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) =>
                                            typeof value === 'number' ? formatCurrency(value) : value
                                        }
                                        labelFormatter={(label) => t('reports.monthLabel', { month: label })}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#a855f7"
                                        strokeWidth={2}
                                        name={t('reports.revenueEuro')}
                                    />
                                </LineChart>
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
                        <CardTitle>{t('reports.monthlyBreakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[400px]">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 font-medium">{t('reports.month')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.revenue')}</th>
                                        <th className="pb-2 font-medium text-right">{t('reports.percentOfTotal')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row) => (
                                        <tr key={row.monthKey} className="border-b">
                                            <td className="py-2">{row.month}</td>
                                            <td className="py-2 text-right font-medium">
                                                {formatCurrency(row.total)}
                                            </td>
                                            <td className="py-2 text-right text-muted-foreground">
                                                {totalRevenue > 0
                                                    ? `${((row.total / totalRevenue) * 100).toFixed(1)}%`
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-4 text-center text-muted-foreground">
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
