import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import language files
import en from '../locales/en.json';
import tr from '../locales/tr.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};

// Get device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

// Map device language codes to supported languages
const getLanguage = (deviceLang: string) => {
  switch (deviceLang) {
    case 'tr':
      return 'tr';
    case 'en':
    default:
      return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLanguage(deviceLanguage),
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Enable debug mode in development
    debug: __DEV__,
    
    // Key separator
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
  });

export default i18n;