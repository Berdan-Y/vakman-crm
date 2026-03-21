import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationNL from './locales/nl/translation.json';

const resources = {
    en: {
        translation: translationEN,
    },
    nl: {
        translation: translationNL,
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: 'nl',
    fallbackLng: 'nl',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
