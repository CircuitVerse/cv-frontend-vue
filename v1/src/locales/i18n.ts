import { createI18n } from 'vue-i18n'
import en from './en.json'
import hi from './hi.json'
import bn from './bn.json'
import pt from './pt.json'

export const i18n = createI18n({
    legacy: false,
    locale: (window as any).locale || 'en',
    fallbackLocale: 'en',
    globalInjection: true,
    // messages
    messages: {
        en,
        hi,
        bn,
        pt,
    },
})


export const availableLocale: Array<{
    title: string
    value: string
}> = [
    { title: 'English', value: 'en' },
    { title: 'Hindi', value: 'hi' },
    { title: 'Portugues (BR)', value: 'pt' },
]

export default i18n
