import * as React from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored
  } catch {}
  return "system"
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem("theme", theme)
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(getStoredTheme)
  const [resolvedTheme, setResolved] = React.useState<"light" | "dark">(() => {
    const t = getStoredTheme()
    return t === "system" ? getSystemTheme() : t
  })

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    storeTheme(newTheme)
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme
    setResolved(resolved)
    applyTheme(resolved)
  }, [])

  React.useEffect(() => {
    const resolved =
      theme === "system" ? getSystemTheme() : theme
    setResolved(resolved)
    applyTheme(resolved)
  }, [theme])

  React.useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const sys = mq.matches ? "dark" : "light"
      setResolved(sys)
      applyTheme(sys)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
