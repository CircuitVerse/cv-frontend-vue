// @ts-ignore: Could not find module 'banana-i18n'
import Banana from 'banana-i18n';
// @ts-ignore: Ignore missing type for JSON import
import enMessages from './i18n/en.json';

// Extend Window interface to include locale property
declare global {
    interface Window {
        locale?: string
    }
}

interface Messages {
    [locale: string]: Record<string, unknown>
}

const banana = new Banana()
banana.setLocale(window.locale || 'en')
const { locale } = banana
const finalFallback: string = 'en'
// object with default language preloaded
const messages: Messages = {
    [finalFallback]: enMessages,
}
try {
    // Dynamic import for locale-specific messages
    // Using require for dynamic JSON loading at runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    messages[locale] = require(`./i18n/${locale}.json`) as Record<string, unknown>
} catch (err) {
    // If Asynchronous loading for current locale failed, load default locale
}

banana.load(messages)
export default banana

