import Banana from 'banana-i18n'

// Ensure `window.locale` is typed (you can extend Window interface if needed)
const userLocale = (window as any).locale as string || 'en'

const banana = new Banana()
banana.setLocale(userLocale)

const locale = banana.locale
const finalFallback = 'en'

// Load default (fallback) messages
const messages: Record<string, any> = {
  [finalFallback]: require(`./i18n/${finalFallback}.json`),
}

// Try to load user's locale file
try {
  messages[locale] = require(`./i18n/${locale}.json`)
} catch (err) {
  console.warn(`Could not load locale file for ${locale}, falling back to ${finalFallback}.`)
}

banana.load(messages)

export default banana
