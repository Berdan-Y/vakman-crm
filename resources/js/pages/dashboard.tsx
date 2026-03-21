import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
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
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { Briefcase, Euro, AlertCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { formatCurrency, toUrl } from '@/lib/utils';

type Period = {
    type: string;
    label: string;
    start: string;
    end: string;
};

type Stats = {
    jobs_completed: number;
    total_revenue: number;
    unpaid_bills: number;
};

type Props = {
    stats?: Stats;
    period?: Period;
};

const defaultStats: Stats = {
    jobs_completed: 0,
    total_revenue: 0,
    unpaid_bills: 0,
};

const defaultPeriod: Period = {
    type: 'month',
    label: new Date().toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    }),
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
};

export default function Dashboard({ stats = defaultStats, period = defaultPeriod }: Props) {
    const { t } = useTranslation();
    
    const handlePeriodChange = (type: string) => {
        router.get('/dashboard', { period: type }, { preserveState: true });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard.title'),
            href: toUrl(dashboard()),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">{t('dashboard.overview')}</h2>
                    <div className="flex items-center gap-2">
                        <Select
                            value={period.type}
                            onValueChange={(value) =>
                                handlePeriodChange(value)
                            }
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">{t('dashboard.thisWeek')}</SelectItem>
                                <SelectItem value="month">{t('dashboard.thisMonth')}</SelectItem>
                                <SelectItem value="year">{t('dashboard.thisYear')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="text-muted-foreground text-sm">{period.label}</p>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('dashboard.jobsCompleted')}
                            </CardTitle>
                            <Briefcase className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.jobs_completed}
                            </div>
                            <CardDescription>
                                {t('dashboard.jobsCompletedDesc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('dashboard.totalRevenue')}
                            </CardTitle>
                            <Euro className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.total_revenue)}
                            </div>
                            <CardDescription>
                                {t('dashboard.totalRevenueDesc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('dashboard.unpaidBills')}
                            </CardTitle>
                            <AlertCircle className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.unpaid_bills)}
                            </div>
                            <CardDescription>
                                {t('dashboard.unpaidBillsDesc')}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
