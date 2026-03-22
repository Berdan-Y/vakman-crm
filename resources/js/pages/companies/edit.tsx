import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    CompanyFormFields,
    emptyCompanyForm,
    type CompanyFormState,
} from '@/components/company-form-fields';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem, Company, SharedData } from '@/types';

function companyToFormState(company: Company): CompanyFormState {
    return {
        name: company.name,
        industry: company.industry ?? '',
        street_address: company.street_address ?? '',
        postal_code: company.postal_code ?? '',
        city: company.city ?? '',
        country: company.country ?? '',
        tax_number: company.tax_number ?? '',
        kvk_number: company.kvk_number ?? '',
        email: company.email ?? '',
        account_holder: company.account_holder ?? '',
        bank_name: company.bank_name ?? '',
        bank_account_number: company.bank_account_number ?? '',
    };
}

type Props = {
    company: Company;
};

export default function CompanyEdit({ company }: Props) {
    const { t } = useTranslation();
    const { props } = usePage<SharedData>();
    const flashSuccess = props.flash?.success;

    const form = useForm(companyToFormState(company));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('companies.title'), href: '/companies' },
        { title: t('companies.editCompany'), href: `/companies/${company.id}/edit` },
    ];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.patch(`/companies/${company.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('companies.editCompany')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={t('companies.editCompany')}
                        description={t('companies.editCompanyDesc')}
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <CompanyFormFields
                            data={form.data}
                            setData={form.setData}
                            errors={form.errors as Partial<
                                Record<keyof CompanyFormState, string>
                            >}
                        />

                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-3">
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? (
                                        <Spinner />
                                    ) : (
                                        t('companies.saveCompany')
                                    )}
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/companies">
                                        {t('common.cancel')}
                                    </Link>
                                </Button>
                            </div>
                            <Transition
                                show={
                                    !!flashSuccess || form.recentlySuccessful
                                }
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-muted-foreground">
                                    {t('companies.updated')}
                                </p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
