import { en } from './en'
import { fr } from './fr'

export const translations = {
  en,
  fr,
} as const

export type TranslationKey = keyof typeof translations.en
export type Language = keyof typeof translations

// Re-export individual language files for i18n config
export { en, fr }
