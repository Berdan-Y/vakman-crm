import { Head, Link } from '@inertiajs/react';
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
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { MapPin, Search, Briefcase, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from '@/bootstrap';
import type { BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

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

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export default function AddressSearchIndex() {
    const { t } = useTranslation();
    const [postcode, setPostcode] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [addition, setAddition] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LookupResponse | null>(null);
    const [autoCompleteResults, setAutoCompleteResults] = useState<OpenPostcodeAddress[]>([]);
    const [showAutoComplete, setShowAutoComplete] = useState(false);
    const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('addressSearch.title'), href: '/address-search' },
    ];

    const fetchOpenPostcodeAddress = useCallback(
        async (pc: string, hn: string) => {
            if (!pc.trim() || !hn.trim()) {
                setAutoCompleteResults([]);
                setShowAutoComplete(false);
                return;
            }

            setAutoCompleteLoading(true);
            setError(null);

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
                    setError(null);
                } else {
                    setAutoCompleteResults([]);
                    setShowAutoComplete(false);
                }
            } catch (error) {
                setAutoCompleteResults([]);
                setShowAutoComplete(false);
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    setError(t('addressSearch.addressNotFound'));
                }
            } finally {
                setAutoCompleteLoading(false);
            }
        },
        [addition],
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

    const handleAddressSelect = useCallback(async (address: OpenPostcodeAddress) => {
        setShowAutoComplete(false);
        setLoading(true);
        setError(null);
        setResult(null);

        const fullHouseNumber = `${address.number}${address.letter}${address.addition}`.trim();

        setPostcode(address.postcode);
        setHouseNumber(String(address.number));
        setAddition((address.letter || address.addition) ? `${address.letter}${address.addition}`.trim() : '');

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
                    postcode: address.postcode,
                    house_number: String(address.number),
                    house_number_addition: (address.letter || address.addition) ? 
                        `${address.letter}${address.addition}`.trim() : null,
                    street: address.street,
                    city: address.city.label,
                    use_provided_address: true,
                }),
                credentials: 'same-origin',
            });
            const data = (await res.json()) as LookupResponse;
            if (!res.ok) {
                setError('success' in data && !data.success ? data.message : t('addressSearch.addressNotFound'));
                return;
            }
            setResult(data);
        } catch {
            setError(t('addressSearch.somethingWrong'));
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLookup = useCallback(async () => {
        setError(null);
        setResult(null);
        setLoading(true);
        setShowAutoComplete(false);
        
        try {
            const params: { postcode: string; huisnummer: string; huisletter?: string } = {
                postcode: postcode.trim(),
                huisnummer: houseNumber.trim(),
            };
            
            if (addition.trim()) {
                params.huisletter = addition.trim();
            }

            const autocompleteResponse = await axios.post('/address-search/autocomplete', params);
            const suggestions = autocompleteResponse.data.suggestions;

            if (!suggestions || suggestions.length === 0) {
                setError('Address not found');
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

            const res = await fetch('/address-search/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    postcode: address.postcode,
                    house_number: String(address.number),
                    house_number_addition: (address.letter || address.addition) ? 
                        `${address.letter}${address.addition}`.trim() : null,
                    street: address.street,
                    city: address.city.label,
                    use_provided_address: true,
                }),
                credentials: 'same-origin',
            });
            const data = (await res.json()) as LookupResponse;
            if (!res.ok) {
                setError('success' in data && !data.success ? data.message : t('addressSearch.addressNotFound'));
                return;
            }
            setResult(data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setError(t('addressSearch.addressNotFound'));
            } else {
                setError(t('addressSearch.somethingWrong'));
            }
        } finally {
            setLoading(false);
        }
    }, [postcode, houseNumber, addition]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('addressSearch.title')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('addressSearch.dutchLookup')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('addressSearch.enterDetails')}
                    </p>
                </div>

                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="size-5" />
                            {t('addressSearch.lookupAddress')}
                        </CardTitle>
                        <CardDescription>
                            {t('addressSearch.usePostcode')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="relative">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="postcode">{t('addressSearch.postalCode')}</Label>
                                    <Input
                                        id="postcode"
                                        placeholder="1012 AB"
                                        value={postcode}
                                        onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                                        maxLength={7}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="house_number">{t('addressSearch.houseNumber')}</Label>
                                    <Input
                                        id="house_number"
                                        placeholder="123"
                                        value={houseNumber}
                                        onChange={(e) => setHouseNumber(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="addition">{t('addressSearch.addition')}</Label>
                                    <Input
                                        id="addition"
                                        placeholder="A"
                                        value={addition}
                                        onChange={(e) => setAddition(e.target.value.toUpperCase())}
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            {autoCompleteLoading && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Spinner className="size-4" />
                                    <span>{t('addressSearch.lookingUpAddress')}</span>
                                </div>
                            )}

                            {showAutoComplete && autoCompleteResults.length > 0 && (
                                <div
                                    ref={autocompleteRef}
                                    className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover shadow-lg"
                                >
                                    <div className="max-h-[300px] overflow-y-auto p-1">
                                        {autoCompleteResults.map((addr, idx) => {
                                            const fullNumber = `${addr.number}${addr.letter}${addr.addition}`.trim();
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleAddressSelect(addr)}
                                                    className="flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                                                >
                                                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">
                                                            {addr.street} {fullNumber}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {addr.postcode} {addr.city.label}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
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
                            {t('addressSearch.lookupAddress')}
                        </Button>
                    </CardContent>
                </Card>

                {result && 'address' in result && (
                    <>
                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="size-5" />
                                    {t('addressSearch.addressDetails')}
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
                                        {t('addressSearch.customersAtAddress')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('addressSearch.viewFullDetails')}
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
                                                    {t('common.view')}
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
                                        {t('addressSearch.customerJobHistory')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('addressSearch.previousJobs')}
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
                                                        {t('common.view')}
                                                    </Link>
                                                </Button>
                                            </div>
                                            <ul className="border-sidebar-border/70 ml-6 space-y-1 border-l-2 pl-4 text-sm">
                                                {jobs.map((job) => (
                                                    <li key={job.id} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                                        <span className="min-w-0 break-words">
                                                            {job.date} — {job.description || t('addressSearch.noDescription')}
                                                        </span>
                                                        <span className="shrink-0">
                                                            {formatCurrency(job.price)}
                                                            {job.is_paid ? (
                                                                <span className="text-muted-foreground ml-1">({t('jobs.paid')})</span>
                                                            ) : (
                                                                <span className="text-amber-600 ml-1">({t('jobs.unpaid')})</span>
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
                                {t('addressSearch.noCustomersOrJobs')}
                            </p>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
