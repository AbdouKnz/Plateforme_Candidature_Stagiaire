import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

export function Hero() {
  return (
    <header className="border-b border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-primary to-primary/70 rounded-xl p-2 shadow-sm">
            <img
              src="/astero.ico"
              alt="Asteroidea"
              width={24}
              height={24}
              className="rounded object-contain brightness-0 invert"
            />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            Asteroidea
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
