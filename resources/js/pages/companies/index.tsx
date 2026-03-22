import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    CompanyFormFields,
    emptyCompanyForm,
} from '@/components/company-form-fields';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { Building2, Check, Pencil, Plus } from 'lucide-react';
import type { Company } from '@/types';

type Props = {
    companies: Array<Company>;
    currentCompanyId?: number;
};

export default function CompaniesIndex({ companies, currentCompanyId }: Props) {
    const { t } = useTranslation();
    
    const form = useForm(emptyCompanyForm());

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'owner': return t('companies.owner');
            case 'admin': return t('companies.admin');
            case 'employee': return t('companies.employee');
            default: return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    // If no company is selected, show a centered layout without sidebar
    if (!currentCompanyId) {
        return (
            <>
                <Head title={t('companies.selectCompany')} />
                <div className="flex min-h-screen items-center justify-center bg-background p-6">
                    <div className="w-full max-w-4xl space-y-8">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold">{t('companies.selectCompany')}</h1>
                            <p className="text-muted-foreground">
                                {t('companies.selectCompanyDesc')}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {companies.map((company) => {
                                const roleLabel = getRoleLabel(company.role);
                                const roleColor = getRoleColor(company.role);
                                
                                const handleSwitch = () => {
                                    router.post('/companies/switch', {
                                        company_id: company.id,
                                    });
                                };
                                
                                return (
                                    <Card
                                        key={company.id}
                                        className="transition-all hover:shadow-md hover:border-primary"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSwitch}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Building2 className="size-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-semibold text-base truncate">
                                                                {company.name}
                                                            </h3>
                                                            {company.industry && (
                                                                <p className="text-sm text-muted-foreground truncate">
                                                                    {company.industry}
                                                                </p>
                                                            )}
                                                            <Badge
                                                                className={`${roleColor} mt-2`}
                                                            >
                                                                {roleLabel}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </button>
                                                <Link
                                                    href={`/companies/${company.id}/edit`}
                                                    className="inline-flex shrink-0 self-start rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    aria-label={t('companies.editCompany')}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            <Card className="border-dashed md:col-span-2 lg:col-span-3">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Plus className="size-5" />
                                        {t('companies.createCompany')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('companies.addNewCompany')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            form.post('/companies', {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    form.reset();
                                                    form.clearErrors();
                                                },
                                            });
                                        }}
                                        className="flex flex-col gap-4"
                                    >
                                        <CompanyFormFields
                                            data={form.data}
                                            setData={form.setData}
                                            errors={form.errors}
                                            idPrefix="create-select"
                                        />
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={form.processing}
                                        >
                                            {form.processing ? (
                                                <Spinner />
                                            ) : (
                                                <>
                                                    <Plus className="size-4" />
                                                    {t('companies.createCompany')}
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // If company is selected, show the full app layout with sidebar
    return (
        <AppLayout>
            <Head title={t('companies.title')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">{t('companies.yourCompanies')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('companies.manageCompanies')}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {companies.map((company) => {
                        const isCurrentCompany = company.id === currentCompanyId;
                        const roleLabel = getRoleLabel(company.role);
                        const roleColor = getRoleColor(company.role);
                        
                        const handleSwitch = () => {
                            router.post('/companies/switch', {
                                company_id: company.id,
                            });
                        };
                        
                        return (
                            <Card
                                key={company.id}
                                className={`transition-all hover:shadow-md ${isCurrentCompany ? 'ring-2 ring-primary' : ''}`}
                            >
                                <CardContent className="p-6">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSwitch}
                                            className="min-w-0 flex-1 text-left"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                                    <Building2 className="size-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-base truncate">
                                                            {company.name}
                                                        </h3>
                                                        {company.industry && (
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {company.industry}
                                                            </p>
                                                        )}
                                                        <Badge className={`${roleColor} mt-2`}>
                                                            {roleLabel}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {isCurrentCompany && (
                                                    <Check className="size-5 text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                        <Link
                                            href={`/companies/${company.id}/edit`}
                                            className="inline-flex shrink-0 self-start rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label={t('companies.editCompany')}
                                        >
                                            <Pencil className="size-4" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    <Card className="border-dashed md:col-span-2 lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Plus className="size-5" />
                                {t('companies.createCompany')}
                            </CardTitle>
                            <CardDescription>
                                {t('companies.addNewCompany')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    form.post('/companies', {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            form.reset();
                                            form.clearErrors();
                                        },
                                    });
                                }}
                                className="flex flex-col gap-4"
                            >
                                <CompanyFormFields
                                    data={form.data}
                                    setData={form.setData}
                                    errors={form.errors}
                                    idPrefix="create-layout"
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={form.processing}
                                >
                                    {form.processing ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            <Plus className="size-4" />
                                            {t('companies.createCompany')}
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
