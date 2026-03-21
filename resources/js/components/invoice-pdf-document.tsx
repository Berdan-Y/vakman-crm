import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export type InvoiceDocumentCustomer = {
    name: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    city: string | null;
    zip_code: string;
    house_number: string;
};

type InvoiceLine = {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
};

type Invoice = {
    id: number;
    type: string;
    recipient_name: string;
    recipient_email: string;
    amount: number;
    subtotal?: number;
    tax_amount?: number;
    total_incl_tax?: number;
    status: string;
    created_at: string;
    sent_at: string | null;
};

type Job = {
    id: number;
    description: string | null;
    date: string;
    scheduled_time: string | null;
    invoice_number: string | null;
};

type Props = {
    invoice: Invoice;
    invoice_lines?: InvoiceLine[];
    job: Job;
    customer: InvoiceDocumentCustomer;
    company_name: string;
    className?: string;
};

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(d);
    } catch {
        return iso;
    }
}

export function InvoicePdfDocument({
    invoice,
    invoice_lines = [],
    job,
    customer,
    company_name,
    className,
}: Props) {
    const { t } = useTranslation();
    const addressLine = [
        [customer.street, customer.house_number].filter(Boolean).join(' '),
        customer.zip_code,
        customer.city,
    ]
        .filter(Boolean)
        .join(', ');
    const invoiceDate = formatDate(invoice.created_at);
    const sentAt = invoice.sent_at ? formatDate(invoice.sent_at) : null;
    const amountFormatted = formatCurrency(invoice.amount);
    const statusClass =
        invoice.status === 'paid'
            ? 'text-green-700'
            : invoice.status === 'sent'
              ? 'text-blue-700 font-medium'
              : 'text-gray-700';

    const hasLines = invoice_lines && invoice_lines.length > 0;

    return (
        <div
            className={cn(
                'max-w-[42rem] rounded border border-gray-200 bg-white p-0 p-4 font-sans text-sm text-gray-900 antialiased shadow-sm',
                className,
            )}
        >
            <div className="border-b border-gray-200 pb-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {company_name}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {invoice.type === 'customer'
                                ? t('invoices.customerInvoice')
                                : t('invoices.employeeInvoice')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-medium">
                            {t('invoices.invoice')} #{invoice.id}
                        </p>
                        {job.invoice_number && (
                            <p className="mt-1 text-sm text-gray-600">
                                {t('invoices.ref')}: {job.invoice_number}
                            </p>
                        )}
                        <p className="mt-1 text-sm text-gray-600">
                            {t('common.date')}: {invoiceDate}
                        </p>
                        {invoice.status !== 'draft' && sentAt && (
                            <p className="mt-1 text-xs text-gray-500">
                                {t('invoices.sent')}: {sentAt}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-6">
                <div>
                    <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                        {t('invoices.billTo')}
                    </p>
                    <p className="font-medium text-gray-900">
                        {invoice.recipient_name}
                    </p>
                    <p className="text-sm text-gray-600">
                        {invoice.recipient_email}
                    </p>
                </div>
                {addressLine && (
                    <div>
                        <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                            {t('invoices.serviceAddress')}
                        </p>
                        <p className="text-sm text-gray-600">{addressLine}</p>
                        {customer.phone && (
                            <p className="mt-1 text-sm text-gray-600">
                                {customer.phone}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <table className="mt-8 w-full border-collapse text-sm min-w-[500px]">
                <thead>
                    <tr>
                        <th className="border-b border-gray-200 py-2 text-left font-medium text-gray-600">
                            {t('common.description')}
                        </th>
                        {hasLines && (
                            <>
                                <th className="border-b border-gray-200 py-2 text-right font-medium text-gray-600">
                                    {t('invoices.quantity')}
                                </th>
                                <th className="border-b border-gray-200 py-2 text-right font-medium text-gray-600">
                                    {t('invoices.unitPrice')}
                                </th>
                            </>
                        )}
                        {!hasLines && (
                            <th className="border-b border-gray-200 py-2 text-right font-medium text-gray-600">
                                {t('common.date')}
                            </th>
                        )}
                        <th className="border-b border-gray-200 py-2 text-right font-medium text-gray-600">
                            {t('invoices.amount')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {hasLines ? (
                        invoice_lines.map((line) => (
                            <tr key={line.id}>
                                <td className="border-b border-gray-200 py-3 text-gray-900">
                                    {line.description}
                                </td>
                                <td className="border-b border-gray-200 py-3 text-right text-gray-900">
                                    {line.quantity}
                                </td>
                                <td className="border-b border-gray-200 py-3 text-right text-gray-900">
                                    {formatCurrency(line.unit_price)}
                                </td>
                                <td className="border-b border-gray-200 py-3 text-right font-medium text-gray-900">
                                    {formatCurrency(line.total)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="border-b border-gray-200 py-3 text-gray-900">
                                {t('invoices.jobNumber', { id: job.id })}
                                {job.description && (
                                    <span className="mt-0.5 block text-xs text-gray-500">
                                        {job.description}
                                    </span>
                                )}
                            </td>
                            <td className="border-b border-gray-200 py-3 text-right text-gray-900">
                                {job.date}
                                {job.scheduled_time && (
                                    <span className="mt-0.5 block text-xs text-gray-500">
                                        {job.scheduled_time}
                                    </span>
                                )}
                            </td>
                            <td className="border-b border-gray-200 py-3 text-right font-medium text-gray-900">
                                {amountFormatted}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {invoice.subtotal !== undefined && invoice.tax_amount !== undefined && (
                <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {t('invoices.subtotalExclTax')}:
                        </span>
                        <span className="font-medium">
                            {formatCurrency(invoice.subtotal)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {t('invoices.taxAmount')}:
                        </span>
                        <span className="font-medium">
                            {formatCurrency(invoice.tax_amount)}
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">
                    {t('invoices.status')}:{' '}
                    <span className={statusClass}>{invoice.status}</span>
                </p>
                <p className="text-xl font-semibold text-gray-900">
                    {t('invoices.totalInclTax')}:{' '}
                    {invoice.total_incl_tax !== undefined
                        ? formatCurrency(invoice.total_incl_tax)
                        : amountFormatted}
                </p>
            </div>
        </div>
    );
}
