import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import {
    Briefcase,
    User,
    Building2,
    Euro,
    FileText,
    Mail,
    Phone,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type Invoice = {
    id: number;
    type: string;
    recipient_name: string;
    recipient_email: string;
    amount: number;
    status: string;
    created_at: string;
    sent_at: string | null;
};

type JobOptions = {
    recommendation: Record<string, string>;
    job_info: Record<string, string>;
    job_types: string[];
};

type JobDetail = {
    id: number;
    description: string | null;
    date: string;
    scheduled_time: string | null;
    recommendation: string | null;
    job_info: string[];
    job_type: string | null;
    job_type_other: string | null;
    price: number;
    is_paid: boolean;
    invoice_number: string | null;
    customer: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        street: string | null;
        city: string | null;
        zip_code: string;
        house_number: string;
    } | null;
    employee: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        role: string | null;
    } | null;
    invoices: Invoice[];
};

type Props = {
    job: JobDetail;
    jobOptions?: JobOptions;
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

const defaultJobOptions: JobOptions = {
    recommendation: { emergency: 'Emergency Service', regular: 'Regular Service' },
    job_info: {
        wait_at_neighbors: 'Wait at neighbors',
        wait_at_door: 'Wait in front of the door',
        appointment_job: 'Appointment job',
        call_15_min_before: 'Call client 15 minutes beforehand',
        wait_inside: 'Wait inside',
    },
    job_types: [],
};

export default function JobsShow({ job, jobOptions = defaultJobOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jobs', href: '/jobs' },
        { title: `Job #${job.id}`, href: `/jobs/${job.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Job #${job.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">Job #{job.id}</h2>
                    {!job.is_paid && (
                        <Button
                            onClick={() =>
                                router.post(`/jobs/${job.id}/mark-paid`)
                            }
                        >
                            Mark as paid
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="size-5" />
                                Job information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {job.scheduled_time && (
                                <p>
                                    <span className="text-muted-foreground">
                                        Time:
                                    </span>{' '}
                                    {job.scheduled_time}
                                </p>
                            )}
                            {job.recommendation && (
                                <p>
                                    <span className="text-muted-foreground">
                                        Recommendation:
                                    </span>{' '}
                                    {(jobOptions.recommendation && jobOptions.recommendation[job.recommendation]) ?? job.recommendation}
                                </p>
                            )}
                            {job.job_info.length > 0 && (
                                <p>
                                    <span className="text-muted-foreground">
                                        Job info:
                                    </span>{' '}
                                    {job.job_info
                                        .map(
                                            (key) =>
                                                (jobOptions.job_info && jobOptions.job_info[key]) ?? key
                                        )
                                        .join(', ')}
                                </p>
                            )}
                            {job.job_type && (
                                <p>
                                    <span className="text-muted-foreground">
                                        Job type:
                                    </span>{' '}
                                    {job.job_type === 'Other' && job.job_type_other
                                        ? job.job_type_other
                                        : job.job_type}
                                </p>
                            )}
                            <p>
                                <span className="text-muted-foreground">
                                    Description:
                                </span>{' '}
                                {job.description || '—'}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Invoice:
                                </span>{' '}
                                {job.invoice_number || '—'}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Date:
                                </span>{' '}
                                {job.date}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Price:
                                </span>{' '}
                                {formatCurrency(job.price)}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Status:
                                </span>{' '}
                                {job.is_paid ? (
                                    <Badge variant="default">Paid</Badge>
                                ) : (
                                    <Badge variant="secondary">Unpaid</Badge>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    {job.customer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="size-5" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="font-medium">{job.customer.name}</p>
                                {job.customer.phone && (
                                    <p className="flex items-center gap-1">
                                        <Phone className="size-4" />
                                        {job.customer.phone}
                                    </p>
                                )}
                                {job.customer.email && (
                                    <p className="flex items-center gap-1">
                                        <Mail className="size-4" />
                                        {job.customer.email}
                                    </p>
                                )}
                                <p className="flex items-center gap-1">
                                    <Building2 className="size-4" />
                                    {[
                                        job.customer.street,
                                        job.customer.house_number,
                                        job.customer.zip_code,
                                        job.customer.city,
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {job.employee && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="size-5" />
                                    Assigned employee
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="font-medium">{job.employee.name}</p>
                                {job.employee.role && (
                                    <p className="text-muted-foreground">
                                        {job.employee.role}
                                    </p>
                                )}
                                <p className="flex items-center gap-1">
                                    <Mail className="size-4" />
                                    {job.employee.email}
                                </p>
                                {job.employee.phone && (
                                    <p className="flex items-center gap-1">
                                        <Phone className="size-4" />
                                        {job.employee.phone}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Invoices
                        </CardTitle>
                        <CardDescription>
                            Customer and employee invoices for this job
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {job.invoices.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No invoices yet. Invoice creation will be
                                available in the invoicing module.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {job.invoices.map((inv) => (
                                    <li
                                        key={inv.id}
                                        className="flex items-center justify-between rounded border p-2 text-sm"
                                    >
                                        <span>
                                            {inv.type} — {inv.recipient_name} (
                                            {inv.recipient_email}) —{' '}
                                            {formatCurrency(inv.amount)}
                                        </span>
                                        <Badge
                                            variant={
                                                inv.status === 'paid'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {inv.status}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
