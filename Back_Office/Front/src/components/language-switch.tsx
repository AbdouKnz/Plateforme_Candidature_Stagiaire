import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDirection, type Direction } from "@/context/direction-provider";
import { useState } from "react";
import { getCookie, setCookie } from "@/lib/cookies";
import i18n from "@/lib/language/i18n/i18n";

const LANGUAGE_COOKIE_NAME = "lang";
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const languages = [
  { code: "en", label: "English", flag: "/flags/united-states.svg", dir: "ltr" as Direction },
  { code: "fr", label: "Français", flag: "/flags/france.svg", dir: "ltr" as Direction },
];

export function LanguageSwitch() {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const cookieLang = getCookie(LANGUAGE_COOKIE_NAME) as string;
    const i18nLang = i18n.language;
    // Use i18n language as source of truth, fall back to cookie, then "en"
    if (i18nLang && ["en", "fr"].includes(i18nLang)) return i18nLang;
    if (cookieLang && ["en", "fr"].includes(cookieLang)) return cookieLang;
    return "en";
  });
  const { setDir } = useDirection();

  const handleLanguageChange = (langCode: string) => {
    const selectedLang = languages.find((lang) => lang.code === langCode);
    if (selectedLang) {
      setCurrentLanguage(langCode);
      i18n.changeLanguage(langCode);
      setDir(selectedLang.dir);
      setCookie(LANGUAGE_COOKIE_NAME, langCode, LANGUAGE_COOKIE_MAX_AGE);
      localStorage.setItem("app-language", langCode);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-2 gap-1.5 text-xs font-medium",
            "bg-transparent hover:bg-accent/50",
            "border-input transition-all duration-200",
            "focus-visible:ring-1 focus-visible:ring-ring",
            "data-[state=open]:bg-accent/50"
          )}
        >
          <img
            src={
              languages.find((lang) => lang.code === currentLanguage)?.flag
            }
            alt={currentLanguage}
            className="w-4 h-3 rounded-sm"
          />
          <span className="uppercase tracking-wider">
            {currentLanguage}
          </span>
          <IconChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <img
              src={lang.flag}
              alt={lang.label}
              className="w-4 h-3 mr-2 rounded-sm"
            />
            <span>{lang.label}</span>

            <IconCheck
              size={14}
              className={cn(
                "ml-auto",
                currentLanguage !== lang.code && "hidden"
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}