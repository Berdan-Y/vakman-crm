export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    locale?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Company = {
    id: number;
    name: string;
    industry: string | null;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    tax_number: string | null;
    kvk_number: string | null;
    email: string | null;
    account_holder: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    role: string;
};

export type Auth = {
    user: User;
    companies: Company[];
    currentCompany: Company | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
