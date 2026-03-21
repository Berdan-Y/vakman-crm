import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { InvoicePdfDocument } from '@/components/invoice-pdf-document';
import type { InvoiceDocumentCustomer } from '@/components/invoice-pdf-document';
import AppLayout from '@/layouts/app-layout';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BreadcrumbItem } from '@/types';

type InvoiceData = {
    id: number;
    type: string;
    recipient_name: string;
    recipient_email: string;
    amount: number;
    status: string;
    created_at: string;
    sent_at: string | null;
};

type InvoiceLine = {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
};

type JobData = {
    id: number;
    description: string | null;
    date: string;
    scheduled_time: string | null;
    invoice_number: string | null;
};

type Props = {
    invoice: InvoiceData;
    invoice_lines?: InvoiceLine[];
    job: JobData;
    customer: InvoiceDocumentCustomer;
    company_name: string;
};

export default function InvoicesShow({
    invoice,
    invoice_lines,
    job,
    customer,
    company_name,
}: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('jobs.title'), href: '/jobs' },
        { title: `${t('jobs.title')} #${job.id}`, href: `/jobs/${job.id}` },
        { title: `${t('invoices.invoice')} #${invoice.id}`, href: `/invoices/${invoice.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('invoices.invoice')} #${invoice.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/jobs/${job.id}`}>
                            <ArrowLeft className="size-4" />
                            {t('jobs.backToJob')}
                        </Link>
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(`/invoices/${invoice.id}/pdf`, '_blank')}
                    >
                        <FileText className="size-4" />
                        {t('invoices.printPdf')}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <InvoicePdfDocument
                        invoice={invoice}
                        invoice_lines={invoice_lines}
                        job={job}
                        customer={customer}
                        company_name={company_name}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
