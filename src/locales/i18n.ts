import { createI18n } from 'vue-i18n';
import en from './en.json';
import hi from './hi.json';

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  globalInjection: true,
  // messages
  messages: {
    en,
    hi,
  },
});
