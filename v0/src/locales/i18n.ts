import { createI18n } from 'vue-i18n'
import en from './en.json'
import hi from './hi.json'
import bn from './bn.json'
import es from './es.json'
import fr from './fr.json'
import de from './de.json'
import jp from './jp.json'
import zh from './zh.json'


const getInitialLocale = (): string => {
    try {
        const saved = localStorage.getItem('locale');
        // List of supported codes to validate the stored value
        const supported = ['en', 'hi', 'bn', 'es', 'fr', 'de', 'jp', 'zh'];
        return (saved && supported.includes(saved)) ? saved : 'en';
    } catch (e) {
        return 'en';
    }
}

export const i18n = createI18n({
    legacy: false,
    locale: getInitialLocale(), // Set the starting language here
    fallbackLocale: 'en',
    globalInjection: true,
    messages: {
        en, hi, bn, es, fr, de, jp, zh,
    },
})

export const availableLocale = [
    { title: 'English', value: 'en' },
    { title: 'हिंदी', value: 'hi' },
    { title: 'বাংলা', value: 'bn' },
    { title: 'Español', value: 'es' },
    { title: 'Français', value: 'fr' },
    { title: 'Deutsch', value: 'de' },
    { title: '日本語', value: 'jp' },
    { title: '中文', value: 'zh' },
]

export default i18n