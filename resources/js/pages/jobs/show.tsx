import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { InvoicePdfDocument } from '@/components/invoice-pdf-document';
import type {
    InvoiceCompanyDetails,
    InvoiceDocumentCustomer,
} from '@/components/invoice-pdf-document';
import AppLayout from '@/layouts/app-layout';
import {
    Briefcase,
    Loader2,
    User,
    Building2,
    Euro,
    FileText,
    Mail,
    Phone,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Edit,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

type Invoice = {
    id: number;
    type: string;
    payment_method: string;
    invoice_number: string | null;
    recipient_name: string;
    recipient_email: string;
    amount: number;
    status: string;
    created_at: string;
    sent_at: string | null;
};

type InvoiceLineLocal = {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
};

type InvoiceLineAPI = {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
};

type JobOptions = {
    recommendation: Record<string, string>;
    job_info: Record<string, string>;
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
    base_price?: number;
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
    whatsapp_sent_at: string | null;
};

type InvoiceParty = {
    id: number;
    name: string;
    email: string | null;
};

type Props = {
    job: JobDetail;
    jobOptions?: JobOptions;
    customersForInvoice?: InvoiceParty[];
    employeesForInvoice?: InvoiceParty[];
};

const defaultJobOptions: JobOptions = {
    recommendation: {
        emergency: 'jobs.emergency',
        regular: 'jobs.regular',
    },
    job_info: {
        wait_at_neighbors: 'jobs.waitAtNeighbors',
        wait_at_door: 'jobs.waitAtDoor',
        appointment_job: 'jobs.appointmentJob',
        call_15_min_before: 'jobs.call15MinBefore',
        wait_inside: 'jobs.waitInside',
    },
};

function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
}

