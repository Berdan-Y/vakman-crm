import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Briefcase, Plus } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type Job = {
    id: number;
    description: string | null;
    date: string;
    scheduled_time: string | null;
    job_type: string | null;
    price: number;
    is_paid: boolean;
    invoice_number: string | null;
    customer: { id: number; name: string } | null;
    employee: { id: number; name: string } | null;
};

type EmployeeOption = { id: number; name: string };

type Props = {
    jobs: Job[];
    employees: EmployeeOption[];
    filters: {
        status?: string;
        employee_id?: string;
        date_from?: string;
        date_to?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Jobs', href: '/jobs' },
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

export default function JobsIndex({ jobs, employees, filters }: Props) {
    const applyFilters = (newFilters: Record<string, string | undefined>) => {
        router.get('/jobs', { ...filters, ...newFilters }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jobs" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">Jobs</h2>
                        <p className="text-muted-foreground text-sm">
                            View and manage all jobs
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/jobs/create">
                            <Plus className="size-4" />
                            Create job
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Filter by payment status, employee, or date range
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilters({
                                        status: v === 'all' ? undefined : v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Employee</Label>
                            <Select
                                value={filters.employee_id ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilters({
                                        employee_id:
                                            v === 'all' ? undefined : v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {employees.map((e) => (
                                        <SelectItem
                                            key={e.id}
                                            value={String(e.id)}
                                        >
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>From date</Label>
                            <Input
                                type="date"
                                value={filters.date_from ?? ''}
                                onChange={(e) =>
                                    applyFilters({
                                        date_from: e.target.value || undefined,
                                    })
                                }
                                className="w-[140px]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>To date</Label>
                            <Input
                                type="date"
                                value={filters.date_to ?? ''}
                                onChange={(e) =>
                                    applyFilters({
                                        date_to: e.target.value || undefined,
                                    })
                                }
                                className="w-[140px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {jobs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Briefcase className="text-muted-foreground size-12" />
                            <p className="text-muted-foreground mt-2 text-sm">
                                No jobs match your filters
                            </p>
                            <Button asChild className="mt-4" variant="outline">
                                <Link href="/jobs/create">
                                    <Plus className="size-4" />
                                    Create a job
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Time
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Description
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Type
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Employee
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Price
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Status
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job) => (
                                            <tr
                                                key={job.id}
                                                className="border-b border-sidebar-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-2">
                                                    {job.date}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.scheduled_time ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.description || '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.job_type ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.customer?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.employee?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(job.price)}
                                                </td>
                                                <td className="px-4 py-2 text-right">
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
                                                <td className="px-4 py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/jobs/${job.id}`}
                                                        >
                                                            View
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
