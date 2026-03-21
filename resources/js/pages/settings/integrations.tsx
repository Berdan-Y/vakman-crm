import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
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
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { AlertCircle, CheckCircle, Loader2, MessageCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

function getCsrfToken(): string {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    return token ?? '';
}

type WhatsAppCredential = {
    id: number;
    phone_number_id: string;
    waba_phone_number: string | null;
    business_name: string | null;
    is_verified: boolean;
    status: string;
} | null;

type StatusResponse = {
    connected: boolean;
    credential: WhatsAppCredential;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Integrations', href: '/settings/integrations' },
];

export default function Integrations() {
    const [status, setStatus] = useState<StatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectLoading, setConnectLoading] = useState(false);
    const [disconnectLoading, setDisconnectLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [testPhone, setTestPhone] = useState('');
    const [testSendLoading, setTestSendLoading] = useState(false);
    const [testSendResult, setTestSendResult] = useState<{
        type: 'success' | 'error';
        text: string;
        tokenLength?: number;
    } | null>(null);

    const [form, setForm] = useState({
        phone_number_id: '',
        access_token: '',
        meta_business_id: '',
        business_name: '',
        waba_phone_number: '',
    });

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/whatsapp/status', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const data: StatusResponse = await res.json();
            setStatus(data);
        } catch {
            setStatus({ connected: false, credential: null });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setConnectLoading(true);
        try {
            const res = await fetch('/whatsapp/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    phone_number_id: form.phone_number_id || undefined,
                    access_token: form.access_token || undefined,
                    meta_business_id: form.meta_business_id || undefined,
                    business_name: form.business_name || undefined,
                    waba_phone_number: form.waba_phone_number || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setForm({
                    phone_number_id: '',
                    access_token: '',
                    meta_business_id: '',
                    business_name: '',
                    waba_phone_number: '',
                });
                fetchStatus();
            } else {
                setMessage({
                    type: 'error',
                    text: data.message || 'Failed to connect.',
                });
            }
        } catch {
            setMessage({ type: 'error', text: 'Request failed.' });
        } finally {
            setConnectLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Disconnect WhatsApp? You can reconnect later.')) return;
        setMessage(null);
        setDisconnectLoading(true);
        try {
            const res = await fetch('/whatsapp/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                fetchStatus();
            } else {
                setMessage({
                    type: 'error',
                    text: data.message || 'Failed to disconnect.',
                });
            }
        } catch {
            setMessage({ type: 'error', text: 'Request failed.' });
        } finally {
            setDisconnectLoading(false);
        }
    };

    const handleTestSend = async () => {
        const to = testPhone.replace(/\D/g, '');
        if (!to || to.length < 10) {
            setTestSendResult({
                type: 'error',
                text: 'Enter a valid phone number (e.g. 31683978932).',
            });
            return;
        }
        setTestSendResult(null);
        setTestSendLoading(true);
        try {
            const res = await fetch('/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    to: to,
                    template_name: 'hello_world',
                    template_language: 'en_US',
                }),
            });
            const data = await res.json();
            if (data.success) {
                const tokenNote =
                    typeof data.access_token_length === 'number'
                        ? ` Token length used: ${data.access_token_length} — compare with your token length from Meta (if different, re-paste the token and reconnect).`
                        : '';
                setTestSendResult({
                    type: 'success',
                    text: `Request accepted. Check your phone and Meta message count.${tokenNote}`,
                    tokenLength: data.access_token_length,
                });
            } else {
                setTestSendResult({
                    type: 'error',
                    text: data.message || 'Failed to send.',
                });
            }
        } catch {
            setTestSendResult({ type: 'error', text: 'Request failed.' });
        } finally {
            setTestSendLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Integrations" />
            <h1 className="sr-only">Integrations</h1>
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Integrations"
                        description="Connect WhatsApp and other services"
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="size-5" />
                                WhatsApp Business
                            </CardTitle>
                            <CardDescription>
                                Connect your company’s WhatsApp number so the
                                app can send job details to employees when you
                                assign a job. No coding required—just follow the
                                guide and paste two values from Meta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {message && (
                                <div
                                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                                        message.type === 'success'
                                            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                            : 'bg-destructive/10 text-destructive'
                                    }`}
                                >
                                    {message.type === 'success' ? (
                                        <CheckCircle className="size-4 shrink-0" />
                                    ) : (
                                        <AlertCircle className="size-4 shrink-0" />
                                    )}
                                    {message.text}
                                </div>
                            )}

                            {loading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" />
                                    Loading…
                                </div>
                            ) : status?.connected ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                        <CheckCircle className="size-4" />
                                        Connected
                                    </div>
                                    {status.credential && (
                                        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-1">
                                            {status.credential
                                                .waba_phone_number && (
                                                <li className="break-words">
                                                    Number:{' '}
                                                    {
                                                        status.credential
                                                            .waba_phone_number
                                                    }
                                                </li>
                                            )}
                                            {status.credential
                                                .business_name && (
                                                <li className="break-words">
                                                    Business:{' '}
                                                    {
                                                        status.credential
                                                            .business_name
                                                    }
                                                </li>
                                            )}
                                            <li className="break-all">
                                                Phone number ID:{' '}
                                                {
                                                    status.credential
                                                        .phone_number_id
                                                }
                                            </li>
                                        </ul>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDisconnect}
                                        disabled={disconnectLoading}
                                    >
                                        {disconnectLoading ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            'Disconnect'
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleConnect}
                                    className="space-y-4"
                                >
                                    <p className="text-sm text-muted-foreground">
                                        Enter the two connection details from
                                        Meta (Phone number ID and Access token).
                                        Not sure where to get them?{' '}
                                        <Link
                                            href="/settings/integrations/connect-whatsapp-guide"
                                            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                                        >
                                            Follow the step-by-step guide
                                        </Link>
                                        .
                                    </p>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone_number_id">
                                            Phone number ID *
                                        </Label>
                                        <Input
                                            id="phone_number_id"
                                            value={form.phone_number_id}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    phone_number_id:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="e.g. 123456789012345"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="access_token">
                                            Access token *
                                        </Label>
                                        <Input
                                            id="access_token"
                                            type="password"
                                            value={form.access_token}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    access_token:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="Paste the token from Meta (use a permanent token for ongoing use)"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="waba_phone_number">
                                            Display phone number (optional)
                                        </Label>
                                        <Input
                                            id="waba_phone_number"
                                            value={form.waba_phone_number}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    waba_phone_number:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="e.g. 31612345678 (how customers see your number)"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="meta_business_id">
                                            Meta Business ID (optional)
                                        </Label>
                                        <Input
                                            id="meta_business_id"
                                            value={form.meta_business_id}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    meta_business_id:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="Only if you have a verified business"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="business_name">
                                            Business name (optional)
                                        </Label>
                                        <Input
                                            id="business_name"
                                            value={form.business_name}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    business_name:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="Your business name"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={connectLoading}
                                    >
                                        {connectLoading ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            'Connect WhatsApp'
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
