import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import el from './locales/el.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      el: { translation: el },
      en: { translation: en },
      ar: { translation: ar }
    },
    fallbackLng: 'el',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
