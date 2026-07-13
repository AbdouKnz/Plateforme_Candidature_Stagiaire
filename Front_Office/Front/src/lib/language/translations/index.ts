import { en } from './en'
import { fr } from './fr'

export const translations = {
  en,
  fr,
}

export type TranslationKey = keyof typeof translations.en
export type Language = keyof typeof translations
export const defaultLocale: Language = "en"

// Re-export individual language files for i18n config
export { en, fr }