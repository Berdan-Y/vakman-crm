import { Head, Link, useForm } from '@inertiajs/react';
import { Trans, useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { useMemo, useState } from 'react';
import type { BreadcrumbItem } from '@/types';

type EmployeeOption = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
};

type JobOptions = {
    recommendation: Record<string, string>;
    job_info: Record<string, string>;
};

type JobTypeRow = {
    id: number;
    name: string;
    is_other: boolean;
};

type JobDetail = {
    id: number;
    description: string | null;
    date: string;
    scheduled_time: string | null;
    recommendation: string | null;
    job_info: string;
    job_type_id: number | null;
    job_type_other: string | null;
    price: number;
    price_includes_tax?: boolean;
    employee_id: number | null;
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
};

type Props = {
    job: JobDetail;
    employees: EmployeeOption[];
    jobOptions: JobOptions;
    jobTypes: JobTypeRow[];
};

export default function JobsEdit({ job, employees, jobOptions, jobTypes }: Props) {
    const { t } = useTranslation();
    const [priceIncludesTax, setPriceIncludesTax] = useState(
        !!job.price_includes_tax,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.jobs'), href: '/jobs' },
        { title: `${t('jobs.title')} #${job.id}`, href: `/jobs/${job.id}` },
        { title: t('common.edit'), href: `/jobs/${job.id}/edit` },
    ];

    const form = useForm({
        description: job.description || '',
        price: String(job.price),
        price_includes_tax: !!job.price_includes_tax,
        employee_id: job.employee_id,
        date: job.date,
        scheduled_time: job.scheduled_time || '',
        recommendation: (job.recommendation || '') as '' | 'emergency' | 'regular',
        job_info: job.job_info as string,
        job_type_id: job.job_type_id,
        job_type_other: job.job_type_other || '',
    });

    const selectedJobType = useMemo(
        () => jobTypes.find((jt) => jt.id === form.data.job_type_id),
        [jobTypes, form.data.job_type_id],
    );

    const submit = () => {
        form.put(`/jobs/${job.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('jobs.editJobTitle')} #${job.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <h2 className="text-lg font-semibold">
                    {t('jobs.editJobTitle')} #{job.id}
                </h2>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>{t('jobs.customerInformation')}</CardTitle>
                        <CardDescription>
                            {t('jobs.addressContactReadonly')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {job.customer && (
                            <>
                                <p>
                                    <span className="font-medium">
                                        {t('common.name')}:
                                    </span>{' '}
                                    {job.customer.name}
                                </p>
                                {job.customer.email && (
                                    <p>
                                        <span className="font-medium">
                                            {t('common.email')}:
                                        </span>{' '}
                                        {job.customer.email}
                                    </p>
                                )}
                                {job.customer.phone && (
                                    <p>
                                        <span className="font-medium">
                                            {t('common.phone')}:
                                        </span>{' '}
                                        {job.customer.phone}
                                    </p>
                                )}
                                <p>
                                    <span className="font-medium">
                                        {t('common.address')}:
                                    </span>{' '}
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
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>{t('jobs.jobDetailsCard')}</CardTitle>
                        <CardDescription>
                            {t('jobs.updateJobInfo')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label>{t('jobs.recommendation')}</Label>
                            <Select
                                value={form.data.recommendation}
                                onValueChange={(v) =>
                                    form.setData(
                                        'recommendation',
                                        v as 'emergency' | 'regular',
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'jobs.selectRecommendation',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(
                                        jobOptions.recommendation,
                                    ).map(([value, label]) => (
                                        <SelectItem
                                            key={value}
                                            value={value}
                                        >
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('jobs.jobInfo')}</Label>
                            <Select
                                value={form.data.job_info}
                                onValueChange={(v) =>
                                    form.setData('job_info', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t('jobs.selectJobInfo')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(
                                        jobOptions.job_info,
                                    ).map(([value, label]) => (
                                        <SelectItem
                                            key={value}
                                            value={value}
                                        >
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{`${t('jobs.jobType')} *`}</Label>
                            {jobTypes.length === 0 ? (
                                <div className="flex min-h-10 w-full items-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                                    <Trans
                                        i18nKey="jobs.jobTypesEmptyWithLink"
                                        components={{
                                            settingsLink: (
                                                <Link
                                                    href="/settings/job-types"
                                                    className="text-primary font-medium underline underline-offset-4 hover:text-primary/90"
                                                />
                                            ),
                                        }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <Select
                                        value={
                                            form.data.job_type_id
                                                ? String(form.data.job_type_id)
                                                : ''
                                        }
                                        onValueChange={(v) =>
                                            form.setData(
                                                'job_type_id',
                                                v ? Number(v) : null,
                                            )
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={t(
                                                    'jobs.selectJobType',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jobTypes.map((jt) => (
                                                <SelectItem
                                                    key={jt.id}
                                                    value={String(jt.id)}
                                                >
                                                    {jt.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={form.errors.job_type_id}
                                    />
                                    {selectedJobType?.is_other && (
                                        <Input
                                            placeholder={t(
                                                'jobs.specifyJobType',
                                            )}
                                            value={form.data.job_type_other}
                                            onChange={(e) =>
                                                form.setData(
                                                    'job_type_other',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-2"
                                            required
                                        />
                                    )}
                                    <InputError
                                        message={form.errors.job_type_other}
                                    />
                                </>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                {`${t('jobs.jobInformation')} *`}
                            </Label>
                            <textarea
                                id="description"
                                rows={3}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                                placeholder={t('jobs.additionalInfo')}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
                                required
                            />
                            <InputError
                                message={form.errors.description}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <Label htmlFor="price">{`${t('common.price')} (€) *`}</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="price-includes-tax"
                                        checked={priceIncludesTax}
                                        onCheckedChange={(checked) => {
                                            setPriceIncludesTax(!!checked);
                                            form.setData('price_includes_tax', !!checked);
                                        }}
                                    />
                                    <Label
                                        htmlFor="price-includes-tax"
                                        className="text-sm font-normal cursor-pointer whitespace-nowrap"
                                    >
                                        {t('jobs.priceInclTax')}
                                    </Label>
                                </div>
                            </div>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.price}
                                onChange={(e) =>
                                    form.setData(
                                        'price',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {form.data.price && (
                                <p className="text-xs text-muted-foreground">
                                    {priceIncludesTax ? (
                                        <>
                                            {t('jobs.priceExclTax')}: €
                                            {(
                                                parseFloat(form.data.price) /
                                                1.21
                                            ).toFixed(2)}
                                            {' • '}
                                            {t('invoices.taxAmount')}: €
                                            {(
                                                parseFloat(form.data.price) -
                                                parseFloat(form.data.price) /
                                                    1.21
                                            ).toFixed(2)}
                                        </>
                                    ) : (
                                        <>
                                            {t('jobs.priceInclTaxValue')}: €
                                            {(
                                                parseFloat(form.data.price) *
                                                1.21
                                            ).toFixed(2)}
                                            {' • '}
                                            {t('invoices.taxAmount')}: €
                                            {(
                                                parseFloat(form.data.price) *
                                                0.21
                                            ).toFixed(2)}
                                        </>
                                    )}
                                </p>
                            )}
                            <InputError message={form.errors.price} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{`${t('jobs.assignedEmployee')} *`}</Label>
                            <Select
                                value={
                                    form.data.employee_id
                                        ? String(form.data.employee_id)
                                        : ''
                                }
                                onValueChange={(v) =>
                                    form.setData(
                                        'employee_id',
                                        v ? Number(v) : null,
                                    )
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t('jobs.selectEmployee')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
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
                            <InputError
                                message={form.errors.employee_id}
                            />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="date">{`${t('common.date')} *`}</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={form.data.date}
                                    onChange={(e) =>
                                        form.setData(
                                            'date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={form.errors.date}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="scheduled_time">
                                    {`${t('common.time')} *`}
                                </Label>
                                <Input
                                    id="scheduled_time"
                                    type="time"
                                    value={form.data.scheduled_time}
                                    onChange={(e) =>
                                        form.setData(
                                            'scheduled_time',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={form.errors.scheduled_time}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={form.processing}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={submit}
                                disabled={
                                    form.processing ||
                                    jobTypes.length === 0 ||
                                    !form.data.date ||
                                    !form.data.scheduled_time ||
                                    !form.data.description.trim() ||
                                    !form.data.job_type_id ||
                                    !form.data.employee_id ||
                                    !form.data.price
                                }
                            >
                                {form.processing ? (
                                    <Spinner />
                                ) : (
                                    t('jobs.updateJob')
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
