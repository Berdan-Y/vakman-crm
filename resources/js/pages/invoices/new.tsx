import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    Trash2,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type InvoiceLineLocal = {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
};

type InvoiceParty = {
    id: number;
    name: string;
    email: string | null;
};

type Props = {
    customers: InvoiceParty[];
    employees: InvoiceParty[];
};

export default function InvoicesNew({
    customers = [],
    employees = [],
}: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2>(1);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>(
        'card',
    );
    const [invoiceType, setInvoiceType] = useState<'customer' | 'employee'>(
        'employee',
    );
    const [recipientName, setRecipientName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [invoiceLines, setInvoiceLines] = useState<InvoiceLineLocal[]>([
        {
            id: crypto.randomUUID(),
            description: '',
            quantity: 1,
            unit_price: 0,
            total: 0,
        },
    ]);
    const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
    const [priceIncludesTax, setPriceIncludesTax] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.invoices'), href: '/invoices' },
        { title: t('invoices.createWithoutJob'), href: '/invoices/new' },
    ];

    const onInvoiceTypeChange = (type: 'customer' | 'employee') => {
        setInvoiceType(type);
        setRecipientName('');
        setRecipientEmail('');
        setSelectedCustomerId('');
        setSelectedEmployeeId('');
    };

    const selectedParty = useMemo(() => {
        if (invoiceType === 'customer') {
            return customers.find((c) => String(c.id) === selectedCustomerId);
        }
        return employees.find((e) => String(e.id) === selectedEmployeeId);
    }, [
        invoiceType,
        customers,
        employees,
        selectedCustomerId,
        selectedEmployeeId,
    ]);

    const stepOneValid = useMemo(() => {
        if (!selectedParty) {
            return false;
        }
        return !!selectedParty.email?.trim();
    }, [selectedParty]);

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

    const getTotalAmount = () =>
        invoiceLines.reduce((sum, line) => sum + line.total, 0);

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
            ...(invoiceType === 'customer'
                ? { billing_customer_id: Number(selectedCustomerId) }
                : { billing_employee_id: Number(selectedEmployeeId) }),
        };

        router.post('/invoices', invoiceData, {
            onFinish: () => setInvoiceSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('invoices.standaloneNewTitle')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/invoices">
                            <ArrowLeft className="size-4" />
                            {t('invoices.backToInvoices')}
                        </Link>
                    </Button>
                </div>

                <div>
                    <h2 className="text-lg font-semibold">
                        {t('invoices.standaloneNewTitle')}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t('invoices.standaloneNewDescription')}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {step === 1
                                ? t('invoices.createInvoiceRecipient')
                                : t('invoices.createInvoiceLineItems')}
                        </CardTitle>
                        <CardDescription>
                            {step === 1
                                ? t('invoices.selectInvoiceTypeDesc')
                                : t('invoices.addLineItemsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 ? (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>{t('invoices.invoiceType')}</Label>
                                    <Select
                                        value={invoiceType}
                                        onValueChange={(v) =>
                                            onInvoiceTypeChange(
                                                v as 'customer' | 'employee',
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
                                    <Label>{t('invoices.paymentMethod')}</Label>
                                    <Select
                                        value={paymentMethod}
                                        onValueChange={(v) =>
                                            setPaymentMethod(
                                                v as 'card' | 'cash',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="card">
                                                {t('invoices.paymentCard')}
                                            </SelectItem>
                                            <SelectItem value="cash">
                                                {t('invoices.paymentCash')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-muted-foreground text-xs">
                                        {paymentMethod === 'cash'
                                            ? t('invoices.cashNoRefShort')
                                            : t('invoices.cardRefHint')}
                                    </p>
                                </div>
                                {invoiceType === 'customer' ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-inv-customer">
                                            {t('invoices.selectCustomer')}
                                        </Label>
                                        <Select
                                            value={selectedCustomerId || undefined}
                                            onValueChange={(id) => {
                                                setSelectedCustomerId(id);
                                                const c = customers.find(
                                                    (x) => String(x.id) === id,
                                                );
                                                if (c) {
                                                    setRecipientName(c.name);
                                                    setRecipientEmail(
                                                        c.email ?? '',
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="new-inv-customer">
                                                <SelectValue
                                                    placeholder={t(
                                                        'invoices.chooseCustomer',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={String(c.id)}
                                                    >
                                                        {c.name}
                                                        {c.email
                                                            ? ` · ${c.email}`
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {customers.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">
                                                {t(
                                                    'invoices.noCustomersForInvoice',
                                                )}{' '}
                                                <Link
                                                    href="/address-search"
                                                    className="text-primary underline"
                                                >
                                                    {t('addressSearch.title')}
                                                </Link>
                                            </p>
                                        ) : null}
                                        {selectedParty &&
                                        !selectedParty.email?.trim() ? (
                                            <p className="text-destructive text-sm">
                                                {t(
                                                    'invoices.recipientNeedsEmail',
                                                )}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-inv-employee">
                                            {t('invoices.selectEmployee')}
                                        </Label>
                                        <Select
                                            value={selectedEmployeeId || undefined}
                                            onValueChange={(id) => {
                                                setSelectedEmployeeId(id);
                                                const e = employees.find(
                                                    (x) => String(x.id) === id,
                                                );
                                                if (e) {
                                                    setRecipientName(e.name);
                                                    setRecipientEmail(
                                                        e.email ?? '',
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="new-inv-employee">
                                                <SelectValue
                                                    placeholder={t(
                                                        'invoices.chooseEmployee',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map((e) => (
                                                    <SelectItem
                                                        key={e.id}
                                                        value={String(e.id)}
                                                    >
                                                        {e.name} · {e.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {employees.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">
                                                {t(
                                                    'invoices.noEmployeesForInvoice',
                                                )}{' '}
                                                <Link
                                                    href="/employees/create"
                                                    className="text-primary underline"
                                                >
                                                    {t('employees.addEmployee')}
                                                </Link>
                                            </p>
                                        ) : null}
                                        {selectedParty &&
                                        invoiceType === 'employee' &&
                                        !selectedParty.email?.trim() ? (
                                            <p className="text-destructive text-sm">
                                                {t(
                                                    'invoices.recipientNeedsEmail',
                                                )}
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                                <div className="flex flex-wrap justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                    >
                                        <Link href="/invoices">
                                            {t('common.cancel')}
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        disabled={!stepOneValid}
                                    >
                                        {t('invoices.nextAddLineItems')}
                                        <ChevronRight className="ml-1 size-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Label className="text-base">
                                        {t('invoices.invoiceLines')}
                                    </Label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="new-invoice-price-includes-tax"
                                                checked={priceIncludesTax}
                                                onCheckedChange={
                                                    setPriceIncludesTax
                                                }
                                            />
                                            <Label
                                                htmlFor="new-invoice-price-includes-tax"
                                                className="cursor-pointer text-sm font-normal whitespace-nowrap"
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
                                    <p className="text-muted-foreground text-sm">
                                        {t('invoices.noLineItemsYet')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {invoiceLines.map((line) => (
                                            <div
                                                key={line.id}
                                                className="grid gap-2 rounded border p-3"
                                            >
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor={`new-line-desc-${line.id}`}
                                                    >
                                                        {t('common.description')}
                                                    </Label>
                                                    <Input
                                                        id={`new-line-desc-${line.id}`}
                                                        value={line.description}
                                                        onChange={(e) =>
                                                            updateInvoiceLine(
                                                                line.id,
                                                                'description',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={t(
                                                            'invoices.serviceItemPlaceholder',
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`new-line-qty-${line.id}`}
                                                        >
                                                            {t(
                                                                'invoices.quantity',
                                                            )}
                                                        </Label>
                                                        <Input
                                                            id={`new-line-qty-${line.id}`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            value={line.quantity}
                                                            onChange={(e) =>
                                                                updateInvoiceLine(
                                                                    line.id,
                                                                    'quantity',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`new-line-price-${line.id}`}
                                                        >
                                                            {t(
                                                                'invoices.unitPriceEuro',
                                                            )}
                                                        </Label>
                                                        <Input
                                                            id={`new-line-price-${line.id}`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={
                                                                line.unit_price
                                                            }
                                                            onChange={(e) =>
                                                                updateInvoiceLine(
                                                                    line.id,
                                                                    'unit_price',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>
                                                            {t(
                                                                'invoices.totalEuro',
                                                            )}
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
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {priceIncludesTax ? (
                                        <>
                                            <div className="bg-muted/50 flex items-center justify-between rounded border p-3 text-sm">
                                                <span>
                                                    {t(
                                                        'invoices.subtotalExclTax',
                                                    )}
                                                    :
                                                </span>
                                                <span>
                                                    €{' '}
                                                    {(
                                                        getTotalAmount() / 1.21
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="bg-muted/50 flex items-center justify-between rounded border p-3 text-sm">
                                                <span>
                                                    {t('invoices.taxAmount')}:
                                                </span>
                                                <span>
                                                    €{' '}
                                                    {(
                                                        getTotalAmount() -
                                                        getTotalAmount() /
                                                            1.21
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="bg-muted flex items-center justify-between rounded border p-3">
                                                <span className="font-medium">
                                                    {t(
                                                        'invoices.totalInclTax',
                                                    )}
                                                    :
                                                </span>
                                                <span className="text-lg font-semibold">
                                                    €{' '}
                                                    {getTotalAmount().toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-muted/50 flex items-center justify-between rounded border p-3 text-sm">
                                                <span>
                                                    {t(
                                                        'invoices.subtotalExclTax',
                                                    )}
                                                    :
                                                </span>
                                                <span>
                                                    €{' '}
                                                    {getTotalAmount().toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="bg-muted/50 flex items-center justify-between rounded border p-3 text-sm">
                                                <span>
                                                    {t('invoices.taxAmount')}:
                                                </span>
                                                <span>
                                                    €{' '}
                                                    {(
                                                        getTotalAmount() * 0.21
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="bg-muted flex items-center justify-between rounded border p-3">
                                                <span className="font-medium">
                                                    {t(
                                                        'invoices.totalInclTax',
                                                    )}
                                                    :
                                                </span>
                                                <span className="text-lg font-semibold">
                                                    €{' '}
                                                    {(
                                                        getTotalAmount() *
                                                        1.21
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        disabled={invoiceSubmitting}
                                        className="w-full sm:w-auto"
                                    >
                                        <ChevronLeft className="size-4" />
                                        {t('common.back')}
                                    </Button>
                                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                                        {invoiceSubmitting ? (
                                            <div className="flex w-full items-center justify-center py-2 sm:w-auto">
                                                <Loader2 className="text-muted-foreground size-6 animate-spin" />
                                            </div>
                                        ) : (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        submitInvoice(false)
                                                    }
                                                    disabled={
                                                        invoiceLines.length ===
                                                            0 ||
                                                        invoiceLines.some(
                                                            (line) =>
                                                                !line.description.trim(),
                                                        )
                                                    }
                                                    className="min-w-0 flex-1 sm:flex-none"
                                                >
                                                    {t('invoices.createDraft')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        submitInvoice(true)
                                                    }
                                                    disabled={
                                                        invoiceLines.length ===
                                                            0 ||
                                                        invoiceLines.some(
                                                            (line) =>
                                                                !line.description.trim(),
                                                        )
                                                    }
                                                    className="min-w-0 flex-1 sm:flex-none"
                                                >
                                                    {t(
                                                        'invoices.createAndSend',
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
