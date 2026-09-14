import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "motion/react"
import { MenuIcon, XIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { cn } from "@/lib/utils"

export function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
          ? "bg-background/65 dark:bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-xs"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-16">
        <Link to="/" className="shrink-0 flex items-center">
          <img
            src="/PC_Logo.png"
            alt="Asteroidea"
            width={200}
            height={200}
            className="h-24 w-28 object-contain -my-4 sm:h-[180px] sm:w-[200px] sm:-my-14"
          />
        </Link>

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
          className="border-t border-border/50 bg-background/85 dark:bg-background backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1 px-6 py-4">
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
