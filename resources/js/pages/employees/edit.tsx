import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { Edit, Mail, Check } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type EmployeeData = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    kvk_number: string | null;
    role: string | null;
    join_date: string | null;
    user_id: number | null;
    has_account: boolean;
};

type Props = {
    employee: EmployeeData;
};

export default function EmployeesEdit({ employee }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('employees.title'), href: '/employees' },
        { title: employee.name, href: `/employees/${employee.id}` },
        { title: t('common.edit'), href: `/employees/${employee.id}/edit` },
    ];

    const [sendingInvitation, setSendingInvitation] = useState(false);

    const form = useForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        kvk_number: employee.kvk_number || '',
        role: (employee.role?.toLowerCase() === 'admin' ? 'admin' : 'employee') as 'employee' | 'admin',
        join_date: employee.join_date || '',
    });

    const handleSendInvitation = () => {
        setSendingInvitation(true);
        router.post(
            `/employees/${employee.id}/send-invitation`,
            {},
            {
                onFinish: () => setSendingInvitation(false),
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('common.edit')} ${employee.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Edit className="size-5" />
                            {t('employees.editEmployee')}
                        </CardTitle>
                        <CardDescription>
                            {t('employees.updateEmployeeDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(`/employees/${employee.id}`);
                            }}
                            className="flex flex-col gap-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('common.name')}</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    required
                                    autoComplete="name"
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('common.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                    required
                                    autoComplete="email"
                                />
                                <InputError message={form.errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">{t('common.phone')}</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                    autoComplete="tel"
                                />
                                <InputError message={form.errors.phone} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="kvk_number">
                                    {t('companies.kvkNumber')}
                                </Label>
                                <Input
                                    id="kvk_number"
                                    type="text"
                                    value={form.data.kvk_number}
                                    onChange={(e) =>
                                        form.setData(
                                            'kvk_number',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="off"
                                />
                                <InputError message={form.errors.kvk_number} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">{t('employees.role')}</Label>
                                <Select
                                    value={form.data.role}
                                    onValueChange={(value) => form.setData('role', value as 'employee' | 'admin')}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder={t('employees.selectRole')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">{t('companies.employee')}</SelectItem>
                                        <SelectItem value="admin">{t('companies.admin')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.role} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="join_date">{t('employees.joinDate')}</Label>
                                <Input
                                    id="join_date"
                                    type="date"
                                    value={form.data.join_date}
                                    onChange={(e) =>
                                        form.setData('join_date', e.target.value)
                                    }
                                />
                                <InputError message={form.errors.join_date} />
                            </div>
                            
                            {!employee.has_account && (
                                <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <Mail className="size-5 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-blue-900 mb-1">
                                                {t('employees.noAccountCreated')}
                                            </h4>
                                            <p className="text-sm text-blue-700 mb-3">
                                                {t('employees.noAccountDesc')}
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleSendInvitation}
                                                disabled={sendingInvitation}
                                                className="bg-white text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                            >
                                                {sendingInvitation ? (
                                                    <>
                                                        <Spinner className="size-4" />
                                                        {t('employees.sendingInvitation')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="size-4" />
                                                        {t('employees.sendAccountInvitation')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {employee.has_account && (
                                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center gap-2 text-green-800">
                                        <Check className="size-5" />
                                        <span className="text-sm font-medium">
                                            {t('employees.hasActiveAccount')}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            <Edit className="size-4" />
                                            {t('employees.updateEmployee')}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(`/employees/${employee.id}`)}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
