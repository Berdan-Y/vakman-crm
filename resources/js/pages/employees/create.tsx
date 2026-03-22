import { Head, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { UserPlus } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

export default function EmployeesCreate() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.employees'), href: '/employees' },
        { title: t('employees.addEmployee'), href: '/employees/create' },
    ];

    const form = useForm({
        name: '',
        email: '',
        phone: '',
        kvk_number: '',
        role: 'employee' as 'employee' | 'admin',
        join_date: new Date().toISOString().slice(0, 10),
        create_account: false,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('employees.createEmployeeTitle')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="size-5" />
                            {t('employees.createEmployeeTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('employees.createEmployeeDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post('/employees');
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
                            <div className="flex items-center space-x-2 rounded-md border p-4">
                                <Checkbox
                                    id="create_account"
                                    checked={form.data.create_account}
                                    onCheckedChange={(checked) =>
                                        form.setData('create_account', checked as boolean)
                                    }
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="create_account"
                                        className="cursor-pointer font-medium"
                                    >
                                        {t('auth.createAccount')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('employees.createAccountHelp')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            <UserPlus className="size-4" />
                                            {t('employees.addEmployee')}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/employees')}
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
