import { Head, router, useForm, usePage } from '@inertiajs/react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { Building2, Plus, Check } from 'lucide-react';
import type { Company } from '@/types';

type Props = {
    companies: Array<Company>;
    currentCompanyId?: number;
};

export default function CompaniesIndex({ companies, currentCompanyId }: Props) {
    const { t } = useTranslation();
    
    const form = useForm({
        name: '',
        industry: '',
    });

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
                                    <button
                                        key={company.id}
                                        onClick={handleSwitch}
                                        className="text-left w-full"
                                    >
                                        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary">
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-3">
                                                    <Building2 className="size-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-base truncate">{company.name}</h3>
                                                        {company.industry && (
                                                            <p className="text-sm text-muted-foreground truncate">{company.industry}</p>
                                                        )}
                                                        <Badge className={`${roleColor} mt-2`}>
                                                            {roleLabel}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </button>
                                );
                            })}

                            <Card className="border-dashed">
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
                                            form.post('/companies');
                                        }}
                                        className="flex flex-col gap-4"
                                    >
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">{t('companies.companyName')}</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={form.data.name}
                                                onChange={(e) =>
                                                    form.setData('name', e.target.value)
                                                }
                                                required
                                                autoComplete="organization"
                                                placeholder="Acme Ltd"
                                            />
                                            <InputError message={form.errors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="industry">
                                                {t('companies.industryOptional')}
                                            </Label>
                                            <Input
                                                id="industry"
                                                name="industry"
                                                type="text"
                                                value={form.data.industry}
                                                onChange={(e) =>
                                                    form.setData('industry', e.target.value)
                                                }
                                                autoComplete="off"
                                                placeholder={t('companies.industryPlaceholder')}
                                            />
                                            <InputError message={form.errors.industry} />
                                        </div>
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
                            <button
                                key={company.id}
                                onClick={handleSwitch}
                                className="text-left w-full"
                            >
                                <Card 
                                    className={`cursor-pointer transition-all hover:shadow-md ${isCurrentCompany ? 'ring-2 ring-primary' : ''}`}
                                >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <Building2 className="size-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-base truncate">{company.name}</h3>
                                                {company.industry && (
                                                    <p className="text-sm text-muted-foreground truncate">{company.industry}</p>
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
                                </CardContent>
                            </Card>
                        </button>
                        );
                    })}

                    <Card className="border-dashed">
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
                                    form.post('/companies');
                                }}
                                className="flex flex-col gap-4"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="name">{t('companies.companyName')}</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                        required
                                        autoComplete="organization"
                                        placeholder="Acme Ltd"
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="industry">
                                        {t('companies.industryOptional')}
                                    </Label>
                                    <Input
                                        id="industry"
                                        name="industry"
                                        type="text"
                                        value={form.data.industry}
                                        onChange={(e) =>
                                            form.setData('industry', e.target.value)
                                        }
                                        autoComplete="off"
                                        placeholder={t('companies.industryPlaceholder')}
                                    />
                                    <InputError message={form.errors.industry} />
                                </div>
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
