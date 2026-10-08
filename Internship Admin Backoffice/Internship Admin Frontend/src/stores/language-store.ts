import { create } from "zustand";
import i18n from "../lib/language/i18n/i18n";

type LanguageState = {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
};

export const useLanguageStore = create<LanguageState>((set) => {
  const lang = i18n.language || "en";

  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
  }

  return {
    currentLanguage: lang,
    changeLanguage: (newLang: string) => {
      i18n.changeLanguage(newLang);
      localStorage.setItem("app-language", newLang);

      document.documentElement.lang = newLang;
      document.documentElement.dir = "ltr";

      set({ currentLanguage: newLang });
    },
  };
});
