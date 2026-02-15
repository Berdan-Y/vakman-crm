import { Head, router } from '@inertiajs/react';
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: typeof dashboard() === 'string' ? dashboard() : (dashboard() as { url: string }).url,
    },
];

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

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

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
    const handlePeriodChange = (type: string, date: string) => {
        router.get('/dashboard', { period: type, date }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">Overview</h2>
                    <div className="flex items-center gap-2">
                        <Select
                            value={period.type}
                            onValueChange={(value) =>
                                handlePeriodChange(value, period.start)
                            }
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This week</SelectItem>
                                <SelectItem value="month">This month</SelectItem>
                                <SelectItem value="year">This year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="text-muted-foreground text-sm">{period.label}</p>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Jobs completed
                            </CardTitle>
                            <Briefcase className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.jobs_completed}
                            </div>
                            <CardDescription>
                                Jobs completed in selected period
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total revenue
                            </CardTitle>
                            <Euro className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.total_revenue)}
                            </div>
                            <CardDescription>
                                Paid jobs in selected period
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Unpaid bills
                            </CardTitle>
                            <AlertCircle className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.unpaid_bills)}
                            </div>
                            <CardDescription>
                                Outstanding in selected period
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
