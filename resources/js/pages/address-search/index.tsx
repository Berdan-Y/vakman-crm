import { Head, Link } from '@inertiajs/react';
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
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { MapPin, Search, Briefcase, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { BreadcrumbItem } from '@/types';

type Address = {
    street: string;
    city: string;
    municipality: string;
    province: string;
    postcode: string;
    house_number: string;
};

type Customer = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    city: string | null;
    zip_code: string;
    house_number: string;
};

type JobItem = {
    id: number;
    description: string | null;
    date: string;
    price: number;
    is_paid: boolean;
    invoice_number: string | null;
};

type JobHistoryCustomer = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
};

type JobHistoryEntry = {
    customer: JobHistoryCustomer;
    jobs: JobItem[];
};

type LookupResponse =
    | { success: true; address: Address; customers: Customer[]; job_history: JobHistoryEntry[] }
    | { success: false; message: string };

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Address search', href: '/address-search' },
];

export default function AddressSearchIndex() {
    const [postcode, setPostcode] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [addition, setAddition] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LookupResponse | null>(null);

    const handleLookup = useCallback(async () => {
        setError(null);
        setResult(null);
        setLoading(true);
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
            const data = (await res.json()) as LookupResponse;
            if (!res.ok) {
                setError('success' in data ? data.message : 'Address not found.');
                return;
            }
            setResult(data);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [postcode, houseNumber, addition]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Address search" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">Dutch address lookup</h2>
                    <p className="text-muted-foreground text-sm">
                        Enter zipcode and house number to validate an address and view customer job history.
                    </p>
                </div>

                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="size-5" />
                            Look up address
                        </CardTitle>
                        <CardDescription>
                            Use Dutch postcode (e.g. 1012 AB) and house number
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="postcode">Postcode</Label>
                                <Input
                                    id="postcode"
                                    placeholder="1012 AB"
                                    value={postcode}
                                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                                    maxLength={7}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="house_number">House number</Label>
                                <Input
                                    id="house_number"
                                    placeholder="123"
                                    value={houseNumber}
                                    onChange={(e) => setHouseNumber(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="addition">Addition (optional)</Label>
                                <Input
                                    id="addition"
                                    placeholder="A"
                                    value={addition}
                                    onChange={(e) => setAddition(e.target.value.toUpperCase())}
                                    maxLength={10}
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-destructive text-sm" role="alert">
                                {error}
                            </p>
                        )}
                        <Button
                            onClick={handleLookup}
                            disabled={loading || !postcode.trim() || !houseNumber.trim()}
                        >
                            {loading ? <Spinner /> : <Search className="size-4" />}
                            Look up address
                        </Button>
                    </CardContent>
                </Card>

                {result && 'address' in result && (
                    <>
                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="size-5" />
                                    Address details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <p className="font-medium">
                                    {result.address.street} {result.address.house_number}
                                </p>
                                <p className="text-muted-foreground">
                                    {result.address.postcode} {result.address.city}
                                </p>
                                {result.address.municipality && (
                                    <p className="text-muted-foreground text-xs">
                                        {result.address.municipality}
                                        {result.address.province && `, ${result.address.province}`}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {result.customers.length > 0 && (
                            <Card className="max-w-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="size-5" />
                                        Customers at this address
                                    </CardTitle>
                                    <CardDescription>
                                        Click View to see full customer details and job history
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {result.customers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded border border-sidebar-border/70 p-3"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {customer.name}
                                                </p>
                                                {(customer.phone || customer.email) && (
                                                    <p className="text-muted-foreground text-sm">
                                                        {[customer.phone, customer.email]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/customers/${customer.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {result.job_history.length > 0 && (
                            <Card className="max-w-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="size-5" />
                                        Customer job history
                                    </CardTitle>
                                    <CardDescription>
                                        Previous jobs at this address (returning customers)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {result.job_history.map(({ customer, jobs }) => (
                                        <div key={customer.id} className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2 font-medium">
                                                <User className="size-4" />
                                                {customer.name}
                                                {customer.phone && (
                                                    <span className="text-muted-foreground text-sm font-normal">
                                                        {customer.phone}
                                                    </span>
                                                )}
                                                <Button variant="link" size="sm" className="ml-auto h-auto p-0" asChild>
                                                    <Link href={`/customers/${customer.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                            </div>
                                            <ul className="border-sidebar-border/70 ml-6 space-y-1 border-l-2 pl-4 text-sm">
                                                {jobs.map((job) => (
                                                    <li key={job.id} className="flex justify-between gap-2">
                                                        <span>
                                                            {job.date} — {job.description || 'No description'}
                                                        </span>
                                                        <span>
                                                            {formatCurrency(job.price)}
                                                            {job.is_paid ? (
                                                                <span className="text-muted-foreground ml-1">(paid)</span>
                                                            ) : (
                                                                <span className="text-amber-600 ml-1">(unpaid)</span>
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {result.customers.length === 0 && result.job_history.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                No existing customers or job history at this address.
                            </p>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
