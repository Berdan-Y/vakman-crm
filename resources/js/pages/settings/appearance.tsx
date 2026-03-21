import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';
import type { BreadcrumbItem } from '@/types';

export default function Appearance() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.appearanceSettings'),
            href: editAppearance().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.appearanceSettings')} />

            <h1 className="sr-only">{t('settings.appearanceSettings')}</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={t('settings.appearanceSettings')}
                        description={t('settings.appearanceDesc')}
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
