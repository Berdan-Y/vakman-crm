import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { UserPlus, Users } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

type Employee = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string | null;
    join_date: string | null;
    total_jobs: number;
    total_revenue: number;
};

type Props = {
    employees: Employee[];
};

export default function EmployeesIndex({ employees }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('employees.title'), href: '/employees' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('employees.title')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">{t('employees.title')}</h2>
                        <p className="text-muted-foreground text-sm">
                            {t('employees.description')}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/employees/create">
                            <UserPlus className="size-4" />
                            {t('employees.addEmployee')}
                        </Link>
                    </Button>
                </div>

                {employees.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="text-muted-foreground size-12" />
                            <p className="text-muted-foreground mt-2 text-sm">
                                {t('employees.noEmployees')}
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/employees/create">
                                    <UserPlus className="size-4" />
                                    {t('employees.addFirstEmployee')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {employees.map((employee) => (
                            <Link
                                key={employee.id}
                                href={`/employees/${employee.id}`}
                                className="block"
                            >
                                <Card className="transition-colors hover:bg-muted/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">
                                            {employee.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {employee.role || '—'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm">
                                        <p>{employee.email}</p>
                                        {employee.phone && (
                                            <p className="text-muted-foreground">
                                                {employee.phone}
                                            </p>
                                        )}
                                        {employee.join_date && (
                                            <p className="text-muted-foreground text-xs">
                                                {t('employees.joined')} {employee.join_date}
                                            </p>
                                        )}
                                        <div className="border-sidebar-border/70 mt-2 flex gap-4 border-t pt-2">
                                            <span>
                                                {employee.total_jobs} {employee.total_jobs !== 1 ? t('employees.jobs') : t('employees.job')}
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(employee.total_revenue)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
