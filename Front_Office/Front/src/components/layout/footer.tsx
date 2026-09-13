import { useTranslation } from "@/context/language-context"
import { useTheme } from "@/context/theme-context"

export function Footer() {
  const t = useTranslation()
  const { resolvedTheme } = useTheme()

  return (
    <footer className="border-t border-border/40 bg-transparent dark:border-white/10">
      <div className="mx-auto w-full px-5 py-12 sm:px-12 sm:py-16 lg:px-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/public/PC_logo.png" alt="Park&Charge" className="h-10 w-auto" />
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground dark:text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              {t("footer.contactTitle")}
            </h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5 text-sm text-foreground/70 dark:text-muted-foreground">
                <img src="/adress.png" alt="" className="size-4 shrink-0" />
                <span>{t("footer.location")}</span>
              </div>
              <a href={`mailto:${t("footer.email")}`} className="flex items-start gap-2.5 break-all text-sm text-foreground/70 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors">
                <img src="/email.png" alt="" className="size-4 shrink-0" />
                {t("footer.email")}
              </a>
              <a href="tel:+21626342040" className="flex items-center gap-2.5 text-sm text-foreground/70 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors">
                <img src="/phone.png" alt="" className="size-4 shrink-0" />
                {t("footer.phone")}
              </a>
              <a href="https://www.linkedin.com/company/park-and-charge-tn/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-foreground/70 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors">
                <img src="/linkedin.png" alt="" className="size-4 shrink-0" />
                LinkedIn
              </a>
              <a href="https://parkandcharge.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-foreground/70 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors">
                <img src="/WhiteBlue.png" alt="" className="size-4 shrink-0" />
                Park&Charge.io
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/60 dark:text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Park & Charge. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-foreground/60 hover:text-foreground dark:text-muted-foreground/60 dark:hover:text-muted-foreground transition-colors cursor-pointer">
              {t("footer.privacy")}
            </span>
            <span className="text-xs text-foreground/60 hover:text-foreground dark:text-muted-foreground/60 dark:hover:text-muted-foreground transition-colors cursor-pointer">
              {t("footer.terms")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
