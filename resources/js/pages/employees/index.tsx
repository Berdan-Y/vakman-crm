import { Head, Link } from '@inertiajs/react';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: '/employees' },
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

export default function EmployeesIndex({ employees }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">Employees</h2>
                        <p className="text-muted-foreground text-sm">
                            Manage your team and view performance
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/employees/create">
                            <UserPlus className="size-4" />
                            Add employee
                        </Link>
                    </Button>
                </div>

                {employees.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="text-muted-foreground size-12" />
                            <p className="text-muted-foreground mt-2 text-sm">
                                No employees yet
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/employees/create">
                                    <UserPlus className="size-4" />
                                    Add your first employee
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
                                                Joined {employee.join_date}
                                            </p>
                                        )}
                                        <div className="border-sidebar-border/70 mt-2 flex gap-4 border-t pt-2">
                                            <span>
                                                {employee.total_jobs} job
                                                {employee.total_jobs !== 1 ? 's' : ''}
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
