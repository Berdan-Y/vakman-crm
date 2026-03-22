import { Head, Link, router } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    Briefcase,
    Building2,
    Mail,
    Phone,
    User,
    Calendar,
    Edit,
    Trash2,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';

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
    street: string | null;
    house_number: string | null;
    zip_code: string | null;
    city: string | null;
    kvk_number: string | null;
    vat_number: string | null;
    role: string | null;
    join_date: string | null;
    total_jobs: number;
    total_revenue: number;
    user_id: number | null;
    has_account: boolean;
    jobs: Job[];
};

type Props = {
    employee: EmployeeDetail;
};

export default function EmployeesShow({ employee }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('employees.title'), href: '/employees' },
        { title: employee.name, href: `/employees/${employee.id}` },
    ];

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [sendingInvitation, setSendingInvitation] = useState(false);

    const handleDelete = () => {
        router.delete(`/employees/${employee.id}`, {
            onSuccess: () => {
                setDeleteConfirmOpen(false);
            },
        });
    };

    const handleSendInvitation = () => {
        setSendingInvitation(true);
        router.post(
            `/employees/${employee.id}/send-invitation`,
            {},
            {
                onFinish: () => setSendingInvitation(false),
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={employee.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {!employee.has_account && (
                        <Button
                            variant="outline"
                            onClick={handleSendInvitation}
                            disabled={sendingInvitation}
                        >
                            {sendingInvitation ? (
                                <>{t('employees.sendingInvitation')}</>
                            ) : (
                                <>
                                    <Mail className="size-4" />
                                    {t('employees.sendInvitation')}
                                </>
                            )}
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link href={`/employees/${employee.id}/edit`}>
                            <Edit className="size-4" />
                            {t('common.edit')}
                        </Link>
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteConfirmOpen(true)}
                    >
                        <Trash2 className="size-4" />
                        {t('common.delete')}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-5" />
                            {employee.name}
                        </CardTitle>
                        <CardDescription>
                            {employee.role || t('companies.employee')}
                        </CardDescription>
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
                        {[
                            employee.street,
                            employee.house_number,
                            employee.zip_code,
                            employee.city,
                        ].some(Boolean) && (
                            <div className="col-span-full flex items-start gap-2 text-sm sm:col-span-2">
                                <Building2 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                <span>
                                    {[
                                        [employee.street, employee.house_number]
                                            .filter(Boolean)
                                            .join(' '),
                                        [employee.zip_code, employee.city]
                                            .filter(Boolean)
                                            .join(' '),
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                </span>
                            </div>
                        )}
                        {employee.vat_number && (
                            <div className="col-span-full text-sm sm:col-span-2">
                                <span className="font-medium">
                                    {t('companies.taxNumber')}:
                                </span>{' '}
                                {employee.vat_number}
                            </div>
                        )}
                        {employee.kvk_number && (
                            <div className="flex items-center gap-2 text-sm">
                                <Building2 className="text-muted-foreground size-4" />
                                <span>{employee.kvk_number}</span>
                            </div>
                        )}
                        {employee.join_date && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="text-muted-foreground size-4" />
                                {t('employees.joined')} {employee.join_date}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="size-5" />
                            {t('employees.performance')}
                        </CardTitle>
                        <CardDescription>
                            {t('employees.performanceDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-6">
                        <div>
                            <p className="text-muted-foreground text-sm">
                                {t('employees.totalJobsCompleted')}
                            </p>
                            <p className="text-2xl font-semibold">
                                {employee.total_jobs}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">
                                {t('employees.totalRevenue')}
                            </p>
                            <p className="text-2xl font-semibold">
                                {formatCurrency(employee.total_revenue)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('employees.jobHistory')}</CardTitle>
                        <CardDescription>
                            {t('employees.jobHistoryDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employee.jobs.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                {t('employees.noJobsYet')}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pb-2 font-medium">
                                                {t('common.date')}
                                            </th>
                                            <th className="pb-2 font-medium">
                                                {t('common.description')}
                                            </th>
                                            <th className="pb-2 font-medium">
                                                {t('jobs.customer')}
                                            </th>
                                            <th className="pb-2 font-medium text-right">
                                                {t('common.price')}
                                            </th>
                                            <th className="pb-2 font-medium text-right">
                                                {t('common.status')}
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
                                                            {t('jobs.paid')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600">
                                                            {t('jobs.unpaid')}
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

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('employees.deleteEmployee')}</DialogTitle>
                        <DialogDescription>
                            {t('employees.deleteEmployeeConfirmNamed', {
                                name: employee.name,
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            {t('common.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
