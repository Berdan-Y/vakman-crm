import { Form, Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { update } from '@/routes/locale';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Transition } from '@headlessui/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Language settings',
        href: '/settings/locale',
    },
];

export default function Locale() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.languageSettings')} />

            <h1 className="sr-only">{t('settings.languageSettings')}</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={t('settings.languageSettings')}
                        description={t('settings.languageDesc')}
                    />

                    <Form
                        {...update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="locale">
                                        {t('settings.selectLanguage')}
                                    </Label>
                                    <Select
                                        name="locale"
                                        defaultValue={auth.user.locale || 'nl'}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nl">
                                                {t('languages.nl')}
                                            </SelectItem>
                                            <SelectItem value="en">
                                                {t('languages.en')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>
                                        {t('common.save')}
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            {t('common.saved')}
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
