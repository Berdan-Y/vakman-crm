import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Building2, Mail, Phone, User, Briefcase } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type JobOptions = {
    recommendation: Record<string, string>;
    job_info: Record<string, string>;
    job_types: string[];
};

type CustomerDetail = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    city: string | null;
    zip_code: string;
    house_number: string;
};

type Job = {
    id: number;
    description: string | null;
    date: string;
    scheduled_time: string | null;
    price: number;
    is_paid: boolean;
    invoice_number: string | null;
    job_type: string | null;
    recommendation: string | null;
    employee: { id: number; name: string } | null;
};

type Props = {
    customer: CustomerDetail;
    jobs: Job[];
    jobOptions?: JobOptions;
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

export default function CustomersShow({
    customer,
    jobs,
    jobOptions = {},
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Address search', href: '/address-search' },
        { title: customer.name, href: `/customers/${customer.id}` },
    ];

    const addressParts = [
        customer.street,
        customer.house_number,
        customer.zip_code,
        customer.city,
    ].filter(Boolean);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <h2 className="text-lg font-semibold">{customer.name}</h2>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-5" />
                            Customer details
                        </CardTitle>
                        <CardDescription>
                            Contact and address information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {customer.email && (
                            <p className="flex items-center gap-2">
                                <Mail className="size-4 shrink-0 text-muted-foreground" />
                                <a
                                    href={`mailto:${customer.email}`}
                                    className="text-primary hover:underline"
                                >
                                    {customer.email}
                                </a>
                            </p>
                        )}
                        {customer.phone && (
                            <p className="flex items-center gap-2">
                                <Phone className="size-4 shrink-0 text-muted-foreground" />
                                <a
                                    href={`tel:${customer.phone}`}
                                    className="text-primary hover:underline"
                                >
                                    {customer.phone}
                                </a>
                            </p>
                        )}
                        {addressParts.length > 0 && (
                            <p className="flex items-center gap-2">
                                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                                {addressParts.join(', ')}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="size-5" />
                            Job history
                        </CardTitle>
                        <CardDescription>
                            All jobs for this customer
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {jobs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No jobs yet for this customer.
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
                                                Time
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Description
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Type
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Employee
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Price
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Status
                                            </th>
                                            <th className="pb-2" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job) => (
                                            <tr
                                                key={job.id}
                                                className="border-b border-sidebar-border/70"
                                            >
                                                <td className="py-2">
                                                    {job.date}
                                                </td>
                                                <td className="py-2">
                                                    {job.scheduled_time ?? '—'}
                                                </td>
                                                <td className="py-2">
                                                    {job.description || '—'}
                                                </td>
                                                <td className="py-2">
                                                    {job.job_type ?? '—'}
                                                </td>
                                                <td className="py-2">
                                                    {job.employee?.name ?? '—'}
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
                                                <td className="py-2 pl-2">
                                                    <Link
                                                        href={`/jobs/${job.id}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        View
                                                    </Link>
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
