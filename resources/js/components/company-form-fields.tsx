import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

export type CompanyFormState = {
    name: string;
    industry: string;
    street_address: string;
    postal_code: string;
    city: string;
    country: string;
    tax_number: string;
    kvk_number: string;
    email: string;
    account_holder: string;
    bank_name: string;
    bank_account_number: string;
};

type FormErrors = Partial<Record<keyof CompanyFormState, string>>;

type Props = {
    data: CompanyFormState;
    setData: <K extends keyof CompanyFormState>(
        key: K,
        value: CompanyFormState[K],
    ) => void;
    errors: FormErrors;
    idPrefix?: string;
};

export function emptyCompanyForm(): CompanyFormState {
    return {
        name: '',
        industry: '',
        street_address: '',
        postal_code: '',
        city: '',
        country: '',
        tax_number: '',
        kvk_number: '',
        email: '',
        account_holder: '',
        bank_name: '',
        bank_account_number: '',
    };
}

export function CompanyFormFields({
    data,
    setData,
    errors,
    idPrefix = '',
}: Props) {
    const { t } = useTranslation();
    const id = (name: keyof CompanyFormState) =>
        idPrefix ? `${idPrefix}-${name}` : name;

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                    {t('companies.sectionGeneral')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={id('name')}>
                            {t('companies.companyName')}
                        </Label>
                        <Input
                            id={id('name')}
                            name="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="organization"
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={id('industry')}>
                            {t('companies.industryOptional')}
                        </Label>
                        <Input
                            id={id('industry')}
                            name="industry"
                            type="text"
                            value={data.industry}
                            onChange={(e) =>
                                setData('industry', e.target.value)
                            }
                            autoComplete="off"
                            placeholder={t('companies.industryPlaceholder')}
                        />
                        <InputError message={errors.industry} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                    {t('companies.sectionAddress')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={id('street_address')}>
                            {t('companies.streetAndHouseNumber')}
                        </Label>
                        <Input
                            id={id('street_address')}
                            name="street_address"
                            type="text"
                            value={data.street_address}
                            onChange={(e) =>
                                setData('street_address', e.target.value)
                            }
                            autoComplete="street-address"
                        />
                        <InputError message={errors.street_address} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={id('postal_code')}>
                            {t('companies.postalCode')}
                        </Label>
                        <Input
                            id={id('postal_code')}
                            name="postal_code"
                            type="text"
                            value={data.postal_code}
                            onChange={(e) =>
                                setData('postal_code', e.target.value)
                            }
                            autoComplete="postal-code"
                        />
                        <InputError message={errors.postal_code} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={id('city')}>{t('companies.city')}</Label>
                        <Input
                            id={id('city')}
                            name="city"
                            type="text"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            autoComplete="address-level2"
                        />
                        <InputError message={errors.city} />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={id('country')}>
                            {t('companies.country')}
                        </Label>
                        <Input
                            id={id('country')}
                            name="country"
                            type="text"
                            value={data.country}
                            onChange={(e) =>
                                setData('country', e.target.value)
                            }
                            autoComplete="country-name"
                        />
                        <InputError message={errors.country} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                    {t('companies.sectionRegistration')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor={id('tax_number')}>
                            {t('companies.taxNumber')}
                        </Label>
                        <Input
                            id={id('tax_number')}
                            name="tax_number"
                            type="text"
                            value={data.tax_number}
                            onChange={(e) =>
                                setData('tax_number', e.target.value)
                            }
                            autoComplete="off"
                        />
                        <InputError message={errors.tax_number} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={id('kvk_number')}>
                            {t('companies.kvkNumber')}
                        </Label>
                        <Input
                            id={id('kvk_number')}
                            name="kvk_number"
                            type="text"
                            value={data.kvk_number}
                            onChange={(e) =>
                                setData('kvk_number', e.target.value)
                            }
                            autoComplete="off"
                        />
                        <InputError message={errors.kvk_number} />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={id('email')}>
                            {t('companies.companyEmail')}
                        </Label>
                        <Input
                            id={id('email')}
                            name="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                        />
                        <InputError message={errors.email} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                    {t('companies.sectionBank')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={id('account_holder')}>
                            {t('companies.accountHolder')}
                        </Label>
                        <Input
                            id={id('account_holder')}
                            name="account_holder"
                            type="text"
                            value={data.account_holder}
                            onChange={(e) =>
                                setData('account_holder', e.target.value)
                            }
                            autoComplete="name"
                        />
                        <InputError message={errors.account_holder} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={id('bank_name')}>
                            {t('companies.bankName')}
                        </Label>
                        <Input
                            id={id('bank_name')}
                            name="bank_name"
                            type="text"
                            value={data.bank_name}
                            onChange={(e) =>
                                setData('bank_name', e.target.value)
                            }
                            autoComplete="off"
                            placeholder={t('companies.bankNamePlaceholder')}
                        />
                        <InputError message={errors.bank_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={id('bank_account_number')}>
                            {t('companies.bankAccountNumber')}
                        </Label>
                        <Input
                            id={id('bank_account_number')}
                            name="bank_account_number"
                            type="text"
                            value={data.bank_account_number}
                            onChange={(e) =>
                                setData('bank_account_number', e.target.value)
                            }
                            autoComplete="off"
                        />
                        <InputError message={errors.bank_account_number} />
                    </div>
                </div>
            </div>
        </div>
    );
}
