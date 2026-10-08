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

// Only initialize if we're on the client side
if (typeof window !== "undefined") {
  i18n
    .use(initReactI18next) // Initialize React integration
    .init({
      resources,
      fallbackLng: "en", // Default language
      lng: getInitialLanguage(),
      supportedLngs: ["en", "fr"], // Supported languages
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      // Prevent infinite loops
      debug: false,
      saveMissing: false,
      react: {
        useSuspense: false, // Prevent suspense issues with SSR
      },
    });
} else {
  // For SSR, initialize with basic config
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: "en",
    lng: "en", // Always use English on server
    supportedLngs: ["en", "fr"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Prevent suspense issues with SSR
    },
  });
}

export default i18n;