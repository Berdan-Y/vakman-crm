import { Head, router, useForm } from '@inertiajs/react';
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
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Building2, Plus } from 'lucide-react';
import type { Company } from '@/types';

type Props = {
    companies: Array<Company>;
};

export default function CompaniesIndex({ companies }: Props) {
    const form = useForm({
        name: '',
        industry: '',
    });

    return (
        <AuthLayout
            title="Select or create a company"
            description="Choose a company to work with or create a new one"
        >
            <Head title="Select company" />

            <div className="mx-auto flex w-full max-w-md flex-col gap-6">
                {companies.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="size-5" />
                                Your companies
                            </CardTitle>
                            <CardDescription>
                                Select a company to continue to the dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            {companies.map((company) => (
                                <Button
                                    key={company.id}
                                    type="button"
                                    variant="outline"
                                    className="h-auto justify-between py-3"
                                    onClick={() =>
                                        router.post('/companies/switch', {
                                            company_id: company.id,
                                        })
                                    }
                                >
                                    <span className="font-medium">
                                        {company.name}
                                    </span>
                                    {company.industry && (
                                        <span className="text-muted-foreground text-sm">
                                            {company.industry}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="size-5" />
                            Create a new company
                        </CardTitle>
                        <CardDescription>
                            Add a company to get started
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
                                <Label htmlFor="name">Company name</Label>
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
                                    Industry (optional)
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
                                    placeholder="e.g. Locksmith, Electrician"
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
                                        Create company
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
