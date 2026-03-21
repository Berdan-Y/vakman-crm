import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';

type Props = {
    token: string;
    employee: {
        name: string;
        email: string;
    };
    company: {
        name: string;
    };
};

export default function AcceptInvitation({ token, employee, company }: Props) {
    const form = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/employee/invitation/${token}`);
    };

    return (
        <AuthLayout
            title={`Welcome to ${company.name}!`}
            description="Set up your account to get started"
        >
            <Head title="Accept Invitation" />
            
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={employee.name} disabled />
                </div>

                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={employee.email} disabled />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                        id="password"
                        type="password"
                        value={form.data.password}
                        onChange={(e) =>
                            form.setData('password', e.target.value)
                        }
                        required
                        autoFocus
                    />
                    <InputError message={form.errors.password} />
                    <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        Confirm Password *
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(e) =>
                            form.setData(
                                'password_confirmation',
                                e.target.value,
                            )
                        }
                        required
                    />
                    <InputError
                        message={form.errors.password_confirmation}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={form.processing}
                >
                    {form.processing ? 'Creating Account...' : 'Create Account'}
                </Button>
            </form>
        </AuthLayout>
    );
}