export default function JobsShow({
    job,
    jobOptions = defaultJobOptions,
    customersForInvoice = [],
    employeesForInvoice = [],
}: Props) {
    const { auth } = usePage().props as any;
    const userRole = auth?.currentCompany?.role;
    const isEmployee = userRole === 'employee';
    const { t } = useTranslation();
    
    const [invoiceOpen, setInvoiceOpen] = useState(false);
    const [invoiceStep, setInvoiceStep] = useState<1 | 2>(1);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>(
        'card',
    );
    const [invoiceType, setInvoiceType] = useState<'customer' | 'employee'>(
        'customer',
    );
    const [recipientName, setRecipientName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [invoiceLines, setInvoiceLines] = useState<InvoiceLineLocal[]>([]);
    const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
    const [whatsAppSending, setWhatsAppSending] = useState(false);
    const [whatsAppMessage, setWhatsAppMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [localWhatsAppSentAt, setLocalWhatsAppSentAt] = useState<
        string | null
    >(null);
    const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
    const [invoicePreviewId, setInvoicePreviewId] = useState<number | null>(
        null,
    );
    const [invoicePreviewData, setInvoicePreviewData] = useState<{
        invoice: Props['job']['invoices'][0] & {
            created_at: string;
            payment_method?: string;
            invoice_number?: string | null;
            subtotal?: number;
            tax_amount?: number;
            total_incl_tax?: number;
        };
        invoice_lines?: InvoiceLineAPI[];
        job: {
            id: number;
            description: string | null;
            date: string;
            scheduled_time: string | null;
            invoice_number: string | null;
        } | null;
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
    } | null>(null);
    const [invoicePreviewLoading, setInvoicePreviewLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
    const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [jobDeleteConfirmOpen, setJobDeleteConfirmOpen] = useState(false);
    const [priceIncludesTax, setPriceIncludesTax] = useState(false);

    const invoiceStepOneValid = useMemo(() => {
        if (invoiceType === 'customer') {
            const c = customersForInvoice.find(
                (x) => String(x.id) === selectedCustomerId,
            );
            return !!(c && c.email?.trim());
        }
        const e = employeesForInvoice.find(
            (x) => String(x.id) === selectedEmployeeId,
        );
        return !!(e && e.email?.trim());
    }, [
        invoiceType,
        customersForInvoice,
        employeesForInvoice,
        selectedCustomerId,
        selectedEmployeeId,
    ]);

    const openCreateInvoice = () => {
        setIsEditMode(false);
        setEditingInvoiceId(null);
        setInvoiceStep(1);
        setInvoiceType('customer');
        setSelectedCustomerId(
            job.customer ? String(job.customer.id) : '',
        );
        setSelectedEmployeeId(
            job.employee ? String(job.employee.id) : '',
        );
        setRecipientName(job.customer?.name ?? '');
        setRecipientEmail(job.customer?.email ?? '');
        setInvoiceLines([
            {
                id: crypto.randomUUID(),
                description: job.description || `Job #${job.id}`,
                quantity: 1,
                unit_price: job.price,
                total: job.price,
            },
        ]);
        setPaymentMethod('card');
        setInvoiceOpen(true);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('newInvoice') !== '1') {
            return;
        }
        openCreateInvoice();
        params.delete('newInvoice');
        const qs = params.toString();
        const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        window.history.replaceState({}, '', url);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per navigation; job is current
    }, [job.id]);

    const openEditInvoice = useCallback((invId: number) => {
        setInvoicePreviewLoading(true);
        fetch(`/invoices/${invId}/preview`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                setIsEditMode(true);
                setEditingInvoiceId(invId);
                setInvoiceStep(1);
                setInvoiceType(data.invoice.type);
                setPaymentMethod(
                    data.invoice.payment_method === 'cash' ? 'cash' : 'card',
                );
                setRecipientName(data.invoice.recipient_name);
                setRecipientEmail(data.invoice.recipient_email);
                if (data.invoice.type === 'customer') {
                    const match = customersForInvoice.find(
                        (c) =>
                            c.name === data.invoice.recipient_name &&
                            (c.email ?? '') ===
                                (data.invoice.recipient_email ?? ''),
                    );
                    setSelectedCustomerId(match ? String(match.id) : '');
                    setSelectedEmployeeId('');
                } else {
                    const match = employeesForInvoice.find(
                        (e) =>
                            e.name === data.invoice.recipient_name &&
                            e.email === data.invoice.recipient_email,
                    );
                    setSelectedEmployeeId(match ? String(match.id) : '');
                    setSelectedCustomerId('');
                }
                setInvoiceLines(
                    (data.invoice_lines || []).map((line: InvoiceLineAPI) => ({
                        id: String(line.id),
                        description: line.description,
                        quantity: line.quantity,
                        unit_price: line.unit_price,
                        total: line.total,
                    })),
                );
                setInvoiceOpen(true);
            })
            .catch(() => {
                alert(t('invoices.failedToLoadInvoiceData'));
            })
            .finally(() => setInvoicePreviewLoading(false));
    }, [customersForInvoice, employeesForInvoice, t]);

    const openDeleteConfirm = (invId: number) => {
        setInvoiceToDelete(invId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteInvoice = () => {
        if (invoiceToDelete) {
            router.delete(`/invoices/${invoiceToDelete}`);
            setDeleteConfirmOpen(false);
            setInvoiceToDelete(null);
        }
    };

    const onInvoiceTypeChange = (type: 'customer' | 'employee') => {
        setInvoiceType(type);
        if (type === 'customer') {
            setSelectedCustomerId(
                job.customer ? String(job.customer.id) : '',
            );
            setSelectedEmployeeId('');
            setRecipientName(job.customer?.name ?? '');
            setRecipientEmail(job.customer?.email ?? '');
        } else {
            setSelectedEmployeeId(
                job.employee ? String(job.employee.id) : '',
            );
            setSelectedCustomerId('');
            setRecipientName(job.employee?.name ?? '');
            setRecipientEmail(job.employee?.email ?? '');
        }
    };

    const addInvoiceLine = () => {
        setInvoiceLines([
            ...invoiceLines,
            {
                id: crypto.randomUUID(),
                description: '',
                quantity: 1,
                unit_price: 0,
                total: 0,
            },
        ]);
    };

    const updateInvoiceLine = (
        id: string,
        field: keyof Omit<InvoiceLineLocal, 'id'>,
        value: string | number,
    ) => {
        setInvoiceLines((lines) =>
            lines.map((line) => {
                if (line.id !== id) return line;
                const updated = { ...line, [field]: value };
                if (field === 'quantity' || field === 'unit_price') {
                    updated.total = updated.quantity * updated.unit_price;
                }
                return updated;
            }),
        );
    };

    const removeInvoiceLine = (id: string) => {
        setInvoiceLines((lines) => lines.filter((line) => line.id !== id));
    };

    const getTotalAmount = () => {
        return invoiceLines.reduce((sum, line) => sum + line.total, 0);
    };

    const submitInvoice = (send: boolean) => {
        setInvoiceSubmitting(true);
        
        const invoiceData = {
            type: invoiceType,
            payment_method: paymentMethod,
            recipient_name: recipientName,
            recipient_email: recipientEmail,
            amount: getTotalAmount(),
            price_includes_tax: priceIncludesTax,
            lines: invoiceLines.map((line) => ({
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                total: line.total,
            })),
            send,
        };
        
        if (isEditMode && editingInvoiceId) {
            router.put(
                `/invoices/${editingInvoiceId}`,
                invoiceData,
                {
                    onFinish: () => setInvoiceSubmitting(false),
                    onSuccess: () => {
                        setInvoiceOpen(false);
                        setIsEditMode(false);
                        setEditingInvoiceId(null);
                    },
                },
            );
        } else {
            router.post(
                '/invoices',
                { ...invoiceData, job_id: job.id },
                {
                    onFinish: () => setInvoiceSubmitting(false),
                    onSuccess: () => setInvoiceOpen(false),
                },
            );
        }
    };

    const openInvoicePreview = useCallback((invId: number) => {
        setInvoicePreviewId(invId);
        setInvoicePreviewOpen(true);
    }, []);

    useEffect(() => {
        if (!invoicePreviewOpen || invoicePreviewId == null) return;
        setInvoicePreviewLoading(true);
        setInvoicePreviewData(null);
        fetch(`/invoices/${invoicePreviewId}/preview`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                setInvoicePreviewData(data);
            })
            .catch(() => setInvoicePreviewData(null))
            .finally(() => setInvoicePreviewLoading(false));
    }, [invoicePreviewOpen, invoicePreviewId]);

    const closeInvoicePreview = useCallback(() => {
        setInvoicePreviewOpen(false);
        setInvoicePreviewId(null);
        setInvoicePreviewData(null);
    }, []);

    const sendWhatsApp = async () => {
        setWhatsAppMessage(null);
        setWhatsAppSending(true);
        try {
            const res = await fetch(`/jobs/${job.id}/send-whatsapp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (data.success && data.sent_at) {
                setLocalWhatsAppSentAt(data.sent_at);
            }
            const recipient = data.recipient_phone
                ? ` Sent to +${data.recipient_phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}.`
                : '';
            const viaId =
                data.success && data.phone_number_id
                    ? ` Via Phone number ID: ${data.phone_number_id}.`
                    : '';
            const sourceNote =
                data.success && data.credential_source
                    ? ` Credential: ${data.credential_source === 'company' ? 'Settings → Integrations' : 'app (.env)'}.`
                    : '';
            setWhatsAppMessage({
                type: data.success ? 'success' : 'error',
                text:
                    (data.message ||
                        (data.success ? t('jobs.whatsappSent') : t('jobs.whatsappFailed'))) +
                    recipient +
                    viaId +
                    sourceNote,
            });
        } catch {
            setWhatsAppMessage({
                type: 'error',
                text: t('jobs.whatsappError'),
            });
        } finally {
            setWhatsAppSending(false);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.jobs'), href: '/jobs' },
        { title: `${t('jobs.title')} #${job.id}`, href: `/jobs/${job.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('jobs.title')} #${job.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">{t('jobs.title')} #{job.id}</h2>
                    {!isEmployee && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.visit(`/jobs/${job.id}/edit`)}
                            >
                                <Edit className="size-4" />
                                {t('common.edit')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setJobDeleteConfirmOpen(true)}
                            >
                                <Trash2 className="size-4 text-destructive" />
                                {t('common.delete')}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="size-5" />
                                {t('jobs.jobInformation')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {job.scheduled_time && (
                                <p>
                                    <span className="text-muted-foreground">
                                        {t('common.time')}:
                                    </span>{' '}
                                    {job.scheduled_time}
                                </p>
                            )}
                            {job.recommendation && (
                                <p>
                                    <span className="text-muted-foreground">
                                        {t('jobs.recommendation')}:
                                    </span>{' '}
                                    {(jobOptions.recommendation &&
                                        t(jobOptions.recommendation[
                                            job.recommendation
                                        ] || job.recommendation)) ??
                                        job.recommendation}
                                </p>
                            )}
                            {job.job_info.length > 0 && (
                                <p>
                                    <span className="text-muted-foreground">
                                        {t('jobs.jobInfo')}:
                                    </span>{' '}
                                    {job.job_info
                                        .map(
                                            (key) =>
                                                (jobOptions.job_info &&
                                                    t(jobOptions.job_info[key] || key)) ??
                                                key,
                                        )
                                        .join(', ')}
                                </p>
                            )}
                            {job.job_type && (
                                <p>
                                    <span className="text-muted-foreground">
                                        {t('jobs.jobType')}:
                                    </span>{' '}
                                    {job.job_type}
                                </p>
                            )}
                            <p>
                                <span className="text-muted-foreground">
                                    {t('common.description')}:
                                </span>{' '}
                                {job.description || '—'}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    {t('jobs.invoice')}:
                                </span>{' '}
                                {job.invoice_number || '—'}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    {t('common.date')}:
                                </span>{' '}
                                {job.date}
                            </p>
                            <div>
                                <p>
                                    <span className="text-muted-foreground">
                                        {t('common.price')}:
                                    </span>{' '}
                                    {formatCurrency(job.price)}
                                </p>
                                {job.base_price && job.price !== job.base_price && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t('jobs.totalFromCustomerInvoices')}
                                        <br />
                                        {t('jobs.basePrice')}: {formatCurrency(job.base_price)}
                                    </p>
                                )}
                            </div>
                            <p>
                                <span className="text-muted-foreground">
                                    {t('common.status')}:
                                </span>{' '}
                                {job.is_paid ? (
                                    <Badge variant="default">{t('jobs.paid')}</Badge>
                                ) : (
                                    <Badge variant="secondary">{t('jobs.unpaid')}</Badge>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    {job.customer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="size-5" />
                                    {t('jobs.customer')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="font-medium">
                                    {job.customer.name}
                                </p>
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
                                        [job.customer.street, job.customer.house_number]
                                            .filter(Boolean)
                                            .join(' '),
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
                                    {t('jobs.assignedEmployee')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="font-medium">
                                    {job.employee.name}
                                </p>
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
                                <div className="space-y-1 pt-2">
                                    <p className="text-xs text-muted-foreground">
                                        {t('jobs.sendWhatsAppDesc')}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={sendWhatsApp}
                                        disabled={whatsAppSending}
                                    >
                                        {whatsAppSending
                                            ? t('jobs.sending')
                                            : job.whatsapp_sent_at ||
                                                localWhatsAppSentAt
                                              ? t('jobs.resendWhatsApp')
                                              : t('jobs.sendWhatsApp')}
                                    </Button>
                                    {whatsAppMessage && (
                                        <p
                                            className={
                                                whatsAppMessage.type ===
                                                'success'
                                                    ? 'mt-2 text-sm text-green-600'
                                                    : 'mt-2 text-sm text-destructive'
                                            }
                                        >
                                            {whatsAppMessage.text}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="size-5" />
                                    {t('invoices.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('invoices.customerAndEmployeeInvoices')}
                                </CardDescription>
                            </div>
                            <Dialog
                                open={invoiceOpen}
                                onOpenChange={setInvoiceOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button onClick={openCreateInvoice}>
                                        <Plus className="size-4" />
                                        {t('invoices.createInvoice')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {isEditMode
                                                ? invoiceStep === 1
                                                    ? t('invoices.editInvoiceRecipient')
                                                    : t('invoices.editInvoiceLineItems')
                                                : invoiceStep === 1
                                                  ? t('invoices.createInvoiceRecipient')
                                                  : t('invoices.createInvoiceLineItems')}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {invoiceStep === 1
                                                ? t('invoices.selectInvoiceTypeDesc')
                                                : t('invoices.addLineItemsDesc')}
                                        </DialogDescription>
                                    </DialogHeader>

                                    {invoiceStep === 1 ? (
                                        <>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>{t('invoices.invoiceType')}</Label>
                                                    <Select
                                                        value={invoiceType}
                                                        onValueChange={(v) =>
                                                            onInvoiceTypeChange(
                                                                v as
                                                                    | 'customer'
                                                                    | 'employee',
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="customer">
                                                                {t('invoices.customerInvoice')}
                                                            </SelectItem>
                                                            <SelectItem value="employee">
                                                                {t('invoices.employeeInvoice')}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>
                                                        {t('invoices.paymentMethod')}
                                                    </Label>
                                                    <Select
                                                        value={paymentMethod}
                                                        onValueChange={(v) =>
                                                            setPaymentMethod(
                                                                v as
                                                                    | 'card'
                                                                    | 'cash',
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="card">
                                                                {t(
                                                                    'invoices.paymentCard',
                                                                )}
                                                            </SelectItem>
                                                            <SelectItem value="cash">
                                                                {t(
                                                                    'invoices.paymentCash',
                                                                )}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-muted-foreground text-xs">
                                                        {paymentMethod ===
                                                        'cash'
                                                            ? t(
                                                                  'invoices.cashNoRefShort',
                                                              )
                                                            : t(
                                                                  'invoices.cardRefHint',
                                                              )}
                                                    </p>
                                                </div>
                                                {invoiceType === 'customer' ? (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="inv-job-customer">
                                                            {t('invoices.selectCustomer')}
                                                        </Label>
                                                        <Select
                                                            value={
                                                                selectedCustomerId ||
                                                                undefined
                                                            }
                                                            onValueChange={(
                                                                id,
                                                            ) => {
                                                                setSelectedCustomerId(
                                                                    id,
                                                                );
                                                                const c =
                                                                    customersForInvoice.find(
                                                                        (x) =>
                                                                            String(
                                                                                x.id,
                                                                            ) ===
                                                                            id,
                                                                    );
                                                                if (c) {
                                                                    setRecipientName(
                                                                        c.name,
                                                                    );
                                                                    setRecipientEmail(
                                                                        c.email ??
                                                                            '',
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger id="inv-job-customer">
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        'invoices.chooseCustomer',
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {customersForInvoice.map(
                                                                    (c) => (
                                                                        <SelectItem
                                                                            key={
                                                                                c.id
                                                                            }
                                                                            value={String(
                                                                                c.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                c.name
                                                                            }
                                                                            {c.email
                                                                                ? ` · ${c.email}`
                                                                                : ''}
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {customersForInvoice.length ===
                                                        0 ? (
                                                            <p className="text-muted-foreground text-sm">
                                                                {t(
                                                                    'invoices.noCustomersForInvoice',
                                                                )}{' '}
                                                                <Link
                                                                    href="/address-search"
                                                                    className="text-primary underline"
                                                                >
                                                                    {t(
                                                                        'addressSearch.title',
                                                                    )}
                                                                </Link>
                                                            </p>
                                                        ) : null}
                                                        {selectedCustomerId &&
                                                        !customersForInvoice.find(
                                                            (x) =>
                                                                String(x.id) ===
                                                                selectedCustomerId,
                                                        )?.email?.trim() ? (
                                                            <p className="text-destructive text-sm">
                                                                {t(
                                                                    'invoices.recipientNeedsEmail',
                                                                )}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="inv-job-employee">
                                                            {t('invoices.selectEmployee')}
                                                        </Label>
                                                        <Select
                                                            value={
                                                                selectedEmployeeId ||
                                                                undefined
                                                            }
                                                            onValueChange={(
                                                                id,
                                                            ) => {
                                                                setSelectedEmployeeId(
                                                                    id,
                                                                );
                                                                const e =
                                                                    employeesForInvoice.find(
                                                                        (x) =>
                                                                            String(
                                                                                x.id,
                                                                            ) ===
                                                                            id,
                                                                    );
                                                                if (e) {
                                                                    setRecipientName(
                                                                        e.name,
                                                                    );
                                                                    setRecipientEmail(
                                                                        e.email ??
                                                                            '',
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger id="inv-job-employee">
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        'invoices.chooseEmployee',
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {employeesForInvoice.map(
                                                                    (e) => (
                                                                        <SelectItem
                                                                            key={
                                                                                e.id
                                                                            }
                                                                            value={String(
                                                                                e.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                e.name
                                                                            }{' '}
                                                                            ·{' '}
                                                                            {
                                                                                e.email
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {employeesForInvoice.length ===
                                                        0 ? (
                                                            <p className="text-muted-foreground text-sm">
                                                                {t(
                                                                    'invoices.noEmployeesForInvoice',
                                                                )}{' '}
                                                                <Link
                                                                    href="/employees/create"
                                                                    className="text-primary underline"
                                                                >
                                                                    {t(
                                                                        'employees.addEmployee',
                                                                    )}
                                                                </Link>
                                                            </p>
                                                        ) : null}
                                                        {selectedEmployeeId &&
                                                        !employeesForInvoice.find(
                                                            (x) =>
                                                                String(x.id) ===
                                                                selectedEmployeeId,
                                                        )?.email?.trim() ? (
                                                            <p className="text-destructive text-sm">
                                                                {t(
                                                                    'invoices.recipientNeedsEmail',
                                                                )}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setInvoiceOpen(false)
                                                    }
                                                >
                                                    {t('common.cancel')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        setInvoiceStep(2)
                                                    }
                                                    disabled={!invoiceStepOneValid}
                                                >
                                                    {t('invoices.nextAddLineItems')}
                                                    <ChevronRight className="ml-1 size-4" />
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-4 py-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    <Label className="text-base">
                                                        {t('invoices.invoiceLines')}
                                                    </Label>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                id="invoice-price-includes-tax"
                                                                checked={priceIncludesTax}
                                                                onCheckedChange={setPriceIncludesTax}
                                                            />
                                                            <Label
                                                                htmlFor="invoice-price-includes-tax"
                                                                className="text-sm font-normal cursor-pointer whitespace-nowrap"
                                                            >
                                                                {t('invoices.inclTax')}
                                                            </Label>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={addInvoiceLine}
                                                        >
                                                            <Plus className="size-4" />
                                                            {t('invoices.addLine')}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {invoiceLines.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('invoices.noLineItemsYet')}
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {invoiceLines.map(
                                                            (line) => (
                                                                <div
                                                                    key={line.id}
                                                                    className="grid gap-2 rounded border p-3"
                                                                >
                                                                    <div className="grid gap-2">
                                                                        <Label htmlFor={`line-desc-${line.id}`}>
                                                                            {t('common.description')}
                                                                        </Label>
                                                                        <Input
                                                                            id={`line-desc-${line.id}`}
                                                                            value={
                                                                                line.description
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateInvoiceLine(
                                                                                    line.id,
                                                                                    'description',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            placeholder={t('invoices.serviceItemPlaceholder')}
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor={`line-qty-${line.id}`}>
                                                                                {t('invoices.quantity')}
                                                                            </Label>
                                                                            <Input
                                                                                id={`line-qty-${line.id}`}
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0.01"
                                                                                value={
                                                                                    line.quantity
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateInvoiceLine(
                                                                                        line.id,
                                                                                        'quantity',
                                                                                        parseFloat(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        ) ||
                                                                                            0,
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor={`line-price-${line.id}`}>
                                                                                {t('invoices.unitPriceEuro')}
                                                                            </Label>
                                                                            <Input
                                                                                id={`line-price-${line.id}`}
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0"
                                                                                value={
                                                                                    line.unit_price
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateInvoiceLine(
                                                                                        line.id,
                                                                                        'unit_price',
                                                                                        parseFloat(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        ) ||
                                                                                            0,
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label>
                                                                                {t('invoices.totalEuro')}
                                                                            </Label>
                                                                            <Input
                                                                                value={line.total.toFixed(
                                                                                    2,
                                                                                )}
                                                                                disabled
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="w-fit"
                                                                        onClick={() =>
                                                                            removeInvoiceLine(
                                                                                line.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="size-4 text-destructive" />
                                                                        {t('invoices.remove')}
                                                                    </Button>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    {priceIncludesTax ? (
                                                        <>
                                                            <div className="flex items-center justify-between rounded border bg-muted/50 p-3 text-sm">
                                                                <span>{t('invoices.subtotalExclTax')}:</span>
                                                                <span>
                                                                    €{' '}
                                                                    {(getTotalAmount() / 1.21).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded border bg-muted/50 p-3 text-sm">
                                                                <span>{t('invoices.taxAmount')}:</span>
                                                                <span>
                                                                    €{' '}
                                                                    {(getTotalAmount() - getTotalAmount() / 1.21).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded border bg-muted p-3">
                                                                <span className="font-medium">
                                                                    {t('invoices.totalInclTax')}:
                                                                </span>
                                                                <span className="text-lg font-semibold">
                                                                    €{' '}
                                                                    {getTotalAmount().toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between rounded border bg-muted/50 p-3 text-sm">
                                                                <span>{t('invoices.subtotalExclTax')}:</span>
                                                                <span>
                                                                    €{' '}
                                                                    {getTotalAmount().toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded border bg-muted/50 p-3 text-sm">
                                                                <span>{t('invoices.taxAmount')}:</span>
                                                                <span>
                                                                    €{' '}
                                                                    {(getTotalAmount() * 0.21).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded border bg-muted p-3">
                                                                <span className="font-medium">
                                                                    {t('invoices.totalInclTax')}:
                                                                </span>
                                                                <span className="text-lg font-semibold">
                                                                    €{' '}
                                                                    {(getTotalAmount() * 1.21).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <DialogFooter className="gap-2 flex-col sm:flex-row">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setInvoiceStep(1)
                                                    }
                                                    disabled={
                                                        invoiceSubmitting
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    <ChevronLeft className="size-4" />
                                                    {t('common.back')}
                                                </Button>
                                                <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            submitInvoice(false)
                                                        }
                                                        disabled={
                                                            invoiceSubmitting ||
                                                            invoiceLines.length ===
                                                                0 ||
                                                            invoiceLines.some(
                                                                (line) =>
                                                                    !line.description.trim(),
                                                            )
                                                        }
                                                        className="flex-1 sm:flex-none"
                                                    >
                                                        {isEditMode
                                                            ? t('invoices.saveAsDraft')
                                                            : t('invoices.createDraft')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            submitInvoice(true)
                                                        }
                                                        disabled={
                                                            invoiceSubmitting ||
                                                            invoiceLines.length ===
                                                                0 ||
                                                            invoiceLines.some(
                                                                (line) =>
                                                                    !line.description.trim(),
                                                            )
                                                        }
                                                        className="flex-1 sm:flex-none"
                                                    >
                                                        {isEditMode
                                                            ? t('invoices.saveAndSend')
                                                            : t('invoices.createAndSend')}
                                                    </Button>
                                                </div>
                                            </DialogFooter>
                                        </>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {job.invoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('invoices.noInvoicesYet')}
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {job.invoices.map((inv) => (
                                    <li
                                        key={inv.id}
                                        className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2 rounded border p-2 text-sm"
                                    >
                                        <span className="min-w-0 break-words">
                                            {inv.type} — {inv.recipient_name} (
                                            <span className="break-all">{inv.recipient_email}</span>) —{' '}
                                            {formatCurrency(inv.amount)}
                                            {inv.invoice_number ? (
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    · {inv.invoice_number}
                                                </span>
                                            ) : inv.payment_method === 'cash' ? (
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    · {t('invoices.cashNoRefShort')}
                                                </span>
                                            ) : null}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    openInvoicePreview(inv.id)
                                                }
                                            >
                                                {inv.status === 'draft'
                                                    ? t('invoices.viewDraft')
                                                    : t('common.view')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    openEditInvoice(inv.id)
                                                }
                                                title={t('invoices.editInvoiceTitle')}
                                            >
                                                <Edit className="size-4" />
                                            </Button>
                                            {inv.status === 'draft' && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            `/invoices/${inv.id}/send`,
                                                        )
                                                    }
                                                    title={t('invoices.sendInvoiceTitle')}
                                                >
                                                    <Mail className="size-4" />
                                                    {t('invoices.send')}
                                                </Button>
                                            )}
                                            {inv.status === 'sent' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            `/invoices/${inv.id}/mark-paid`,
                                                        )
                                                    }
                                                >
                                                    {t('invoices.markPaid')}
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    openDeleteConfirm(inv.id)
                                                }
                                                title={t('invoices.deleteInvoiceTitle')}
                                            >
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                            <Badge
                                                variant={
                                                    inv.status === 'paid'
                                                        ? 'default'
                                                        : inv.status === 'sent'
                                                          ? 'secondary'
                                                          : 'outline'
                                                }
                                            >
                                                {inv.status}
                                            </Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={invoicePreviewOpen}
                onOpenChange={(open) => !open && closeInvoicePreview()}
            >
                <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>{t('invoices.invoicePreview')}</DialogTitle>
                        <DialogDescription>
                            {t('invoices.invoicePreviewDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-auto rounded border bg-[#f5f5f5] p-4">
                        {invoicePreviewLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!invoicePreviewLoading && invoicePreviewData && (
                            <InvoicePdfDocument
                                invoice={invoicePreviewData.invoice}
                                invoice_lines={
                                    invoicePreviewData.invoice_lines
                                }
                                job={invoicePreviewData.job}
                                customer={invoicePreviewData.customer}
                                company_name={invoicePreviewData.company_name}
                                company={invoicePreviewData.company}
                                company_sender_line={
                                    invoicePreviewData.company_sender_line
                                }
                                document_date={invoicePreviewData.document_date}
                                due_date={invoicePreviewData.due_date}
                                delivery_date={
                                    invoicePreviewData.delivery_date
                                }
                                payment_method_label={
                                    invoicePreviewData.payment_method_label
                                }
                                display_invoice_number={
                                    invoicePreviewData.display_invoice_number
                                }
                                tax_rate_percent={
                                    invoicePreviewData.tax_rate_percent
                                }
                                customer_address_lines={
                                    invoicePreviewData.customer_address_lines
                                }
                                className="bg-white"
                            />
                        )}
                        {!invoicePreviewLoading &&
                            !invoicePreviewData &&
                            invoicePreviewId != null && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    {t('invoices.couldNotLoadPreview')}
                                </p>
                            )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeInvoicePreview}>
                            {t('common.close')}
                        </Button>
                        {invoicePreviewData && (
                            <Button
                                onClick={() =>
                                    window.open(
                                        `/invoices/${invoicePreviewId}`,
                                        '_blank',
                                    )
                                }
                            >
                                {t('invoices.openInNewTab')}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('invoices.deleteInvoiceTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('invoices.deleteInvoiceConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteInvoice}
                        >
                            {t('common.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={jobDeleteConfirmOpen} onOpenChange={setJobDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('jobs.deleteJob')}</DialogTitle>
                        <DialogDescription>
                            {t('jobs.deleteJobConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setJobDeleteConfirmOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => router.delete(`/jobs/${job.id}`)}
                        >
                            {t('jobs.deleteJob')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
