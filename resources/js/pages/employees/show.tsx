import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Briefcase, Mail, Phone, User, Calendar } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type Job = {
    id: number;
    description: string | null;
    date: string;
    price: number;
    is_paid: boolean;
    invoice_number: string | null;
    customer: { id: number; name: string; phone: string | null } | null;
};

type EmployeeDetail = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string | null;
    join_date: string | null;
    total_jobs: number;
    total_revenue: number;
    jobs: Job[];
};

type Props = {
    employee: EmployeeDetail;
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

export default function EmployeesShow({ employee }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: '/employees' },
        { title: employee.name, href: `/employees/${employee.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={employee.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-5" />
                            {employee.name}
                        </CardTitle>
                        <CardDescription>{employee.role || 'Employee'}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="text-muted-foreground size-4" />
                            <a
                                href={`mailto:${employee.email}`}
                                className="text-primary hover:underline"
                            >
                                {employee.email}
                            </a>
                        </div>
                        {employee.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="text-muted-foreground size-4" />
                                <a
                                    href={`tel:${employee.phone}`}
                                    className="text-primary hover:underline"
                                >
                                    {employee.phone}
                                </a>
                            </div>
                        )}
                        {employee.join_date && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="text-muted-foreground size-4" />
                                Joined {employee.join_date}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="size-5" />
                            Performance
                        </CardTitle>
                        <CardDescription>
                            Jobs and revenue for this employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-6">
                        <div>
                            <p className="text-muted-foreground text-sm">
                                Total jobs completed
                            </p>
                            <p className="text-2xl font-semibold">
                                {employee.total_jobs}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">
                                Total revenue
                            </p>
                            <p className="text-2xl font-semibold">
                                {formatCurrency(employee.total_revenue)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Job history</CardTitle>
                        <CardDescription>
                            All jobs assigned to this employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employee.jobs.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No jobs yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pb-2 font-medium">
                                                Date
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Description
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Customer
                                            </th>
                                            <th className="pb-2 font-medium text-right">
                                                Price
                                            </th>
                                            <th className="pb-2 font-medium text-right">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employee.jobs.map((job) => (
                                            <tr
                                                key={job.id}
                                                className="border-b border-sidebar-border/70"
                                            >
                                                <td className="py-2">
                                                    {job.date}
                                                </td>
                                                <td className="py-2">
                                                    {job.description || '—'}
                                                </td>
                                                <td className="py-2">
                                                    {job.customer ? (
                                                        <Link
                                                            href={`/jobs/${job.id}`}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {job.customer.name}
                                                        </Link>
                                                    ) : (
                                                            '—'
                                                        )}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatCurrency(job.price)}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {job.is_paid ? (
                                                        <span className="text-green-600">
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600">
                                                            Unpaid
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
