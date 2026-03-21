import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import axios from '@/bootstrap';
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
import { MapPin, Search } from 'lucide-react';
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

type Props = {
    employees: EmployeeOption[];
    jobOptions: JobOptions;
    jobTypes: JobTypeRow[];
};

type AddressResult = {
    success: true;
    address: {
        street: string;
        city: string;
        postcode: string;
        house_number: string;
    };
    customers: Array<{
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
    }>;
};

type OpenPostcodeAddress = {
    postcode: string;
    number: number;
    letter: string;
    addition: string;
    street: string;
    city: {
        label: string;
    };
};

type OpenPostcodeResponse = {
    postcode: string;
    number: number;
    letter: string;
    addition: string;
    street: string;
    city: {
        label: string;
    };
} | {
    suggestions?: OpenPostcodeAddress[];
    candidates?: OpenPostcodeAddress[];
};

export default function JobsCreate({ employees, jobOptions, jobTypes }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.jobs'), href: '/jobs' },
        { title: t('jobs.createJob'), href: '/jobs/create' },
    ];
    const [step, setStep] = useState<1 | 2>(1);
    const [postcode, setPostcode] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [addition, setAddition] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [addressResult, setAddressResult] = useState<AddressResult | null>(
        null,
    );
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
        null,
    );
    const [autoCompleteResults, setAutoCompleteResults] = useState<
        OpenPostcodeAddress[]
    >([]);
    const [showAutoComplete, setShowAutoComplete] = useState(false);
    const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
    const [priceIncludesTax, setPriceIncludesTax] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const form = useForm({
        customer_id: null as number | null,
        name: '',
        email: '',
        phone: '',
        zip_code: '',
        house_number: '',
        street: '',
        city: '',
        recommendation: '' as '' | 'emergency' | 'regular',
        job_info: '' as string,
        job_type_id: null as number | null,
        job_type_other: '',
        description: '',
        price: '',
        employee_id: null as number | null,
        date: new Date().toISOString().slice(0, 10),
        scheduled_time: '',
        send_notification: false,
    });

    const selectedJobType = useMemo(
        () => jobTypes.find((jt) => jt.id === form.data.job_type_id),
        [jobTypes, form.data.job_type_id],
    );

    const fetchOpenPostcodeAddress = useCallback(
        async (pc: string, hn: string) => {
            if (!pc.trim() || !hn.trim()) {
                setAutoCompleteResults([]);
                setShowAutoComplete(false);
                return;
            }

            setAutoCompleteLoading(true);
            setLookupError(null);

            try {
                const params: { postcode: string; huisnummer: string; huisletter?: string } = {
                    postcode: pc,
                    huisnummer: hn,
                };
                
                if (addition.trim()) {
                    params.huisletter = addition.trim();
                }

                const response = await axios.post('/address-search/autocomplete', params);

                if (response.data.suggestions && response.data.suggestions.length > 0) {
                    setAutoCompleteResults(response.data.suggestions);
                    setShowAutoComplete(true);
                    setLookupError(null);
                } else {
                    setAutoCompleteResults([]);
                    setShowAutoComplete(false);
                }
            } catch (error) {
                setAutoCompleteResults([]);
                setShowAutoComplete(false);
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    setLookupError(t('jobs.addressNotFound'));
                } else {
                    setLookupError(t('jobs.failedToFetchAddress'));
                }
            } finally {
                setAutoCompleteLoading(false);
            }
        },
        [addition, t],
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if (postcode && houseNumber) {
                fetchOpenPostcodeAddress(postcode, houseNumber);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [postcode, houseNumber, fetchOpenPostcodeAddress]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                autocompleteRef.current &&
                !autocompleteRef.current.contains(event.target as Node)
            ) {
                setShowAutoComplete(false);
            }
        };

        if (showAutoComplete) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showAutoComplete]);

    const handleAddressSelect = useCallback(
        async (address: OpenPostcodeAddress) => {
            setShowAutoComplete(false);
            setLookupLoading(true);
            setLookupError(null);

            const fullHouseNumber = `${address.number}${address.letter}${address.addition}`.trim();

            const addressData = {
                street: address.street,
                city: address.city.label,
                postcode: address.postcode,
                house_number: fullHouseNumber,
            };

            form.setData({
                ...form.data,
                zip_code: address.postcode,
                house_number: fullHouseNumber,
                street: address.street,
                city: address.city.label,
            });

            try {
                const response = await axios.post('/address-search/find-customers', {
                    postcode: address.postcode,
                    house_number: fullHouseNumber,
                });

                const data = response.data;

                if (data.customers && data.customers.length > 0) {
                    setAddressResult({
                        success: true,
                        address: addressData,
                        customers: data.customers,
                    });

                    if (data.customers.length === 1) {
                        const c = data.customers[0];
                        setSelectedCustomerId(c.id);
                        form.setData({
                            ...form.data,
                            customer_id: c.id,
                            name: c.name,
                            email: c.email ?? '',
                            phone: c.phone ?? '',
                            zip_code: address.postcode,
                            house_number: fullHouseNumber,
                            street: address.street,
                            city: address.city.label,
                        });
                    } else {
                        setSelectedCustomerId(null);
                    }
                } else {
                    setAddressResult({
                        success: true,
                        address: addressData,
                        customers: [],
                    });
                    setSelectedCustomerId(null);
                }
            } catch (error) {
                setAddressResult({
                    success: true,
                    address: addressData,
                    customers: [],
                });
                setSelectedCustomerId(null);
            } finally {
                setLookupLoading(false);
                setStep(2);
            }
        },
        [form],
    );

    const handleLookup = useCallback(async () => {
        setLookupError(null);
        setAddressResult(null);
        setLookupLoading(true);
        setShowAutoComplete(false);

        try {
            const params: { postcode: string; huisnummer: string; huisletter?: string } = {
                postcode: postcode.trim(),
                huisnummer: houseNumber.trim(),
            };
            
            if (addition.trim()) {
                params.huisletter = addition.trim();
            }

            const response = await axios.post('/address-search/autocomplete', params);

            const suggestions = response.data.suggestions;

            if (!suggestions || suggestions.length === 0) {
                setLookupError(t('jobs.addressNotFound'));
                return;
            }

            const address = suggestions.find((addr: OpenPostcodeAddress) => {
                const addrAddition = `${addr.letter}${addr.addition}`.trim().toLowerCase();
                const inputAddition = addition.trim().toLowerCase();
                
                if (!inputAddition) {
                    return !addr.letter && !addr.addition;
                }
                
                return addrAddition === inputAddition;
            }) || suggestions[0];

            const fullHouseNumber = `${address.number}${address.letter}${address.addition}`.trim();

            const addressData = {
                street: address.street,
                city: address.city.label,
                postcode: address.postcode,
                house_number: fullHouseNumber,
            };

            form.setData({
                ...form.data,
                zip_code: address.postcode,
                house_number: fullHouseNumber,
                street: address.street,
                city: address.city.label,
            });

            try {
                const customersResponse = await axios.post('/address-search/find-customers', {
                    postcode: address.postcode,
                    house_number: fullHouseNumber,
                });

                const customersData = customersResponse.data;

                if (customersData.customers && customersData.customers.length > 0) {
                    setAddressResult({
                        success: true,
                        address: addressData,
                        customers: customersData.customers,
                    });

                    if (customersData.customers.length === 1) {
                        const c = customersData.customers[0];
                        setSelectedCustomerId(c.id);
                        form.setData({
                            ...form.data,
                            customer_id: c.id,
                            name: c.name,
                            email: c.email ?? '',
                            phone: c.phone ?? '',
                            zip_code: address.postcode,
                            house_number: fullHouseNumber,
                            street: address.street,
                            city: address.city.label,
                        });
                    } else {
                        setSelectedCustomerId(null);
                    }
                } else {
                    setAddressResult({
                        success: true,
                        address: addressData,
                        customers: [],
                    });
                    setSelectedCustomerId(null);
                }
            } catch (error) {
                setAddressResult({
                    success: true,
                    address: addressData,
                    customers: [],
                });
                setSelectedCustomerId(null);
            }

            setStep(2);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setLookupError(t('jobs.addressNotFound'));
            } else {
                setLookupError(t('jobs.failedToFetchAddress'));
            }
        } finally {
            setLookupLoading(false);
        }
    }, [postcode, houseNumber, addition, form, t]);

    const selectCustomer = (c: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
    }) => {
        setSelectedCustomerId(c.id);
        form.setData({
            ...form.data,
            customer_id: c.id,
            name: c.name,
            email: c.email ?? '',
            phone: c.phone ?? '',
        });
    };

    const submit = (sendNotification: boolean) => {
        form.data.send_notification = sendNotification;
        form.post('/jobs');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('jobs.createJob')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <h2 className="text-lg font-semibold">{t('jobs.createJob')}</h2>

                {step === 1 && (
                    <Card className="max-w-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="size-5" />
                                {t('jobs.step1LookupAddress')}
                            </CardTitle>
                            <CardDescription>
                                {t('jobs.step1Desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="relative">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label>{t('addressSearch.postalCode')}</Label>
                                        <Input
                                            placeholder="1012 AB"
                                            value={postcode}
                                            onChange={(e) => {
                                                setPostcode(
                                                    e.target.value.toUpperCase(),
                                                );
                                            }}
                                            maxLength={7}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('addressSearch.houseNumber')}</Label>
                                        <Input
                                            placeholder="123"
                                            value={houseNumber}
                                            onChange={(e) => {
                                                setHouseNumber(e.target.value);
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('addressSearch.addition')}</Label>
                                        <Input
                                            placeholder="A"
                                            value={addition}
                                            onChange={(e) =>
                                                setAddition(
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {autoCompleteLoading && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Spinner className="size-4" />
                                        <span>{t('jobs.lookingUpAddress')}</span>
                                    </div>
                                )}

                                {showAutoComplete &&
                                    autoCompleteResults.length > 0 && (
                                        <div
                                            ref={autocompleteRef}
                                            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover shadow-lg"
                                        >
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {autoCompleteResults.map(
                                                    (addr, idx) => {
                                                        const fullNumber = `${addr.number}${addr.letter}${addr.addition}`.trim();
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleAddressSelect(
                                                                        addr,
                                                                    )
                                                                }
                                                                className="flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                                                            >
                                                                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">
                                                                        {addr.street}{' '}
                                                                        {fullNumber}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {addr.postcode}{' '}
                                                                        {addr.city.label}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {lookupError && (
                                <p className="text-sm text-destructive">
                                    {lookupError}
                                </p>
                            )}
                            <Button
                                onClick={handleLookup}
                                disabled={
                                    lookupLoading ||
                                    !postcode.trim() ||
                                    !houseNumber.trim()
                                }
                            >
                                {lookupLoading ? (
                                    <Spinner />
                                ) : (
                                    <Search className="size-4" />
                                )}
                                {t('jobs.lookupAddressButton')}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <>
                        {addressResult && (
                            <Card className="max-w-xl">
                                <CardContent className="pt-4 text-sm">
                                    <p className="font-medium">
                                        {addressResult.address.street}{' '}
                                        {addressResult.address.house_number},{' '}
                                        {addressResult.address.postcode}{' '}
                                        {addressResult.address.city}
                                    </p>
                                    {addressResult.customers.length > 1 && (
                                        <div className="mt-2">
                                            <Label className="text-muted-foreground">
                                                {t('jobs.existingCustomers')}
                                            </Label>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {addressResult.customers.map(
                                                    (c) => (
                                                        <Button
                                                            key={c.id}
                                                            type="button"
                                                            variant={
                                                                selectedCustomerId ===
                                                                c.id
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                selectCustomer(
                                                                    c,
                                                                )
                                                            }
                                                        >
                                                            {c.name}
                                                        </Button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="mt-2 p-0"
                                        onClick={() => setStep(1)}
                                    >
                                        {t('jobs.changeAddress')}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle>{t('jobs.step2JobDetails')}</CardTitle>
                                <CardDescription>
                                    {t('jobs.step2Desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                {!selectedCustomerId && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">
                                                {`${t('jobs.customer')} ${t('common.name')}`}
                                            </Label>
                                            <Input
                                                id="name"
                                                value={form.data.name}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={form.errors.name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">
                                                {`${t('common.email')} (${t('common.optional')})`}
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={form.data.email}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">
                                                {`${t('common.phone')} (${t('common.optional')})`}
                                            </Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={form.data.phone}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'phone',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </>
                                )}
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
                                                placeholder={t(
                                                    'jobs.selectJobInfo',
                                                )}
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
                                                        ? String(
                                                              form.data
                                                                  .job_type_id,
                                                          )
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
                                                            value={String(
                                                                jt.id,
                                                            )}
                                                        >
                                                            {jt.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={
                                                    form.errors.job_type_id
                                                }
                                            />
                                            {selectedJobType?.is_other && (
                                                <Input
                                                    placeholder={t(
                                                        'jobs.specifyJobType',
                                                    )}
                                                    value={
                                                        form.data
                                                            .job_type_other
                                                    }
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
                                                message={
                                                    form.errors.job_type_other
                                                }
                                            />
                                        </>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        {`${t('jobs.jobDescription')} *`}
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
                                                onCheckedChange={setPriceIncludesTax}
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
                                                    {(parseFloat(form.data.price) / 1.21).toFixed(2)}
                                                    {' • '}
                                                    {t('invoices.taxAmount')}: €
                                                    {(
                                                        parseFloat(form.data.price) -
                                                        parseFloat(form.data.price) / 1.21
                                                    ).toFixed(2)}
                                                </>
                                            ) : (
                                                <>
                                                    {t('jobs.priceInclTaxValue')}: €
                                                    {(parseFloat(form.data.price) * 1.21).toFixed(2)}
                                                    {' • '}
                                                    {t('invoices.taxAmount')}: €
                                                    {(parseFloat(form.data.price) * 0.21).toFixed(2)}
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
                                                placeholder={t(
                                                    'jobs.selectEmployee',
                                                )}
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
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        disabled={
                                            form.processing ||
                                            !form.data.date ||
                                            !form.data.scheduled_time ||
                                            !form.data.description.trim() ||
                                            jobTypes.length === 0 ||
                                            !form.data.job_type_id ||
                                            !form.data.employee_id ||
                                            !form.data.price
                                        }
                                        onClick={() => submit(false)}
                                    >
                                        {form.processing ? (
                                            <Spinner />
                                        ) : (
                                            t('jobs.createJobButton')
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={
                                            form.processing ||
                                            !form.data.date ||
                                            !form.data.scheduled_time ||
                                            !form.data.description.trim() ||
                                            jobTypes.length === 0 ||
                                            !form.data.job_type_id ||
                                            !form.data.employee_id ||
                                            !form.data.price
                                        }
                                        onClick={() => submit(true)}
                                    >
                                        {t('jobs.createJobAndNotify')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
