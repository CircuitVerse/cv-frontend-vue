declare module 'banana-i18n' {
  export default class Banana {
    locale: string
    constructor(locale?: string)
    setLocale(locale: string): void
    get(key: string, params?: any[]): string
    load(messages: Record<string, Record<string, string>>): void
  }
}
