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
import { Briefcase, FileText, Plus } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type JobRow = {
    id: number;
    description: string | null;
    date: string;
    customer: { name: string } | null;
};

type Props = {
    jobs: JobRow[];
};

export default function InvoicesCreate({ jobs }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.invoices'), href: '/invoices' },
        { title: t('invoices.createInvoice'), href: '/invoices/create' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('invoices.createInvoice')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">
                        {t('invoices.createInvoice')}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t('invoices.createDescription')}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('invoices.standaloneNewTitle')}</CardTitle>
                        <CardDescription>
                            {t('invoices.standaloneNewDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="secondary">
                            <Link href="/invoices/new">
                                <Plus className="size-4" />
                                {t('invoices.createWithoutJob')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {jobs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Briefcase className="text-muted-foreground size-12" />
                            <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">
                                {t('invoices.noJobsForInvoice')}
                            </p>
                            <Button asChild className="mt-4" variant="outline">
                                <Link href="/jobs">
                                    <Plus className="size-4" />
                                    {t('jobs.title')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('invoices.selectJob')}</CardTitle>
                            <CardDescription>
                                {t('invoices.createDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[640px]">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('common.date')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('jobs.customer')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('common.description')}
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
                                                    {job.customer?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {job.description || '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Button size="sm" asChild>
                                                        <Link
                                                            href={`/jobs/${job.id}?newInvoice=1`}
                                                        >
                                                            <FileText className="size-4" />
                                                            {t(
                                                                'invoices.createForThisJob',
                                                            )}
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
