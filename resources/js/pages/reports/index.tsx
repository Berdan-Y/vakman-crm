import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BarChart3, TrendingUp, Users, Briefcase, Activity } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';

export default function ReportsIndex() {
    const { auth } = usePage().props as any;
    const userRole = auth?.currentCompany?.role;
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('reports.title'), href: '/reports' },
    ];

    const REPORTS = [
        {
            title: t('reports.revenueByEmployee'),
            description: t('reports.revenueByEmployeeDesc'),
            icon: TrendingUp,
            href: '/reports/revenue-by-employee',
            color: 'text-blue-600',
            ownerOnly: true,
        },
        {
            title: t('reports.jobsByStatus'),
            description: t('reports.jobsByStatusDesc'),
            icon: Briefcase,
            href: '/reports/jobs-by-status',
            color: 'text-green-600',
        },
        {
            title: t('reports.monthlyRevenue'),
            description: t('reports.monthlyRevenueDesc'),
            icon: BarChart3,
            href: '/reports/monthly-revenue',
            color: 'text-purple-600',
        },
        {
            title: t('reports.customerJobs'),
            description: t('reports.customerJobsDesc'),
            icon: Users,
            href: '/reports/customer-jobs',
            color: 'text-amber-600',
            ownerOnly: true,
        },
        {
            title: t('reports.employeePerformance'),
            description: t('reports.employeePerformanceDesc'),
            icon: Activity,
            href: '/reports/employee-performance',
            color: 'text-pink-600',
        },
    ];
    
    // Filter reports based on user role - hide ownerOnly reports from employees
    const availableReports = REPORTS.filter(report => 
        !report.ownerOnly || userRole !== 'employee'
    );
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.title')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('reports.title')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('reports.analyticsInsights')}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableReports.map((report) => {
                        const Icon = report.icon;
                        return (
                            <Link key={report.href} href={report.href}>
                                <Card className="transition-colors hover:bg-accent cursor-pointer">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-semibold">
                                            {report.title}
                                        </CardTitle>
                                        <Icon className={`size-5 ${report.color}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>
                                            {report.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
