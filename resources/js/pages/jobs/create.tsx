import { Head, useForm } from '@inertiajs/react';
import { useCallback, useState } from 'react';
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
    job_types: string[];
};

type Props = {
    employees: EmployeeOption[];
    jobOptions: JobOptions;
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Jobs', href: '/jobs' },
    { title: 'Create job', href: '/jobs/create' },
];

function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
}

export default function JobsCreate({ employees, jobOptions }: Props) {
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
        job_type: '',
        job_type_other: '',
        description: '',
        price: '',
        employee_id: null as number | null,
        date: new Date().toISOString().slice(0, 10),
        scheduled_time: '',
        send_notification: false,
    });

    const handleLookup = useCallback(async () => {
        setLookupError(null);
        setAddressResult(null);
        setLookupLoading(true);
        try {
            const res = await fetch('/address-search/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    postcode: postcode.trim(),
                    house_number: houseNumber.trim(),
                    house_number_addition: addition.trim() || null,
                }),
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (!res.ok) {
                setLookupError(
                    'success' in data ? data.message : 'Address not found.',
                );
                return;
            }
            if (data.success && data.address) {
                setAddressResult(data as AddressResult);
                form.setData({
                    ...form.data,
                    zip_code: data.address.postcode,
                    house_number: data.address.house_number,
                    street: data.address.street,
                    city: data.address.city,
                });
                if (data.customers?.length === 1) {
                    const c = data.customers[0];
                    setSelectedCustomerId(c.id);
                    form.setData({
                        ...form.data,
                        customer_id: c.id,
                        name: c.name,
                        email: c.email ?? '',
                        phone: c.phone ?? '',
                        zip_code: data.address.postcode,
                        house_number: data.address.house_number,
                        street: data.address.street,
                        city: data.address.city,
                    });
                } else {
                    setSelectedCustomerId(null);
                    form.setData({
                        ...form.data,
                        customer_id: null,
                        zip_code: data.address.postcode,
                        house_number: data.address.house_number,
                        street: data.address.street,
                        city: data.address.city,
                    });
                }
                setStep(2);
            }
        } catch {
            setLookupError('Something went wrong.');
        } finally {
            setLookupLoading(false);
        }
    }, [postcode, houseNumber, addition]);

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
        if (sendNotification) {
            form.setData('send_notification', true);
            setTimeout(() => form.post('/jobs'), 0);
        } else {
            form.post('/jobs');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create job" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <h2 className="text-lg font-semibold">Create job</h2>

                {step === 1 && (
                    <Card className="max-w-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="size-5" />
                                Step 1: Look up address
                            </CardTitle>
                            <CardDescription>
                                Enter Dutch postcode and house number to find
                                the address and existing customer
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label>Postcode</Label>
                                    <Input
                                        placeholder="1012 AB"
                                        value={postcode}
                                        onChange={(e) =>
                                            setPostcode(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        maxLength={7}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>House number</Label>
                                    <Input
                                        placeholder="123"
                                        value={houseNumber}
                                        onChange={(e) =>
                                            setHouseNumber(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Addition (optional)</Label>
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
                                Look up address
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
                                                Existing customers at this
                                                address:
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
                                        Change address
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle>Step 2: Job details</CardTitle>
                                <CardDescription>
                                    Customer and job information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                {!selectedCustomerId && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">
                                                Customer name
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
                                                Email (optional)
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
                                                Phone (optional)
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
                                    <Label>Recommendation</Label>
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
                                            <SelectValue placeholder="Select recommendation" />
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
                                    <Label>Job info</Label>
                                    <Select
                                        value={form.data.job_info}
                                        onValueChange={(v) =>
                                            form.setData('job_info', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select job info" />
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
                                    <Label>Job type</Label>
                                    <Select
                                        value={form.data.job_type}
                                        onValueChange={(v) =>
                                            form.setData('job_type', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select job type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jobOptions.job_types.map(
                                                (type) => (
                                                    <SelectItem
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {type}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {form.data.job_type === 'Other' && (
                                        <Input
                                            placeholder="Specify job type"
                                            value={form.data.job_type_other}
                                            onChange={(e) =>
                                                form.setData(
                                                    'job_type_other',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Job description
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
                                        placeholder="Additional information regarding the job"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
                                    />
                                    <InputError
                                        message={form.errors.description}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price (€)</Label>
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
                                    <InputError message={form.errors.price} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Assigned employee</Label>
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
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
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
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="date">Date</Label>
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
                                            Time
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
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        disabled={form.processing}
                                        onClick={() => submit(false)}
                                    >
                                        {form.processing ? (
                                            <Spinner />
                                        ) : (
                                            'Create job'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={
                                            form.processing ||
                                            !form.data.employee_id
                                        }
                                        onClick={() => submit(true)}
                                    >
                                        Create job & send notification
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
