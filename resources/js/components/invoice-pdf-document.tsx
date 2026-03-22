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

export type InvoiceCompanyDetails = {
    name: string;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    tax_number: string | null;
    kvk_number: string | null;
    email: string | null;
    account_holder: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
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
    payment_method?: string;
    invoice_number?: string | null;
    recipient_name: string;
    recipient_email: string;
    recipient_vat_number?: string | null;
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
    job: Job | null;
    customer: InvoiceDocumentCustomer | null;
    company_name: string;
    company?: InvoiceCompanyDetails | null;
    company_sender_line?: string;
    document_date?: string;
    due_date?: string;
    delivery_date?: string;
    payment_method_label?: string;
    display_invoice_number?: string | null;
    tax_rate_percent?: number;
    customer_address_lines?: string[];
    /** VAT / BTW number shown under the address (from customer, employee, or invoice). */
    bill_to_vat_number?: string | null;
    className?: string;
};

function formatDateNl(iso: string): string {
    try {
        const normalized = iso.includes('T') ? iso : `${iso}T12:00:00`;
        const d = new Date(normalized);
        return new Intl.DateTimeFormat('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(d);
    } catch {
        return iso;
    }
}

function formatQty(q: number): string {
    return new Intl.NumberFormat('nl-NL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(q);
}

export function InvoicePdfDocument({
    invoice,
    invoice_lines = [],
    job,
    customer,
    company_name,
    company,
    company_sender_line,
    document_date,
    due_date,
    delivery_date,
    payment_method_label,
    display_invoice_number,
    tax_rate_percent = 21,
    customer_address_lines: customerAddressLinesProp,
    bill_to_vat_number: billToVatNumberProp,
    className,
}: Props) {
    const { t } = useTranslation();

    const addressLineLegacy = [
        [customer?.street, customer?.house_number].filter(Boolean).join(' '),
        customer?.zip_code,
        customer?.city,
    ]
        .filter(Boolean)
        .join(', ');

    const customerAddressLines =
        customerAddressLinesProp ??
        (addressLineLegacy ? [addressLineLegacy] : []);

    const billToVatNumber =
        billToVatNumberProp ?? invoice.recipient_vat_number ?? null;

    const docDate =
        document_date ??
        formatDateNl(invoice.sent_at ?? invoice.created_at);
    const dueDateComputed =
        due_date ??
        (() => {
            try {
                const base = new Date(invoice.sent_at ?? invoice.created_at);
                const d = new Date(base);
                d.setDate(d.getDate() + 14);
                return new Intl.DateTimeFormat('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }).format(d);
            } catch {
                return docDate;
            }
        })();
    const deliveryDate =
        delivery_date ?? (job?.date ? formatDateNl(job.date) : docDate);

    const paymentLabel =
        payment_method_label ??
        (invoice.payment_method === 'cash'
            ? t('invoices.paymentCash')
            : t('invoices.paymentCard'));

    const refNumber =
        display_invoice_number ??
        invoice.invoice_number ??
        job?.invoice_number ??
        null;
    const factuurNr =
        refNumber !== null && refNumber !== ''
            ? refNumber
            : t('invoices.pdfNoNumber');

    const hasLines = invoice_lines.length > 0;
    const subtotal = invoice.subtotal;
    const taxAmount = invoice.tax_amount;
    const totalIncl = invoice.total_incl_tax;
    const showTaxBlock =
        subtotal !== undefined &&
        taxAmount !== undefined &&
        totalIncl !== undefined;

    const baseForVat = formatCurrency(subtotal ?? 0);

    const senderLine =
        company_sender_line ??
        [company_name].filter(Boolean).join(', ');

    const companyForFooter: InvoiceCompanyDetails | null =
        company ??
        ({
            name: company_name,
            street_address: null,
            postal_code: null,
            city: null,
            country: null,
            tax_number: null,
            kvk_number: null,
            email: null,
            account_holder: null,
            bank_name: null,
            bank_account_number: null,
        } as InvoiceCompanyDetails);

    const footerAddr = [
        companyForFooter.name,
        companyForFooter.street_address,
        [companyForFooter.postal_code, companyForFooter.city]
            .filter(Boolean)
            .join(' '),
        companyForFooter.country,
    ]
        .filter((x) => x !== null && x !== '')
        .join(', ');

    const idBits: string[] = [];
    if (companyForFooter.tax_number) {
        idBits.push(
            `${t('invoices.pdfFooterVat')}: ${companyForFooter.tax_number}`,
        );
    }
    if (companyForFooter.kvk_number) {
        idBits.push(
            `${t('invoices.pdfFooterKvk')}: ${companyForFooter.kvk_number}`,
        );
    }

    const bankBits: string[] = [];
    if (companyForFooter.account_holder) {
        bankBits.push(
            `${t('invoices.pdfFooterAccountHolder')}: ${companyForFooter.account_holder}`,
        );
    }
    if (companyForFooter.bank_name) {
        bankBits.push(
            `${t('invoices.pdfFooterBank')}: ${companyForFooter.bank_name}`,
        );
    }
    if (companyForFooter.bank_account_number) {
        bankBits.push(
            `${t('invoices.pdfFooterAccount')}: ${companyForFooter.bank_account_number}`,
        );
    }

    return (
        <div
            className={cn(
                'max-w-[720px] bg-white p-8 font-sans text-[11px] leading-relaxed text-gray-900 antialiased shadow-sm',
                className,
            )}
        >
            <h1 className="mb-1.5 text-[26px] font-bold uppercase tracking-wide">
                {t('invoices.pdfTitle')}
            </h1>
            {senderLine ? (
                <p className="mb-7 max-w-[90%] text-[11px] text-gray-500">
                    {senderLine}
                </p>
            ) : null}

            <div className="mb-5 flex flex-wrap gap-6">
                <div className="min-w-[240px] flex-1">
                    <p className="mb-2 text-[11px] font-bold">
                        {t('invoices.pdfCustomerLabel')}
                    </p>
                    <p className="mb-1 text-[12px] font-bold">
                        {invoice.recipient_name}
                    </p>
                    {customerAddressLines.map((line) => (
                        <p key={line} className="text-[11px] text-gray-700">
                            {line}
                        </p>
                    ))}
                    {billToVatNumber ? (
                        <p className="text-[11px] text-gray-700">
                            {t('companies.taxNumber')}: {billToVatNumber}
                        </p>
                    ) : null}
                </div>
                <div className="min-w-[220px] flex-1">
                    <table className="w-full font-sans text-[11px]">
                        <tbody>
                            <tr>
                                <td className="py-0.5 text-gray-700">
                                    {t('invoices.pdfInvoiceNumberShort')}
                                </td>
                                <td className="py-0.5 text-right font-bold">
                                    {factuurNr}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-0.5 text-gray-700">
                                    {t('invoices.invoiceDate')}
                                </td>
                                <td className="py-0.5 text-right font-bold">
                                    {docDate}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-0.5 text-gray-700">
                                    {t('invoices.dueDate')}
                                </td>
                                <td className="py-0.5 text-right font-bold">
                                    {dueDateComputed}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="h-2" />
                            </tr>
                            <tr>
                                <td className="py-0.5 text-gray-700">
                                    {t('invoices.pdfDeliveryDate')}
                                </td>
                                <td className="py-0.5 text-right font-bold">
                                    {deliveryDate}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-0.5 text-gray-700">
                                    {t('invoices.pdfPaymentMethod')}
                                </td>
                                <td className="py-0.5 text-right font-bold">
                                    {paymentLabel}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <table className="mb-5 w-full border-collapse font-sans text-[10px]">
                <thead>
                    <tr className="bg-gray-200 text-gray-700">
                        <th className="border border-gray-300 px-1.5 py-2 text-left font-bold uppercase tracking-wide">
                            {t('invoices.pdfColDescription')}
                        </th>
                        {hasLines ? (
                            <>
                                <th className="w-[8%] border border-gray-300 px-1.5 py-2 text-center font-bold uppercase tracking-wide">
                                    {t('invoices.pdfColQty')}
                                </th>
                                <th className="w-[14%] border border-gray-300 px-1.5 py-2 text-right font-bold uppercase tracking-wide">
                                    {t('invoices.pdfColPrice')}
                                </th>
                                <th className="w-[11%] border border-gray-300 px-1.5 py-2 text-right font-bold uppercase tracking-wide">
                                    {t('invoices.pdfColDiscount')}
                                </th>
                                <th className="w-[15%] border border-gray-300 px-1.5 py-2 text-right font-bold uppercase tracking-wide">
                                    {t('invoices.pdfColAmount')}
                                </th>
                            </>
                        ) : (
                            <>
                                <th className="w-[18%] border border-gray-300 px-1.5 py-2 text-center font-bold uppercase tracking-wide">
                                    {t('common.date')}
                                </th>
                                <th className="w-[22%] border border-gray-300 px-1.5 py-2 text-right font-bold uppercase tracking-wide">
                                    {t('invoices.pdfColAmount')}
                                </th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {hasLines ? (
                        invoice_lines.map((line) => (
                            <tr key={line.id}>
                                <td className="border-b border-gray-200 px-1.5 py-2.5 align-top">
                                    {line.description}
                                </td>
                                <td className="border-b border-gray-200 px-1.5 py-2.5 text-center align-top">
                                    {formatQty(line.quantity)}
                                </td>
                                <td className="border-b border-gray-200 px-1.5 py-2.5 text-right align-top">
                                    {formatCurrency(line.unit_price)}
                                </td>
                                <td className="border-b border-gray-200 px-1.5 py-2.5 text-right align-top">
                                    0,00
                                </td>
                                <td className="border-b border-gray-200 px-1.5 py-2.5 text-right font-bold align-top">
                                    {formatCurrency(line.total)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="border-b border-gray-200 px-1.5 py-2.5 align-top">
                                {job ? (
                                    <>
                                        <span>
                                            {t('invoices.pdfJobLine', {
                                                id: job.id,
                                            })}
                                        </span>
                                        {job.description ? (
                                            <span className="mt-0.5 block text-[9px] text-gray-500">
                                                {job.description}
                                            </span>
                                        ) : null}
                                    </>
                                ) : (
                                    <span>
                                        {t('invoices.pdfStandaloneLine')}
                                    </span>
                                )}
                            </td>
                            <td className="border-b border-gray-200 px-1.5 py-2.5 text-center align-top">
                                {job ? (
                                    <>
                                        {formatDateNl(job.date)}
                                        {job.scheduled_time ? (
                                            <span className="mt-0.5 block text-[9px] text-gray-500">
                                                {job.scheduled_time}
                                            </span>
                                        ) : null}
                                    </>
                                ) : (
                                    docDate
                                )}
                            </td>
                            <td className="border-b border-gray-200 px-1.5 py-2.5 text-right font-bold align-top">
                                {formatCurrency(invoice.amount)}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {showTaxBlock ? (
                <div className="mb-2 flex justify-end">
                    <table className="w-[58%] border-collapse border border-gray-300 font-sans text-[11px]">
                        <tbody>
                            <tr>
                                <td className="border-b border-gray-200 px-3 py-2 text-left text-gray-700">
                                    {t('invoices.pdfTotalExclVat')}:
                                </td>
                                <td className="border-b border-gray-200 px-3 py-2 text-right font-bold whitespace-nowrap">
                                    {formatCurrency(subtotal ?? 0)}
                                </td>
                            </tr>
                            <tr>
                                <td className="border-b border-gray-200 px-3 py-2 text-left text-gray-700">
                                    {t('invoices.pdfVatLine', {
                                        rate: tax_rate_percent,
                                        base: baseForVat,
                                    })}
                                </td>
                                <td className="border-b border-gray-200 px-3 py-2 text-right font-bold whitespace-nowrap">
                                    {formatCurrency(taxAmount ?? 0)}
                                </td>
                            </tr>
                            <tr>
                                <td className="border-b border-gray-200 px-3 py-2 text-left text-gray-700">
                                    {t('invoices.pdfTotalInclEur')}:
                                </td>
                                <td className="border-b border-gray-200 px-3 py-2 text-right font-bold whitespace-nowrap">
                                    {formatCurrency(totalIncl ?? 0)}
                                </td>
                            </tr>
                            <tr className="bg-[#1d4ed8] text-white">
                                <td className="px-3 py-2 font-bold">
                                    {t('invoices.pdfAmountDueEur')}
                                </td>
                                <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                                    {formatCurrency(totalIncl ?? 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mb-2 flex justify-end">
                    <table className="w-[58%] border-collapse border border-gray-300 font-sans text-[11px]">
                        <tbody>
                            <tr className="bg-[#1d4ed8] text-white">
                                <td className="px-3 py-2 font-bold">
                                    {t('invoices.pdfAmountDueEur')}
                                </td>
                                <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                                    {formatCurrency(invoice.amount)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-9 border-t border-gray-300 pt-4 text-[9px] leading-relaxed text-gray-600">
                {footerAddr ? (
                    <p className="mb-1.5">{footerAddr}</p>
                ) : null}
                {idBits.length > 0 ? (
                    <p className="mb-1.5">{idBits.join(' | ')}</p>
                ) : null}
                {companyForFooter.email ? (
                    <p className="mb-1.5">
                        {t('invoices.pdfFooterEmail')}:{' '}
                        {companyForFooter.email}
                    </p>
                ) : null}
                {bankBits.length > 0 ? <p>{bankBits.join(' | ')}</p> : null}
            </div>
        </div>
    );
}
