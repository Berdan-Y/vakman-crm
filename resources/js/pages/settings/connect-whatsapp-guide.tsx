import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Heading from '@/components/heading';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Integrations', href: '/settings/integrations' },
    { title: 'Connect WhatsApp guide', href: '/settings/integrations/connect-whatsapp-guide' },
];

export default function ConnectWhatsAppGuide() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Connect your WhatsApp Business number" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/settings/integrations">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <Heading
                            variant="small"
                            title="Connect your WhatsApp Business number"
                            description="Follow these steps once per company. The app does the rest."
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="size-5" />
                                What this does
                            </CardTitle>
                            <CardContent className="pt-0">
                                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                    <li>When you assign a job to an employee, they get the job details on WhatsApp.</li>
                                    <li>You can send messages from the app using your business number.</li>
                                </ul>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>What you need</CardTitle>
                            <CardContent className="space-y-2 text-sm">
                                <ul className="list-inside list-disc text-muted-foreground">
                                    <li>A Facebook account (personal is fine).</li>
                                    <li>Your business. If it isn’t set up with Meta yet, the steps below will guide you.</li>
                                    <li>About 10–15 minutes the first time.</li>
                                </ul>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1: Open Meta’s business site</CardTitle>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Go to <strong className="text-foreground">business.facebook.com</strong> and log in.</li>
                                    <li>If asked to create a business account, enter your business name and your name, then continue.</li>
                                    <li>If you already have a business, select it.</li>
                                </ol>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Step 2: Add WhatsApp to your business</CardTitle>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>In the left menu, look for <strong className="text-foreground">WhatsApp</strong> or <strong className="text-foreground">All tools</strong> → WhatsApp.</li>
                                    <li>Open <strong className="text-foreground">WhatsApp Manager</strong> or <strong className="text-foreground">WhatsApp Accounts</strong>.</li>
                                    <li>Click <strong className="text-foreground">Add</strong> or <strong className="text-foreground">Create</strong> to add a WhatsApp Business Account.</li>
                                    <li>Follow the prompts (terms, add or select a phone number for your business).</li>
                                </ol>
                                <p className="mt-2">
                                    If Meta asks for <strong className="text-foreground">business verification</strong>, submit the documents they request. Approval can take a few days. Then continue.
                                </p>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Step 3: Get your connection details</CardTitle>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>You need <strong className="text-foreground">two values</strong> to paste into this app:</p>
                                <ul className="list-inside list-disc">
                                    <li><strong className="text-foreground">Phone number ID</strong> – represents your WhatsApp business number.</li>
                                    <li><strong className="text-foreground">Access token</strong> – lets the app send messages from your number safely.</li>
                                </ul>
                                <p><strong className="text-foreground">Where to find them:</strong></p>
                                <ul className="list-inside list-disc space-y-1">
                                    <li>In <strong className="text-foreground">WhatsApp Manager</strong> (business.facebook.com): open your WhatsApp account → <strong className="text-foreground">Phone numbers</strong> or <strong className="text-foreground">API setup</strong>. Copy the <strong className="text-foreground">Phone number ID</strong>. For the token, look for <strong className="text-foreground">Temporary access token</strong> or <strong className="text-foreground">Access token</strong> and click Generate or Copy.</li>
                                    <li>If an IT person or partner manages your Meta/WhatsApp setup: ask them for the <strong className="text-foreground">Phone number ID</strong> and a <strong className="text-foreground">permanent (long-lived) access token</strong>.</li>
                                </ul>
                                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                                    <strong>Important:</strong> A temporary token only works for about 24 hours. For ongoing use, you need a <strong>permanent</strong> token. If you only see a temporary token, ask your IT team or Meta business admin for a permanent one and use that here.
                                </p>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Step 4: Enter the details in this app</CardTitle>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Select your <strong className="text-foreground">company</strong> in this app (if you have more than one).</li>
                                    <li>Go to <strong className="text-foreground">Settings</strong> → <strong className="text-foreground">Integrations</strong>.</li>
                                    <li>Paste the <strong className="text-foreground">Phone number ID</strong> and <strong className="text-foreground">Access token</strong> in the WhatsApp section. Optionally add display phone number and business name.</li>
                                    <li>Click <strong className="text-foreground">Connect WhatsApp</strong>.</li>
                                </ol>
                                <p>When you see <strong className="text-foreground">Connected</strong>, job notifications will be sent to employees via WhatsApp from your business number.</p>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Step 5: Employee phone numbers</CardTitle>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>Each employee in the app has a phone number. Notifications go to that number on WhatsApp. Use a number with country code (e.g. 31612345678 for the Netherlands), with no spaces or leading zeros.</p>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>If something doesn’t work</CardTitle>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p><strong className="text-foreground">“WhatsApp is not connected”</strong> – Check that you pasted the full Phone number ID and Access token with no extra spaces. Try disconnecting and connecting again.</p>
                                <p><strong className="text-foreground">“Invalid recipient phone number”</strong> – The employee’s number must include the country code (e.g. 31 for Netherlands, 1 for USA).</p>
                                <p><strong className="text-foreground">Messages stop after a day</strong> – You’re likely using a temporary token. Get a permanent access token from your IT or Meta admin and paste it in Integrations again.</p>
                                <p><strong className="text-foreground">Meta asks for business verification</strong> – Normal in many regions. Complete it with your business documents; then continue with the steps above.</p>
                            </CardContent>
                        </CardHeader>
                    </Card>

                    <div className="flex justify-end">
                        <Button asChild>
                            <Link href="/settings/integrations">Go to Integrations</Link>
                        </Button>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
