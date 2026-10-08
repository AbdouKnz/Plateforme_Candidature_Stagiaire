import * as React from "react"
import { translations, defaultLocale, type Language } from "@/lib/language/translations"

type Locale = Language

type LanguageContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = React.createContext<LanguageContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: string, params?: Record<string, string | number>) => key,
})

export function useTranslation() {
  const ctx = React.use(LanguageContext)
  return ctx.t
}

export function useLocale() {
  const ctx = React.use(LanguageContext)
  return { locale: ctx.locale, setLocale: ctx.setLocale }
}

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [locale, setLocale] = React.useState<Locale>(defaultLocale)

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[locale]
      let value = (dict as Record<string, string>)[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
        }
      }
      return value
    },
    [locale],
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
