import Banana from 'banana-i18n'

const banana = new Banana()

// window.locale may be undefined; use a string type
const locale: string = (window as any).locale || 'en'

banana.setLocale(locale)

// fallback language
const finalFallback = 'en'

// object with default language preloaded
interface Messages {
  [key: string]: Record<string, string>
}

const messages: Messages = {
  [finalFallback]: require(`./i18n/${finalFallback}.json`),
}

try {
  messages[locale] = require(`./i18n/${locale}.json`)
} catch (err) {
  // If loading for current locale failed, just fallback
  console.warn(`Failed to load locale ${locale}, falling back to ${finalFallback}`)
}

banana.load(messages)

export default banana
