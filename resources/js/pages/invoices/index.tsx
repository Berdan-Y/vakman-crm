import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { FileText, Plus } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

type InvoiceRow = {
    id: number;
    invoice_number: string | null;
    type: string;
    payment_method: string;
    status: string;
    amount: number;
    total_incl_tax: number | null;
    recipient_name: string;
    created_at: string;
    sent_at: string | null;
    job: {
        id: number;
        date: string;
        customer_name: string | undefined;
    } | null;
};

type Props = {
    invoices: InvoiceRow[];
};

function formatShortDate(iso: string, locale: string): string {
    try {
        return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export default function InvoicesIndex({ invoices }: Props) {
    const { t, i18n } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.invoices'), href: '/invoices' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('invoices.title')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">{t('invoices.title')}</h2>
                        <p className="text-muted-foreground text-sm">
                            {t('invoices.indexDescription')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/invoices/new">
                                <Plus className="size-4" />
                                {t('invoices.createWithoutJob')}
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/invoices/create">
                                <Plus className="size-4" />
                                {t('invoices.createInvoice')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="text-muted-foreground size-12" />
                            <p className="text-muted-foreground mt-2 text-sm">
                                {t('invoices.noInvoicesYet')}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <Button asChild variant="outline">
                                    <Link href="/invoices/new">
                                        <Plus className="size-4" />
                                        {t('invoices.createWithoutJob')}
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/invoices/create">
                                        <Plus className="size-4" />
                                        {t('invoices.createInvoice')}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('invoices.allInvoices')}</CardTitle>
                            <CardDescription>
                                {t('invoices.indexDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[900px]">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('invoices.ref')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('jobs.title')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('jobs.customer')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('invoices.recipientName')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('common.date')}
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                {t('invoices.amount')}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('invoices.status')}
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((inv) => (
                                            <tr
                                                key={inv.id}
                                                className="border-b border-sidebar-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-2 font-mono text-xs">
                                                    {inv.invoice_number ?? '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {inv.job ? (
                                                        <Link
                                                            href={`/jobs/${inv.job.id}`}
                                                            className="text-primary font-medium hover:underline"
                                                        >
                                                            #{inv.job.id}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {inv.job?.customer_name ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {inv.recipient_name}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    {formatShortDate(
                                                        inv.sent_at ??
                                                            inv.created_at,
                                                        i18n.language,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(
                                                        inv.total_incl_tax ??
                                                            inv.amount,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge
                                                        variant={
                                                            inv.status === 'paid'
                                                                ? 'default'
                                                                : inv.status ===
                                                                    'sent'
                                                                  ? 'secondary'
                                                                  : 'outline'
                                                        }
                                                    >
                                                        {inv.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/invoices/${inv.id}`}
                                                        >
                                                            {t('common.view')}
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
