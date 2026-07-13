import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, fr } from "../translations";

interface TranslationResources {
  [key: string]: {
    translation: Record<string, string>;
  };
}

// Translations
const resources: TranslationResources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
};

const getInitialLanguage = (): string => {
  if (typeof window !== "undefined") {
    const savedLang = localStorage.getItem("app-language");
    if (savedLang && ["en", "fr"].includes(savedLang)) {
      return savedLang;
    }
  }
  return "en";
};

const initOptions = {
  resources,
  fallbackLng: "en",
  supportedLngs: ["en", "fr"],
  keySeparator: false,
  interpolation: {
    escapeValue: false,
    prefix: "{",
    suffix: "}",
  },
  react: {
    useSuspense: false,
  },
  debug: false,
  saveMissing: false,
};

if (typeof window !== "undefined") {
  i18n.use(initReactI18next).init({
    ...initOptions,
    lng: getInitialLanguage(),
  });
} else {
  i18n.use(initReactI18next).init({
    ...initOptions,
    lng: "en",
  });
}

export default i18n;