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
import { Briefcase } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { ReportFilters } from '@/components/report-filters';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type JobsData = {
    paid: number;
    unpaid: number;
};

type Props = {
    data: JobsData;
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

const COLORS = ['#10b981', '#f59e0b'];

export default function JobsByStatus({ data, period, dateFrom, dateTo }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: t('nav.reports'), href: '/reports' },
            { title: t('reports.jobsByStatus'), href: '/reports/jobs-by-status' },
        ],
        [t],
    );

    const total = data.paid + data.unpaid;

    const chartData = [
        { name: t('jobs.paid'), value: data.paid },
        { name: t('jobs.unpaid'), value: data.unpaid },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.jobsByStatus')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('reports.jobsByStatus')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('reports.jobsByStatusDesc')}
                    </p>
                </div>

                <ReportFilters
                    period={period}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    routePath="/reports/jobs-by-status"
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="size-5 text-green-600" />
                            {t('reports.statusOverview')}
                        </CardTitle>
                        <CardDescription>
                            {formatPeriodLabel(period, dateFrom, dateTo, t)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {total > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                                        }
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                {t('reports.noDataForPeriod')}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.paidJobs')}</CardTitle>
                            <Briefcase className="size-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{data.paid}</div>
                            <p className="text-muted-foreground text-xs mt-1">
                                {total > 0
                                    ? t('reports.percentOfTotalFraction', {
                                          percent: ((data.paid / total) * 100).toFixed(1),
                                      })
                                    : t('reports.noJobsInPeriod')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.unpaidJobs')}</CardTitle>
                            <Briefcase className="size-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{data.unpaid}</div>
                            <p className="text-muted-foreground text-xs mt-1">
                                {total > 0
                                    ? t('reports.percentOfTotalFraction', {
                                          percent: ((data.unpaid / total) * 100).toFixed(1),
                                      })
                                    : t('reports.noJobsInPeriod')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
