import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "motion/react"
import { MenuIcon, XIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useTheme } from "@/context/theme-context"
import { useTranslation } from "@/context/language-context"
import { useFrontOfficeStatus } from "@/hooks/use-front-office-status"
import { cn } from "@/lib/utils"

function useNavLinks() {
  const { status } = useFrontOfficeStatus()
  const isClosed = status && !status.is_enabled
  if (isClosed) {
    return [
      { to: "/", labelKey: "home.nav.home" },
      { to: "/about", labelKey: "home.nav.about" },
    ]
  }
  return [
    { to: "/", labelKey: "home.nav.home" },
    { to: "/about", labelKey: "home.nav.about" },
    { to: "/form", labelKey: "home.applyNow" },
  ]
}

export function Navbar() {
  const t = useTranslation()
  const { resolvedTheme } = useTheme()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const NAV_LINKS = useNavLinks()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-border/50 shadow-xs"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full items-center justify-between px-8 sm:px-12 lg:px-16">
        <Link to="/" className="shrink-0 flex items-center">
          <img
            src={`/${resolvedTheme === "dark" ? "DarkMode" : "LightMode"}.png`}
            alt="Asteroidea"
            width={200}
            height={200}
            className="h-[180px] w-[200px] object-contain -my-14"
          />
        </Link>

        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {t(link.labelKey)}
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {mobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/50 bg-white dark:bg-gray-950 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              )
            })}
            <div className="flex items-center gap-2 px-4 pt-2 border-t border-border/50 mt-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
